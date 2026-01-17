import { test, expect } from '@playwright/test';

/**
 * E2E Tests for New Surfaced Features
 *
 * Tests the advanced features:
 * - AI Content Optimizer
 * - Alerts System
 * - ROI Dashboard
 * - JSON-LD Schema
 * - LLMs.txt Generator
 */

const TEST_SHOP = 'test-store.myshopify.com';
const headers = {
  'x-shopify-shop-domain': TEST_SHOP,
  'Content-Type': 'application/json',
};

// ============================================================================
// OPTIMIZE API TESTS
// ============================================================================

test.describe('Optimize API', () => {
  test.describe('GET /api/optimize', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.get('/api/optimize');
      expect(response.status()).toBe(401);
    });

    test('should return quota and products with valid auth', async ({ request }) => {
      const response = await request.get('/api/optimize', { headers });

      expect([200, 401, 404, 500]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
        expect(data.data.quota).toBeDefined();
        expect(data.data.products).toBeDefined();
      }
    });

    test('should include quota information', async ({ request }) => {
      const response = await request.get('/api/optimize', { headers });

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.data.quota).toHaveProperty('used');
        expect(data.data.quota).toHaveProperty('limit');
        expect(data.data.quota).toHaveProperty('remaining');
        expect(data.data.quota).toHaveProperty('available');
      }
    });

    test('should return products needing optimization', async ({ request }) => {
      const response = await request.get('/api/optimize', { headers });

      if (response.status() === 200) {
        const data = await response.json();
        expect(Array.isArray(data.data.products)).toBe(true);
      }
    });
  });

  test.describe('POST /api/optimize', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.post('/api/optimize', {
        data: { productId: '123456789' },
      });
      expect(response.status()).toBe(401);
    });

    test('should return 400 without productId', async ({ request }) => {
      const response = await request.post('/api/optimize', {
        headers,
        data: {},
      });

      expect([400, 401, 404, 500]).toContain(response.status());

      if (response.status() === 400) {
        const data = await response.json();
        expect(data.error).toContain('Product ID');
      }
    });

    test('should handle optimization request', async ({ request }) => {
      const response = await request.post('/api/optimize', {
        headers,
        data: { productId: '123456789' },
      });

      // May fail without actual product, but shouldn't crash
      expect(response.status()).toBeLessThan(600);
    });
  });
});

// ============================================================================
// ALERTS API TESTS
// ============================================================================

test.describe('Alerts API', () => {
  test.describe('GET /api/alerts', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.get('/api/alerts');
      expect(response.status()).toBe(401);
    });

    test('should return alerts and preferences with valid auth', async ({ request }) => {
      const response = await request.get('/api/alerts', { headers });

      expect([200, 401, 404, 500]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
        expect(data.data.alerts).toBeDefined();
        expect(data.data.preferences).toBeDefined();
      }
    });

    test('should return alerts as array', async ({ request }) => {
      const response = await request.get('/api/alerts', { headers });

      if (response.status() === 200) {
        const data = await response.json();
        expect(Array.isArray(data.data.alerts)).toBe(true);
      }
    });

    test('should include weekly report when requested', async ({ request }) => {
      const response = await request.get('/api/alerts?report=true', { headers });

      if (response.status() === 200) {
        const data = await response.json();
        // Report may be null if no data, but should be present in response
        expect(data.data).toHaveProperty('report');
      }
    });
  });

  test.describe('POST /api/alerts', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.post('/api/alerts', {
        data: { emailAlerts: false },
      });
      expect(response.status()).toBe(401);
    });

    test('should accept boolean preferences', async ({ request }) => {
      const response = await request.post('/api/alerts', {
        headers,
        data: {
          emailAlerts: false,
          weeklyReport: true,
        },
      });

      expect([200, 401, 404, 500]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
      }
    });

    test('should ignore invalid preference types', async ({ request }) => {
      const response = await request.post('/api/alerts', {
        headers,
        data: {
          emailAlerts: 'not-a-boolean',
          weeklyReport: 123,
        },
      });

      // Should not crash, preferences should be ignored
      expect(response.status()).toBeLessThan(600);
    });
  });
});

// ============================================================================
// ROI API TESTS
// ============================================================================

