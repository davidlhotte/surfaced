# 🚀 AI VISIBILITY - Product Specification
## "Le Semrush de l'AI Commerce pour Shopify"

---

## 📋 RÉSUMÉ PRODUIT

**Nom** : AI Visibility (ou "Rankify AI" / "AIO Tracker" - à valider)

**Tagline** : "Know where you rank in ChatGPT, Perplexity & AI search"

**Positionnement** : 
- PAS une app de génération llms.txt (gratuit ailleurs)
- Une plateforme d'ANALYTICS et INTELLIGENCE pour l'AI commerce
- Le "Semrush" ou "Ahrefs" de la visibilité AI

**Prix** : $49 / $99 / $199 par mois (pas de gratuit)

---

## 🎯 PROBLÈME RÉSOLU

### Douleur marchand
> "Shopify m'a dit que mon store est 'agent-ready' avec Agentic Storefronts.
> Mais je n'ai AUCUNE idée si ChatGPT recommande mes produits.
> Je vois du trafic 'chatgpt.com' dans GA4 mais c'est tout.
> Mes concurrents apparaissent-ils à ma place ?"

### Notre solution
Une plateforme qui répond à :
1. **OÙ** suis-je visible ? (ChatGPT, Perplexity, Gemini, Copilot)
2. **POUR QUELLES queries** ? (ex: "best running shoes under $100")
3. **QUI** apparaît à ma place ? (concurrents)
4. **POURQUOI** ? (audit des données produits)
5. **COMMENT** m'améliorer ? (recommandations actionnables)

---

## 🏗️ ARCHITECTURE MVP

### Core Features (V1.0 - 6 semaines)

#### 1. AI Readiness Audit
- Scan du catalogue produits
- Vérification : titles, descriptions, metafields, images, schema
- Score de 0-100 avec recommandations
- Comparaison vs "best practices" AI commerce

#### 2. llms.txt Generator (table stakes)
- Génération automatique du fichier llms.txt
- Configuration des bots autorisés
- Mise à jour automatique (prix, stock)
- Dashboard de statut

#### 3. Basic Visibility Check
- Test manuel : "Est-ce que ChatGPT mentionne ma marque ?"
- 10-20 queries prédéfinies par catégorie
- Résultats stockés et historisés
- Alertes si changement

### Premium Features (V1.5 - Mois 3-4)

#### 4. Multi-AI Tracking Dashboard
- Monitoring automatique sur 4+ AI platforms
- Fréquence : quotidienne ou hebdomadaire
- Historique de visibilité
- Graphiques de tendance

#### 5. Competitor Intelligence
- Suivre 3-5 concurrents
- Voir quand ILS sont recommandés (pas vous)
- Gap analysis : "Concurrent X apparaît pour 'running shoes', pas vous"

#### 6. Query Discovery
- Découvrir les queries où votre catégorie est mentionnée
- Volume estimé par query type
- Opportunités non exploitées

---

## 💻 STACK TECHNIQUE

### Frontend
- **Framework** : Next.js 14+ (App Router)
- **UI** : Polaris (Shopify design system) - OBLIGATOIRE pour Built for Shopify
- **State** : React Query ou SWR

### Backend
- **API** : Next.js API routes ou Node.js séparé
- **Auth** : Shopify OAuth (embedded app)
- **Database** : Supabase (PostgreSQL)

### Infrastructure
- **Hosting** : Vercel
- **Jobs/Cron** : Vercel Cron ou Inngest
- **AI Queries** : OpenAI API (pour simuler les recherches)

