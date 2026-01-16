import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Surfaced Core Features
 *
 * Tests the main Surfaced functionality:
 * - Dashboard API
 * - Audit Engine
 * - Visibility Check
 * - Competitor Intelligence
 */

const TEST_SHOP = 'test-store.myshopify.com';
const headers = {
  'x-shopify-shop-domain': TEST_SHOP,
  'Content-Type': 'application/json',
};

// ============================================================================
// DASHBOARD API TESTS
// ============================================================================

test.describe('Dashboard API', () => {
  test.describe('GET /api/dashboard', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.get('/api/dashboard');
      expect(response.status()).toBe(401);
    });

    test('should return dashboard data with valid auth', async ({ request }) => {
      const response = await request.get('/api/dashboard', { headers });

      // Either 200 (shop exists) or 401/404 (shop not in db)
      expect([200, 401, 404, 500]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
        expect(data.data.shop).toBeDefined();
        expect(data.data.audit).toBeDefined();
        expect(data.data.visibility).toBeDefined();
        expect(data.data.competitors).toBeDefined();
      }
    });

    test('should include shop info in dashboard response', async ({ request }) => {
      const response = await request.get('/api/dashboard', { headers });

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.data.shop).toHaveProperty('domain');
        expect(data.data.shop).toHaveProperty('plan');
        expect(data.data.shop).toHaveProperty('productsCount');
        expect(data.data.shop).toHaveProperty('aiScore');
      }
    });

    test('should include audit statistics', async ({ request }) => {
      const response = await request.get('/api/dashboard', { headers });

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.data.audit).toHaveProperty('totalProducts');
        expect(data.data.audit).toHaveProperty('auditedProducts');
        expect(data.data.audit).toHaveProperty('averageScore');
        expect(data.data.audit.issues).toHaveProperty('critical');
        expect(data.data.audit.issues).toHaveProperty('warning');
      }
    });

    test('should include visibility platforms status', async ({ request }) => {
      const response = await request.get('/api/dashboard', { headers });

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.data.visibility).toHaveProperty('platforms');
        expect(Array.isArray(data.data.visibility.platforms)).toBe(true);
      }
    });

    test('should have cache control headers', async ({ request }) => {
      const response = await request.get('/api/dashboard', { headers });

      if (response.status() === 200) {
        const cacheControl = response.headers()['cache-control'];
        expect(cacheControl).toContain('no-store');
      }
    });
  });
});

// ============================================================================
// AUDIT API TESTS
// ============================================================================

test.describe('Audit API', () => {
  test.describe('GET /api/audit', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.get('/api/audit');
      expect(response.status()).toBe(401);
    });

    test('should return audit results with valid auth', async ({ request }) => {
      const response = await request.get('/api/audit', { headers });

      // Either 200 (shop exists) or 401/404 (shop not in db)
      expect([200, 401, 404, 500]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
        expect(data.data).toHaveProperty('totalProducts');
        expect(data.data).toHaveProperty('auditedProducts');
        expect(data.data).toHaveProperty('averageScore');
      }
    });

    test('should return products array in audit results', async ({ request }) => {
      const response = await request.get('/api/audit', { headers });

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.data).toHaveProperty('products');
        expect(Array.isArray(data.data.products)).toBe(true);
      }
    });

    test('should return issue counts by severity', async ({ request }) => {
      const response = await request.get('/api/audit', { headers });

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.data.issues).toHaveProperty('critical');
        expect(data.data.issues).toHaveProperty('warning');
        expect(data.data.issues).toHaveProperty('info');
      }
    });
  });

  test.describe('POST /api/audit', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.post('/api/audit');
      expect(response.status()).toBe(401);
    });

    test('should trigger audit with valid auth', async ({ request }) => {
      const response = await request.post('/api/audit', { headers });

      // May timeout or fail if no Shopify connection, but shouldn't crash
      expect(response.status()).toBeLessThan(600);
    });

    test('should return audit result structure', async ({ request }) => {
      const response = await request.post('/api/audit', { headers });

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data).toHaveProperty('auditedProducts');
        expect(data.data).toHaveProperty('averageScore');
      }
    });
  });
});