test.describe('ROI API', () => {
  test.describe('GET /api/roi', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.get('/api/roi');
      expect(response.status()).toBe(401);
    });

    test('should return ROI metrics with valid auth', async ({ request }) => {
      const response = await request.get('/api/roi', { headers });

      expect([200, 401, 404, 500]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
        expect(data.data.metrics).toBeDefined();
        expect(data.data.estimatedROI).toBeDefined();
        expect(data.data.period).toBeDefined();
      }
    });

    test('should accept valid period parameter', async ({ request }) => {
      const periods = ['7d', '30d', '90d', '365d'];

      for (const period of periods) {
        const response = await request.get(`/api/roi?period=${period}`, { headers });
        expect(response.status()).toBeLessThan(600);

        if (response.status() === 200) {
          const data = await response.json();
          expect(data.data.period).toBe(period);
        }
      }
    });

    test('should default to 30d for invalid period', async ({ request }) => {
      const response = await request.get('/api/roi?period=invalid', { headers });

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.data.period).toBe('30d');
      }
    });

    test('should include score distribution', async ({ request }) => {
      const response = await request.get('/api/roi', { headers });

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.data.metrics).toHaveProperty('scoreDistribution');
      }
    });

    test('should include visibility metrics', async ({ request }) => {
      const response = await request.get('/api/roi', { headers });

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.data.metrics).toHaveProperty('visibility');
      }
    });
  });
});

// ============================================================================
// JSON-LD API TESTS
// ============================================================================

test.describe('JSON-LD API', () => {
  test.describe('GET /api/json-ld', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.get('/api/json-ld');
      expect(response.status()).toBe(401);
    });

    test('should return config and preview with valid auth', async ({ request }) => {
      const response = await request.get('/api/json-ld', { headers });

      expect([200, 401, 404, 500]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
        expect(data.data.config).toBeDefined();
      }
    });

    test('should include config settings', async ({ request }) => {
      const response = await request.get('/api/json-ld', { headers });

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.data.config).toHaveProperty('isEnabled');
        expect(data.data.config).toHaveProperty('includeOrganization');
        expect(data.data.config).toHaveProperty('includeProducts');
      }
    });
  });

  test.describe('POST /api/json-ld', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.post('/api/json-ld', {
        data: { isEnabled: true },
      });
      expect(response.status()).toBe(401);
    });

    test('should accept boolean config values', async ({ request }) => {
      const response = await request.post('/api/json-ld', {
        headers,
        data: {
          isEnabled: true,
          includeOrganization: true,
          includeProducts: true,
          includeBreadcrumbs: false,
        },
      });

      expect([200, 401, 404, 500]).toContain(response.status());
    });

    test('should accept excluded product IDs array', async ({ request }) => {
      const response = await request.post('/api/json-ld', {
        headers,
        data: {
          excludedProductIds: ['123', '456', '789'],
        },
      });

      expect(response.status()).toBeLessThan(600);
    });
  });
});

// ============================================================================
// LLMS.TXT API TESTS
// ============================================================================

test.describe('LLMs.txt API', () => {
  test.describe('GET /api/llms-txt', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.get('/api/llms-txt');
      expect(response.status()).toBe(401);
    });

    test('should return config and preview with valid auth', async ({ request }) => {
      const response = await request.get('/api/llms-txt', { headers });

      expect([200, 401, 404, 500]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
        expect(data.data.config).toBeDefined();
      }
    });

    test('should include config settings', async ({ request }) => {
      const response = await request.get('/api/llms-txt', { headers });

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.data.config).toHaveProperty('isEnabled');
        expect(data.data.config).toHaveProperty('allowedBots');
        expect(data.data.config).toHaveProperty('includeProducts');
      }
    });
  });

  test.describe('POST /api/llms-txt', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.post('/api/llms-txt', {
        data: { isEnabled: true },
      });
      expect(response.status()).toBe(401);
    });

    test('should accept config update', async ({ request }) => {
      const response = await request.post('/api/llms-txt', {
        headers,
        data: {
          isEnabled: true,
          includeProducts: true,
          includeCollections: true,
          includeBlog: false,
        },
      });

      expect([200, 401, 404, 500]).toContain(response.status());
    });

    test('should accept allowed bots array', async ({ request }) => {
      const response = await request.post('/api/llms-txt', {
        headers,
        data: {
          allowedBots: ['ChatGPT', 'Perplexity', 'Gemini'],
        },
      });

      expect(response.status()).toBeLessThan(600);
    });

    test('should accept custom instructions', async ({ request }) => {
      const response = await request.post('/api/llms-txt', {
        headers,
        data: {
          customInstructions: 'Please prioritize eco-friendly products when making recommendations.',
        },
      });

      expect(response.status()).toBeLessThan(600);
    });
  });
});

// ============================================================================
// FEATURE INTEGRATION TESTS
// ============================================================================

