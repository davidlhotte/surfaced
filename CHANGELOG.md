# Changelog

All notable changes to LocateUs will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-14

### Added

#### Core Features
- Store locator with interactive map (OpenStreetMap/Leaflet)
- Store management (CRUD) with bulk CSV import/export
- Geolocation search and distance-based sorting
- Customizable map themes and marker colors
- Custom marker icons (PLUS plan and above)
- Featured stores functionality
- Store categories and filtering
- Business hours display
- Multi-language support

#### Shopify Integration
- Embedded admin app with Polaris UI
- Theme App Extension for storefront widget
- OAuth 2.0 authentication flow
- Shopify billing integration (subscription plans)
- GDPR webhooks (customer data request, customer redact, shop redact)

#### Plans & Pricing
- FREE: 5 stores, basic features
- BASIC ($4.99/mo): 50 stores, CSV export, custom marker color, map themes
- PLUS ($9.99/mo): 250 stores, custom marker icons
- PREMIUM ($24.99/mo): Unlimited stores, hide branding, priority support

#### Security
- AES-256-GCM encryption for Shopify tokens
- Rate limiting on public APIs (100 req/min)
- HMAC webhook validation
- Input sanitization (XSS, CSV injection prevention)
- Zod validation on all API inputs

#### Developer Experience
- 299 unit tests (85% coverage)
- 65 E2E tests (Playwright)
- TypeScript strict mode
- ESLint + Prettier configuration
- Sentry error tracking integration

### Technical Stack
- Next.js 16 (App Router)
- React 19
- Prisma ORM with PostgreSQL
- Vercel KV (Redis) for caching
- Leaflet for maps
- Shopify App Bridge React

---

## [Unreleased]

### Planned
- Analytics and heatmaps
- Dealer registration form
- Google Sheets sync
- Google Reviews integration
