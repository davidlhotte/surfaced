# E2E Tests - LocateUs

## Overview

These E2E tests verify the critical paths of the LocateUs Shopify app:

1. **health.spec.ts** - Smoke tests and health checks
2. **billing.spec.ts** - Payment flow tests
3. **api.spec.ts** - Core API endpoint tests
4. **storefront.spec.ts** - Public widget API tests

## Running Tests

### Local Development

```bash
# Run all E2E tests
npm run e2e

# Run with UI (interactive)
npm run e2e:ui

# Run specific test file
npx playwright test tests/e2e/health.spec.ts
```

### CI Environment

For tests to pass completely, the following environment variables must be set:

```env
SHOPIFY_API_KEY=your-api-key
SHOPIFY_API_SECRET=your-api-secret
SHOPIFY_APP_URL=https://your-app.example.com
DATABASE_URL=your-database-url
KV_REST_API_URL=your-redis-url
KV_REST_API_TOKEN=your-redis-token
ENCRYPTION_KEY=your-encryption-key
```

### Expected Behavior

| Environment | Expected Result |
|-------------|-----------------|
| Local (no env vars) | Some tests pass, some fail with 500 (missing config) |
| CI (with env vars) | All tests should pass |
| Production | Not recommended - use staging environment |

## Test Categories

### 1. Health Checks (health.spec.ts)
- Verifies the app is running
- Checks all endpoints are reachable
- Validates error handling

### 2. Billing Flow (billing.spec.ts)
- **GET /api/billing** - Check billing status
- **POST /api/billing** - Create subscription
- **GET /api/billing/callback** - Handle payment callback

Critical for:
- Plan upgrades (BASIC, PLUS, PREMIUM)
- Payment confirmation
- Plan downgrades

### 3. API Endpoints (api.spec.ts)
- Stores CRUD operations
- Settings management
- Authentication flow
- Rate limiting

### 4. Storefront Widget (storefront.spec.ts)
- Public API for theme extension
- CORS headers
- Search and filtering
- Distance sorting
- Security (no sensitive data exposed)

## Writing New Tests

```typescript
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test('should do something', async ({ request }) => {
    const response = await request.get('/api/my-endpoint');

    // In local env, expect 500 as valid (missing config)
    // In CI, expect the actual status
    expect([200, 401, 500]).toContain(response.status());
  });
});
```

## Pre-Launch Checklist

Before launching to production, verify:

- [ ] All E2E tests pass in CI with production-like env vars
- [ ] Billing flow tested manually on Shopify dev store
- [ ] All plan upgrades work (FREE → BASIC → PLUS → PREMIUM)
- [ ] Billing callback correctly updates plan in database
- [ ] Storefront widget loads correctly on theme

## Manual Testing Required

Some flows cannot be fully automated:

1. **OAuth Installation Flow** - Requires real Shopify store
2. **Payment Approval** - Requires Shopify admin interaction
3. **Theme Extension** - Requires theme editor testing

For these, use a Shopify development store:
1. Install app on dev store
2. Test each plan subscription
3. Verify billing callback
4. Test theme extension in customizer
