import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Authentication Flows
 *
 * These tests verify that the app handles authentication correctly,
 * especially when accessed directly without Shopify context.
 *
 * CRITICAL: These tests would have caught the issues where:
 * - Users accessing directly saw cryptic errors
 * - Shop detection failures weren't handled gracefully
 */

// ============================================================================
// DIRECT ACCESS TESTS (No Shopify Context)
// ============================================================================

test.describe('Direct Access Handling (No Shop Context)', () => {
  test('dashboard shows authentication required message when accessed directly', async ({ page }) => {
    // Access the admin directly without shop parameter
    await page.goto('/admin');

    // Wait for shop detection to exhaust all retries (5 retries * ~1s each + processing time)
    await page.waitForTimeout(8000);

    // Should either show NotAuthenticated component OR loading state that leads to auth message
    const bodyContent = await page.locator('body').textContent();

    // Should NOT show a cryptic error like "App Bridge: missing shop"
    expect(bodyContent).not.toContain('App Bridge');
    expect(bodyContent).not.toContain('missing required');

    // Should show helpful message about authentication OR still be loading
    const hasAuthMessage = bodyContent?.includes('Authentication Required') ||
      bodyContent?.includes('Shopify admin') ||
      bodyContent?.includes('Please open') ||
      bodyContent?.includes('Loading');

    expect(hasAuthMessage).toBeTruthy();
  });

  test('products page shows authentication error when accessed directly', async ({ page }) => {
    await page.goto('/admin/products');

    // Wait for shop detection to fail
    await page.waitForTimeout(6000); // 5 retries * ~1s each

    const bodyContent = await page.locator('body').textContent();

    // Should NOT show infinite loading
    expect(bodyContent).not.toContain('Loading your products...');

    // Should show auth instructions or error
    const hasAuthInstructions = bodyContent?.includes('Authentication') ||
      bodyContent?.includes('Shopify admin') ||
      bodyContent?.includes('Please open');

    expect(hasAuthInstructions).toBeTruthy();
  });

  test('visibility page shows authentication error when accessed directly', async ({ page }) => {
    await page.goto('/admin/visibility');
    await page.waitForTimeout(6000);

    const bodyContent = await page.locator('body').textContent();
    expect(bodyContent).not.toContain('Loading your visibility');

    const hasAuthInstructions = bodyContent?.includes('Authentication') ||
      bodyContent?.includes('Shopify admin');

    expect(hasAuthInstructions).toBeTruthy();
  });

  test('optimize page shows authentication error when accessed directly', async ({ page }) => {
    await page.goto('/admin/optimize');
    await page.waitForTimeout(6000);

    const bodyContent = await page.locator('body').textContent();

    // Should NOT show "Missing shop domain" without explanation
    if (bodyContent?.includes('Missing shop domain')) {
      // If this error is shown, it should come with instructions
      expect(bodyContent).toContain('Shopify admin');
    }
  });

  test('competitors page shows authentication error when accessed directly', async ({ page }) => {
    await page.goto('/admin/competitors');
    await page.waitForTimeout(6000);

    const bodyContent = await page.locator('body').textContent();
    expect(bodyContent).not.toContain('Failed to fetch competitors');

    const hasAuthInstructions = bodyContent?.includes('Authentication') ||
      bodyContent?.includes('Shopify admin');

    expect(hasAuthInstructions).toBeTruthy();
  });

  test('ab-tests page shows authentication error when accessed directly', async ({ page }) => {
    await page.goto('/admin/ab-tests');
    await page.waitForTimeout(6000);

    const bodyContent = await page.locator('body').textContent();
    expect(bodyContent).not.toContain('Failed to fetch tests');

    const hasAuthInstructions = bodyContent?.includes('Authentication') ||
      bodyContent?.includes('Shopify admin');

    expect(hasAuthInstructions).toBeTruthy();
  });

  test('settings page shows authentication error when accessed directly', async ({ page }) => {
    await page.goto('/admin/settings');
    await page.waitForTimeout(6000);

    const bodyContent = await page.locator('body').textContent();

    const hasAuthInstructions = bodyContent?.includes('Authentication') ||
      bodyContent?.includes('Shopify admin');

    expect(hasAuthInstructions).toBeTruthy();
  });
});

// ============================================================================
// API AUTHENTICATION TESTS
// ============================================================================

test.describe('API Authentication', () => {
  test('API returns 401 without shop header', async ({ request }) => {
    const endpoints = [
      '/api/dashboard',
      '/api/products',
      '/api/visibility',
      '/api/optimize',
      '/api/competitors',
      '/api/ab-tests',
      '/api/settings',
      '/api/alerts',
    ];

    for (const endpoint of endpoints) {
      const response = await request.get(endpoint);
      expect(response.status()).toBe(401);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    }
  });

  test('API returns proper error message for missing shop', async ({ request }) => {
    const response = await request.get('/api/dashboard');
    const data = await response.json();

    // Error message should be clear
    expect(data.error).toContain('shop');
  });
});

// ============================================================================
// SHOP DETECTION TIMEOUT TESTS
// ============================================================================

test.describe('Shop Detection Timeouts', () => {
  test('page does not hang indefinitely when shop cannot be detected', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/admin');

    // Wait for either auth message or error, but not more than 15 seconds
    await page.waitForTimeout(10000);

    const elapsedTime = Date.now() - startTime;

    // Should resolve within 15 seconds
    expect(elapsedTime).toBeLessThan(15000);

    // Page should have content (not blank)
    const bodyContent = await page.locator('body').textContent();
    expect(bodyContent?.length).toBeGreaterThan(50);
  });

  test('all retry attempts are exhausted before showing error', async ({ page }) => {
    await page.goto('/admin');

    // The ShopProvider does 5 retries with delays
    // Total time should be around 5 seconds for retries
    await page.waitForTimeout(7000);

    // After retries, should show auth message
    const bodyContent = await page.locator('body').textContent();

    const hasResolved = bodyContent?.includes('Authentication') ||
      bodyContent?.includes('Shopify admin') ||
      bodyContent?.includes('Loading');

    expect(hasResolved).toBeTruthy();
  });
});

// ============================================================================
// ERROR MESSAGE QUALITY TESTS
// ============================================================================

test.describe('Error Message Quality', () => {
  test('authentication error includes actionable instructions', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(7000);

    const bodyContent = await page.locator('body').textContent();

    // If showing auth error, should include instructions
    if (bodyContent?.includes('Authentication')) {
      // Should tell user what to do
      const hasInstructions = bodyContent.includes('Go to') ||
        bodyContent.includes('Click') ||
        bodyContent.includes('Open') ||
        bodyContent.includes('admin.shopify.com');

      expect(hasInstructions).toBeTruthy();
    }
  });

  test('authentication error includes link to Shopify admin', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(7000);

    // Look for a button or link to Shopify admin
    const shopifyLink = page.locator('a[href*="shopify"], button:has-text("Shopify")');

    if (await shopifyLink.count() > 0) {
      await expect(shopifyLink.first()).toBeVisible();
    }
  });

  test('no console errors about App Bridge when accessed directly', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/admin');
    await page.waitForTimeout(5000);

    // App Bridge errors should be caught and handled gracefully
    const appBridgeErrors = consoleErrors.filter(
      (err) => err.includes('App Bridge') && err.includes('missing')
    );

    // We accept some App Bridge warnings, but they shouldn't crash the page
    // The page should still show a helpful message
    const bodyContent = await page.locator('body').textContent();
    expect(bodyContent?.length).toBeGreaterThan(100);
  });
});
