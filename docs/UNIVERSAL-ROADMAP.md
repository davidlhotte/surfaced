# Surfaced Universal - Complete Product Roadmap

## Vision Produit

**Surfaced Universal** = La plateforme AEO de référence pour TOUTES les marques/sites web

> "Découvrez ce que l'IA dit de votre marque. Optimisez votre visibilité dans ChatGPT, Claude & Perplexity."

---

## Architecture Site Web

### Structure Actuelle (Shopify-only)
```
surfaced.vercel.app/
├── /                    → Landing Shopify
├── /admin              → App Shopify (embedded)
├── /blog               → Blog
└── /cms                → Payload CMS
```

### Nouvelle Structure (Universal + Shopify)
```
surfaced.vercel.app/
│
├── /                    → Landing Universal (NEW - default)
│   ├── Hero: "What does AI say about your brand?"
│   ├── Free Tool: AI Visibility Checker
│   ├── Features Universal
│   ├── Pricing Universal
│   └── CTA: "Check your brand" / "For Shopify stores →"
│
├── /shopify             → Landing Shopify (MOVED)
│   ├── Hero: "Get your products recommended by AI"
│   ├── Shopify-specific features
│   ├── Pricing Shopify
│   ├── App Store badge
│   └── CTA: "Install on Shopify"
│
├── /check               → AI Visibility Checker (FREE TOOL)
│   ├── Input: brand/URL
│   └── Results + email capture
│
├── /score               → AEO Score Grader (FREE TOOL)
│   ├── Input: URL
│   └── Technical audit results
│
├── /compare             → Competitor Comparison (FREE TOOL)
│   ├── Input: 2 brands
│   └── Side-by-side results
│
├── /dashboard           → Universal Dashboard (LOGGED IN)
│   ├── Brand monitoring
│   ├── Competitor tracking
│   ├── Reports
│   └── Settings
│
├── /admin               → Shopify App (EMBEDDED - unchanged)
│
├── /blog                → Blog (shared)
│
├── /cms                 → Payload CMS (shared)
│
└── /api/
    ├── /v1/             → Public API
    ├── /universal/      → Universal endpoints
    └── /shopify/        → Shopify endpoints (existing)
```

---

## Phase 1 : MVP Free Tools (Semaines 1-4)

### 1.1 AI Visibility Checker `/check`

**Objectif :** Outil gratuit viral - "What does AI say about you?"

**User Flow :**
```
┌─────────────────────────────────────────────────────────────┐
│  Page: /check                                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🔍 AI Visibility Checker                                   │
│                                                             │
│  What do ChatGPT, Claude & Perplexity say about your brand? │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Enter brand name or website URL                      │   │
│  │ ________________________________________________    │   │
│  │ Example: "Nike" or "https://nike.com"               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Check AI Visibility - Free]                               │
│                                                             │
│  ✓ No signup required                                       │
│  ✓ Results in 30 seconds                                    │
│  ✓ Check all major AI platforms                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Results Page : `/check/[brand]`**
```
┌─────────────────────────────────────────────────────────────┐
│  AI Visibility Report: Nike                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  YOUR AEO SCORE                                      │  │
│  │                                                      │  │
│  │     ████████████████████████░░░░░░  78/100          │  │
│  │                                                      │  │
│  │  🏆 Top 15% of brands in AI visibility              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  AI Platform Breakdown:                                     │
│  ┌────────────┬──────────┬─────────────────────────────┐  │
│  │ Platform   │ Status   │ What AI Says                │  │
│  ├────────────┼──────────┼─────────────────────────────┤  │
│  │ ChatGPT    │ ✅ Cited │ "Leading sportswear brand..." │  │
│  │ Claude     │ ✅ Cited │ "Known for innovation..."    │  │
│  │ Perplexity │ ✅ Cited │ "Popular choice for..."      │  │
│  │ Gemini     │ ✅ Cited │ "Athletic footwear leader"   │  │
│  └────────────┴──────────┴─────────────────────────────┘  │
│                                                             │
│  Sample Prompts & Responses:                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Prompt: "What are the best running shoes?"          │  │
│  │ ChatGPT: "Nike is consistently recommended for..."   │  │
│  │ Position: #1 out of 5 brands mentioned               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 📧 Get Full Report + Weekly Monitoring               │  │
│  │                                                      │  │
│  │ Email: [________________________] [Get Report]       │  │
│  │                                                      │  │
│  │ Includes: • Detailed AI responses                    │  │
│  │           • Competitor comparison                    │  │
│  │           • Optimization recommendations             │  │
│  │           • Weekly email updates                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  [Compare with Competitor] [Check Another Brand]            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Technical Implementation:**

