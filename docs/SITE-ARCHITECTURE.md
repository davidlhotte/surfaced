# Surfaced Site Architecture - Universal + Shopify Separation

## Overview

Le site doit supporter deux audiences distinctes :
1. **Universal** - Toute marque/site web (default)
2. **Shopify** - Marchands Shopify spécifiquement

---

## URL Structure

### Current (Shopify-only)
```
surfaced.vercel.app/
├── /                    → Shopify landing
├── /admin              → Shopify embedded app
├── /blog               → Blog
├── /cms                → Payload CMS admin
├── /privacy            → Privacy policy
├── /terms              → Terms of service
└── /api/...            → API routes
```

### New (Universal + Shopify)
```
surfaced.vercel.app/
│
│  ══════════════════════════════════════════════════════════
│  PUBLIC PAGES (No auth required)
│  ══════════════════════════════════════════════════════════
│
├── /                         → Universal Landing (NEW default)
│   └── Hero with "Enter URL" checker
│
├── /shopify                  → Shopify Landing (MOVED)
│   └── Shopify-specific messaging & App Store CTA
│
├── /check                    → AI Visibility Checker (FREE)
│   └── /check/[brand]       → Results page
│
├── /score                    → AEO Score Grader (FREE)
│   └── /score/[domain]      → Score results
│
├── /compare                  → Competitor Comparison (FREE)
│
├── /pricing                  → Universal Pricing
├── /pricing/shopify          → Shopify Pricing (if different)
│
├── /blog                     → Shared blog (content for both)
├── /blog/[slug]             → Blog posts
│
├── /privacy                  → Privacy policy (shared)
├── /terms                    → Terms of service (shared)
├── /gdpr                     → GDPR info (shared)
│
│  ══════════════════════════════════════════════════════════
│  AUTHENTICATED - UNIVERSAL (Email/Google auth)
│  ══════════════════════════════════════════════════════════
│
├── /login                    → Universal login
├── /signup                   → Universal signup
├── /dashboard                → Universal dashboard
│   ├── /dashboard/[brandId] → Brand details
│   ├── /dashboard/settings  → Account settings
│   └── /dashboard/billing   → Subscription management
│
│  ══════════════════════════════════════════════════════════
│  AUTHENTICATED - SHOPIFY (Shopify OAuth)
│  ══════════════════════════════════════════════════════════
│
├── /admin                    → Shopify embedded app (unchanged)
│   ├── /admin/products      → Product optimization
│   ├── /admin/visibility    → Visibility dashboard
│   ├── /admin/competitors   → Competitor tracking
│   ├── /admin/settings      → Shop settings
│   └── /admin/...           → Other Shopify features
│
│  ══════════════════════════════════════════════════════════
│  CMS & API
│  ══════════════════════════════════════════════════════════
│
├── /cms                      → Payload CMS admin (unchanged)
│
└── /api
    ├── /api/auth/...        → Auth endpoints (both systems)
    ├── /api/universal/...   → Universal API endpoints
    ├── /api/shopify/...     → Shopify-specific (existing)
    └── /api/v1/...          → Public API
```

---

## File Structure Changes

### Current Structure
```
app/
├── (app)/
│   ├── layout.tsx           # Shopify layout (App Bridge)
│   ├── page.tsx             # Landing (Shopify)
│   ├── admin/               # Shopify admin pages
│   ├── blog/                # Blog
│   └── ...
├── (payload)/
│   └── cms/                 # Payload CMS
└── api/
    └── ...                  # API routes
```

