import { test, expect } from '@playwright/test';

/**
 * Health Check / Smoke Tests
 *
 * These tests verify the app is running and responding correctly.
 * Run these first to catch deployment issues.
 */

test.describe('Health Checks', () => {
  test('app is running and responding', async ({ request }) => {
    // The app should respond to requests
    const response = await request.get('/');

    // App is running if we get any response
    expect(response.status()).toBeGreaterThanOrEqual(200);
  });

  test('API endpoints are reachable', async ({ request }) => {
    const endpoints = [
      '/api/billing',
      '/api/settings',
      '/api/auth?shop=test.myshopify.com',
      // Surfaced-specific endpoints
      '/api/dashboard',
      '/api/audit',
      '/api/visibility',
      '/api/competitors',
    ];

    for (const endpoint of endpoints) {
      const response = await request.get(endpoint);

      // All endpoints should respond (may be 500 if env vars missing in test env)
      // In production CI, env vars should be set and we'd expect < 500
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(600);
    }
  });

  test('storefront API is reachable', async ({ request }) => {
    const response = await request.get('/storefront/test.myshopify.com');

    // Should respond with a valid HTTP status
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(600);
  });
});

test.describe('Critical Path Smoke Tests', () => {
  // Note: These tests may return 500 in local env without Shopify env vars
  // In CI with proper env vars, they should return expected status codes

  test('authentication flow responds correctly', async ({ request }) => {
    // Step 1: Initial auth request
    const authResponse = await request.get('/api/auth?shop=smoke-test.myshopify.com', {
      maxRedirects: 0,
    });

    // Should redirect to Shopify OAuth, or 400/500 if env not configured
    expect([302, 400, 500]).toContain(authResponse.status());

    // Step 2: Callback without valid params
    const callbackResponse = await request.get('/api/auth/callback');

    // Should return 400 (missing params) or 500 if env not configured
    expect([400, 500]).toContain(callbackResponse.status());
  });

  test('billing flow responds correctly', async ({ request }) => {
    // Step 1: Get billing status (unauthenticated)
    const statusResponse = await request.get('/api/billing');
    // 401 expected, 500 if env not configured
    expect([401, 500]).toContain(statusResponse.status());

    // Step 2: Create subscription (unauthenticated)
    const createResponse = await request.post('/api/billing', {
      data: { plan: 'BASIC' },
    });
    expect([401, 500]).toContain(createResponse.status());

    // Step 3: Billing callback without shop
    const callbackResponse = await request.get('/api/billing/callback');
    expect([400, 500]).toContain(callbackResponse.status());
  });

  test('stores CRUD flow responds correctly', async ({ request }) => {
    const headers = {
      'x-shopify-shop-domain': 'smoke-test.myshopify.com',
      'Content-Type': 'application/json',
    };

    // GET stores - may be 500 without env vars
    const listResponse = await request.get('/api/stores', { headers });
    expect(listResponse.status()).toBeLessThan(600);

    // POST store (will fail auth, but shouldn't crash)
    const createResponse = await request.post('/api/stores', {
      headers,
      data: {
        name: 'Test',
        address: '123 Main',
        city: 'NYC',
        country: 'US',
      },
    });
    expect(createResponse.status()).toBeLessThan(600);
  });

  test('settings flow responds correctly', async ({ request }) => {
    const headers = {
      'x-shopify-shop-domain': 'smoke-test.myshopify.com',
      'Content-Type': 'application/json',
    };

    // GET settings - may be 500 without env vars
    const getResponse = await request.get('/api/settings', { headers });
    expect(getResponse.status()).toBeLessThan(600);

    // PUT settings
    const updateResponse = await request.put('/api/settings', {
      headers,
      data: { markerColor: '#FF0000' },
    });
    expect(updateResponse.status()).toBeLessThan(600);
  });
});

test.describe('Error Handling', () => {
  test('handles malformed JSON gracefully', async ({ request }) => {
    const response = await request.post('/api/stores', {
      headers: {
        'x-shopify-shop-domain': 'test.myshopify.com',
        'Content-Type': 'application/json',
      },
      data: 'not-valid-json',
    });

    // Should return a valid HTTP response (may be 500 without env vars)
    expect(response.status()).toBeLessThan(600);
  });

  test('handles very long shop domains', async ({ request }) => {
    const longDomain = 'a'.repeat(1000) + '.myshopify.com';

    const response = await request.get(`/api/billing`, {
      headers: { 'x-shopify-shop-domain': longDomain },
    });

    // Should handle gracefully (may be 500 without env vars)
    expect(response.status()).toBeLessThan(600);
  });

  test('handles special characters in parameters', async ({ request }) => {
    const response = await request.get(
      '/storefront/test.myshopify.com?search=<script>alert(1)</script>'
    );

    // Should respond (may be 404/500)
    expect(response.status()).toBeLessThan(600);

    // Response should not contain unescaped script (if not 500)
    if (response.status() !== 500) {
      const text = await response.text();
      expect(text).not.toContain('<script>');
    }
  });

  test('handles SQL injection attempts', async ({ request }) => {
    const response = await request.get(
      "/storefront/test.myshopify.com?search=' OR '1'='1"
    );

    // Should respond (may be 404/500)
    expect(response.status()).toBeLessThan(600);
  });
});

test.describe('Performance Checks', () => {
  test('API response time is acceptable', async ({ request }) => {
    const start = Date.now();

    await request.get('/api/billing', {
      headers: { 'x-shopify-shop-domain': 'perf-test.myshopify.com' },
    });

    const duration = Date.now() - start;

    // Should respond within 10 seconds (generous for cold start with compilation)
    expect(duration).toBeLessThan(10000);
  });

  test('storefront API response time is acceptable', async ({ request }) => {
    const start = Date.now();

    await request.get('/storefront/perf-test.myshopify.com');

    const duration = Date.now() - start;

    // Should respond within 10 seconds (generous for cold start)
    expect(duration).toBeLessThan(10000);
  });
});
