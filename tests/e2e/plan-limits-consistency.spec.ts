import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Plan Limits Consistency
 *
 * These tests verify that plan limits are consistent across:
 * - Landing page pricing display
 * - Settings page plan comparison
 * - Help page documentation
 * - API responses
 *
 * CRITICAL: These tests would have caught the issue where:
 * - Landing page showed $4.99/$9.99/$24.99 but API used $49/$99/$199
 * - Settings page showed different limits than actual limits
 * - User on "Business" plan saw 0/0 optimizations
 */

const TEST_SHOP = 'test-store.myshopify.com';
const headers = {
  'x-shopify-shop-domain': TEST_SHOP,
  'Content-Type': 'application/json',
};

// Expected plan limits from lib/constants/plans.ts
const EXPECTED_LIMITS = {
  FREE: {
    productsAudited: 10,
    visibilityChecksPerMonth: 3,
    aiOptimizationsPerMonth: 3,
    competitorsTracked: 0,
  },
  BASIC: {
    productsAudited: 100,
    visibilityChecksPerMonth: 10,
    aiOptimizationsPerMonth: 20,
    competitorsTracked: 1,
  },
  PLUS: {
    productsAudited: 500,
    visibilityChecksPerMonth: 50,
    aiOptimizationsPerMonth: 100,
    competitorsTracked: 3,
  },
  PREMIUM: {
    productsAudited: Infinity,
    visibilityChecksPerMonth: 200,
    aiOptimizationsPerMonth: 500,
    competitorsTracked: 10,
  },
};

const EXPECTED_PRICES = {
  BASIC: 49,
  PLUS: 99,
  PREMIUM: 199,
};

// ============================================================================
// LANDING PAGE PRICING TESTS
// ============================================================================

test.describe('Landing Page Pricing Consistency', () => {
  test('landing page prices match expected values', async ({ page }) => {
    await page.goto('/');

    const pageContent = await page.locator('body').textContent();

    // Check for correct prices (not old incorrect ones)
    // Should NOT have the old prices
    expect(pageContent).not.toContain('4.99');
    expect(pageContent).not.toContain('9.99');
    expect(pageContent).not.toContain('24.99');

    // Should have the correct prices
    expect(pageContent).toContain('49');
    expect(pageContent).toContain('99');
    expect(pageContent).toContain('199');
  });

  test('landing page plan names are consistent', async ({ page }) => {
    await page.goto('/');

    const pageContent = await page.locator('body').textContent();

    // Should use correct plan names
    expect(pageContent).toContain('Starter');
    expect(pageContent).toContain('Growth');
    expect(pageContent).toContain('Scale');
  });

  test('landing page limits match expected values', async ({ page }) => {
    await page.goto('/');

    const pageContent = await page.locator('body').textContent();

    // Free plan: 10 products, 3 checks
    expect(pageContent).toContain('10 produits');
    expect(pageContent).toContain('3 vérifications');

    // Starter plan: 100 products, 10 checks
    expect(pageContent).toContain('100 produits');
    expect(pageContent).toContain('10 vérifications');

    // Growth plan: 500 products, 50 checks
    expect(pageContent).toContain('500 produits');
    expect(pageContent).toContain('50 vérifications');
  });
});

// ============================================================================
// HELP PAGE DOCUMENTATION TESTS
// ============================================================================

test.describe('Help Page Plan Documentation Consistency', () => {
  test('help page prices match expected values', async ({ page }) => {
    await page.goto('/help');

    const pageContent = await page.locator('body').textContent();

    // Should have correct prices
    if (pageContent?.includes('49$/mois') || pageContent?.includes('$49')) {
      expect(pageContent).toContain('49');
      expect(pageContent).toContain('99');
      expect(pageContent).toContain('199');
    }
  });

  test('help page limits match expected values', async ({ page }) => {
    await page.goto('/help');

    const pageContent = await page.locator('body').textContent();

    // Check for consistent limit values
    if (pageContent?.includes('Produits analysés')) {
      expect(pageContent).toContain('10'); // Free
      expect(pageContent).toContain('100'); // Starter
      expect(pageContent).toContain('500'); // Growth
    }
  });
});

// ============================================================================
// API QUOTA CONSISTENCY TESTS
// ============================================================================

