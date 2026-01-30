# Surfaced AEO - Product Roadmap 2026

## Vision
**Devenir LA référence mondiale de l'AEO (Answer Engine Optimization)**

> "Faites recommander votre marque et vos produits par ChatGPT, Claude & Perplexity"

---

## Stratégie Produit : Deux Marchés

### 1. Surfaced UNIVERSAL (Tout le monde - SaaS Web)
**Cible :** Toute marque/site web voulant être visible dans les AI
**Accès :** Via surfaced.vercel.app - "Enter your URL"
**Modèle :** Freemium avec upsell vers plans payants

### 2. Surfaced for SHOPIFY (App Shopify)
**Cible :** Marchands Shopify e-commerce
**Accès :** Shopify App Store - Installation native
**Modèle :** Plans mensuels via Shopify Billing

---

## Phase 1 : Foundation (Semaines 1-8) 🔴 PRIORITÉ HAUTE

### 1.1 AI Citation Tracker (Core Feature)

| Feature | Universal | Shopify | Notes |
|---------|:---------:|:-------:|-------|
| Brand mention check | ✅ | ✅ | "What does ChatGPT say about [brand]?" |
| Product mention check | ✅ | ✅ | "Does Claude recommend [product]?" |
| Multi-LLM support | ✅ | ✅ | ChatGPT, Claude, Perplexity, Gemini |
| Citation position | ✅ | ✅ | #1, #2, #3 in AI response |
| Citation history | ✅ | ✅ | Track changes over time |

**MVP Universal (Landing Page Tool):**
```
┌─────────────────────────────────────────────────┐
│  🔍 Free AI Visibility Check                    │
│                                                 │
│  Enter your brand or website URL:               │
│  ┌─────────────────────────────────────────┐   │
│  │ https://example.com                      │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  [Check AI Visibility - Free]                   │
│                                                 │
│  ✓ See what ChatGPT says about you             │
│  ✓ Check Claude recommendations                │
│  ✓ Get your AEO Score (0-100)                  │
└─────────────────────────────────────────────────┘
```

### 1.2 AEO Score Calculator

| Feature | Universal | Shopify | Notes |
|---------|:---------:|:-------:|-------|
| Overall AEO Score (0-100) | ✅ | ✅ | Proprietary algorithm |
| llms.txt detection | ✅ | ✅ | Has llms.txt file? |
| Schema validation | ✅ | ✅ | JSON-LD present & valid? |
| AI crawler access | ✅ | ✅ | GPTBot allowed in robots.txt? |
| Content quality score | ✅ | ✅ | Structured, clear, AI-friendly? |
| Product catalog score | ❌ | ✅ | Shopify products optimization |

### 1.3 Product Mention Dashboard (Shopify-specific)

| Feature | Universal | Shopify | Notes |
|---------|:---------:|:-------:|-------|
| Sync product catalog | ❌ | ✅ | Auto-import from Shopify |
| Per-product AEO score | ❌ | ✅ | Score each product |
| Bulk optimization | ❌ | ✅ | Fix all products at once |
| Product recommendations | ❌ | ✅ | "Optimize title for AI" |

---

## Phase 2 : Competitive Intelligence (Semaines 9-14) 🟠 HAUTE

### 2.1 Share of Voice

| Feature | Universal | Shopify | Notes |
|---------|:---------:|:-------:|-------|
| Brand vs competitors | ✅ | ✅ | % of AI mentions |
| Category leadership | ✅ | ✅ | "#1 in AI for [category]" |
| Competitor tracking | ✅ | ✅ | Monitor up to 10 competitors |
| Gap analysis | ✅ | ✅ | "You're not cited for these queries" |

### 2.2 Competitor AI Tracking

| Feature | Universal | Shopify | Notes |
|---------|:---------:|:-------:|-------|
| Add competitor URLs | ✅ | ✅ | Track any brand |
| Side-by-side comparison | ✅ | ✅ | Your brand vs competitor |
| Alert on competitor gains | ✅ | ✅ | "Competitor now ranks #1" |
| Competitive report | ✅ | ✅ | PDF export |

---

## Phase 3 : Analytics & Insights (Semaines 15-20) 🟡 MOYENNE

### 3.1 Sentiment Analysis

| Feature | Universal | Shopify | Notes |
|---------|:---------:|:-------:|-------|
| Brand sentiment | ✅ | ✅ | Positive/Negative/Neutral |
| Sentiment by LLM | ✅ | ✅ | "Claude is more positive" |
| Key themes extracted | ✅ | ✅ | What AI says about you |
| Sentiment trends | ✅ | ✅ | Change over time |

### 3.2 Traffic Attribution