```typescript
// app/(app)/check/page.tsx - Input form
// app/(app)/check/[brand]/page.tsx - Results page

// API: POST /api/universal/check
interface CheckRequest {
  query: string; // brand name or URL
}

interface CheckResponse {
  brand: string;
  url?: string;
  aeoScore: number;
  platforms: {
    chatgpt: PlatformResult;
    claude: PlatformResult;
    perplexity: PlatformResult;
    gemini: PlatformResult;
  };
  samplePrompts: PromptResult[];
  recommendations: string[];
}

interface PlatformResult {
  mentioned: boolean;
  sentiment: 'positive' | 'neutral' | 'negative';
  snippet: string;
  position?: number; // 1-5 ranking if mentioned
}
```

**Prompts à tester (par industrie) :**
```
Generic:
- "What is [brand]?"
- "Tell me about [brand]"
- "Is [brand] good?"

E-commerce:
- "Best [category] brands"
- "Where to buy [product type]"
- "[brand] vs [competitor]"

Services:
- "Best [service] companies"
- "[brand] reviews"
- "Is [brand] reliable?"
```

---

### 1.2 AEO Score Grader `/score`

**Objectif :** Audit technique AEO - équivalent de GTmetrix pour l'AEO

**User Flow :**
```
┌─────────────────────────────────────────────────────────────┐
│  Page: /score                                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 AEO Readiness Grader                                    │
│                                                             │
│  Is your website optimized for AI search engines?           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ https://                                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Analyze Website - Free]                                   │
│                                                             │
│  We check:                                                  │
│  ✓ llms.txt file presence                                   │
│  ✓ JSON-LD structured data                                  │
│  ✓ AI crawler access (robots.txt)                           │
│  ✓ Content structure & clarity                              │
│  ✓ Technical SEO for AI                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Results Page : `/score/[domain]`**
```
┌─────────────────────────────────────────────────────────────┐
│  AEO Score: example.com                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Overall Score: 45/100  ██████████░░░░░░░░░░               │
│  Grade: C - Needs Improvement                               │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  TECHNICAL CHECKS                                    │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │                                                      │  │
│  │  llms.txt File                                       │  │
│  │  ❌ NOT FOUND                           0/20 pts    │  │
│  │  → Add llms.txt to guide AI crawlers                │  │
│  │                                                      │  │
│  │  JSON-LD Schema                                      │  │
│  │  ⚠️ PARTIAL                             10/20 pts    │  │
│  │  → Found: Organization                               │  │
│  │  → Missing: Product, FAQ, HowTo                     │  │
│  │                                                      │  │
│  │  AI Crawler Access                                   │  │
│  │  ⚠️ PARTIAL                             10/20 pts    │  │
│  │  → GPTBot: ✅ Allowed                               │  │
│  │  → ClaudeBot: ❌ Blocked                            │  │
│  │  → PerplexityBot: ✅ Allowed                        │  │
│  │                                                      │  │
│  │  Sitemap                                             │  │
│  │  ✅ VALID                               15/15 pts    │  │
│  │  → 234 URLs indexed                                 │  │
│  │                                                      │  │
│  │  Content Structure                                   │  │
│  │  ⚠️ NEEDS WORK                          10/25 pts    │  │
│  │  → Headers: Good hierarchy                          │  │
│  │  → Paragraphs: Too long for AI extraction           │  │
│  │  → Lists: Underutilized                             │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  🎯 QUICK WINS (+35 points possible)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 1. Add llms.txt file                      +20 pts   │  │
│  │ 2. Unblock ClaudeBot in robots.txt        +5 pts    │  │
│  │ 3. Add Product schema                     +10 pts   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  [Generate llms.txt - Free] [Fix robots.txt - Guide]        │
│  [Get Full Report via Email]                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Scoring Algorithm:**
```typescript
interface AEOScore {
  total: number; // 0-100
  breakdown: {
    llmsTxt: { score: number; max: 20; status: 'found' | 'missing' | 'invalid' };
    jsonLd: { score: number; max: 20; schemas: string[]; missing: string[] };
    aiCrawlers: { score: number; max: 20; allowed: string[]; blocked: string[] };
    sitemap: { score: number; max: 15; valid: boolean; urlCount: number };
    content: { score: number; max: 25; issues: string[] };
  };
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  quickWins: QuickWin[];
}
```

---

### 1.3 Competitor Comparison `/compare`

**Objectif :** Viral hook - "Who's winning in AI search?"