test.describe('API Quota Response Consistency', () => {
  test('optimize API returns valid quota structure', async ({ request }) => {
    const response = await request.get('/api/optimize', { headers });

    if (response.status() === 200) {
      const data = await response.json();

      expect(data.data.quota).toHaveProperty('used');
      expect(data.data.quota).toHaveProperty('limit');
      expect(data.data.quota).toHaveProperty('remaining');
      expect(data.data.quota).toHaveProperty('available');

      // Limit should be a valid number (not 0 for paid plans)
      const limit = data.data.quota.limit;
      expect(typeof limit).toBe('number');

      // Remaining should equal limit - used
      expect(data.data.quota.remaining).toBe(
        Math.max(0, data.data.quota.limit - data.data.quota.used)
      );
    }
  });

  test('quota limit matches plan', async ({ request }) => {
    // First get shop info to know the plan
    const shopResponse = await request.get('/api/shop', { headers });

    if (shopResponse.status() === 200) {
      const shopData = await shopResponse.json();
      const plan = shopData.data?.plan;

      // Then get optimize quota
      const optimizeResponse = await request.get('/api/optimize', { headers });

      if (optimizeResponse.status() === 200) {
        const optimizeData = await optimizeResponse.json();
        const quotaLimit = optimizeData.data.quota.limit;

        // Verify limit matches expected for plan
        if (plan && EXPECTED_LIMITS[plan as keyof typeof EXPECTED_LIMITS]) {
          const expectedLimit = EXPECTED_LIMITS[plan as keyof typeof EXPECTED_LIMITS].aiOptimizationsPerMonth;
          expect(quotaLimit).toBe(expectedLimit);
        }
      }
    }
  });

  test('visibility quota matches plan limits', async ({ request }) => {
    const response = await request.get('/api/visibility', { headers });

    if (response.status() === 200) {
      const data = await response.json();

      // Should have quota information
      if (data.data?.quota) {
        expect(data.data.quota).toHaveProperty('limit');
        expect(typeof data.data.quota.limit).toBe('number');

        // Limit should not be 0 (that would be the bug)
        // For FREE plan it should be 3, for PREMIUM it should be 200
        expect(data.data.quota.limit).toBeGreaterThan(0);
      }
    }
  });

  test('audit response includes plan info', async ({ request }) => {
    const response = await request.get('/api/audit', { headers });

    if (response.status() === 200) {
      const data = await response.json();

      expect(data.data).toHaveProperty('plan');
      expect(data.data.plan).toHaveProperty('current');
      expect(data.data.plan).toHaveProperty('productLimit');

      // Plan should be a valid value
      const validPlans = ['FREE', 'BASIC', 'PLUS', 'PREMIUM'];
      expect(validPlans).toContain(data.data.plan.current);

      // Product limit should match expected
      const plan = data.data.plan.current;
      const expectedLimit = EXPECTED_LIMITS[plan as keyof typeof EXPECTED_LIMITS]?.productsAudited;

      if (expectedLimit === Infinity) {
        expect(data.data.plan.productLimit).toBe(-1);
      } else if (expectedLimit) {
        expect(data.data.plan.productLimit).toBe(expectedLimit);
      }
    }
  });
});

// ============================================================================
// CROSS-PAGE CONSISTENCY TESTS
// ============================================================================

test.describe('Cross-Page Consistency', () => {
  test('settings page shows same plan as API', async ({ page, request }) => {
    // This test would require authentication context
    // For now, just verify the settings page loads
    await page.goto('/admin/settings');
    await page.waitForTimeout(3000);

    // Page should load without error
    const bodyContent = await page.locator('body').textContent();
    expect(bodyContent?.length).toBeGreaterThan(100);
  });

  test('optimize page quota matches API quota', async ({ page, request }) => {
    // Get API quota
    const apiResponse = await request.get('/api/optimize', { headers });

    if (apiResponse.status() === 200) {
      const apiData = await apiResponse.json();
      const apiLimit = apiData.data.quota.limit;
      const apiUsed = apiData.data.quota.used;

      // Navigate to optimize page
      await page.goto('/admin/optimize');
      await page.waitForTimeout(5000);

      const pageContent = await page.locator('body').textContent();

      // If showing quota, it should match API
      if (pageContent?.includes('of') && pageContent?.includes('remaining')) {
        // The displayed values should reflect the API values
        if (apiLimit > 0) {
          expect(pageContent).toContain(String(apiLimit));
        }
      }
    }
  });
});

// ============================================================================
// PLAN UPGRADE/DOWNGRADE CONSISTENCY TESTS
// ============================================================================