| Feature | Universal | Shopify | Notes |
|---------|:---------:|:-------:|-------|
| AI traffic detection | ✅ | ✅ | Visits from ChatGPT/Perplexity |
| GA4 integration | ✅ | ❌ | Connect Google Analytics |
| Shopify analytics | ❌ | ✅ | Native Shopify stats |
| Conversion tracking | ✅ | ✅ | AI visit → Sale |
| ROI calculator | ✅ | ✅ | Value of AI visibility |

### 3.3 Automated Reports

| Feature | Universal | Shopify | Notes |
|---------|:---------:|:-------:|-------|
| Weekly email digest | ✅ | ✅ | AEO performance summary |
| Monthly PDF report | ✅ | ✅ | Detailed analysis |
| Custom alerts | ✅ | ✅ | "Alert me if score drops" |
| Slack notifications | ✅ | ✅ | Real-time alerts |

---

## Phase 4 : Advanced & Enterprise (Semaines 21+) 🟢 BASSE

### 4.1 Optimization Tools

| Feature | Universal | Shopify | Notes |
|---------|:---------:|:-------:|-------|
| llms.txt generator | ✅ | ✅ | Already built |
| JSON-LD generator | ✅ | ✅ | Already built |
| Robots.txt optimizer | ✅ | ✅ | Already built |
| Content recommendations | ✅ | ✅ | "Add these keywords" |
| AI-optimized meta tags | ✅ | ✅ | Title/description for AI |
| Product feed optimizer | ❌ | ✅ | Shopify-specific |

### 4.2 Enterprise Features

| Feature | Universal | Shopify | Notes |
|---------|:---------:|:-------:|-------|
| API access | ✅ | ✅ | Programmatic access |
| White-label reports | ✅ | ✅ | For agencies |
| Multi-brand management | ✅ | ❌ | Agency dashboard |
| SSO / SAML | ✅ | ❌ | Enterprise auth |
| Custom integrations | ✅ | ❌ | Zapier, webhooks |
| AI crawler log analysis | ✅ | ✅ | GPTBot activity |

---

## Landing Page Strategy

### Free Tools (No signup required)

1. **AI Visibility Checker** - Enter URL → See AI citations
2. **AEO Score Grader** - Enter URL → Get score 0-100
3. **llms.txt Validator** - Check if site has valid llms.txt
4. **AI Crawler Tester** - Can GPTBot access your site?

### Free Account (Email signup)

1. **3 checks/month** on any URL
2. **Basic competitor comparison** (1 competitor)
3. **Weekly summary email**
4. **AEO tips & recommendations**

### Paid Plans

| Plan | Universal | Shopify | Price |
|------|-----------|---------|-------|
| Starter | ✅ | ✅ | $29/mo |
| Growth | ✅ | ✅ | $79/mo |
| Scale | ✅ | ✅ | $149/mo |
| Enterprise | ✅ | ❌ | Custom |

---

## Technical Architecture

### Universal Platform (Web SaaS)
```
surfaced.vercel.app/
├── / (Landing page + free tools)
├── /check (AI visibility checker)
├── /score (AEO grader)
├── /dashboard (Logged-in users)
└── /api/v1/ (Public API)
```

### Shopify App
```
surfaced.vercel.app/admin (Embedded app)
├── Shopify OAuth
├── Product sync
├── Native billing
└── App Bridge UI
```

### Shared Backend
```
lib/
├── ai-citation/     # Core AI checking logic (shared)
├── aeo-score/       # Scoring algorithm (shared)
├── competitors/     # Competitor tracking (shared)
├── shopify/         # Shopify-specific
└── universal/       # Web SaaS specific
```

---

## Success Metrics

### Phase 1 Success
- [ ] 1,000 free checks/month on landing page
- [ ] 100 Shopify installs
- [ ] 10 paying customers

### Phase 2 Success
- [ ] 5,000 free checks/month
- [ ] 500 Shopify installs
- [ ] 50 paying customers
- [ ] $5K MRR

### Phase 3 Success
- [ ] 20,000 free checks/month
- [ ] 2,000 Shopify installs
- [ ] 200 paying customers
- [ ] $20K MRR

---

## Competitive Positioning

| Competitor | Their Focus | Surfaced Advantage |
|------------|-------------|-------------------|
| Semrush | SEO + AI (expensive $199+) | AEO-only, affordable |
| HubSpot AEO | Brand-level only | Product-level + Brand |
| Profound | Enterprise only | SMB-friendly |
| Peec AI | Generic websites | E-commerce specialist |
| Otterly | Monitoring only | Optimize + Monitor |

**Tagline:** "The only AEO platform built for e-commerce"

---

## Next Actions

### This Week
1. [ ] Build MVP "AI Visibility Checker" on landing page
2. [ ] Create `/check` route for URL input
3. [ ] Implement basic ChatGPT/Claude/Perplexity checking
4. [ ] Design results page with AEO Score

### This Month
1. [ ] Launch free tool publicly
2. [ ] Add email capture for detailed reports
3. [ ] Build competitor comparison feature
4. [ ] Marketing: "Free AEO Grader" campaign
