# LocateUs - Shopify Store Locator App

## Project Context

You are setting up **LocateUs**, a Shopify embedded app for store location management with:
- Unlimited stores on all plans
- Map size presets (banner, square, rectangle, full-page)
- 20% lower pricing than competitors
- Modern stack: Next.js 14, Vercel, PostgreSQL, Shopify App Bridge

## Technical Stack

```
Frontend:     Next.js 14 (App Router) + React 18
Backend:      Next.js API Routes (Serverless)
Database:     PostgreSQL (Vercel Postgres)
ORM:          Prisma
Hosting:      Vercel
Maps:         OpenStreetMap (Leaflet) - FREE
Auth:         Shopify OAuth + App Bridge
Testing:      Playwright (E2E) + Vitest (Unit)
UI:           Shopify Polaris + Tailwind CSS
Cache:        Vercel KV (Redis)
Monitoring:   Sentry
Encryption:   AES-256-GCM
```

## Instructions

### RÈGLE ABSOLUE
- Fais TOUT ce que tu peux faire automatiquement sans me demander
- Ne me demande que pour les actions qui NÉCESSITENT mon intervention
- Quand tu as besoin de moi, donne-moi des instructions PRÉCISES étape par étape

---

## Phase 1: Dependencies (AUTOMATIC)

Install all dependencies:

```bash
# Shopify
npm install @shopify/shopify-api @shopify/app-bridge-react @shopify/polaris @shopify/polaris-icons

# Database
npm install @prisma/client @vercel/postgres
npm install -D prisma

# Cache & Queue
npm install @vercel/kv @upstash/ratelimit

# Maps
npm install leaflet react-leaflet
npm install -D @types/leaflet

# CSV
npm install papaparse
npm install -D @types/papaparse

# Validation
npm install zod

# Security
npm install isomorphic-dompurify
npm install -D @types/dompurify

# Monitoring
npm install @sentry/nextjs pino pino-pretty

# Dev & Testing
npm install -D vitest @vitest/coverage-v8 playwright @playwright/test
npm install -D eslint-config-prettier prettier
npm install -D @testing-library/react @testing-library/jest-dom
```

---

## Phase 2: Prisma Configuration (AUTOMATIC)

1. Initialize Prisma: `npx prisma init`
2. Configure `prisma/schema.prisma` with the complete schema:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Shop {
  id              String    @id @default(cuid())
  shopDomain      String    @unique
  accessToken     String    // Encrypted AES-256-GCM
  plan            Plan      @default(FREE)
  trialEndsAt     DateTime?
  installedAt     DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  stores          Store[]
  settings        Settings?
  auditLogs       AuditLog[]
}

model Store {
  id              String    @id @default(cuid())
  shopId          String
  shop            Shop      @relation(fields: [shopId], references: [id], onDelete: Cascade)
  
  name            String
  address         String
  city            String
  state           String?
  postalCode      String?
  country         String
  
  phone           String?
  email           String?
  website         String?
  
  latitude        Float?
  longitude       Float?
  geocodeStatus   GeocodeStatus @default(PENDING)
  
  featured        Boolean   @default(false)
  category        String?
  customFields    Json?
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([shopId])
  @@index([country, state, city])
  @@index([name])
  @@index([latitude, longitude])
  @@index([featured, shopId])
  @@index([category, shopId])
}

model Settings {
  id                String        @id @default(cuid())
  shopId            String        @unique
  shop              Shop          @relation(fields: [shopId], references: [id], onDelete: Cascade)
  
  mapProvider       MapProvider   @default(OPENSTREETMAP)
  googleMapsKey     String?
  mapSizePreset     MapSizePreset @default(RECTANGLE)
  
  markerColor       String        @default("#FF0000")
  markerIcon        String?
  
  showAddresses     Boolean       @default(true)
  showPhone         Boolean       @default(true)
  showWebsite       Boolean       @default(true)
  groupByState      Boolean       @default(true)
  
  enableSearch      Boolean       @default(true)
  searchPlaceholder String        @default("Search locations...")
  enableGeolocation Boolean       @default(true)
  defaultZoom       Int           @default(10)
  
  distanceUnit      DistanceUnit  @default(MILES)
  hidePoweredBy     Boolean       @default(false)
  
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
}

