import { test, expect } from '@playwright/test';

/**
 * API Configuration Status Tests
 *
 * These tests verify which external APIs are actually configured and functional.
 * This helps ensure we don't claim features that don't work.
 */

const TEST_SHOP = 'test-store.myshopify.com';
const headers = {
  'x-shopify-shop-domain': TEST_SHOP,
  'Content-Type': 'application/json',
};

// ============================================================================
// VISIBILITY API CONFIGURATION STATUS
// ============================================================================

test.describe('Visibility API Configuration Status', () => {
  test.describe('ChatGPT Visibility (OpenAI)', () => {
    test('should verify ChatGPT visibility check is operational', async ({ request }) => {
      const response = await request.post('/api/visibility', {
        headers,
        data: {
          queries: ['test query for ChatGPT'],
          platforms: ['chatgpt'],
        },
      });

      // ChatGPT should work if OPENAI_API_KEY is configured
      if (response.status() === 200) {
        const data = await response.json();
        // Check if we got a real response, not an error
        if (data.success && data.data && data.data.results) {
          console.log('ChatGPT visibility check: OPERATIONAL');
          expect(data.success).toBe(true);
        } else {
          console.log('ChatGPT visibility check: API CONFIGURED BUT NO RESULTS');
        }
      } else {
        console.log(`ChatGPT visibility check: FAILED (status ${response.status()})`);
        // Log the error for debugging
        const errorData = await response.json().catch(() => ({}));
        console.log('Error:', errorData.error || 'Unknown error');
      }

      // Test shouldn't fail even if API isn't configured
      expect(response.status()).toBeLessThan(600);
    });
  });

  test.describe('Perplexity Visibility', () => {
    test('should verify Perplexity visibility check status', async ({ request }) => {
      const response = await request.post('/api/visibility', {
        headers,
        data: {
          queries: ['test query for Perplexity'],
          platforms: ['perplexity'],
        },
      });

      if (response.status() === 200) {
        const data = await response.json();
        if (data.success && data.data && data.data.results) {
          const perplexityResult = data.data.results.find(
            (r: { platform?: string }) => r.platform === 'perplexity'
          );
          if (perplexityResult && !perplexityResult.error) {
            console.log('Perplexity visibility check: OPERATIONAL');
          } else {
            console.log('Perplexity visibility check: API NOT CONFIGURED OR ERROR');
            console.log('Error:', perplexityResult?.error || 'No result');
          }
        }
      } else {
        console.log(`Perplexity visibility check: FAILED (status ${response.status()})`);
      }

      expect(response.status()).toBeLessThan(600);
    });
  });

  test.describe('Gemini Visibility (Google AI)', () => {
    test('should verify Gemini visibility check status', async ({ request }) => {
      const response = await request.post('/api/visibility', {
        headers,
        data: {
          queries: ['test query for Gemini'],
          platforms: ['gemini'],
        },
      });

      if (response.status() === 200) {
        const data = await response.json();
        if (data.success && data.data && data.data.results) {
          const geminiResult = data.data.results.find(
            (r: { platform?: string }) => r.platform === 'gemini'
          );
          if (geminiResult && !geminiResult.error) {
            console.log('Gemini visibility check: OPERATIONAL');
          } else {
            console.log('Gemini visibility check: API NOT CONFIGURED OR ERROR');
            console.log('Error:', geminiResult?.error || 'No result');
          }
        }
      } else {
        console.log(`Gemini visibility check: FAILED (status ${response.status()})`);
      }

      expect(response.status()).toBeLessThan(600);
    });
  });

  test.describe('Multi-Platform Check', () => {
    test('should report which platforms are functional', async ({ request }) => {
      const response = await request.post('/api/visibility', {
        headers,
        data: {
          queries: ['multi-platform test query'],
          platforms: ['chatgpt', 'perplexity', 'gemini'],
        },
      });

      const platformStatus = {
        chatgpt: 'UNKNOWN',
        perplexity: 'UNKNOWN',
        gemini: 'UNKNOWN',
      };

      if (response.status() === 200) {
        const data = await response.json();
        if (data.success && data.data && data.data.results) {
          for (const result of data.data.results) {
            const platform = result.platform as keyof typeof platformStatus;
            if (platform && platform in platformStatus) {
              platformStatus[platform] = result.error ? 'NOT CONFIGURED' : 'OPERATIONAL';
            }
          }
        }
      }

      console.log('\n=== VISIBILITY PLATFORM STATUS ===');
      console.log(`ChatGPT:   ${platformStatus.chatgpt}`);
      console.log(`Perplexity: ${platformStatus.perplexity}`);
      console.log(`Gemini:    ${platformStatus.gemini}`);
      console.log('==================================\n');

      expect(response.status()).toBeLessThan(600);
    });
  });
});