### New Structure
```
app/
├── (marketing)/              # PUBLIC pages - no App Bridge
│   ├── layout.tsx           # Marketing layout (no Shopify scripts)
│   ├── page.tsx             # Universal landing (NEW)
│   ├── shopify/
│   │   └── page.tsx         # Shopify landing (MOVED from /)
│   ├── check/
│   │   ├── page.tsx         # Checker input
│   │   └── [brand]/
│   │       └── page.tsx     # Checker results
│   ├── score/
│   │   ├── page.tsx         # Score input
│   │   └── [domain]/
│   │       └── page.tsx     # Score results
│   ├── compare/
│   │   └── page.tsx         # Comparison tool
│   ├── pricing/
│   │   ├── page.tsx         # Universal pricing
│   │   └── shopify/
│   │       └── page.tsx     # Shopify pricing
│   ├── blog/
│   │   ├── page.tsx         # Blog listing
│   │   └── [slug]/
│   │       └── page.tsx     # Blog post
│   ├── login/
│   │   └── page.tsx         # Universal login
│   ├── signup/
│   │   └── page.tsx         # Universal signup
│   ├── privacy/
│   │   └── page.tsx
│   ├── terms/
│   │   └── page.tsx
│   └── gdpr/
│       └── page.tsx
│
├── (dashboard)/              # UNIVERSAL authenticated
│   ├── layout.tsx           # Dashboard layout (with sidebar)
│   └── dashboard/
│       ├── page.tsx         # Dashboard home
│       ├── [brandId]/
│       │   └── page.tsx     # Brand details
│       ├── settings/
│       │   └── page.tsx     # Account settings
│       └── billing/
│           └── page.tsx     # Billing/subscription
│
├── (shopify)/                # SHOPIFY authenticated (App Bridge)
│   ├── layout.tsx           # Shopify layout (App Bridge scripts)
│   └── admin/
│       ├── page.tsx         # Shopify dashboard
│       ├── products/
│       │   └── page.tsx
│       ├── visibility/
│       │   └── page.tsx
│       ├── competitors/
│       │   └── page.tsx
│       ├── settings/
│       │   └── page.tsx
│       └── ...
│
├── (payload)/                # PAYLOAD CMS (unchanged)
│   ├── layout.tsx
│   └── cms/
│       └── [[...segments]]/
│           └── page.tsx
│
├── api/
│   ├── auth/
│   │   ├── login/
│   │   │   └── route.ts     # Universal login
│   │   ├── signup/
│   │   │   └── route.ts     # Universal signup
│   │   ├── google/
│   │   │   └── route.ts     # Google OAuth
│   │   └── shopify/
│   │       └── route.ts     # Shopify OAuth (existing)
│   ├── universal/
│   │   ├── check/
│   │   │   └── route.ts     # AI visibility check
│   │   ├── score/
│   │   │   └── route.ts     # AEO score
│   │   ├── compare/
│   │   │   └── route.ts     # Comparison
│   │   ├── brands/
│   │   │   └── route.ts     # CRUD brands
│   │   └── dashboard/
│   │       └── route.ts     # Dashboard data
│   ├── shopify/              # Existing Shopify endpoints
│   │   └── ...
│   └── v1/                   # Public API
│       ├── check/
│       │   └── route.ts
│       └── score/
│           └── route.ts
│
└── layout.tsx               # Root layout (minimal)
```

---

## Route Groups Explained

### `(marketing)` - Public Pages
- No authentication required
- No Shopify App Bridge
- Standard Next.js layout with marketing header/footer
- Includes free tools + landing pages

### `(dashboard)` - Universal Authenticated
- Requires email/password or Google auth
- Custom dashboard layout with sidebar
- Universal user data (not Shopify)

### `(shopify)` - Shopify Authenticated
- Requires Shopify OAuth
- Includes App Bridge scripts in layout
- Embedded in Shopify Admin

### `(payload)` - CMS Admin
- Payload CMS authentication
- Separate layout (already done)

---

## Layout Files

### `app/(marketing)/layout.tsx`
```tsx
// Marketing layout - NO Shopify App Bridge
import { Outfit } from 'next/font/google';
import '../globals.css';
import { MarketingHeader } from '@/components/marketing/header';
import { MarketingFooter } from '@/components/marketing/footer';

const outfit = Outfit({ subsets: ['latin'] });

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={outfit.className}>
        <MarketingHeader />
        <main>{children}</main>
        <MarketingFooter />
      </body>
    </html>
  );
}
```

### `app/(dashboard)/layout.tsx`
```tsx
// Universal dashboard layout
import { redirect } from 'next/navigation';
import { getUniversalUser } from '@/lib/auth/universal';
import { DashboardSidebar } from '@/components/dashboard/sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUniversalUser();
  if (!user) {
    redirect('/login');
  }

  return (
    <html lang="en">
      <body>
        <div className="flex">
          <DashboardSidebar user={user} />
          <main className="flex-1 p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
```

### `app/(shopify)/layout.tsx`
```tsx
// Shopify embedded app layout - WITH App Bridge
import '@shopify/polaris/build/esm/styles.css';

export default function ShopifyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || '';

  return (
    <html lang="en">
      <head>
        <meta name="shopify-api-key" content={apiKey} />
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

---

## Navigation Components

### Marketing Header
```tsx
// components/marketing/header.tsx
export function MarketingHeader() {
  return (
    <header className="border-b">
      <nav className="container mx-auto flex items-center justify-between py-4">
        <a href="/" className="font-bold text-xl">
          🌊 Surfaced
        </a>

        <div className="flex items-center gap-6">
          <a href="/check">AI Checker</a>
          <a href="/score">AEO Score</a>
          <a href="/pricing">Pricing</a>
          <a href="/blog">Blog</a>
        </div>

        <div className="flex items-center gap-4">
          <a href="/shopify" className="text-sm text-gray-600">
            For Shopify →
          </a>
          <a href="/login" className="btn-secondary">
            Login
          </a>
          <a href="/signup" className="btn-primary">
            Get Started Free
          </a>
        </div>
      </nav>
    </header>
  );
}
```

### Dashboard Sidebar
```tsx
// components/dashboard/sidebar.tsx
export function DashboardSidebar({ user }) {
  return (
    <aside className="w-64 border-r h-screen">
      <div className="p-4">
        <a href="/" className="font-bold">🌊 Surfaced</a>
      </div>

      <nav className="p-4">
        <a href="/dashboard">Dashboard</a>
        <a href="/dashboard/settings">Settings</a>
        <a href="/dashboard/billing">Billing</a>
      </nav>

      <div className="p-4 border-t">
        <p>{user.email}</p>
        <a href="/api/auth/logout">Logout</a>
      </div>
    </aside>
  );
}
```

---

## Database Schema Changes

### New Tables for Universal
```sql
-- Universal users (separate from Shopify shops)
CREATE TABLE universal_users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,          -- For email/password auth
  google_id TEXT,              -- For Google OAuth
  name TEXT,
  plan TEXT DEFAULT 'free',    -- free, starter, growth, scale
  stripe_customer_id TEXT,     -- For Stripe billing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brands tracked by universal users