```
┌─────────────────────────────────────────────────────────────┐
│  Page: /compare                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ⚔️ AI Visibility Battle                                    │
│                                                             │
│  Which brand is more visible in AI search?                  │
│                                                             │
│  ┌─────────────────┐    VS    ┌─────────────────┐          │
│  │ Your brand      │          │ Competitor      │          │
│  │ ____________    │          │ ____________    │          │
│  └─────────────────┘          └─────────────────┘          │
│                                                             │
│  [Compare Now - Free]                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 1.4 New Landing Page `/` (Universal)

**Header Navigation:**
```
┌─────────────────────────────────────────────────────────────┐
│  🌊 Surfaced          Tools  Pricing  Blog   [For Shopify →]│
└─────────────────────────────────────────────────────────────┘
```

**Hero Section:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│        What Does AI Say About Your Brand?                   │
│                                                             │
│   Get discovered by ChatGPT, Claude & Perplexity.           │
│   The brands AI recommends get 5x more organic traffic.     │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │ Enter your brand or website URL                      │  │
│   └─────────────────────────────────────────────────────┘  │
│   [Check AI Visibility - Free]                              │
│                                                             │
│   ✓ No signup required  ✓ Results in 30 seconds            │
│                                                             │
│   Trusted by 2,500+ brands worldwide                        │
│   [logo] [logo] [logo] [logo] [logo]                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Features Section:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Everything you need to dominate AI search                  │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ 🔍 Monitor  │  │ 📊 Analyze  │  │ 🚀 Optimize │         │
│  │             │  │             │  │             │         │
│  │ Track what  │  │ Understand  │  │ Improve     │         │
│  │ AI says     │  │ your AEO    │  │ visibility  │         │
│  │ about you   │  │ score       │  │ step by step│         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ ⚔️ Compare  │  │ 🔔 Alerts   │  │ 📈 Reports  │         │
│  │             │  │             │  │             │         │
│  │ Benchmark   │  │ Get notified│  │ Weekly      │         │
│  │ vs rivals   │  │ of changes  │  │ insights    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Free Tools Section:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Free AEO Tools - No Signup Required                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔍 AI Visibility Checker                            │   │
│  │ See what ChatGPT, Claude & Perplexity say about you │   │
│  │ [Try Free →]                                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📊 AEO Score Grader                                 │   │
│  │ Get your technical AEO readiness score              │   │
│  │ [Try Free →]                                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ⚔️ Competitor Comparison                            │   │
│  │ Compare your AI visibility vs any competitor        │   │
│  │ [Try Free →]                                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Shopify CTA (bottom):**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  🛒 Running a Shopify store?                                │
│                                                             │
│  Get product-level AEO optimization with our native app.    │
│  Sync your catalog, optimize products, track results.       │
│                                                             │
│  [Learn about Surfaced for Shopify →]                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 2 : Universal Dashboard (Semaines 5-8)

### 2.1 User Authentication

**Sign up flow:**
```
Email + Password OR
Google OAuth OR
Continue with Shopify (redirect to Shopify app)
```

### 2.2 Dashboard `/dashboard`

```
┌─────────────────────────────────────────────────────────────┐
│  Surfaced Dashboard                    [+ Add Brand] [User] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Your Brands                                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 🏢 Acme Corp                          AEO: 72/100   │  │
│  │    acmecorp.com                       ↑ +5 this week│  │
│  │    [View Details]                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  AI Visibility Trends (Last 30 days)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  📈 [Graph showing visibility over time]             │  │
│  │     ChatGPT ── Claude ── Perplexity                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Recent AI Mentions                                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ChatGPT mentioned you for "best project management"  │  │
│  │ 2 hours ago • Position #2 • Positive sentiment       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Competitors                                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Competitor A: 68/100  │  Competitor B: 81/100       │  │
│  │ You: 72/100 ← Beating A, behind B                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Brand Details Page `/dashboard/[brand]`

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back    Acme Corp    Last checked: 2 hours ago  [Check] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Tabs: [Overview] [AI Mentions] [Competitors] [Optimize]    │
│                                                             │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  AEO Score: 72/100                                          │
│  ████████████████████████████░░░░░░░░                      │
│                                                             │
│  Platform Breakdown:                                        │
│  ┌────────────┬─────────┬──────────┬─────────────────┐     │
│  │ Platform   │ Visible │ Position │ Sentiment       │     │
│  ├────────────┼─────────┼──────────┼─────────────────┤     │
│  │ ChatGPT    │ ✅ Yes  │ #2       │ 😊 Positive     │     │
│  │ Claude     │ ✅ Yes  │ #1       │ 😊 Positive     │     │
│  │ Perplexity │ ⚠️ Some │ #4       │ 😐 Neutral      │     │
│  │ Gemini     │ ❌ No   │ --       │ --              │     │
│  └────────────┴─────────┴──────────┴─────────────────┘     │
│                                                             │
│  Prompts Being Tracked:                                     │
│  • "best project management software"                       │
│  • "acme corp review"                                       │
│  • "project management tools 2024"                          │
│  [+ Add Custom Prompt]                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 3 : Advanced Features (Semaines 9-12)

### 3.1 Share of Voice Analytics
### 3.2 Sentiment Tracking
### 3.3 Automated Reports (Weekly Email)
### 3.4 Custom Alerts
### 3.5 API Access