model AuditLog {
  id          String    @id @default(cuid())
  shopId      String
  shop        Shop      @relation(fields: [shopId], references: [id], onDelete: Cascade)
  action      String
  details     Json?
  ipAddress   String?
  createdAt   DateTime  @default(now())
  
  @@index([shopId, createdAt])
}

enum Plan {
  FREE
  BASIC
  PLUS
  PREMIUM
}

enum MapProvider {
  OPENSTREETMAP
  GOOGLE_MAPS
}

enum MapSizePreset {
  BANNER
  SQUARE
  RECTANGLE
  FULL_PAGE
}

enum DistanceUnit {
  MILES
  KILOMETERS
}

enum GeocodeStatus {
  PENDING
  SUCCESS
  FAILED
  MANUAL
}
```

3. Create `lib/db/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

---

## Phase 3: Security Implementation (AUTOMATIC)

Create the following security files:

### lib/security/encryption.ts
- AES-256-GCM encryption/decryption for tokens
- Use crypto.timingSafeEqual for comparisons

### lib/security/rate-limit.ts
- Public API: 100 req/min
- Admin API: 1000 req/min
- Geocoding: 10 req/sec

### lib/security/sanitize.ts
- CSV formula injection prevention
- XSS sanitization with DOMPurify

### middleware.ts
- Security headers (CSP, X-Frame-Options, etc.)
- CORS for storefront API
- Rate limiting integration

---

## Phase 4: External Services (GUIDED)

### DEMANDE-MOI les informations suivantes:

```
J'ai besoin des informations de tes services externes.

## 1. Shopify Partner Dashboard
1. Va sur https://partners.shopify.com
2. Crée une nouvelle app "LocateUs"
3. Configure:
   - App URL: https://locateus-app.vercel.app (ou ton domaine)
   - Redirect URLs: https://locateus-app.vercel.app/api/auth/callback
4. Donne-moi:
   - API Key
   - API Secret

## 2. Vercel
1. Va sur https://vercel.com/dashboard
2. Crée un nouveau projet connecté à ton repo
3. Dans Storage, crée:
   - Vercel Postgres (database)
   - Vercel KV (cache)
4. Donne-moi:
   - DATABASE_URL (depuis Postgres)
   - KV_REST_API_URL
   - KV_REST_API_TOKEN

## 3. Sentry (optionnel mais recommandé)
1. Va sur https://sentry.io
2. Crée un projet Next.js
3. Donne-moi:
   - SENTRY_DSN

## 4. Génère une clé de chiffrement:
```bash
openssl rand -hex 32
```
Donne-moi le résultat pour ENCRYPTION_KEY
```

---

## Phase 5: Environment Variables (AUTOMATIC)

Create `.env.example`:

```env
# Shopify
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
SHOPIFY_SCOPES=read_content,write_content,read_themes,write_themes
SHOPIFY_APP_URL=http://localhost:3000

# Database
DATABASE_URL=

# Cache (Vercel KV)
KV_REST_API_URL=
KV_REST_API_TOKEN=

# Security
ENCRYPTION_KEY=

# Monitoring
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

Create `.env.local` with values provided by user.

---

## Phase 6: Project Structure (AUTOMATIC)

Create the complete folder structure:

```
app/
  (admin)/
    layout.tsx              # Shopify App Bridge provider
    page.tsx                # Dashboard
    stores/
      page.tsx              # Store list
      [id]/page.tsx         # Edit store
      new/page.tsx          # Add store
    import/page.tsx         # CSV import
    settings/page.tsx       # App settings
    appearance/page.tsx     # Map customization
  api/
    auth/
      route.ts              # OAuth start
      callback/route.ts     # OAuth callback
    stores/
      route.ts              # List/Create
      [id]/route.ts         # Get/Update/Delete
    import/
      route.ts              # CSV import
      template/route.ts     # Download template
    export/route.ts         # CSV export
    settings/route.ts
    billing/route.ts
    webhooks/route.ts
  storefront/
    [shop]/route.ts         # Public API
  layout.tsx
  page.tsx                  # Landing/redirect
components/
  admin/
    StoreForm.tsx
    StoreList.tsx
    StoreCard.tsx
    CSVImporter.tsx
    MapPreview.tsx
    SizePresetSelector.tsx
    PlanBadge.tsx
  storefront/
    StoreLocatorWidget.tsx
    MapContainer.tsx
    StoreList.tsx
    SearchBar.tsx
    StorePopup.tsx
  ui/
    ErrorBoundary.tsx
    LoadingSpinner.tsx
    Toast.tsx
