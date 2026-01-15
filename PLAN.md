# 🚀 SURFACED - Plan de Développement

> **Mission** : Accompagner les entreprises Shopify dans leur référencement dans les IA, pas seulement mesurer.

> **Objectif** : 1M€ CA / an

> **Différenciation** : "Surfaced ne vous dit pas juste que vous êtes invisible. Surfaced CORRIGE le problème."

---

## 📊 BUSINESS MODEL

### Modèle Freemium

```
┌─────────────────────────────────────────────────────────────────┐
│                        GRATUIT (Forever Free)                    │
├─────────────────────────────────────────────────────────────────┤
│  ✅ AI Readiness Score (global)                                 │
│  ✅ 3 Visibility Checks / mois                                  │
│  ✅ Audit détaillé de 10 produits                               │
│  ✅ llms.txt basique                                            │
│  ✅ Recommandations (lecture seule)                             │
│  ✅ 1 concurrent suivi (basique)                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
              "Vous avez 47 problèmes à corriger"
              "Vos concurrents sont mieux positionnés"
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     PAYANT (Actions & Intelligence)              │
├─────────────────────────────────────────────────────────────────┤
│  💰 STARTER $49/mois                                            │
│     • 100 produits audités                                       │
│     • 10 visibility checks                                       │
│     • 1 concurrent détaillé                                      │
│     • Alertes email                                              │
├─────────────────────────────────────────────────────────────────┤
│  💰 GROWTH $99/mois                                             │
│     • 500 produits                                               │
│     • 50 visibility checks                                       │
│     • 3 concurrents trackés                                      │
│     • AI Content Optimizer (50 produits/mois)                   │
│     • Alertes temps réel                                         │
├─────────────────────────────────────────────────────────────────┤
│  💰 SCALE $199/mois                                             │
│     • Produits illimités                                         │
│     • 200 visibility checks                                      │
│     • 10 concurrents                                            │
│     • AI Content Optimizer illimité                             │
│     • ROI Dashboard                                              │
│     • API access                                                 │
│     • Priority support                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 MVP (Version 1.0)

### Objectif MVP
Livrer une app fonctionnelle avec le gratuit + la killer feature payante (Competitor Intelligence).

### Features MVP

| Feature | Gratuit | Payant | Priorité |
|---------|---------|--------|----------|
| Dashboard + Score global | ✅ | - | P0 |
| AI Readiness Audit (10 produits) | ✅ | 100+ | P0 |
| Visibility Check (3/mois) | ✅ | 10-200 | P0 |
| Recommandations (lecture) | ✅ | - | P0 |
| llms.txt Generator (basique) | ✅ | Pro | P1 |
| **Competitor Intelligence** | Basique | Détaillé | P0 (Killer) |
| Billing Shopify | - | ✅ | P0 |
| Onboarding flow | ✅ | - | P1 |

### Critères de succès MVP
- [ ] Un marchand peut installer gratuitement
- [ ] L'audit fonctionne sur 10+ produits
- [ ] Le visibility check fonctionne (ChatGPT)
- [ ] Le marchand voit ses concurrents
- [ ] Le marchand peut passer en payant via Shopify Billing
- [ ] UI 100% Polaris
- [ ] Built for Shopify requirements respectés

---

## 🔮 ROADMAP FEATURES (Post-MVP)

### Feature A : Competitor Intelligence ⭐ KILLER FEATURE MVP

**Description** : Montrer aux marchands où leurs concurrents apparaissent et pas eux.

**Valeur** :
```
"Brand X apparaît dans 73% des recherches 'best running shoes'.
Vous apparaissez dans 12%.
Voici ce qu'ils font différemment..."
```

**Implémentation** :
- Ajouter jusqu'à 3-10 concurrents (domaines)
- Lancer les mêmes visibility checks sur les concurrents
- Comparer et afficher les gaps
- Analyser les différences (descriptions, schema, etc.)

**Coût estimé** : ~$0.04/check concurrent

**Statut** : 🟢 MVP

---

### Feature B : Alertes & Monitoring Continu

**Description** : Notifications quand la visibilité change.

**Valeur** :
```
🔴 ALERTE : Vous avez disparu des résultats ChatGPT
   Avant : Position #2
   Maintenant : Non mentionné
   Concurrent qui a pris votre place : Decathlon
```

**Implémentation** :
- Cron job quotidien/hebdomadaire
- Comparaison avec le check précédent
- Email + notification in-app
- Historique des changements

**Coût estimé** : ~$0.50/jour/shop (monitoring quotidien)

**Statut** : 🟡 V1.1

---

### Feature C : AI Content Optimizer

**Description** : Réécriture automatique du contenu pour l'AI.

**Sous-features** :
| Element | Action |
|---------|--------|
| Descriptions produits | Réécriture AI-friendly |
| Titres produits | Optimisation |
| Metafields | Remplissage auto |
| Schema.org | Génération JSON-LD |
| Alt text images | Génération |
| FAQ produit | Génération |

**Valeur** :
```
AVANT : "Nike Air Max 90. Running. Blanc."
APRÈS : "Les Nike Air Max 90 sont des chaussures de running
        polyvalentes, idéales pour les coureurs cherchant
        confort et style..."