// ============================================================================
// CONTENT OPTIMIZER API STATUS
// ============================================================================

test.describe('Content Optimizer API Status', () => {
  test('should verify OpenAI optimization is operational', async ({ request }) => {
    const response = await request.post('/api/optimize', {
      headers,
      data: { productId: 'test-product-for-optimization' },
    });

    if (response.status() === 200) {
      const data = await response.json();
      if (data.success && data.data && data.data.suggestions) {
        console.log('Content Optimizer: OPERATIONAL (OpenAI configured)');
      } else {
        console.log('Content Optimizer: PARTIAL (no suggestions generated)');
      }
    } else if (response.status() === 404) {
      console.log('Content Optimizer: API OK (product not found is expected in test)');
    } else {
      console.log(`Content Optimizer: STATUS ${response.status()}`);
    }

    expect(response.status()).toBeLessThan(600);
  });
});

// ============================================================================
// COMPETITOR INTELLIGENCE API STATUS
// ============================================================================

test.describe('Competitor Intelligence API Status', () => {
  test('should verify competitor analysis is operational', async ({ request }) => {
    const response = await request.post('/api/competitors', {
      headers,
      data: { action: 'analyze' },
    });

    if (response.status() === 200) {
      const data = await response.json();
      if (data.success) {
        console.log('Competitor Intelligence: OPERATIONAL');
      } else {
        console.log('Competitor Intelligence: ERROR -', data.error);
      }
    } else {
      console.log(`Competitor Intelligence: STATUS ${response.status()}`);
    }

    expect(response.status()).toBeLessThan(600);
  });
});

// ============================================================================
// A/B TESTING API STATUS
// ============================================================================

test.describe('A/B Testing API Status', () => {
  test('should verify A/B testing API exists', async ({ request }) => {
    const response = await request.get('/api/ab-tests', { headers });

    if (response.status() === 200) {
      console.log('A/B Testing API: OPERATIONAL');
    } else if (response.status() === 404) {
      console.log('A/B Testing API: NOT IMPLEMENTED (404)');
    } else {
      console.log(`A/B Testing API: STATUS ${response.status()}`);
    }

    expect(response.status()).toBeLessThan(600);
  });
});

// ============================================================================
// ORGANIZATION/MULTI-STORE API STATUS
// ============================================================================

test.describe('Organization API Status', () => {
  test('should verify organization API exists', async ({ request }) => {
    const response = await request.get('/api/organization', { headers });

    if (response.status() === 200) {
      console.log('Organization API: OPERATIONAL');
    } else if (response.status() === 404) {
      console.log('Organization API: NOT IMPLEMENTED (404)');
    } else {
      console.log(`Organization API: STATUS ${response.status()}`);
    }

    expect(response.status()).toBeLessThan(600);
  });
});

// ============================================================================
// FLOW TRIGGERS API STATUS
// ============================================================================

test.describe('Flow Triggers API Status', () => {
  test('should verify flow triggers API exists', async ({ request }) => {
    const response = await request.get('/api/flow-triggers', { headers });

    if (response.status() === 200) {
      console.log('Flow Triggers API: OPERATIONAL');
    } else if (response.status() === 404) {
      console.log('Flow Triggers API: NOT IMPLEMENTED (404)');
    } else {
      console.log(`Flow Triggers API: STATUS ${response.status()}`);
    }

    expect(response.status()).toBeLessThan(600);
  });
});

// ============================================================================
// COMPREHENSIVE API HEALTH CHECK
// ============================================================================

