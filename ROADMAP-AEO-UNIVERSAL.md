# Surfaced - Roadmap AEO Universel

> **Stratégie Hybride : De Shopify-only vers Plateforme Multi-Commerce**

## Vision

```
"Démocratiser l'AEO pour que chaque boutique en ligne,
quelle que soit sa taille ou sa plateforme, soit visible sur l'IA"
```

## Contexte

- **Produit actuel** : App Shopify AEO (visibility, competitors, products, AI tracking)
- **Limitation** : Shopify uniquement (~2.7M boutiques)
- **Opportunité** : Marché multi-plateforme (~10M+ boutiques)

---

## Stratégie Hybride

```
┌─────────────────────────────────────────────────────────────────┐
│                      TIMELINE GLOBALE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Phase 1        Phase 2        Phase 3        Phase 4          │
│  ACCESSIBLE     VALIDATION     EXPANSION      ENTERPRISE       │
│  (Mois 1-4)     (Mois 5-8)     (Mois 9-12)    (Mois 13+)       │
│                                                                 │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐      │
│  │ MVP     │───►│ 500     │───►│ Multi-  │───►│ Full    │      │
│  │ Gratuit │    │ Clients │    │ Platform│    │ Enterpr.│      │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘      │
│                                                                 │
│  €25-35K        Validation     +€30-40K       +€40-50K         │
│  investis       PMF            investis       investis         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1 : MVP Accessible (Mois 1-4)

### Objectifs
- [ ] Lancer un outil AEO gratuit accessible à tous
- [ ] Étendre au-delà de Shopify avec WooCommerce
- [ ] Générer des leads via freemium funnel
- [ ] Valider l'intérêt marché multi-plateforme

### Nouveaux Produits

#### 1.1 AEO Audit Gratuit (Semaines 1-2)
```
URL: surfaced.vercel.app/audit (ou nouveau domaine)

Fonctionnement:
1. Utilisateur entre une URL de boutique
2. Scan automatique en 30 secondes
3. Score AEO (0-100) avec breakdown
4. Recommandations prioritaires
5. CTA vers plans payants

Technologies:
- Next.js API route
- Puppeteer/Playwright pour crawl
- OpenAI pour analyse contenu
```

**User Flow:**
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Landing    │────►│  Scan URL    │────►│   Résultats  │
│   Page       │     │  (loading)   │     │   + Score    │
└──────────────┘     └──────────────┘     └──────────────┘
                                                  │
                     ┌──────────────┐             │
                     │   Signup     │◄────────────┘
                     │   (Email)    │
                     └──────────────┘
```

**Critères de scoring:**
| Critère | Poids | Vérification |
|---------|-------|--------------|
| Schema Product JSON-LD | 20% | Présence et validité |
| Meta descriptions | 15% | Longueur, mots-clés |
| Robots.txt | 10% | Accessibilité AI crawlers |
| Sitemap.xml | 10% | Présence, validité |
| llms.txt | 10% | Présence du fichier |
| Contenu structuré | 15% | Headings, FAQ, How-to |
| Vitesse chargement | 10% | Core Web Vitals |
| Mobile-friendly | 10% | Responsive design |

#### 1.2 Schema Generator (Semaines 3-4)
```
URL: surfaced.vercel.app/tools/schema-generator

Types supportés:
- Product (e-commerce)
- FAQPage
- HowTo
- Organization
- BreadcrumbList
- Review/AggregateRating

Output:
- JSON-LD copier/coller
- Validation automatique
- Preview Google/AI
```

#### 1.3 llms.txt Builder (Semaine 4)
```
URL: surfaced.vercel.app/tools/llms-txt

Wizard guidé:
1. Infos entreprise (nom, description)
2. Produits/Services principaux
3. FAQ courantes
4. Policies (shipping, returns)
5. Contact info

Output:
- Fichier llms.txt téléchargeable
- Instructions d'installation
- Validation format
```

#### 1.4 Universal Tracking Script (Semaines 5-6)
```javascript
// Script à intégrer sur n'importe quel site
<script src="https://cdn.surfaced.io/tracker.js"
        data-site-id="xxx"></script>

Fonctionnalités:
- Détection referrer AI (ChatGPT, Perplexity, Claude, etc.)
- Attribution conversions
- Dashboard analytics
- RGPD compliant (consent mode)
```

