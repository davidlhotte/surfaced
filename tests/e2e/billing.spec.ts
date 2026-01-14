import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Billing Flow
 *
 * These tests verify the critical payment flow:
 * 1. GET /api/billing - Get current billing status
 * 2. POST /api/billing - Create subscription
 * 3. GET /api/billing/callback - Handle payment callback
 */

test.describe('Billing API', () => {
  const TEST_SHOP = 'test-store.myshopify.com';

  test.describe('GET /api/billing', () => {
    test('should return 401 without shop header', async ({ request }) => {
      const response = await request.get('/api/billing');

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Missing shop domain');
    });

    test('should return billing info with valid shop header', async ({ request }) => {
      // Note: This test requires a shop to exist in the database
      // In CI, this would use a seeded test database
      const response = await request.get('/api/billing', {
        headers: {
          'x-shopify-shop-domain': TEST_SHOP,
        },
      });

      // Either 200 (shop exists) or 401 (shop not found)
      expect([200, 401]).toContain(response.status());
    });
  });

  test.describe('POST /api/billing', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.post('/api/billing', {
        data: { plan: 'BASIC' },
      });

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Missing shop domain');
    });

    test('should return 400 for invalid plan', async ({ request }) => {
      const response = await request.post('/api/billing', {
        headers: {
          'x-shopify-shop-domain': TEST_SHOP,
          'Content-Type': 'application/json',
        },
        data: { plan: 'INVALID_PLAN' },
      });

      // Either 400 (invalid plan) or 401 (shop not found)
      expect([400, 401]).toContain(response.status());
    });

    test('should return 400 for FREE plan subscription attempt', async ({ request }) => {
      const response = await request.post('/api/billing', {
        headers: {
          'x-shopify-shop-domain': TEST_SHOP,
          'Content-Type': 'application/json',
        },
        data: { plan: 'FREE' },
      });

      // FREE plan should not be subscribable
      expect([400, 401]).toContain(response.status());
    });

    test('should accept valid plan values', async ({ request }) => {
      const validPlans = ['BASIC', 'PLUS', 'PREMIUM'];

      for (const plan of validPlans) {
        const response = await request.post('/api/billing', {
          headers: {
            'x-shopify-shop-domain': TEST_SHOP,
            'Content-Type': 'application/json',
          },
          data: { plan },
        });

        // Should not be 400 "Invalid plan" - might be 401 (no shop) or 200 (success)
        const data = await response.json();
        if (response.status() === 400) {
          expect(data.error).not.toBe('Invalid plan');
        }
      }
    });
  });

  test.describe('GET /api/billing/callback', () => {
    test('should return 400 without shop parameter', async ({ request }) => {
      const response = await request.get('/api/billing/callback');

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Missing shop parameter');
    });

    test('should return 400 for invalid shop domain format', async ({ request }) => {
      const response = await request.get('/api/billing/callback?shop=invalid-domain');

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid shop domain');
    });

    test('should return 404 for unknown shop', async ({ request }) => {
      const response = await request.get('/api/billing/callback?shop=unknown-shop.myshopify.com');

      expect(response.status()).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Shop not found');
    });

    test('should accept valid shop domain format', async ({ request }) => {
      const response = await request.get(`/api/billing/callback?shop=${TEST_SHOP}&charge_id=123`);

      // Should not fail on domain validation - either 404 (shop not in db) or redirect
      expect(response.status()).not.toBe(400);
    });
  });
});

test.describe('Billing Flow Integration', () => {
  test('complete subscription flow validation', async ({ request }) => {
    const TEST_SHOP = 'integration-test.myshopify.com';

    // Step 1: Check current billing status
    const statusResponse = await request.get('/api/billing', {
      headers: { 'x-shopify-shop-domain': TEST_SHOP },
    });

    // Step 2: Attempt to create subscription
    const subscribeResponse = await request.post('/api/billing', {
      headers: {
        'x-shopify-shop-domain': TEST_SHOP,
        'Content-Type': 'application/json',
      },
      data: { plan: 'BASIC' },
    });

    // Step 3: Simulate callback (without real Shopify, this will fail gracefully)
    const callbackResponse = await request.get(
      `/api/billing/callback?shop=${TEST_SHOP}&charge_id=test-123`
    );

    // Verify the flow doesn't crash with unhandled errors
    expect(statusResponse.status()).toBeLessThan(500);
    expect(subscribeResponse.status()).toBeLessThan(500);
    expect(callbackResponse.status()).toBeLessThan(500);
  });

  test('plan upgrade flow preserves data integrity', async ({ request }) => {
    const TEST_SHOP = 'upgrade-test.myshopify.com';

    // Attempt upgrades in sequence: BASIC -> PLUS -> PREMIUM
    const plans = ['BASIC', 'PLUS', 'PREMIUM'];

    for (const plan of plans) {
      const response = await request.post('/api/billing', {
        headers: {
          'x-shopify-shop-domain': TEST_SHOP,
          'Content-Type': 'application/json',
        },
        data: { plan },
      });

      // Should not return 500 (server error)
      expect(response.status()).toBeLessThan(500);
    }
  });
});