CREATE TABLE brands (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES universal_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT,                 -- optional website URL
  industry TEXT,               -- for better prompts
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Visibility check history
CREATE TABLE visibility_checks (
  id SERIAL PRIMARY KEY,
  brand_id INTEGER REFERENCES brands(id) ON DELETE CASCADE,
  aeo_score INTEGER,
  chatgpt_result JSONB,
  claude_result JSONB,
  perplexity_result JSONB,
  gemini_result JSONB,
  prompts_tested JSONB,        -- List of prompts used
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competitor relationships
CREATE TABLE brand_competitors (
  id SERIAL PRIMARY KEY,
  brand_id INTEGER REFERENCES brands(id) ON DELETE CASCADE,
  competitor_brand_id INTEGER REFERENCES brands(id),
  competitor_name TEXT,        -- If not in our system
  competitor_domain TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom prompts per brand
CREATE TABLE brand_prompts (
  id SERIAL PRIMARY KEY,
  brand_id INTEGER REFERENCES brands(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  category TEXT,               -- 'general', 'product', 'comparison'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email signups (from free tools)
CREATE TABLE email_signups (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  source TEXT,                 -- 'checker', 'score', 'compare'
  brand_checked TEXT,          -- What brand they checked
  converted_to_user BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Existing Shopify Tables (unchanged)
```sql
-- shops table (existing)
-- products table (existing)
-- etc.
```

---

## Authentication Flow

### Universal Auth
```
┌─────────────────────────────────────────────────────────────┐
│  Universal Authentication                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Option 1: Email + Password                                 │
│  /signup → Create account → /dashboard                      │
│  /login → Verify credentials → /dashboard                   │
│                                                             │
│  Option 2: Google OAuth                                     │
│  /login → Google → Callback → /dashboard                    │
│                                                             │
│  Session: JWT stored in httpOnly cookie                     │
│  Table: universal_users                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Shopify Auth (unchanged)
```
┌─────────────────────────────────────────────────────────────┐
│  Shopify Authentication                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Shopify App Install → OAuth flow → /admin                  │
│                                                             │
│  Session: Shopify session tokens                            │
│  Table: shops                                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Migration Plan

### Phase 1: Add New Routes (Non-breaking)
1. Create `(marketing)` route group
2. Move current landing to `/shopify`
3. Create new universal landing at `/`
4. Add `/check`, `/score`, `/compare` routes
5. Keep `/admin` unchanged

### Phase 2: Add Universal Auth
1. Create `universal_users` table
2. Implement email/password auth
3. Add Google OAuth
4. Create `(dashboard)` route group

### Phase 3: Connect Everything
1. Link free tools to signup flow
2. Implement billing (Stripe)
3. Build dashboard features
4. Add API rate limiting

---

## Environment Variables

### Existing (Shopify)
```env
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
NEXT_PUBLIC_SHOPIFY_API_KEY=
```

### New (Universal)
```env
# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Stripe Billing
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# AI APIs for checking
OPENAI_API_KEY=           # Already have
ANTHROPIC_API_KEY=        # For Claude
PERPLEXITY_API_KEY=       # For Perplexity
GOOGLE_AI_API_KEY=        # For Gemini
```

---

## SEO Considerations

### Meta Tags per Section
```tsx
// Universal landing
export const metadata = {
  title: 'Surfaced - AI Visibility Platform',
  description: 'See what ChatGPT, Claude & Perplexity say about your brand...',
};

// Shopify landing
export const metadata = {
  title: 'Surfaced for Shopify - Product AEO Optimization',
  description: 'Get your Shopify products recommended by AI assistants...',
};
```

### Canonical URLs
- `/` → Universal home
- `/shopify` → Shopify-specific home
- No duplicate content issues

---

## Summary

| Aspect | Universal | Shopify |
|--------|-----------|---------|
| **Landing** | `/` | `/shopify` |
| **Auth** | Email/Google | Shopify OAuth |
| **Dashboard** | `/dashboard` | `/admin` |
| **Billing** | Stripe | Shopify Billing |
| **Database** | `universal_users` | `shops` |
| **Layout** | No App Bridge | With App Bridge |
| **Focus** | Brand visibility | Product optimization |