#### 1.5 Dashboard Unifié (Semaines 7-8)
```
Refonte du dashboard pour accepter:
- Boutiques Shopify (existant)
- URLs manuelles (nouveau)
- WooCommerce via plugin (Phase 1.6)

Nouvelle structure DB:
┌─────────────┐
│    Store    │
├─────────────┤
│ id          │
│ name        │
│ url         │
│ platform    │  ← 'shopify' | 'woocommerce' | 'manual' | 'prestashop'
│ credentials │  ← Encrypted, nullable
│ userId      │
└─────────────┘
```

#### 1.6 Plugin WooCommerce (Semaines 9-12)
```
Distribution: WordPress.org plugin repository

Fonctionnalités:
- Sync automatique produits
- Insertion tracking script
- Dashboard dans WP admin
- Configuration API key

Structure plugin:
surfaced-aeo/
├── surfaced-aeo.php          # Main plugin file
├── includes/
│   ├── class-api.php         # API communication
│   ├── class-sync.php        # Product sync
│   └── class-tracking.php    # JS injection
├── admin/
│   ├── settings.php          # Settings page
│   └── dashboard.php         # Embedded dashboard
└── assets/
    ├── js/tracker.js
    └── css/admin.css
```

### Nouvelle Grille Tarifaire Phase 1

| | FREE | STARTER | GROWTH |
|---|---|---|---|
| **Prix** | €0 | €29/mois | €79/mois |
| **Audits AEO** | 1/mois | 10/mois | Illimité |
| **Produits monitorés** | 5 | 50 | 500 |
| **Plateformes IA** | ChatGPT | 3 | 5 |
| **Schema Generator** | Basic | Avancé | + Custom |
| **llms.txt Builder** | ✅ | ✅ | ✅ |
| **Tracking Script** | ❌ | ✅ | ✅ |
| **Competitors** | ❌ | 1 | 5 |
| **Alertes** | ❌ | Email hebdo | Temps réel |
| **Intégrations** | - | Shopify, WooCommerce | + API |
| **Support** | Docs | Email | Prioritaire |

### Livrables Phase 1

- [ ] Page `/audit` - Outil gratuit scan AEO
- [ ] Page `/tools/schema-generator` - Générateur JSON-LD
- [ ] Page `/tools/llms-txt` - Builder llms.txt
- [ ] Script `tracker.js` - Tracking universel
- [ ] Dashboard multi-plateforme (Shopify + Manual)
- [ ] Plugin WooCommerce v1.0
- [ ] Nouvelle landing page (différenciation Shopify/Universal)
- [ ] Documentation utilisateur

### Budget Phase 1

| Poste | Estimation |
|-------|------------|
| Développement (3 mois) | €15-20K |
| Design UI/UX | €3-5K |
| Plugin WooCommerce | €5-8K |
| Infra/Hosting | €500/mois |
| Marketing lancement | €2-3K |
| **Total** | **€25-35K** |

---

## Phase 2 : Validation PMF (Mois 5-8)

### Objectifs
- [ ] Atteindre 500 clients payants
- [ ] Valider rétention (churn < 5%/mois)
- [ ] Identifier segments les plus rentables
- [ ] Collecter feedback pour Phase 3

### Métriques Clés

| Métrique | Cible Mois 5 | Cible Mois 8 |
|----------|--------------|--------------|
| Audits gratuits/mois | 1,000 | 5,000 |
| Signups gratuits | 200 | 800 |
| Conversion free→paid | 5% | 8% |
| Clients payants | 100 | 500 |
| MRR | €4,000 | €20,000 |
| Churn mensuel | < 8% | < 5% |
| NPS | > 30 | > 40 |

### Actions Marketing

1. **SEO Content**
   - 20 articles blog AEO/GEO
   - Guides par plateforme (Shopify, WooCommerce)
   - Études de cas clients

2. **Product-Led Growth**
   - Audit gratuit viral (partage résultats)
   - Badge "AEO Optimized" pour sites
   - Leaderboard anonymisé

3. **Partenariats**
   - Agences web/e-commerce
   - Influenceurs e-commerce
   - Communautés WooCommerce/WordPress

### Développements Phase 2

| Feature | Priorité | Trigger |
|---------|----------|---------|
| Amélioration onboarding | P0 | Churn > 10% |
| Rapports email auto | P1 | Demande clients |
| Intégration Zapier | P2 | +100 clients Growth |
| API v1 documentation | P2 | Demandes API |
| Mobile app (PWA) | P3 | Feedback utilisateurs |

---

## Phase 3 : Expansion Multi-Plateforme (Mois 9-12)

### Objectifs
- [ ] Ajouter connecteurs PrestaShop et Magento
- [ ] Lancer fonctionnalités multi-boutiques
- [ ] Introduire plans Business/Enterprise
- [ ] Atteindre €50K MRR

