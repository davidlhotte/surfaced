import { test, expect } from '@playwright/test';

/**
 * Performance Tests
 *
 * Measures page load times and API response times to establish baseline
 * and track improvements after optimizations.
 *
 * Run with: npx playwright test tests/e2e/performance.spec.ts
 */

const TEST_SHOP = 'test-store.myshopify.com';
const headers = {
  'x-shopify-shop-domain': TEST_SHOP,
};

// Performance thresholds (in milliseconds)
const THRESHOLDS = {
  pageLoad: 3000,      // Max acceptable page load time
  apiResponse: 1000,   // Max acceptable API response time
  ttfb: 500,           // Time to first byte
};

interface PerformanceResult {
  name: string;
  duration: number;
  status: 'pass' | 'fail';
  threshold: number;
}

const results: PerformanceResult[] = [];

// Helper to record results
function recordResult(name: string, duration: number, threshold: number) {
  results.push({
    name,
    duration: Math.round(duration),
    status: duration <= threshold ? 'pass' : 'fail',
    threshold,
  });
}

// ============================================================================
// API PERFORMANCE TESTS
// ============================================================================

test.describe('API Response Times', () => {
  test('GET /api/dashboard response time', async ({ request }) => {
    const start = performance.now();
    const response = await request.get('/api/dashboard', { headers });
    const duration = performance.now() - start;

    recordResult('API: /api/dashboard', duration, THRESHOLDS.apiResponse);
    console.log(`/api/dashboard: ${Math.round(duration)}ms`);

    expect(response.status()).toBe(200);
    expect(duration).toBeLessThan(THRESHOLDS.apiResponse * 2); // Allow 2x for CI
  });

  test('GET /api/audit response time', async ({ request }) => {
    const start = performance.now();
    const response = await request.get('/api/audit', { headers });
    const duration = performance.now() - start;

    recordResult('API: /api/audit', duration, THRESHOLDS.apiResponse);
    console.log(`/api/audit: ${Math.round(duration)}ms`);

    expect(response.status()).toBe(200);
    expect(duration).toBeLessThan(THRESHOLDS.apiResponse * 2);
  });

  test('GET /api/optimize response time', async ({ request }) => {
    const start = performance.now();
    const response = await request.get('/api/optimize', { headers });
    const duration = performance.now() - start;

    recordResult('API: /api/optimize', duration, THRESHOLDS.apiResponse);
    console.log(`/api/optimize: ${Math.round(duration)}ms`);

    expect(response.status()).toBe(200);
    expect(duration).toBeLessThan(THRESHOLDS.apiResponse * 2);
  });

  test('GET /api/visibility response time', async ({ request }) => {
    const start = performance.now();
    const response = await request.get('/api/visibility', { headers });
    const duration = performance.now() - start;

    recordResult('API: /api/visibility', duration, THRESHOLDS.apiResponse);
    console.log(`/api/visibility: ${Math.round(duration)}ms`);

    expect(response.status()).toBe(200);
    expect(duration).toBeLessThan(THRESHOLDS.apiResponse * 2);
  });

  test('GET /api/competitors response time', async ({ request }) => {
    const start = performance.now();
    const response = await request.get('/api/competitors', { headers });
    const duration = performance.now() - start;

    recordResult('API: /api/competitors', duration, THRESHOLDS.apiResponse);
    console.log(`/api/competitors: ${Math.round(duration)}ms`);

    expect(response.status()).toBe(200);
    expect(duration).toBeLessThan(THRESHOLDS.apiResponse * 2);
  });

  test('GET /api/ab-tests response time', async ({ request }) => {
    const start = performance.now();
    const response = await request.get('/api/ab-tests', { headers });
    const duration = performance.now() - start;

    recordResult('API: /api/ab-tests', duration, THRESHOLDS.apiResponse);
    console.log(`/api/ab-tests: ${Math.round(duration)}ms`);

    expect(response.status()).toBe(200);
    expect(duration).toBeLessThan(THRESHOLDS.apiResponse * 2);
  });

  test('GET /api/settings response time', async ({ request }) => {
    const start = performance.now();
    const response = await request.get('/api/settings', { headers });
    const duration = performance.now() - start;

    recordResult('API: /api/settings', duration, THRESHOLDS.apiResponse);
    console.log(`/api/settings: ${Math.round(duration)}ms`);

    expect(response.status()).toBe(200);
    expect(duration).toBeLessThan(THRESHOLDS.apiResponse * 2);
  });
});

// ============================================================================
// PAGE LOAD PERFORMANCE TESTS
// ============================================================================