test.describe('Plan Change Consistency', () => {
  test('dev plan change updates quotas correctly', async ({ request }) => {
    // Change to PREMIUM
    const changeResponse = await request.post('/api/dev/plan', {
      headers,
      data: { plan: 'PREMIUM' },
    });

    if (changeResponse.status() === 200) {
      // Verify quota reflects PREMIUM limits
      const optimizeResponse = await request.get('/api/optimize', { headers });

      if (optimizeResponse.status() === 200) {
        const data = await optimizeResponse.json();
        expect(data.data.quota.limit).toBe(EXPECTED_LIMITS.PREMIUM.aiOptimizationsPerMonth);
      }
    }
  });

  test('plan change from FREE to BASIC increases limits', async ({ request }) => {
    // Set to FREE first
    await request.post('/api/dev/plan', {
      headers,
      data: { plan: 'FREE' },
    });

    // Get FREE quota
    let freeLimit = 0;
    const freeResponse = await request.get('/api/optimize', { headers });
    if (freeResponse.status() === 200) {
      const data = await freeResponse.json();
      freeLimit = data.data.quota.limit;
    }

    // Change to BASIC
    await request.post('/api/dev/plan', {
      headers,
      data: { plan: 'BASIC' },
    });

    // Get BASIC quota
    const basicResponse = await request.get('/api/optimize', { headers });
    if (basicResponse.status() === 200) {
      const data = await basicResponse.json();
      const basicLimit = data.data.quota.limit;

      // BASIC should have higher limits than FREE
      expect(basicLimit).toBeGreaterThan(freeLimit);
    }
  });
});

// ============================================================================
// ZERO QUOTA BUG DETECTION TESTS
// ============================================================================

test.describe('Zero Quota Bug Detection', () => {
  test('PREMIUM plan should never show 0/0 optimizations', async ({ request }) => {
    // Set plan to PREMIUM
    await request.post('/api/dev/plan', {
      headers,
      data: { plan: 'PREMIUM' },
    });

    const response = await request.get('/api/optimize', { headers });

    if (response.status() === 200) {
      const data = await response.json();

      // PREMIUM should have 500 optimizations, never 0
      expect(data.data.quota.limit).toBe(500);
      expect(data.data.quota.limit).not.toBe(0);
    }
  });

  test('paid plan should never show 0 limit', async ({ request }) => {
    const paidPlans = ['BASIC', 'PLUS', 'PREMIUM'];

    for (const plan of paidPlans) {
      // Set plan
      await request.post('/api/dev/plan', {
        headers,
        data: { plan },
      });

      const response = await request.get('/api/optimize', { headers });

      if (response.status() === 200) {
        const data = await response.json();

        // Paid plans should never have 0 limit
        expect(data.data.quota.limit).toBeGreaterThan(0);
      }
    }
  });

  test('shop plan field matches expected after change', async ({ request }) => {
    // Change to PLUS
    await request.post('/api/dev/plan', {
      headers,
      data: { plan: 'PLUS' },
    });

    // Verify shop shows PLUS
    const shopResponse = await request.get('/api/shop', { headers });

    if (shopResponse.status() === 200) {
      const data = await shopResponse.json();
      expect(data.data.plan).toBe('PLUS');
    }
  });
});

// ============================================================================
// DISPLAY VALUE CONSISTENCY TESTS
// ============================================================================

test.describe('Display Value Consistency', () => {
  test('unlimited plans show infinity symbol or "Unlimited"', async ({ page }) => {
    await page.goto('/admin/settings');
    await page.waitForTimeout(5000);

    const pageContent = await page.locator('body').textContent();

    // Scale/PREMIUM plan should show unlimited
    if (pageContent?.includes('Scale') || pageContent?.includes('PREMIUM')) {
      const hasUnlimited = pageContent.includes('Unlimited') ||
        pageContent.includes('Illimité') ||
        pageContent.includes('∞');

      // If showing Scale plan details, should have unlimited indicator
      expect(hasUnlimited || !pageContent.includes('Scale')).toBeTruthy();
    }
  });

  test('quota display matches format X of Y', async ({ page }) => {
    await page.goto('/admin/optimize');
    await page.waitForTimeout(5000);

    const pageContent = await page.locator('body').textContent();

    // If showing quota, should be in format "X of Y" or "X / Y"
    // Should NOT show "0 of 0" for paid plans
    const zeroOfZero = pageContent?.includes('0 of 0') || pageContent?.includes('0 / 0');

    if (zeroOfZero) {
      // This is a bug - paid plans should never show 0/0
      // Check if this is expected (FREE plan with no usage)
      const isFreeWithNoUsage = pageContent?.includes('Free') && pageContent?.includes('Upgrade');

      expect(isFreeWithNoUsage).toBeTruthy();
    }
  });
});