### Nouveaux Connecteurs

#### 3.1 Module PrestaShop (Semaines 1-4)
```
Priorité France/Europe (37% utilisateurs PrestaShop en France)

Distribution: PrestaShop Addons Marketplace

Fonctionnalités:
- Sync catalogue produits
- Injection tracking
- Back-office intégré
- Compatible PS 1.7+ et 8.x
```

#### 3.2 Extension Magento (Semaines 5-8)
```
Cible: Marchands mid-market/enterprise

Distribution: Adobe Commerce Marketplace

Fonctionnalités:
- GraphQL sync
- Multi-store support
- Admin panel widget
- Compatible Magento 2.4+
```

### Multi-Boutiques

```
Nouvelle structure compte:

┌─────────────────────────────────────────┐
│              Organization               │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
│  │ Store 1 │  │ Store 2 │  │ Store 3 │ │
│  │ Shopify │  │  WooC.  │  │ Presta  │ │
│  └─────────┘  └─────────┘  └─────────┘ │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │      Dashboard Consolidé        │   │
│  │  - Score AEO global             │   │
│  │  - Comparaison inter-stores     │   │
│  │  - Alertes unifiées             │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

### Nouvelle Grille Tarifaire Phase 3

| | STARTER | GROWTH | BUSINESS | ENTERPRISE |
|---|---|---|---|---|
| **Prix** | €29/mois | €79/mois | €149/mois | €399/mois |
| **Boutiques** | 1 | 1 | 5 | 25 |
| **Plateformes** | 1 | Toutes | Toutes | Toutes |
| **Produits** | 50 | 500 | 2,000 | 10,000 |
| **Utilisateurs** | 1 | 2 | 5 | 20 |
| **API calls/mois** | - | 1,000 | 10,000 | 100,000 |
| **Historique** | 3 mois | 6 mois | 1 an | Illimité |
| **Support** | Email | Prioritaire | Dédié | Account Mgr |

### Budget Phase 3

| Poste | Estimation |
|-------|------------|
| Module PrestaShop | €8-10K |
| Extension Magento | €10-15K |
| Multi-boutiques backend | €8-12K |
| API v2 + docs | €5-8K |
| **Total** | **€30-45K** |

---

## Phase 4 : Enterprise (Mois 13+)

### Objectifs
- [ ] Clients grands comptes (€10K+/an)
- [ ] Programme partenaires agences
- [ ] Certifications sécurité
- [ ] International expansion

### Features Enterprise

#### 4.1 White-Label
```
Permettre aux agences de revendre sous leur marque:

- Domaine custom (aeo.agence.com)
- Logo et couleurs personnalisés
- Emails de marque
- Rapports white-label PDF
- Pricing custom par client final
```

#### 4.2 SSO/SAML
```
Intégration identity providers enterprise:

- Okta
- Azure AD
- Google Workspace
- OneLogin
- Custom SAML 2.0
```

#### 4.3 SDK Développeurs
```
Packages officiels:

npm install @surfaced/node-sdk
pip install surfaced-python
composer require surfaced/php-sdk

Fonctionnalités:
- Toutes les API endpoints
- Webhooks handling
- Rate limiting automatique
- TypeScript types inclus
```

#### 4.4 Intégrations BI
```
Exports et connecteurs:

- Looker
- Tableau
- Power BI
- Google Data Studio
- Custom SQL access (read-only)
```

### Programme Partenaires

```
┌─────────────────────────────────────────────────────────────┐
│                 SURFACED PARTNER PROGRAM                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CERTIFIED        SILVER           GOLD          PLATINUM  │
│  PARTNER          PARTNER          PARTNER       PARTNER   │
│                                                             │
│  1-5 clients      5-15 clients     15-50 clients 50+       │
│  10% commission   15% commission   20% commission 25%      │
│  Badge site       + Co-marketing   + Leads refs  + Dédié   │
│  Training basic   + Training adv   + Account mgr + Events  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Budget Phase 4

| Poste | Estimation |
|-------|------------|
| White-label system | €15-20K |
| SSO/SAML | €8-10K |
| SDKs (3 langages) | €10-15K |
| Intégrations BI | €8-12K |
| Certification SOC2 | €15-25K |
| **Total** | **€55-80K** |

---

## Architecture Technique Cible