### Shopify Integration
- **Type** : Embedded App (dans l'admin Shopify)
- **APIs utilisées** :
  - Products API (lecture catalogue)
  - Metafields API (lecture/écriture)
  - Shop API (infos store)
  - Assets API (pour llms.txt si via theme)

---

## 📊 DATA MODEL

### Tables principales

```
stores
├── id (uuid)
├── shopify_domain
├── shopify_access_token (encrypted)
├── plan (starter/growth/scale)
├── created_at
└── settings (jsonb)

products_audit
├── id
├── store_id (fk)
├── product_id (shopify)
├── ai_score (0-100)
├── issues (jsonb) 
├── last_audit_at
└── created_at

visibility_checks
├── id
├── store_id (fk)
├── platform (chatgpt/perplexity/gemini/copilot)
├── query
├── mentioned (boolean)
├── position (nullable int)
├── competitors_mentioned (jsonb)
├── raw_response (text)
├── checked_at
└── created_at

competitors
├── id
├── store_id (fk)
├── domain
├── name
└── created_at

llms_txt_config
├── id
├── store_id (fk)
├── allowed_bots (jsonb)
├── excluded_products (jsonb)
├── custom_instructions (text)
├── last_generated_at
└── created_at
```

---

## 🔐 BUILT FOR SHOPIFY REQUIREMENTS

### Obligatoire pour le badge :

1. **Embedded App** - Pas de redirection externe
2. **Polaris UI** - 100% design system Shopify
3. **Session Token Auth** - Pas de cookies
4. **App Bridge** - Navigation intégrée
5. **GDPR Compliant** - Endpoints obligatoires
6. **Billing API** - Paiements via Shopify
7. **Performance** - <3s chargement initial
8. **Webhooks** - Uninstall, shop/update, etc.

### Checklist technique :
- [ ] @shopify/app-bridge-react
- [ ] @shopify/polaris
- [ ] Session token authentication
- [ ] GDPR webhooks (customers/redact, shop/redact, customers/data_request)
- [ ] App Proxy (optionnel, pour llms.txt sur domaine marchand)
- [ ] Billing API integration

---

## 📱 USER FLOWS

### Flow 1 : Onboarding (nouveau client)

```
1. Install depuis App Store
   ↓
2. OAuth Shopify
   ↓
3. Welcome screen + value prop
   ↓
4. Choix du plan ($49/$99/$199)
   ↓
5. Billing API → charge créée
   ↓
6. Auto-scan du catalogue (background)
   ↓
7. Dashboard avec AI Readiness Score
   ↓
8. Prompt : "Générer votre llms.txt ?"
```

### Flow 2 : Usage quotidien (client existant)

```
1. Ouvre l'app dans Shopify Admin
   ↓
2. Dashboard : 
   - AI Score actuel
   - Derniers visibility checks
   - Alertes (changements détectés)
   ↓
3. Actions possibles :
   - Voir détail audit
   - Lancer visibility check manuel
   - Voir concurrents
   - Configurer llms.txt
```

### Flow 3 : Visibility Check

```
1. User clique "Check My Visibility"
   ↓
2. App propose queries suggérées (basées sur produits)
   ↓
3. User sélectionne ou personnalise
   ↓
4. Background job : query les AI platforms
   ↓
5. Résultats affichés :
   - ✅ Mentioned sur ChatGPT
   - ❌ Non mentionné sur Perplexity
   - Concurrents détectés : [Brand X, Brand Y]
   ↓
6. Recommandations d'amélioration
```

---

## 💰 PRICING IMPLEMENTATION

### Plans

| Feature | Starter $49 | Growth $99 | Scale $199 |
|---------|-------------|------------|------------|
| AI Readiness Audit | ✅ | ✅ | ✅ |
| llms.txt Generator | ✅ | ✅ | ✅ |
| Products audités | 100 | 500 | Unlimited |
| Visibility checks/mois | 10 | 50 | 200 |
| Platforms trackées | 2 | 4 | 4+ |
| Concurrents suivis | 1 | 3 | 10 |
| Historique | 30 jours | 90 jours | 1 an |
| Export CSV | ❌ | ✅ | ✅ |
| API Access | ❌ | ❌ | ✅ |
| Priority Support | ❌ | ❌ | ✅ |

### Billing via Shopify

```javascript
// Création de la charge récurrente
const charge = await shopify.billing.request({
  plan: {
    name: "Growth Plan",
    amount: 99.00,
    currencyCode: "USD",
    interval: BillingInterval.Every30Days,
  },
  isTest: process.env.NODE_ENV !== 'production',
});
```

---

## 📅 ROADMAP MVP

### Semaine 1-2 : Foundation
- [ ] Setup projet Next.js + Shopify App template
- [ ] Auth OAuth Shopify
- [ ] Database Supabase
- [ ] Polaris UI base
- [ ] Billing API integration

### Semaine 3-4 : Core Features
- [ ] Products sync depuis Shopify
- [ ] AI Readiness Audit engine
- [ ] Score calculation algorithm
- [ ] Dashboard principal
- [ ] llms.txt generator

### Semaine 5-6 : Visibility + Polish
- [ ] Visibility check engine (1 platform d'abord)
- [ ] Results display
- [ ] Onboarding flow
- [ ] App Store listing assets
- [ ] Testing + bug fixes

### Semaine 7-8 : Launch
- [ ] Submit to Shopify App Store
- [ ] Built for Shopify review
- [ ] Landing page
- [ ] Documentation
- [ ] Launch marketing

---

## 🎨 APP STORE LISTING

### Title
"AI Visibility - Track Your ChatGPT & AI Rankings"

### Tagline
"Know if ChatGPT recommends your products. Track AI visibility, audit your catalog, outrank competitors."

### Key Benefits
1. See if ChatGPT, Perplexity, and AI search mention your brand
2. AI Readiness Score - know exactly what to fix
3. Track competitors' AI visibility
4. Auto-generate llms.txt for AI crawlers
5. Actionable recommendations to improve rankings

### Screenshots needed (5)
1. Dashboard with AI Score
2. Visibility Check results
3. Audit details with recommendations
4. Competitor comparison
5. llms.txt configuration

---

## 📝 NOTES TECHNIQUES

### Comment faire les "Visibility Checks" ?

**Option A : API OpenAI (ChatGPT)**
- Utiliser l'API avec web search enabled
- Envoyer la query, parser la réponse
- Chercher les mentions de la marque/produits
- Coût : ~$0.01-0.05 par query

**Option B : Scraping (Perplexity, etc.)**
- Plus complexe, risque de blocage
- Nécessite proxies, rotation
- Alternative : API Perplexity si disponible

**Option C : Hybrid**
- ChatGPT via API (fiable)
- Autres platforms : checks manuels guidés par l'app

### Recommandation MVP
Commencer avec ChatGPT uniquement (via API OpenAI avec browsing).
Ajouter les autres platforms en V1.5.

---

## ✅ DEFINITION OF DONE (MVP)

L'app est prête à lancer quand :

- [ ] Un marchand peut installer et payer via Shopify Billing
- [ ] L'audit de catalogue fonctionne sur 100+ produits
- [ ] Le score AI Readiness est calculé et affiché
- [ ] Le llms.txt est généré et accessible
- [ ] Au moins 1 platform de visibility check fonctionne
- [ ] L'UI est 100% Polaris
- [ ] Les webhooks GDPR sont implémentés
- [ ] L'app passe le review Shopify initial

---

*Document créé le 14 janvier 2026*
*Version : 1.0*
