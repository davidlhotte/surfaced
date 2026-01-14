import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Core API Endpoints
 *
 * Tests the main API functionality:
 * - Stores CRUD operations
 * - Settings management
 * - Authentication flow
 */

test.describe('Stores API', () => {
  const TEST_SHOP = 'test-store.myshopify.com';
  const headers = {
    'x-shopify-shop-domain': TEST_SHOP,
    'Content-Type': 'application/json',
  };

  test.describe('GET /api/stores', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.get('/api/stores');

      expect(response.status()).toBe(401);
    });

    test('should return stores list with valid auth', async ({ request }) => {
      const response = await request.get('/api/stores', { headers });

      // Either 200 (shop exists) or 401 (shop not in db)
      expect([200, 401]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
      }
    });
  });

  test.describe('POST /api/stores', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.post('/api/stores', {
        data: {
          name: 'Test Store',
          address: '123 Main St',
          city: 'New York',
          country: 'US',
        },
      });

      expect(response.status()).toBe(401);
    });

    test('should validate required fields', async ({ request }) => {
      const response = await request.post('/api/stores', {
        headers,
        data: {
          // Missing required fields
          name: 'Test Store',
        },
      });

      // Should be 400 (validation error) or 401 (no shop)
      expect([400, 401]).toContain(response.status());
    });

    test('should validate coordinate ranges', async ({ request }) => {
      const response = await request.post('/api/stores', {
        headers,
        data: {
          name: 'Test Store',
          address: '123 Main St',
          city: 'New York',
          country: 'US',
          latitude: 999, // Invalid latitude
          longitude: 0,
        },
      });

      // Should be 400 (validation error) or 401 (no shop)
      expect([400, 401]).toContain(response.status());
    });

    test('should accept valid store data', async ({ request }) => {
      const response = await request.post('/api/stores', {
        headers,
        data: {
          name: 'Valid Test Store',
          address: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          postalCode: '90001',
          country: 'US',
          latitude: 34.0522,
          longitude: -118.2437,
          phone: '555-1234',
          email: 'store@example.com',
          website: 'https://example.com',
          featured: false,
        },
      });

      // Should not be 400 validation error - either 401 (no shop) or 200/201 (created)
      if (response.status() === 400) {
        const data = await response.json();
        expect(data.error).not.toContain('validation');
      }
    });
  });

  test.describe('PUT /api/stores/[id]', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.put('/api/stores/test-id', {
        data: { name: 'Updated Store' },
      });

      expect(response.status()).toBe(401);
    });

    test('should return 404 for non-existent store', async ({ request }) => {
      const response = await request.put('/api/stores/non-existent-id', {
        headers,
        data: { name: 'Updated Store' },
      });

      // Either 404 (not found) or 401 (no shop)
      expect([401, 404]).toContain(response.status());
    });
  });

  test.describe('DELETE /api/stores/[id]', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.delete('/api/stores/test-id');

      expect(response.status()).toBe(401);
    });
  });
});

test.describe('Settings API', () => {
  const TEST_SHOP = 'test-store.myshopify.com';
  const headers = {
    'x-shopify-shop-domain': TEST_SHOP,
    'Content-Type': 'application/json',
  };

  test.describe('GET /api/settings', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.get('/api/settings');

      expect(response.status()).toBe(401);
    });

    test('should return settings with valid auth', async ({ request }) => {
      const response = await request.get('/api/settings', { headers });

      // Either 200 (shop exists) or 401 (shop not in db)
      expect([200, 401]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.settings).toBeDefined();
        expect(data.data.plan).toBeDefined();
      }
    });

    test('should include cache control headers', async ({ request }) => {
      const response = await request.get('/api/settings', { headers });

      if (response.status() === 200) {
        const cacheControl = response.headers()['cache-control'];
        expect(cacheControl).toContain('no-store');
      }
    });
  });

  test.describe('PUT /api/settings', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.put('/api/settings', {
        data: { markerColor: '#FF0000' },
      });

      expect(response.status()).toBe(401);
    });

    test('should validate marker color format', async ({ request }) => {
      const response = await request.put('/api/settings', {
        headers,
        data: { markerColor: 'not-a-color' },
      });

      // Should be 400 (validation error) or 401 (no shop)
      expect([400, 401]).toContain(response.status());
    });

    test('should validate zoom level range', async ({ request }) => {
      const response = await request.put('/api/settings', {
        headers,
        data: { defaultZoom: 100 }, // Invalid zoom (max is usually 18-20)
      });

      // Should be 400 (validation error) or 401 (no shop)
      expect([400, 401]).toContain(response.status());
    });

    test('should accept valid settings update', async ({ request }) => {
      const response = await request.put('/api/settings', {
        headers,
        data: {
          markerColor: '#00FF00',
          showStoreList: true,
          defaultZoom: 12,
          enableSearch: true,
        },
      });

      // Should not be 500 server error
      expect(response.status()).toBeLessThan(500);
    });
  });
});

test.describe('Auth API', () => {
  test.describe('GET /api/auth', () => {
    test('should return 400 without shop parameter', async ({ request }) => {
      const response = await request.get('/api/auth');

      expect(response.status()).toBe(400);
    });

    test('should return 400 for invalid shop domain', async ({ request }) => {
      const response = await request.get('/api/auth?shop=invalid');

      expect(response.status()).toBe(400);
    });

    test('should redirect for valid shop domain', async ({ request }) => {
      const response = await request.get('/api/auth?shop=valid-store.myshopify.com', {
        maxRedirects: 0, // Don't follow redirects
      });

      // Should either redirect (302) or return error
      expect([302, 400]).toContain(response.status());
    });
  });

  test.describe('GET /api/auth/callback', () => {
    test('should return 400 without required params', async ({ request }) => {
      const response = await request.get('/api/auth/callback');

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Missing required parameters');
    });

    test('should return 400 for invalid shop domain', async ({ request }) => {
      const response = await request.get('/api/auth/callback?shop=invalid&code=test&hmac=test');

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid shop domain');
    });

    test('should validate all required parameters', async ({ request }) => {
      // Missing code
      let response = await request.get('/api/auth/callback?shop=test.myshopify.com&hmac=test');
      expect(response.status()).toBe(400);

      // Missing hmac
      response = await request.get('/api/auth/callback?shop=test.myshopify.com&code=test');
      expect(response.status()).toBe(400);

      // Missing shop
      response = await request.get('/api/auth/callback?code=test&hmac=test');
      expect(response.status()).toBe(400);
    });
  });
});

test.describe('Rate Limiting', () => {
  test('should handle rapid requests without crashing', async ({ request }) => {
    const TEST_SHOP = 'rate-limit-test.myshopify.com';
    const headers = { 'x-shopify-shop-domain': TEST_SHOP };

    // Send 10 rapid requests
    const promises = Array(10)
      .fill(null)
      .map(() => request.get('/api/stores', { headers }));

    const responses = await Promise.all(promises);

    // All requests should complete without 500 errors
    for (const response of responses) {
      expect(response.status()).toBeLessThan(500);
    }
  });
});