```
                                   ┌─────────────────┐
                                   │   CDN/Edge      │
                                   │   (Vercel)      │
                                   └────────┬────────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    │                       │                       │
           ┌────────▼────────┐    ┌────────▼────────┐    ┌────────▼────────┐
           │   Landing/App   │    │   API Gateway   │    │   Tracker CDN   │
           │   (Next.js)     │    │   (Next.js API) │    │   (tracker.js)  │
           └────────┬────────┘    └────────┬────────┘    └────────┬────────┘
                    │                      │                      │
                    │              ┌───────┴───────┐              │
                    │              │               │              │
           ┌────────▼────────┐    ┌▼───────┐ ┌────▼─────┐ ┌──────▼───────┐
           │   Auth/Billing  │    │ Core   │ │ Connector│ │   Analytics  │
           │   (Shopify)     │    │ Engine │ │ Service  │ │   Service    │
           └────────┬────────┘    └────┬───┘ └────┬─────┘ └──────┬───────┘
                    │                  │          │              │
                    └──────────────────┼──────────┼──────────────┘
                                       │          │
                              ┌────────▼──────────▼────────┐
                              │        PostgreSQL          │
                              │        (Vercel Postgres)   │
                              └────────────────────────────┘
                                           │
                              ┌────────────┴────────────┐
                              │                         │
                     ┌────────▼────────┐     ┌─────────▼─────────┐
                     │   Redis Cache   │     │   Queue (BullMQ)  │
                     │   (Vercel KV)   │     │   Background jobs │
                     └─────────────────┘     └───────────────────┘
```

### Nouveaux Modèles Prisma

```prisma
// schema.prisma - Extensions Phase 1-4

model Organization {
  id        String   @id @default(cuid())
  name      String
  plan      Plan     @default(STARTER)
  stores    Store[]
  users     User[]
  createdAt DateTime @default(now())
}

model Store {
  id             String       @id @default(cuid())
  name           String
  url            String
  platform       Platform     // shopify, woocommerce, prestashop, magento, manual
  credentials    String?      // Encrypted API credentials
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  products       Product[]
  audits         AeoAudit[]
  analytics      Analytics[]
  createdAt      DateTime     @default(now())
}

model AeoAudit {
  id          String   @id @default(cuid())
  storeId     String
  store       Store    @relation(fields: [storeId], references: [id])
  score       Int      // 0-100
  breakdown   Json     // Detailed scoring by category
  suggestions Json     // Prioritized recommendations
  createdAt   DateTime @default(now())
}

model Analytics {
  id           String   @id @default(cuid())
  storeId      String
  store        Store    @relation(fields: [storeId], references: [id])
  date         DateTime
  aiVisits     Int
  conversions  Int
  revenue      Decimal?
  byPlatform   Json     // { chatgpt: 10, perplexity: 5, ... }
}

enum Platform {
  shopify
  woocommerce
  prestashop
  magento
  bigcommerce
  manual
}

enum Plan {
  FREE
  STARTER
  GROWTH
  BUSINESS
  ENTERPRISE
}
```

---

## Métriques de Succès Globales

| Milestone | Timing | MRR Cible | Clients Payants |
|-----------|--------|-----------|-----------------|
| MVP Launch | Mois 4 | €5K | 100 |
| PMF Validated | Mois 8 | €25K | 500 |
| Multi-Platform | Mois 12 | €60K | 1,000 |
| Enterprise Ready | Mois 18 | €150K | 2,000 |
| Scale | Mois 24 | €300K | 4,000 |

---

## Risques et Mitigations

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Faible adoption WooCommerce | Medium | High | Focus SEO, freemium viral |
| Concurrence (Semrush, etc.) | High | Medium | Niche e-commerce, prix agressif |
| Complexité multi-plateforme | Medium | High | Architecture modulaire, MVP first |
| Churn élevé | Medium | High | Onboarding soigné, quick wins |
| Ressources dev limitées | High | Medium | Priorisation stricte, MVP lean |

---

## Prochaines Actions Immédiates

### Cette semaine
- [ ] Décider domaine (surfaced.io ? aeo.tools ?)
- [ ] Wireframes page Audit gratuit
- [ ] Spécifications techniques API audit

### Ce mois
- [ ] Développer MVP audit gratuit
- [ ] Refonte landing page (Shopify + Universal)
- [ ] Setup analytics (Mixpanel/Amplitude)

---

## Notes et Décisions

| Date | Décision | Contexte |
|------|----------|----------|
| 2025-01-24 | Stratégie hybride validée | Option A → B progressive |
| | | |
| | | |

---

*Document créé le 24 janvier 2025*
*Dernière mise à jour : 24 janvier 2025*
