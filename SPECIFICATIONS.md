# LocateUs: Store & Dealer Finder - Complete Specifications

## 📊 Executive Summary

**LocateUs** is a Shopify embedded app that allows merchants to display their store locations on an interactive map. Key improvements over competitors:
- **Unlimited stores** on all plans
- **Configurable map size presets** (banner, square, rectangle, full-page)
- **20% lower pricing** than ListR

---

## 🔍 Competitive Analysis

### ListR Store Locator Pricing (Current)
| Plan | Price | Stores | Features |
|------|-------|--------|----------|
| Free | $0 | 10 | Basic map, CSV import |
| Basic | $4.99/mo | 50 | + customizations |
| Plus | $9.99/mo | 250 | + export, more customizations |
| Premium | $19.99/mo | 500 | + no branding |

### LocateUs Pricing (20% reduction + unlimited stores)
| Plan | Price | Stores | Features |
|------|-------|--------|----------|
| Free | $0 | **Unlimited** | Basic map, CSV import, map size presets |
| Basic | **$3.99/mo** | **Unlimited** | + customizations |
| Plus | **$7.99/mo** | **Unlimited** | + export, advanced customizations |
| Premium | **$15.99/mo** | **Unlimited** | + no branding, priority support |

---

## 🛠 Technical Architecture

### Stack
```
Frontend:     Next.js 14 (App Router) + React 18
Backend:      Next.js API Routes (Serverless)
Database:     PostgreSQL (Vercel Postgres)
ORM:          Prisma
Hosting:      Vercel
Maps:         OpenStreetMap (Leaflet) - FREE | Google Maps (optional)
Auth:         Shopify OAuth + App Bridge
Testing:      Playwright (E2E) + Vitest (Unit)
UI:           Shopify Polaris + Tailwind CSS
Cache:        Vercel KV (Redis)
Monitoring:   Sentry + Vercel Analytics
Encryption:   AES-256-GCM for tokens
```

### Project Structure
```
locateus-app/
├── app/
│   ├── (admin)/              # Shopify Admin UI (embedded)
│   │   ├── layout.tsx
│   │   ├── page.tsx          # Dashboard
│   │   ├── stores/
│   │   ├── import/page.tsx
│   │   ├── settings/page.tsx
│   │   └── appearance/page.tsx
│   ├── api/
│   │   ├── auth/callback/route.ts
│   │   ├── stores/
│   │   ├── import/route.ts
│   │   ├── export/route.ts
│   │   ├── settings/route.ts
│   │   ├── billing/route.ts
│   │   └── webhooks/route.ts
│   └── storefront/[shop]/route.ts
├── components/
│   ├── admin/
│   ├── storefront/
│   └── ui/
├── lib/
│   ├── shopify/
│   ├── db/
│   ├── cache/
│   ├── security/
│   ├── maps/
│   ├── monitoring/
│   └── utils/
├── prisma/
├── extensions/store-locator/
├── tests/
│   ├── e2e/
│   └── unit/
├── docs/
│   ├── SECURITY.md
│   ├── API.md
│   └── CHANGELOG.md
├── middleware.ts
├── CLAUDE.md
└── .env.example
```

---

## 📁 Feature Comparison Matrix

| Feature | Free | Basic | Plus | Premium |
|---------|------|-------|------|---------|
| Stores | ∞ | ∞ | ∞ | ∞ |
| Map Size Presets | ✅ | ✅ | ✅ | ✅ |
| CSV Import | ✅ | ✅ | ✅ | ✅ |
| CSV Export | ❌ | ❌ | ✅ | ✅ |
| Search & Filter | ✅ | ✅ | ✅ | ✅ |
| Geolocation | ✅ | ✅ | ✅ | ✅ |
| Custom Marker Colors | ❌ | ✅ | ✅ | ✅ |
| Custom Marker Icons | ❌ | ❌ | ✅ | ✅ |
| Multiple Map Themes | ❌ | ✅ | ✅ | ✅ |
| Google Maps Option | ❌ | ❌ | ✅ | ✅ |
| Remove Branding | ❌ | ❌ | ❌ | ✅ |
| Priority Support | ❌ | ❌ | ❌ | ✅ |
| API Access | ❌ | ❌ | ❌ | ✅ |

---

## ⚖️ Fair Use Policy (Soft Limits)

| Plan | Soft Limit | Action |
|------|------------|--------|
| Free | 1,000 stores | Warning email |
| Basic | 5,000 stores | Warning email |
| Plus | 25,000 stores | Contact sales |
| Premium | 100,000 stores | Contact sales |

---

## 📅 Development Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| 1. Setup | 1 day | Scaffolding, Shopify config, DB, Vercel KV |
| 2. Security | 1 day | Encryption, rate limiting, HMAC, headers |
| 3. Core Backend | 2 days | Auth, Store CRUD, Settings, Webhooks |
| 4. Admin UI | 2 days | Polaris dashboard, forms, CSV import |
| 5. Map Widget | 2 days | Leaflet, size presets, responsive, clustering |
| 6. Theme Extension | 1 day | Liquid blocks, settings schema |
| 7. Billing | 1 day | Shopify Billing API |
| 8. Testing | 2 days | E2E + Unit tests |
| 9. Monitoring | 0.5 day | Sentry, logging |
| 10. Polish | 0.5 day | Bug fixes, docs |

**Total: ~13 days**

---

## 📚 Related Documentation

- [Security Documentation](docs/SECURITY.md)
- [API Documentation](docs/API.md)
- [Database Schema](prisma/schema.prisma)
- [Development Guide](CLAUDE.md)

## 📚 External References

- [Shopify App Development](https://shopify.dev/docs/apps)
- [Polaris Design System](https://polaris.shopify.com/)
- [Leaflet.js](https://leafletjs.com/)
- [Prisma ORM](https://www.prisma.io/)
- [Next.js App Router](https://nextjs.org/docs/app)