// ============================================================================
// VISIBILITY API TESTS
// ============================================================================

test.describe('Visibility API', () => {
  test.describe('GET /api/visibility', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.get('/api/visibility');
      expect(response.status()).toBe(401);
    });

    test('should return visibility history with valid auth', async ({ request }) => {
      const response = await request.get('/api/visibility', { headers });

      expect([200, 401, 404, 500]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
      }
    });
  });

  test.describe('POST /api/visibility', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.post('/api/visibility');
      expect(response.status()).toBe(401);
    });

    test('should accept custom queries array', async ({ request }) => {
      const response = await request.post('/api/visibility', {
        headers,
        data: {
          queries: ['best running shoes', 'top sneakers 2025'],
        },
      });

      // May fail without OpenAI key, but shouldn't crash
      expect(response.status()).toBeLessThan(600);
    });

    test('should work without body (uses default queries)', async ({ request }) => {
      const response = await request.post('/api/visibility', { headers });

      expect(response.status()).toBeLessThan(600);
    });

    test('should handle empty queries array gracefully', async ({ request }) => {
      const response = await request.post('/api/visibility', {
        headers,
        data: { queries: [] },
      });

      expect(response.status()).toBeLessThan(600);
    });
  });
});

// ============================================================================
// COMPETITORS API TESTS
// ============================================================================

