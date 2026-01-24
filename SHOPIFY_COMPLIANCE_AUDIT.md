# Surfaced - Audit de Conformité Shopify App Store

> **Date d'audit** : 24 janvier 2025
> **Version de l'app** : 1.0.0
> **Statut global** : ⚠️ **Corrections mineures requises**

---

## Résumé Exécutif

| Catégorie | Statut | Issues |
|-----------|--------|--------|
| OAuth & Authentication | ✅ Conforme | 0 |
| Shopify Billing API | ✅ Conforme | 0 |
| App Bridge | ✅ Conforme | 0 |
| GraphQL API (vs REST) | ✅ Conforme | 0 |
| GDPR Webhooks | ✅ Conforme | 0 |
| Embedded Experience | ✅ Conforme | 0 |
| Security | ✅ Conforme | 0 |
| UI/UX & Error Handling | ✅ Conforme | 0 |
| App Listing Content | ⚠️ À vérifier | 3 |
| Access Scopes | ⚠️ À optimiser | 1 |
| Submission Requirements | ❌ Manquant | 2 |

**Total : 10/13 catégories conformes, 3 à corriger**

---

## 1. OAuth & Authentication ✅

### Statut : CONFORME

| Critère | Statut | Détails |
|---------|--------|---------|
| Redirection OAuth immédiate | ✅ | Redirect vers OAuth après installation |
| Validation HMAC | ✅ | Timing-safe HMAC-SHA256 dans `/api/auth/callback` |
| Session tokens (pas cookies) | ✅ | JWT verification dans `/lib/shopify/auth.ts` |
| Réinstallation fonctionne | ✅ | Upsert dans callback, settings créés automatiquement |

**Fichiers vérifiés :**
- `app/api/auth/callback/route.ts` - HMAC verification correcte
- `lib/shopify/auth.ts` - Session token validation
- `app/api/auth/token/route.ts` - Token exchange

---

## 2. Shopify Billing API ✅

### Statut : CONFORME

| Critère | Statut | Détails |
|---------|--------|---------|
| Utilise Shopify Billing API | ✅ | GraphQL `appSubscriptionCreate` mutation |
| Pas de billing externe | ✅ | Aucun Stripe/autre détecté |
| Upgrade/downgrade sans réinstall | ✅ | Via `/api/billing/callback` |
| Pricing cohérent | ✅ | Landing = Code = Billing |

**Plans configurés :**
```
FREE    : $0/mois (Trial 14 jours)
BASIC   : $29/mois (7j trial)
PLUS    : $79/mois (7j trial)
PREMIUM : $149/mois (7j trial)
```

**Fichiers vérifiés :**
- `lib/shopify/billing.ts` - GraphQL mutations
- `lib/constants/plans.ts` - Prix cohérents
- `app/page.tsx` - Affichage prix

---

## 3. App Bridge ✅

### Statut : CONFORME

| Critère | Statut | Détails |
|---------|--------|---------|
| Version CDN (recommandée) | ✅ | `cdn.shopify.com/shopifycloud/app-bridge.js` |
| Meta shopify-api-key | ✅ | Dans `app/layout.tsx` |
| Script synchrone | ✅ | Pas d'async/defer |
| React components | ✅ | `@shopify/app-bridge-react` v4.2.8 pour hooks |

**Note :** L'app utilise l'approche moderne CDN, pas le package npm legacy.

**Fichiers vérifiés :**
- `app/layout.tsx` - Script CDN correct
- `components/admin/AppBridgeNav.tsx` - Navigation Polaris

---

## 4. GraphQL vs REST API ✅

### Statut : CONFORME

| Critère | Statut | Détails |
|---------|--------|---------|
| 100% GraphQL | ✅ | Aucun appel REST Admin API |
| Version API | ✅ | `2025-01` configurée |
| Client GraphQL | ✅ | `shopify.clients.Graphql` |

**Requirement Shopify (Avril 2025)** : Toutes les nouvelles apps doivent utiliser GraphQL exclusivement.

**Fichiers vérifiés :**
- `lib/shopify/graphql.ts` - Toutes les queries/mutations

---

## 5. GDPR Webhooks ✅

### Statut : CONFORME

| Webhook | URL | HMAC | Status |
|---------|-----|------|--------|
| `customers/data_request` | `/api/webhooks/gdpr/customers-data-request` | ✅ | ✅ |
| `customers/redact` | `/api/webhooks/gdpr/customers-redact` | ✅ | ✅ |
| `shop/redact` | `/api/webhooks/gdpr/shop-redact` | ✅ | ✅ |

