# Plan de Test E2E - Surfaced MVP V0.1

## Contexte
Application Shopify pour optimiser la visibilité des produits dans les moteurs de recherche AI (ChatGPT, Perplexity, etc.)

---

## 1. Pré-requis de Test

### 1.1 Données de Test Shopify
Créer **5 produits de test** avec différents niveaux de qualité :

| Produit | Description | Images | SEO | Tags | Score Attendu |
|---------|-------------|--------|-----|------|---------------|
| `test-product-perfect` | 300+ chars | 3+ avec alt | Complet | 5+ tags | 90-100 |
| `test-product-good` | 150-300 chars | 2 avec alt | Partiel | 3 tags | 70-89 |
| `test-product-medium` | 50-150 chars | 1 sans alt | Vide | 1 tag | 40-69 |
| `test-product-poor` | <50 chars | 0 | Vide | 0 | 20-39 |
| `test-product-empty` | Vide | 0 | Vide | 0 | 0-19 |

### 1.2 Compétiteurs de Test
- `allbirds.com` - Marque connue (devrait apparaître dans ChatGPT)
- `obscure-brand-xyz.com` - Marque fictive (ne devrait pas apparaître)

---

## 2. Scénarios de Test E2E

### TC-001: Authentification et Accès Initial
**Priorité:** CRITIQUE

| Étape | Action | Résultat Attendu |
|-------|--------|------------------|
| 1 | Ouvrir l'app depuis Shopify Admin | Dashboard affiché |
| 2 | Vérifier les données initiales | Score 0, 0 produits audités |
| 3 | Vérifier les logs Vercel | Token exchange successful |

### TC-002: Audit des Produits
**Priorité:** CRITIQUE

| Étape | Action | Résultat Attendu |
|-------|--------|------------------|
| 1 | Cliquer "Run Audit" | Spinner affiché |
| 2 | Attendre fin de l'audit | Score mis à jour (>0) |
| 3 | Vérifier compteur produits | "X of Y products audited" |
| 4 | Vérifier badges issues | Critical/Warning/Tips affichés |
| 5 | Aller sur /admin/audit | Liste des produits avec scores |

**Validation des scores:**
- `test-product-perfect` → Score ≥ 90
- `test-product-empty` → Score < 40

### TC-003: Visibility Check
**Priorité:** HAUTE

| Étape | Action | Résultat Attendu |
|-------|--------|------------------|
| 1 | Aller sur /admin/visibility | Page affichée |
| 2 | Cliquer "Run Check" | Spinner + appel OpenAI |
| 3 | Attendre résultat | Badge "Visible" ou "Not Found" |
| 4 | Vérifier historique | Nouvelle entrée dans la liste |

### TC-004: Gestion des Compétiteurs
**Priorité:** MOYENNE

| Étape | Action | Résultat Attendu |
|-------|--------|------------------|
| 1 | Aller sur /admin/competitors | Page affichée |
| 2 | Ajouter compétiteur "allbirds.com" | Ajout réussi |
| 3 | Cliquer "Analyze" | Analyse comparative affichée |
| 4 | Supprimer compétiteur | Suppression réussie |
| 5 | Tester limite plan FREE (3) | Message d'erreur après 4ème |

### TC-005: Navigation et UX
**Priorité:** MOYENNE

| Étape | Action | Résultat Attendu |
|-------|--------|------------------|
| 1 | Dashboard → View Audit Details | Navigation OK |
| 2 | Dashboard → Run Visibility Check | Navigation OK |
| 3 | Dashboard → Manage Competitors | Navigation OK |
| 4 | Dashboard → Configure llms.txt | Navigation OK |
| 5 | Dashboard → Settings | Navigation OK |

---

## 3. Tests de Régression API

### API Endpoints à Tester

```bash
# Dashboard
curl -H "x-shopify-shop-domain: SHOP.myshopify.com" \
     https://surfaced.vercel.app/api/dashboard

# Audit
curl -X POST -H "x-shopify-shop-domain: SHOP.myshopify.com" \
     https://surfaced.vercel.app/api/audit

# Visibility
curl -X POST -H "x-shopify-shop-domain: SHOP.myshopify.com" \
     -H "Content-Type: application/json" \
     -d '{"query":"best shoes","platform":"chatgpt"}' \
     https://surfaced.vercel.app/api/visibility

# Competitors
curl -X POST -H "x-shopify-shop-domain: SHOP.myshopify.com" \
     -H "Content-Type: application/json" \
     -d '{"domain":"allbirds.com","name":"Allbirds"}' \
     https://surfaced.vercel.app/api/competitors
```

---

## 4. Checklist Pré-Production

### 4.1 Fonctionnel
- [ ] Dashboard charge correctement
- [ ] Audit calcule les scores correctement
- [ ] Visibility Check retourne des résultats
- [ ] Compétiteurs peuvent être ajoutés/supprimés
- [ ] Navigation entre pages fonctionne

### 4.2 Sécurité
- [ ] Token exchange vérifie le JWT
- [ ] APIs rejettent les requêtes non authentifiées
- [ ] Rate limiting fonctionne

### 4.3 Performance
- [ ] Dashboard charge en < 3s
- [ ] Audit de 50 produits < 30s
- [ ] Visibility check < 10s

### 4.4 Erreurs
- [ ] Messages d'erreur clairs
- [ ] Retry sur erreurs réseau
- [ ] Logs Sentry fonctionnels

---

## 5. Environnement de Test

### Store de Test
- **URL:** admin.shopify.com/store/[VOTRE_STORE]
- **App URL:** https://surfaced.vercel.app/admin

### Monitoring
- **Logs:** `vercel logs surfaced.vercel.app`
- **Sentry:** https://sentry.io (vérifier les erreurs)

### Base de Données
- **Neon Console:** Vérifier les données créées

---

## 6. Critères d'Acceptation MVP

| Critère | Seuil | Status |
|---------|-------|--------|
| Auth fonctionne | 100% | ✅ |
| Audit calcule scores | >80% précision | ⏳ |
| Visibility retourne résultat | 100% | ⏳ |
| Pas d'erreurs critiques | 0 erreurs | ⏳ |
| Tests unitaires passent | 100% | ✅ (118/118) |

---

## 7. Plan d'Exécution

### Phase 1: Setup (15 min)
1. Créer les 5 produits de test dans Shopify
2. Vérifier l'accès à l'app

### Phase 2: Tests Fonctionnels (30 min)
1. Exécuter TC-001 à TC-005
2. Noter les résultats

### Phase 3: Tests API (15 min)
1. Tester chaque endpoint avec curl
2. Vérifier les réponses

### Phase 4: Analyse (15 min)
1. Compiler les résultats
2. Identifier les bugs
3. Prioriser les corrections