```

**Implémentation** :
- GPT-4 pour la génération
- Preview avant application
- Bulk actions (plusieurs produits)
- Historique des modifications

**Coût estimé** : ~$0.05-0.10/produit

**Statut** : 🟡 V1.2

---

### Feature D : ROI Calculator & Attribution

**Description** : Mesurer le ROI du canal AI.

**Valeur** :
```
📊 CE MOIS-CI :
   Visites depuis ChatGPT : 234
   Visites depuis Perplexity : 89
   Conversions AI : 12
   Revenue attribué : $1,847

   💡 Potentiel si visible partout : +$4,200/mois
```

**Implémentation** :
- Intégration GA4 ou script tracking
- Attribution des conversions
- Calcul du manque à gagner
- Dashboard ROI

**Coût estimé** : Minimal (analytics)

**Statut** : 🔴 V2.0

---

## 🛠️ ARCHITECTURE TECHNIQUE

### Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 + Polaris |
| Backend | Next.js API Routes |
| Database | Neon PostgreSQL |
| ORM | Prisma |
| Auth | Shopify OAuth |
| Billing | Shopify Billing API |
| AI | OpenAI API (GPT-4) |
| Hosting | Vercel |
| Monitoring | Sentry |
| Cache | Vercel KV (optionnel) |

### Modèle de données (Prisma)

```
Shop                 → Données marchand + plan
├── Settings         → Préférences
├── ProductAudit     → Audit AI-readiness des produits
├── VisibilityCheck  → Tests de visibilité AI
├── Competitor       → Concurrents trackés
├── LlmsTxtConfig    → Configuration llms.txt
└── AuditLog         → Logs d'activité
```

### APIs externes

| API | Usage | Coût |
|-----|-------|------|
| Shopify Products API | Lecture catalogue | Gratuit |
| Shopify Metafields API | Lecture/écriture | Gratuit |
| OpenAI API (GPT-4) | Visibility checks | ~$0.01-0.05/check |
| OpenAI API (GPT-4) | Content generation | ~$0.05-0.10/produit |

---

## 📅 TIMELINE

### Phase 1 : MVP Core (Semaines 1-2)
- [ ] Dashboard principal (score global)
- [ ] Sync produits Shopify
- [ ] AI Readiness Audit engine
- [ ] Score calculation
- [ ] UI Polaris base

### Phase 2 : Visibility & Competitors (Semaines 3-4)
- [ ] Visibility Check engine (ChatGPT)
- [ ] Competitor tracking (Feature A)
- [ ] Comparaison gaps
- [ ] Résultats + recommandations

### Phase 3 : Monetization & Polish (Semaines 5-6)
- [ ] Billing Shopify integration
- [ ] Plans + limites
- [ ] llms.txt generator
- [ ] Onboarding flow
- [ ] Tests + bug fixes

### Phase 4 : Launch (Semaines 7-8)
- [ ] Submit Shopify App Store
- [ ] Built for Shopify review
- [ ] Landing page
- [ ] Documentation
- [ ] Launch marketing

### Post-Launch
- [ ] Feature B : Alertes (V1.1)
- [ ] Feature C : AI Content Optimizer (V1.2)
- [ ] Feature D : ROI Dashboard (V2.0)

---

## 💰 PROJECTIONS FINANCIÈRES

### Coûts par client

| Plan | Revenu | Coût estimé | Marge |
|------|--------|-------------|-------|
| Gratuit | $0 | $0.06/mois | -$0.06 |
| Starter $49 | $49 | ~$2 | 96% |
| Growth $99 | $99 | ~$4 | 96% |
| Scale $199 | $199 | ~$8 | 96% |

### Objectif 1M€/an

| Métrique | Valeur |
|----------|--------|
| MRR cible | $83,333 |
| ARPU estimé | $75 |
| Clients payants nécessaires | ~1,111 |
| Timeline réaliste | 18-24 mois |

---

## ✅ CHECKLIST BUILT FOR SHOPIFY

- [ ] Embedded App (pas de redirection externe)
- [ ] Polaris UI (100% design system Shopify)
- [ ] Session Token Auth
- [ ] App Bridge navigation
- [ ] GDPR Webhooks (customers/redact, shop/redact, data_request)
- [ ] Billing API
- [ ] Performance <3s chargement
- [ ] Webhooks (uninstall, shop/update)

---

## 📝 NOTES

### Décisions prises
- Modèle freemium : gratuit généreux + payant pour actions
- Killer feature MVP : Competitor Intelligence (Feature A)
- Pas de plan gratuit permanent avec toutes les features
- ChatGPT uniquement pour MVP, autres AI en V1.5+

### Questions ouvertes
- Pricing final à valider après MVP
- Feature C (AI Content Optimizer) : valider la demande avant dev
- ROI Dashboard : nécessite intégration analytics (complexe)

### Risques identifiés
1. Shopify intègre nativement (40% probabilité)
2. Course au gratuit (60% probabilité)
3. Marché pas encore mature (30% probabilité)

---

*Dernière mise à jour : 15 janvier 2026*
*Version : 1.0*