**Fichiers vérifiés :**
- `shopify.app.toml` - URLs configurées
- `app/api/webhooks/gdpr/*` - Handlers avec HMAC validation
- `lib/shopify/webhooks.ts` - Verification timing-safe

---

## 6. Embedded Experience ✅

### Statut : CONFORME

| Critère | Statut | Détails |
|---------|--------|---------|
| `embedded = true` | ✅ | Dans `shopify.app.toml` |
| Navigation intégrée | ✅ | `ui-nav-menu` web component |
| Polaris UI | ✅ | v13.9.5 avec i18n (EN/FR) |
| Mode incognito | ✅ | Session tokens via App Bridge, pas localStorage |

**Fichiers vérifiés :**
- `shopify.app.toml` - Configuration embedded
- `app/admin/layout-client.tsx` - Polaris AppProvider

---

## 7. Security ✅

### Statut : CONFORME

| Critère | Statut | Détails |
|---------|--------|---------|
| HTTPS enforced | ✅ | Vercel + URLs https:// |
| Token encryption | ✅ | AES-256-GCM |
| Security headers | ✅ | CSP, X-Content-Type-Options, X-XSS-Protection |
| Rate limiting | ✅ | Upstash ratelimit configuré |
| HMAC timing-safe | ✅ | `timingSafeEqual` partout |

**Fichiers vérifiés :**
- `lib/security/encryption.ts` - AES-256-GCM
- `middleware.ts` - Security headers
- `lib/security/rate-limit.ts` - Rate limiting

---

## 8. UI/UX & Error Handling ✅

### Statut : CONFORME

| Critère | Statut | Détails |
|---------|--------|---------|
| Error Boundaries | ✅ | Wraps admin layout |
| API error handling | ✅ | `handleApiError()` consistant |
| Loading states | ✅ | Skeleton loaders Polaris |
| Responsive design | ✅ | CSS grid avec breakpoints |

**Fichiers vérifiés :**
- `components/ui/ErrorBoundary.tsx`
- `app/admin/error.tsx`
- `lib/utils/errors.ts`

---

## 9. App Listing Content ⚠️

### Statut : À VÉRIFIER

#### ⚠️ Issue 1 : Statistiques non vérifiables

**Localisation :** `app/page.tsx` lignes 611-629

```jsx
// Stats bar dans la section Testimonials
<div className="text-4xl font-bold">500+</div>
<div className="text-sky-200">shops</div>

<div className="text-4xl font-bold">50K+</div>
<div className="text-sky-200">products analyzed</div>

<div className="text-4xl font-bold">35%</div>
<div className="text-sky-200">visibility improvement</div>

<div className="text-4xl font-bold">4.9/5</div>
<div className="text-sky-200">rating</div>
```

**Règle Shopify violée :**
> "No unsubstantiated statistics, data, or guarantees ('the first,' 'the best,' 'the only')"
> "Avoid stats and claims in both text and images"

**Action requise :**
- [ ] Supprimer ou sourcer ces statistiques
- [ ] Si l'app est nouvelle, ces stats sont forcément inventées
- [ ] Alternative : Remplacer par des bénéfices génériques

#### ⚠️ Issue 2 : Témoignages fictifs

**Localisation :** `app/page.tsx` lignes 124-146 et `lib/i18n/translations.ts`

Les témoignages avec des noms spécifiques et métriques sont problématiques :
- "Sophie M." - CEO EcoShop Paris
- "Marcus T." - Founder TechGear US
- "Emma L." - E-commerce Manager

**Règle Shopify violée :**
> "No reviews, testimonials, or third-party endorsements in listing"

**Action requise :**
- [ ] Supprimer les témoignages de la landing page
- [ ] Ou les remplacer par des témoignages vérifiables avec permission écrite

#### ⚠️ Issue 3 : Claims dans FAQ

**Localisation :** `lib/i18n/translations.ts` ligne 231, 552

```
"Nos clients voient en moyenne une amélioration de 35% de leur visibilité IA"
```

**Action requise :**
- [ ] Reformuler sans pourcentage spécifique
- [ ] Exemple : "Les optimisations peuvent améliorer significativement votre visibilité"

---

## 10. Access Scopes ⚠️

### Statut : À OPTIMISER