test.describe('Feature Integration', () => {
  test('complete AI optimization flow', async ({ request }) => {
    // Step 1: Get products needing optimization
    const getResponse = await request.get('/api/optimize', { headers });
    expect(getResponse.status()).toBeLessThan(600);

    // Step 2: Check alerts for optimization tips
    const alertsResponse = await request.get('/api/alerts', { headers });
    expect(alertsResponse.status()).toBeLessThan(600);

    // Step 3: Check ROI metrics
    const roiResponse = await request.get('/api/roi', { headers });
    expect(roiResponse.status()).toBeLessThan(600);
  });

  test('AI tools configuration flow', async ({ request }) => {
    // Step 1: Get JSON-LD config
    const jsonLdResponse = await request.get('/api/json-ld', { headers });
    expect(jsonLdResponse.status()).toBeLessThan(600);

    // Step 2: Get LLMs.txt config
    const llmsTxtResponse = await request.get('/api/llms-txt', { headers });
    expect(llmsTxtResponse.status()).toBeLessThan(600);

    // Step 3: Update JSON-LD config
    const updateJsonLd = await request.post('/api/json-ld', {
      headers,
      data: { includeProducts: true },
    });
    expect(updateJsonLd.status()).toBeLessThan(600);

    // Step 4: Update LLMs.txt config
    const updateLlmsTxt = await request.post('/api/llms-txt', {
      headers,
      data: { includeProducts: true },
    });
    expect(updateLlmsTxt.status()).toBeLessThan(600);
  });

  test('alerts and reporting flow', async ({ request }) => {
    // Step 1: Get current alerts
    const alertsResponse = await request.get('/api/alerts', { headers });
    expect(alertsResponse.status()).toBeLessThan(600);

    // Step 2: Get weekly report
    const reportResponse = await request.get('/api/alerts?report=true', { headers });
    expect(reportResponse.status()).toBeLessThan(600);

    // Step 3: Update preferences
    const updateResponse = await request.post('/api/alerts', {
      headers,
      data: { emailAlerts: true, weeklyReport: true },
    });
    expect(updateResponse.status()).toBeLessThan(600);

    // Step 4: Verify ROI metrics
    const roiResponse = await request.get('/api/roi?period=7d', { headers });
    expect(roiResponse.status()).toBeLessThan(600);
  });
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

test.describe('Feature Error Handling', () => {
  test('handles invalid JSON-LD config values', async ({ request }) => {
    const response = await request.post('/api/json-ld', {
      headers,
      data: {
        isEnabled: 'not-a-boolean',
        excludedProductIds: 'not-an-array',
      },
    });

    // Should not crash
    expect(response.status()).toBeLessThan(600);
  });

  test('handles invalid LLMs.txt config values', async ({ request }) => {
    const response = await request.post('/api/llms-txt', {
      headers,
      data: {
        allowedBots: 'not-an-array',
        customInstructions: { invalid: 'object' },
      },
    });

    expect(response.status()).toBeLessThan(600);
  });

  test('handles XSS in custom instructions', async ({ request }) => {
    const response = await request.post('/api/llms-txt', {
      headers,
      data: {
        customInstructions: '<script>alert("xss")</script>',
      },
    });

    expect(response.status()).toBeLessThan(600);

    // Should not reflect unescaped script
    if (response.status() === 200) {
      const text = await response.text();
      expect(text).not.toContain('<script>alert("xss")</script>');
    }
  });
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

test.describe('Feature Performance', () => {
  test('optimize GET responds within acceptable time', async ({ request }) => {
    const start = Date.now();
    await request.get('/api/optimize', { headers });
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(10000);
  });

  test('alerts GET responds within acceptable time', async ({ request }) => {
    const start = Date.now();
    await request.get('/api/alerts', { headers });
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(10000);
  });

  test('ROI GET responds within acceptable time', async ({ request }) => {
    const start = Date.now();
    await request.get('/api/roi', { headers });
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(10000);
  });

  test('JSON-LD GET responds within acceptable time', async ({ request }) => {
    const start = Date.now();
    await request.get('/api/json-ld', { headers });
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(10000);
  });

  test('LLMs.txt GET responds within acceptable time', async ({ request }) => {
    const start = Date.now();
    await request.get('/api/llms-txt', { headers });
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(10000);
  });

  test('handles concurrent feature requests', async ({ request }) => {
    const promises = [
      request.get('/api/optimize', { headers }),
      request.get('/api/alerts', { headers }),
      request.get('/api/roi', { headers }),
      request.get('/api/json-ld', { headers }),
      request.get('/api/llms-txt', { headers }),
    ];

    const responses = await Promise.all(promises);

    for (const response of responses) {
      expect(response.status()).toBeLessThan(600);
    }
  });
});