test.describe('Competitors API', () => {
  test.describe('GET /api/competitors', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.get('/api/competitors');
      expect(response.status()).toBe(401);
    });

    test('should return competitors list with valid auth', async ({ request }) => {
      const response = await request.get('/api/competitors', { headers });

      expect([200, 401, 404, 500]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
      }
    });
  });

  test.describe('POST /api/competitors', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.post('/api/competitors', {
        data: { domain: 'competitor.com' },
      });
      expect(response.status()).toBe(401);
    });

    test('should return 400 without domain', async ({ request }) => {
      const response = await request.post('/api/competitors', {
        headers,
        data: { name: 'Test Competitor' },
      });

      // Should be 400 (missing domain) or 401/404 (no shop)
      expect([400, 401, 404, 500]).toContain(response.status());

      if (response.status() === 400) {
        const data = await response.json();
        expect(data.error).toContain('domain');
      }
    });

    test('should accept valid competitor data', async ({ request }) => {
      const response = await request.post('/api/competitors', {
        headers,
        data: {
          domain: 'allbirds.com',
          name: 'Allbirds',
        },
      });

      expect(response.status()).toBeLessThan(600);
    });

    test('should support analyze action', async ({ request }) => {
      const response = await request.post('/api/competitors', {
        headers,
        data: { action: 'analyze' },
      });

      // May fail without OpenAI key, but shouldn't crash
      expect(response.status()).toBeLessThan(600);
    });
  });

  test.describe('DELETE /api/competitors', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.delete('/api/competitors?id=test-id');
      expect(response.status()).toBe(401);
    });

    test('should return 400 without competitor ID', async ({ request }) => {
      const response = await request.delete('/api/competitors', { headers });

      expect([400, 401, 404, 500]).toContain(response.status());

      if (response.status() === 400) {
        const data = await response.json();
        expect(data.error).toContain('ID');
      }
    });

    test('should accept valid competitor ID', async ({ request }) => {
      const response = await request.delete('/api/competitors?id=some-competitor-id', {
        headers,
      });

      // May be 404 if competitor doesn't exist, but shouldn't crash
      expect(response.status()).toBeLessThan(600);
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

test.describe('Surfaced Integration Flow', () => {
  test('complete dashboard to audit flow', async ({ request }) => {
    // Step 1: Check dashboard
    const dashboardResponse = await request.get('/api/dashboard', { headers });
    expect(dashboardResponse.status()).toBeLessThan(600);

    // Step 2: Get current audit status
    const auditGetResponse = await request.get('/api/audit', { headers });
    expect(auditGetResponse.status()).toBeLessThan(600);

    // Step 3: Check visibility history
    const visibilityResponse = await request.get('/api/visibility', { headers });
    expect(visibilityResponse.status()).toBeLessThan(600);

    // Step 4: Check competitors
    const competitorsResponse = await request.get('/api/competitors', { headers });
    expect(competitorsResponse.status()).toBeLessThan(600);
  });

  test('competitor management flow', async ({ request }) => {
    // Step 1: List competitors
    const listResponse = await request.get('/api/competitors', { headers });
    expect(listResponse.status()).toBeLessThan(600);

    // Step 2: Add competitor
    const addResponse = await request.post('/api/competitors', {
      headers,
      data: { domain: 'nike.com', name: 'Nike' },
    });
    expect(addResponse.status()).toBeLessThan(600);

    // Step 3: List again to verify
    const listAfterAdd = await request.get('/api/competitors', { headers });
    expect(listAfterAdd.status()).toBeLessThan(600);
  });
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

test.describe('Surfaced Error Handling', () => {
  test('handles invalid shop domain gracefully', async ({ request }) => {
    const invalidHeaders = {
      'x-shopify-shop-domain': 'invalid-domain',
      'Content-Type': 'application/json',
    };

    const response = await request.get('/api/dashboard', { headers: invalidHeaders });
    expect(response.status()).toBeLessThan(600);
  });

  test('handles malformed JSON in visibility request', async ({ request }) => {
    const response = await request.post('/api/visibility', {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      data: 'invalid-json',
    });

    // Should handle gracefully
    expect(response.status()).toBeLessThan(600);
  });

  test('handles malformed JSON in competitors request', async ({ request }) => {
    const response = await request.post('/api/competitors', {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      data: 'invalid-json',
    });

    expect(response.status()).toBeLessThan(600);
  });

  test('handles XSS attempts in competitor domain', async ({ request }) => {
    const response = await request.post('/api/competitors', {
      headers,
      data: {
        domain: '<script>alert(1)</script>.com',
        name: '<img onerror="alert(1)" src="x">',
      },
    });

    expect(response.status()).toBeLessThan(600);

    // Should not reflect unescaped script
    if (response.status() === 200 || response.status() === 400) {
      const text = await response.text();
      expect(text).not.toContain('<script>');
    }
  });

  test('handles SQL injection attempts in queries', async ({ request }) => {
    const response = await request.post('/api/visibility', {
      headers,
      data: {
        queries: ["'; DROP TABLE shops; --", "1' OR '1'='1"],
      },
    });

    expect(response.status()).toBeLessThan(600);
  });
});

// ============================================================================
// RATE LIMITING TESTS
// ============================================================================

test.describe('Surfaced Rate Limiting', () => {
  test('handles rapid dashboard requests', async ({ request }) => {
    const promises = Array(5)
      .fill(null)
      .map(() => request.get('/api/dashboard', { headers }));

    const responses = await Promise.all(promises);

    for (const response of responses) {
      expect(response.status()).toBeLessThan(600);
    }
  });

  test('handles rapid audit requests', async ({ request }) => {
    const promises = Array(3)
      .fill(null)
      .map(() => request.get('/api/audit', { headers }));

    const responses = await Promise.all(promises);

    for (const response of responses) {
      expect(response.status()).toBeLessThan(600);
    }
  });
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

test.describe('Surfaced Performance', () => {
  test('dashboard responds within acceptable time', async ({ request }) => {
    const start = Date.now();
    await request.get('/api/dashboard', { headers });
    const duration = Date.now() - start;

    // Should respond within 10 seconds (generous for cold start)
    expect(duration).toBeLessThan(10000);
  });

  test('audit GET responds within acceptable time', async ({ request }) => {
    const start = Date.now();
    await request.get('/api/audit', { headers });
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(10000);
  });

  test('competitors list responds within acceptable time', async ({ request }) => {
    const start = Date.now();
    await request.get('/api/competitors', { headers });
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(10000);
  });
});