**Scopes actuels :** `shopify.app.toml` ligne 21
```toml
scopes = "read_products,write_products,read_content,write_content,read_themes,write_themes"
```

| Scope | Utilisé | Justification |
|-------|---------|---------------|
| `read_products` | ✅ | Product audits, visibility analysis |
| `write_products` | ✅ | Bulk SEO edits, meta updates |
| `read_content` | ✅ | Blog/page analysis |
| `write_content` | ✅ | Content optimization |
| `read_themes` | ✅ | Theme analysis pour SEO |
| `write_themes` | ⚠️ **Non utilisé** | Scope demandé mais pas d'écriture theme |

**Action requise :**
- [ ] Retirer `write_themes` du scope si non utilisé
- [ ] OU documenter l'usage prévu (ex: injection script tracking futur)

**Commande pour modifier :**
```toml
# shopify.app.toml
scopes = "read_products,write_products,read_content,write_content,read_themes"
```

---

## 11. Submission Requirements ❌

### Statut : INCOMPLET

#### ❌ Issue 1 : Demo Screencast manquant

**Règle Shopify :**
> "Demo screencast required showing onboarding and core features in English or with English subtitles"

**Action requise :**
- [ ] Créer une vidéo de 2-5 minutes montrant :
  1. Installation depuis Shopify App Store
  2. OAuth flow et premier écran
  3. Configuration initiale
  4. Fonctionnalités principales (Dashboard, Products, Visibility, etc.)
  5. Billing flow (upgrade plan)
- [ ] Héberger sur YouTube/Loom/Vimeo (unlisted)
- [ ] Fournir le lien dans la soumission

#### ❌ Issue 2 : Test Credentials manquantes

**Règle Shopify :**
> "Valid, functional test credentials providing full feature access"
> "Keep credentials current before submission"

**Action requise :**
- [ ] Créer un development store de démo
- [ ] Installer l'app avec toutes les fonctionnalités activées
- [ ] Documenter :
  - URL du store : `xxx.myshopify.com`
  - Email staff : `reviewer@xxx.com`
  - Password staff : `xxx`
  - Plan activé : PREMIUM (pour accès complet)
- [ ] Fournir instructions de test détaillées

---

## 12. Flow Triggers Extension ✅

### Statut : CONFORME (si déployée)

**Fichier :** `extensions/flow-triggers/shopify.extension.toml`

5 triggers configurés :
1. Product AI Score Changed
2. Surfaced Alert Created
3. Visibility Check Completed
4. Product Optimization Applied
5. A/B Test Completed

**Vérification requise :**
- [ ] Confirmer que les triggers sont fonctionnels
- [ ] Tester avec Shopify Flow dans un dev store

---

## Actions Requises - Checklist

### Priorité HAUTE (Bloquant pour soumission)

- [ ] **Créer demo screencast** (2-5 min)
- [ ] **Préparer test credentials** (dev store + instructions)
- [ ] **Supprimer/modifier statistiques** (500+, 50K+, 35%, 4.9/5)
- [ ] **Supprimer/modifier témoignages** (ou obtenir permissions)

### Priorité MOYENNE (Recommandé)

- [ ] **Retirer `write_themes`** du scope si non utilisé
- [ ] **Reformuler claims FAQ** (35% improvement)

### Priorité BASSE (Optionnel)

- [ ] Mettre à jour `@shopify/app-bridge-react` vers dernière version
- [ ] Ajouter pages 404/500 custom (actuellement defaults Next.js)

---

## Commandes de Vérification

```bash
# Vérifier les types TypeScript
npx tsc --noEmit --skipLibCheck

# Vérifier le linting
npm run lint

# Lancer les tests
npm run test

# Déployer sur Shopify
npx shopify app deploy --force

# Vérifier Vercel
curl -s -o /dev/null -w "%{http_code}" https://surfaced.vercel.app/admin
```

---

## Ressources Shopify

- [App Store Requirements](https://shopify.dev/docs/apps/launch/shopify-app-store/app-store-requirements)
- [Pass App Review](https://shopify.dev/docs/apps/launch/app-store-review/pass-app-review)
- [Common Review Problems](https://shopify.dev/docs/apps/launch/app-store-review/pass-app-review#common-app-review-problems)
- [App Listing Guidelines](https://shopify.dev/docs/apps/launch/shopify-app-store/app-store-listing)

---

*Audit réalisé le 24 janvier 2025*