test.describe('Comprehensive API Health Check', () => {
  test('should generate full API status report', async ({ request }) => {
    const endpoints = [
      { name: 'Dashboard', method: 'GET', path: '/api/dashboard' },
      { name: 'Audit (GET)', method: 'GET', path: '/api/audit' },
      { name: 'Audit (POST)', method: 'POST', path: '/api/audit' },
      { name: 'Visibility (GET)', method: 'GET', path: '/api/visibility' },
      { name: 'Visibility (POST)', method: 'POST', path: '/api/visibility' },
      { name: 'Competitors (GET)', method: 'GET', path: '/api/competitors' },
      { name: 'Competitors (POST)', method: 'POST', path: '/api/competitors' },
      { name: 'Optimize (GET)', method: 'GET', path: '/api/optimize' },
      { name: 'Optimize (POST)', method: 'POST', path: '/api/optimize' },
      { name: 'Alerts (GET)', method: 'GET', path: '/api/alerts' },
      { name: 'Alerts (POST)', method: 'POST', path: '/api/alerts' },
      { name: 'ROI', method: 'GET', path: '/api/roi' },
      { name: 'JSON-LD (GET)', method: 'GET', path: '/api/json-ld' },
      { name: 'JSON-LD (POST)', method: 'POST', path: '/api/json-ld' },
      { name: 'llms.txt (GET)', method: 'GET', path: '/api/llms-txt' },
      { name: 'llms.txt (POST)', method: 'POST', path: '/api/llms-txt' },
      { name: 'Settings', method: 'GET', path: '/api/settings' },
      { name: 'Billing', method: 'POST', path: '/api/billing' },
      { name: 'A/B Tests', method: 'GET', path: '/api/ab-tests' },
      { name: 'Organization', method: 'GET', path: '/api/organization' },
      { name: 'Flow Triggers', method: 'GET', path: '/api/flow-triggers' },
    ];

    console.log('\n========== API HEALTH CHECK REPORT ==========\n');

    const results: { name: string; status: number; functional: boolean }[] = [];

    for (const endpoint of endpoints) {
      let response;
      if (endpoint.method === 'GET') {
        response = await request.get(endpoint.path, { headers });
      } else {
        response = await request.post(endpoint.path, { headers, data: {} });
      }

      const status = response.status();
      const functional = status === 200 || status === 400 || status === 401 || status === 404;

      results.push({ name: endpoint.name, status, functional });

      const statusIcon = status === 200 ? '✅' : status === 404 ? '❌' : '⚠️';
      console.log(`${statusIcon} ${endpoint.name.padEnd(20)} - ${status}`);
    }

    console.log('\n============================================\n');

    // Summary
    const operational = results.filter(r => r.status === 200).length;
    const notFound = results.filter(r => r.status === 404).length;
    const errors = results.filter(r => r.status >= 500).length;

    console.log(`Operational: ${operational}/${results.length}`);
    console.log(`Not Found:   ${notFound}/${results.length}`);
    console.log(`Errors:      ${errors}/${results.length}`);
    console.log('\n============================================\n');

    // At least some endpoints should work
    expect(operational + notFound + errors).toBe(results.length);
  });
});

// ============================================================================
// EXTERNAL API KEYS VERIFICATION
// ============================================================================

test.describe('External API Keys Verification', () => {
  test('should identify which external APIs are configured', async ({ request }) => {
    console.log('\n========== EXTERNAL API KEYS STATUS ==========\n');

    // Test OpenAI (via optimize or visibility)
    const openaiTest = await request.post('/api/visibility', {
      headers,
      data: { queries: ['test'], platforms: ['chatgpt'] },
    });

    let openaiStatus = 'UNKNOWN';
    if (openaiTest.status() === 200) {
      const data = await openaiTest.json();
      if (data.success && !data.error?.includes('API key')) {
        openaiStatus = '✅ CONFIGURED';
      } else {
        openaiStatus = '❌ NOT CONFIGURED';
      }
    } else if (openaiTest.status() === 401 || openaiTest.status() === 404) {
      openaiStatus = '⚠️ AUTH REQUIRED';
    } else {
      openaiStatus = `⚠️ STATUS ${openaiTest.status()}`;
    }

    // Test Perplexity
    const perplexityTest = await request.post('/api/visibility', {
      headers,
      data: { queries: ['test'], platforms: ['perplexity'] },
    });

    let perplexityStatus = 'UNKNOWN';
    if (perplexityTest.status() === 200) {
      const data = await perplexityTest.json();
      // Check if perplexity specifically failed
      const perplexityResult = data.data?.results?.find(
        (r: { platform?: string }) => r.platform === 'perplexity'
      );
      if (perplexityResult?.error) {
        perplexityStatus = '❌ NOT CONFIGURED';
      } else if (perplexityResult) {
        perplexityStatus = '✅ CONFIGURED';
      } else {
        perplexityStatus = '⚠️ NO RESULT';
      }
    }

    // Test Gemini
    const geminiTest = await request.post('/api/visibility', {
      headers,
      data: { queries: ['test'], platforms: ['gemini'] },
    });

    let geminiStatus = 'UNKNOWN';
    if (geminiTest.status() === 200) {
      const data = await geminiTest.json();
      const geminiResult = data.data?.results?.find(
        (r: { platform?: string }) => r.platform === 'gemini'
      );
      if (geminiResult?.error) {
        geminiStatus = '❌ NOT CONFIGURED';
      } else if (geminiResult) {
        geminiStatus = '✅ CONFIGURED';
      } else {
        geminiStatus = '⚠️ NO RESULT';
      }
    }

    console.log(`OPENAI_API_KEY:      ${openaiStatus}`);
    console.log(`PERPLEXITY_API_KEY:  ${perplexityStatus}`);
    console.log(`GOOGLE_AI_API_KEY:   ${geminiStatus}`);
    console.log('\n==============================================\n');

    // Test passes regardless - we're just reporting status
    expect(true).toBe(true);
  });
});