lib/
  shopify/
    auth.ts
    api.ts
    billing.ts
    webhooks.ts
    session.ts
  db/
    prisma.ts
  cache/
    redis.ts
  security/
    encryption.ts
    rate-limit.ts
    sanitize.ts
  maps/
    geocoding.ts
    presets.ts
    distance.ts
  monitoring/
    sentry.ts
    logger.ts
  utils/
    csv.ts
    validation.ts
    errors.ts
    fair-use.ts
  constants/
    plans.ts
    map-presets.ts
  types/
    index.ts
extensions/
  store-locator/
    blocks/
      store-locator.liquid
    assets/
      store-locator.js
      store-locator.css
    locales/
      en.default.json
tests/
  e2e/
    auth.spec.ts
    stores.spec.ts
    import-export.spec.ts
    storefront.spec.ts
  unit/
    csv.test.ts
    validation.test.ts
    encryption.test.ts
    geocoding.test.ts
  fixtures/
    valid-stores.csv
    malformed.csv
```

---

## Phase 7: Core Implementation (AUTOMATIC)

### Priority Order:
1. **Shopify Auth** - OAuth flow, session management
2. **Security Layer** - Encryption, rate limiting, sanitization
3. **Store CRUD API** - With Zod validation
4. **CSV Import/Export** - With sanitization
5. **Settings API** - Plan-gated features
6. **Webhooks** - app/uninstalled handler
7. **Storefront API** - Public endpoint with caching

---

## Phase 8: Admin UI (AUTOMATIC)

Build Polaris-based admin interface:
- Dashboard with stats
- Store list with pagination, search, filters
- Store form with validation
- CSV import with preview and error reporting
- Settings with plan feature gates
- Map preview with size presets

---

## Phase 9: Storefront Widget (AUTOMATIC)

Build the public widget:
- Leaflet map integration
- Responsive size presets
- Store search and filtering
- Geolocation support
- Marker clustering for large datasets
- Mobile-optimized layout

---

## Phase 10: Testing Configuration (AUTOMATIC)

### vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: ['node_modules', 'tests', '**/*.d.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

### playwright.config.ts
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

Add npm scripts:
```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "e2e": "playwright test",
  "e2e:ui": "playwright test --ui"
}
```

---

## Phase 11: Sentry Setup (AUTOMATIC)

Run: `npx @sentry/wizard@latest -i nextjs`

Configure error boundaries and tracking.

---

## Phase 12: Theme App Extension (AUTOMATIC)

Create Shopify theme extension with:
- Liquid block for store locator
- Settings schema for map configuration
- Bundled JS/CSS assets
- Localization support

---

## Phase 13: Final Configuration (AUTOMATIC)

### CLAUDE.md
```markdown
# LocateUs Development Guide

## Quick Start
npm run dev          # Start development server
npm run test         # Run unit tests
npm run e2e          # Run E2E tests
npm run build        # Production build

## Architecture
- Next.js 14 App Router
- Shopify App Bridge for embedded UI
- Prisma + PostgreSQL
- Vercel KV for caching

## Key Patterns
- All tokens encrypted with AES-256-GCM
- Rate limiting on all APIs
- Zod validation everywhere
- Error boundaries on React components

## Testing
- Unit: Vitest + Testing Library
- E2E: Playwright
- Coverage target: 80%

## Deployment
1. Push to main
2. Vercel auto-deploys
3. Run `npx prisma migrate deploy`
```

### .prettierrc
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### .gitignore (complete)

---

## Phase 14: Verification (AUTOMATIC)

1. `npm run build` - Verify compilation
2. `npm run test` - Verify tests pass
3. `npx prisma generate` - Generate Prisma client
4. Fix any errors automatically

---

## Phase 15: Git (AUTOMATIC)

```bash
git init
git add .
git commit -m "feat: initial LocateUs setup with full stack"
```

---

## Summary at End

Provide:
1. ✅ What was configured automatically
2. ⏳ Manual steps remaining (Shopify Partner, Vercel setup)
3. 🚀 Commands to start development
4. 📋 Pre-launch checklist