test.describe('Page Load Times', () => {
  test('Landing page load time', async ({ page }) => {
    const start = performance.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const duration = performance.now() - start;

    recordResult('Page: Landing /', duration, THRESHOLDS.pageLoad);
    console.log(`Landing page: ${Math.round(duration)}ms`);

    expect(duration).toBeLessThan(THRESHOLDS.pageLoad * 2);
  });

  test('Help page load time', async ({ page }) => {
    const start = performance.now();
    await page.goto('/help');
    await page.waitForLoadState('domcontentloaded');
    const duration = performance.now() - start;

    recordResult('Page: Help /help', duration, THRESHOLDS.pageLoad);
    console.log(`Help page: ${Math.round(duration)}ms`);

    expect(duration).toBeLessThan(THRESHOLDS.pageLoad * 2);
  });

  test('Admin dashboard load time', async ({ page }) => {
    const start = performance.now();
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    const duration = performance.now() - start;

    recordResult('Page: Admin /admin', duration, THRESHOLDS.pageLoad);
    console.log(`Admin dashboard: ${Math.round(duration)}ms`);

    expect(duration).toBeLessThan(THRESHOLDS.pageLoad * 2);
  });

  test('Products page load time', async ({ page }) => {
    const start = performance.now();
    await page.goto('/admin/products');
    await page.waitForLoadState('domcontentloaded');
    const duration = performance.now() - start;

    recordResult('Page: Products /admin/products', duration, THRESHOLDS.pageLoad);
    console.log(`Products page: ${Math.round(duration)}ms`);

    expect(duration).toBeLessThan(THRESHOLDS.pageLoad * 2);
  });

  test('Visibility page load time', async ({ page }) => {
    const start = performance.now();
    await page.goto('/admin/visibility');
    await page.waitForLoadState('domcontentloaded');
    const duration = performance.now() - start;

    recordResult('Page: Visibility /admin/visibility', duration, THRESHOLDS.pageLoad);
    console.log(`Visibility page: ${Math.round(duration)}ms`);

    expect(duration).toBeLessThan(THRESHOLDS.pageLoad * 2);
  });

  test('Settings page load time', async ({ page }) => {
    const start = performance.now();
    await page.goto('/admin/settings');
    await page.waitForLoadState('domcontentloaded');
    const duration = performance.now() - start;

    recordResult('Page: Settings /admin/settings', duration, THRESHOLDS.pageLoad);
    console.log(`Settings page: ${Math.round(duration)}ms`);

    expect(duration).toBeLessThan(THRESHOLDS.pageLoad * 2);
  });
});

// ============================================================================
// BUNDLE SIZE CHECK
// ============================================================================

test.describe('Bundle Analysis', () => {
  test('Check JS bundle sizes on landing page', async ({ page }) => {
    const jsRequests: { url: string; size: number }[] = [];

    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('.js') && response.status() === 200) {
        const headers = response.headers();
        const size = parseInt(headers['content-length'] || '0', 10);
        if (size > 0) {
          jsRequests.push({ url: url.split('/').pop() || url, size });
        }
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const totalSize = jsRequests.reduce((acc, r) => acc + r.size, 0);
    console.log(`\nJS Bundle Analysis:`);
    console.log(`Total JS size: ${Math.round(totalSize / 1024)}KB`);

    // Log largest bundles
    jsRequests.sort((a, b) => b.size - a.size);
    jsRequests.slice(0, 5).forEach((r) => {
      console.log(`  ${r.url}: ${Math.round(r.size / 1024)}KB`);
    });

    // Warn if total JS is too large (> 500KB)
    if (totalSize > 500 * 1024) {
      console.warn(`⚠️ Total JS bundle size (${Math.round(totalSize / 1024)}KB) exceeds 500KB`);
    }
  });
});

// ============================================================================
// WATERFALL ANALYSIS
// ============================================================================

test.describe('Request Waterfall Analysis', () => {
  test('Analyze admin page request waterfall', async ({ page }) => {
    const requests: { url: string; duration: number; type: string }[] = [];

    page.on('requestfinished', async (request) => {
      const timing = request.timing();
      const url = request.url();
      const resourceType = request.resourceType();

      if (timing.responseEnd > 0) {
        const duration = timing.responseEnd - timing.requestStart;
        requests.push({
          url: url.replace(/https?:\/\/[^/]+/, '').split('?')[0],
          duration: Math.round(duration),
          type: resourceType,
        });
      }
    });

    const start = performance.now();
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    const totalTime = performance.now() - start;

    console.log(`\n📊 Admin Page Waterfall Analysis:`);
    console.log(`Total load time: ${Math.round(totalTime)}ms`);
    console.log(`\nSlowest requests:`);

    requests.sort((a, b) => b.duration - a.duration);
    requests.slice(0, 10).forEach((r) => {
      console.log(`  [${r.type}] ${r.url}: ${r.duration}ms`);
    });

    // Count by type
    const byType: Record<string, number> = {};
    requests.forEach((r) => {
      byType[r.type] = (byType[r.type] || 0) + 1;
    });
    console.log(`\nRequests by type:`, byType);
  });
});

// ============================================================================
// PERFORMANCE SUMMARY
// ============================================================================

test.afterAll(() => {
  console.log('\n' + '='.repeat(60));
  console.log('📊 PERFORMANCE TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.filter((r) => r.status === 'fail').length;

  console.log(`\n✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`\nDetailed Results:`);

  results.forEach((r) => {
    const icon = r.status === 'pass' ? '✅' : '❌';
    const overBy = r.duration > r.threshold ? ` (+${r.duration - r.threshold}ms)` : '';
    console.log(`${icon} ${r.name}: ${r.duration}ms (threshold: ${r.threshold}ms)${overBy}`);
  });

  // Calculate averages
  const apiResults = results.filter((r) => r.name.startsWith('API:'));
  const pageResults = results.filter((r) => r.name.startsWith('Page:'));

  if (apiResults.length > 0) {
    const avgApi = apiResults.reduce((acc, r) => acc + r.duration, 0) / apiResults.length;
    console.log(`\n📈 Average API response time: ${Math.round(avgApi)}ms`);
  }

  if (pageResults.length > 0) {
    const avgPage = pageResults.reduce((acc, r) => acc + r.duration, 0) / pageResults.length;
    console.log(`📈 Average page load time: ${Math.round(avgPage)}ms`);
  }

  console.log('\n' + '='.repeat(60));
});
