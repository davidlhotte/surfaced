# Surfaced - Development Guide

This is a Shopify app template built with Next.js, Prisma, and Polaris.

## Quick Start

```bash
npm run dev          # Start development server (localhost:3000)
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run build        # Production build
npm run lint         # Run ESLint
npm run format       # Run Prettier
```

## Project Structure

```
surfaced/
├── app/                    # Next.js App Router
│   ├── admin/             # Embedded Shopify admin (App Bridge)
│   ├── api/               # API routes
│   └── page.tsx           # Public landing page
├── components/
│   ├── admin/             # Polaris components
│   ├── providers/         # React context providers
│   └── ui/                # Shared UI (ErrorBoundary, etc.)
├── lib/
│   ├── shopify/           # Shopify auth, API, billing
│   ├── db/                # Prisma client
│   ├── cache/             # Vercel KV
│   ├── security/          # Encryption, rate limiting
│   ├── monitoring/        # Sentry, logging
│   └── utils/             # Validation, errors
├── prisma/                # Database schema & migrations
└── tests/
    ├── e2e/              # Playwright tests
    └── unit/             # Vitest tests
```

## Configuration

### 1. Shopify App Setup
1. Create a new app in Shopify Partner Dashboard
2. Update `shopify.app.toml` with your credentials:
   - `client_id`: Your Shopify app client ID
   - Update URLs to match your Vercel deployment

### 2. Environment Variables
Create `.env` with:
```env
SHOPIFY_API_KEY=            # From Shopify Partners
SHOPIFY_API_SECRET=         # From Shopify Partners
DATABASE_URL=               # Vercel Postgres
KV_REST_API_URL=            # Vercel KV
KV_REST_API_TOKEN=          # Vercel KV
ENCRYPTION_KEY=             # openssl rand -hex 32
```

### 3. Database
```bash
npx prisma generate         # Generate client
npx prisma db push          # Push schema to DB
npx prisma studio           # View data
```

## Built-in Features

- **Shopify OAuth**: Complete authentication flow with token encryption
- **Billing**: Subscription plans with Shopify billing API
- **Webhooks**: GDPR-compliant with HMAC validation
- **Security**: AES-256 encryption, rate limiting, security headers
- **Monitoring**: Sentry integration, structured logging

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `@shopify/shopify-api` | Shopify API client |
| `@shopify/polaris` | Admin UI components |
| `@shopify/app-bridge-react` | Embedded app bridge |
| `prisma` | Database ORM |
| `@vercel/kv` | Redis cache |
| `zod` | Validation |
| `@sentry/nextjs` | Error tracking |

## Plans

The app includes 4 subscription tiers:
- FREE: Basic features
- BASIC ($4.99/mo): More features
- PLUS ($9.99/mo): Advanced features
- PREMIUM ($24.99/mo): Everything + priority support

Edit `app/admin/settings/page.tsx` to customize plan features.

## Extending the Template

### Add a new model
1. Update `prisma/schema.prisma`
2. Run `npx prisma db push`
3. Create API routes in `app/api/`

### Add admin pages
1. Create page in `app/admin/your-feature/page.tsx`
2. Use Polaris components for UI
3. Use `useAuthenticatedFetch` for API calls

### Add settings
1. Update `Settings` model in Prisma schema
2. Update `lib/utils/validation.ts` with schema
3. Update `app/api/settings/route.ts`

## Coding Standards

- TypeScript strict mode
- Zod for runtime validation
- Server Components by default
- Error boundaries on all pages
- Consistent API error format

## Commit Convention

```
feat: Add new feature
fix: Bug fix
docs: Documentation
test: Add tests
refactor: Code refactoring
chore: Maintenance
```

## Deployment Workflow

**IMPORTANT: After every modification, follow this COMPLETE workflow:**

### 1. Lint & Type Check
```bash
npm run lint                           # Check for ESLint errors
npx tsc --noEmit                       # Check for TypeScript errors
```

### 2. Commit & Push
```bash
git add -A
git commit -m "feat/fix: Description"
git push origin main
```

### 3. Deploy to Shopify
```bash
npx shopify app deploy --force
```

### 4. Verify Vercel Build (MANDATORY)
```bash
# Check if pages are accessible (should return 200)
curl -s -o /dev/null -w "%{http_code}" https://surfaced.vercel.app
curl -s -o /dev/null -w "%{http_code}" https://surfaced.vercel.app/admin
curl -s -o /dev/null -w "%{http_code}" https://surfaced.vercel.app/admin/settings

# If any returns non-200, check Vercel dashboard for error logs
```

### 5. Fix Errors if Build Failed
- Check Vercel dashboard: https://vercel.com/davids-projects-611f5421/surfaced
- Read error logs
- Fix the code
- Repeat steps 1-4

### 6. Test Functionality
- Test the feature manually in the app
- Run relevant tests: `npm run test`

### Complete Workflow Example
```bash
# 1. Lint and type check
npm run lint && npx tsc --noEmit

# 2. Commit and push
git add -A && git commit -m "feat: Add new feature" && git push origin main

# 3. Deploy to Shopify
npx shopify app deploy --force

# 4. Verify Vercel deployment
curl -s -o /dev/null -w "%{http_code}" https://surfaced.vercel.app/admin

# 5. If 200, deployment successful!
# If not 200, check Vercel logs and fix errors
```

### Verification Checklist
- [ ] `npm run lint` passes
- [ ] `npx tsc --noEmit` passes
- [ ] Git push successful
- [ ] Shopify deploy shows "New version released"
- [ ] Vercel pages return HTTP 200
- [ ] Feature works as expected

## App URLs

- **Production**: https://surfaced.vercel.app
- **Shopify Partners**: https://partners.shopify.com (Apps > Surfaced)
- **Vercel Dashboard**: https://vercel.com/dashboard