---

## Phase 4 : Enterprise (Semaines 13+)

### 4.1 Multi-brand Management
### 4.2 Team Collaboration
### 4.3 White-label Reports
### 4.4 Custom Integrations
### 4.5 SSO / SAML

---

## Pricing Structure (Universal)

| Plan | Price | Brands | Checks/mo | Competitors | Features |
|------|-------|--------|-----------|-------------|----------|
| **Free** | $0 | 1 | 3 | 1 | Basic visibility check |
| **Starter** | $29/mo | 3 | 30 | 3 | Dashboard, trends, email reports |
| **Growth** | $79/mo | 10 | 100 | 10 | Alerts, API, custom prompts |
| **Scale** | $149/mo | 25 | 300 | 25 | Priority support, advanced analytics |
| **Enterprise** | Custom | Unlimited | Unlimited | Unlimited | SSO, dedicated support, SLA |

---

## Technical Stack (Universal)

### Frontend
```
app/(app)/
├── page.tsx                    # Landing page (Universal)
├── check/
│   ├── page.tsx               # AI Visibility Checker input
│   └── [brand]/page.tsx       # Results page
├── score/
│   ├── page.tsx               # AEO Score input
│   └── [domain]/page.tsx      # Score results
├── compare/
│   └── page.tsx               # Competitor comparison
├── dashboard/                  # Authenticated dashboard
│   ├── page.tsx               # Dashboard home
│   ├── [brand]/page.tsx       # Brand details
│   └── settings/page.tsx      # Account settings
├── pricing/
│   └── page.tsx               # Universal pricing
└── shopify/                    # Shopify landing (separate)
    └── page.tsx               # Shopify-specific landing
```

### Backend
```
app/api/
├── universal/
│   ├── check/route.ts         # AI visibility check
│   ├── score/route.ts         # AEO score calculation
│   ├── compare/route.ts       # Competitor comparison
│   └── brands/route.ts        # CRUD brands
├── auth/
│   ├── signup/route.ts        # Email signup
│   ├── login/route.ts         # Email login
│   └── google/route.ts        # Google OAuth
└── v1/                         # Public API
    ├── check/route.ts
    ├── score/route.ts
    └── brands/route.ts
```

### Database (New Tables)
```sql
-- Universal users (separate from Shopify shops)
CREATE TABLE universal_users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  google_id TEXT,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brands being tracked
CREATE TABLE brands (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES universal_users(id),
  name TEXT NOT NULL,
  domain TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI visibility checks history
CREATE TABLE visibility_checks (
  id SERIAL PRIMARY KEY,
  brand_id INTEGER REFERENCES brands(id),
  aeo_score INTEGER,
  chatgpt_result JSONB,
  claude_result JSONB,
  perplexity_result JSONB,
  gemini_result JSONB,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competitors tracking
CREATE TABLE competitors (
  id SERIAL PRIMARY KEY,
  brand_id INTEGER REFERENCES brands(id),
  competitor_name TEXT NOT NULL,
  competitor_domain TEXT
);
```

### Services
```
lib/services/
├── ai-checker/
│   ├── chatgpt.ts             # Query ChatGPT
│   ├── claude.ts              # Query Claude
│   ├── perplexity.ts          # Query Perplexity
│   └── gemini.ts              # Query Gemini
├── aeo-scorer/
│   ├── llms-txt.ts            # Check llms.txt
│   ├── schema.ts              # Validate JSON-LD
│   ├── robots.ts              # Check robots.txt
│   └── content.ts             # Analyze content
├── universal/
│   ├── brands.ts              # Brand management
│   ├── checks.ts              # Visibility checks
│   └── reports.ts             # Generate reports
└── shared/                     # Shared with Shopify
    ├── llms-generator.ts
    └── schema-generator.ts
```

---

## Marketing Strategy

### SEO Content
- "What is AEO?" guide
- "How to get mentioned by ChatGPT"
- "AEO vs SEO: What's the difference?"
- "AI Visibility Checklist 2024"

### Viral Loops
- Free tools shareable results
- "Check your competitor" feature
- Embeddable AEO score badges
- "AI Visibility Battle" social feature

### Paid Acquisition
- Google Ads: "AI visibility", "ChatGPT SEO"
- LinkedIn: B2B decision makers
- Twitter/X: Tech & marketing audiences

---

## Success Metrics

### Phase 1 (Week 4)
- [ ] 500 free checks completed
- [ ] 100 email signups
- [ ] 10 paying customers

### Phase 2 (Week 8)
- [ ] 2,000 free checks/month
- [ ] 500 registered users
- [ ] 50 paying customers
- [ ] $2K MRR

### Phase 3 (Week 12)
- [ ] 10,000 free checks/month
- [ ] 2,000 registered users
- [ ] 200 paying customers
- [ ] $10K MRR
