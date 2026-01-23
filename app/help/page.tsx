'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LanguageProvider, useLanguage, LanguageSwitcher } from '@/lib/i18n';

type HelpCategory = {
  id: string;
  icon: string;
  articles: HelpArticle[];
};

type HelpArticle = {
  id: string;
  title: { fr: string; en: string };
  content: { fr: string; en: string };
};

const helpCategories: HelpCategory[] = [
  {
    id: 'why-aeo',
    icon: '💡',
    articles: [
      {
        id: 'what-is-aeo',
        title: { fr: "Pourquoi l'AEO est essentiel en 2025", en: "Why AEO is essential in 2025" },
        content: {
          fr: `### Le monde a changé

En 2024, **40% des recherches produits** passent par des assistants IA comme ChatGPT, Claude ou Perplexity. Ce chiffre atteindra **60% en 2026** selon Gartner.

### Le problème pour les e-commerçants

Quand un client demande *"Quels sont les meilleurs écouteurs sans fil pour le sport ?"* à ChatGPT :
- **Sans AEO** : Vos produits n'existent pas. Zéro mention. Zéro vente.
- **Avec AEO** : Vos produits apparaissent dans les recommandations = trafic gratuit et qualifié.

### Qu'est-ce que l'AEO ?

**AEO = AI Engine Optimization** (Optimisation pour les Moteurs IA)

C'est le SEO pour les assistants IA. Au lieu d'optimiser pour Google, vous optimisez pour ChatGPT, Claude, Perplexity, Gemini et Copilot.

### La différence avec le SEO

| SEO Classique | AEO |
|---------------|-----|
| Optimise pour Google | Optimise pour ChatGPT, Claude, etc. |
| Résultats = liens | Résultats = recommandations directes |
| L'utilisateur clique | L'IA recommande VOTRE produit |
| Position #1 = 30% clics | Mention = Confiance immédiate |

### Pourquoi Surfaced ?

Surfaced est la **première app Shopify dédiée à l'AEO**. Elle vous permet de :
1. **Mesurer** votre visibilité actuelle sur les IA
2. **Comprendre** pourquoi vos produits ne sont pas recommandés
3. **Optimiser** automatiquement votre catalogue
4. **Vérifier** en temps réel si les IA vous mentionnent
5. **Surpasser** vos concurrents sur ce nouveau canal`,
          en: `### The world has changed

In 2024, **40% of product searches** go through AI assistants like ChatGPT, Claude, or Perplexity. This will reach **60% by 2026** according to Gartner.

### The problem for e-commerce

When a customer asks *"What are the best wireless earbuds for sports?"* to ChatGPT:
- **Without AEO**: Your products don't exist. Zero mentions. Zero sales.
- **With AEO**: Your products appear in recommendations = free qualified traffic.

### What is AEO?

**AEO = AI Engine Optimization**

It's SEO for AI assistants. Instead of optimizing for Google, you optimize for ChatGPT, Claude, Perplexity, Gemini, and Copilot.

### The difference with SEO

| Traditional SEO | AEO |
|-----------------|-----|
| Optimizes for Google | Optimizes for ChatGPT, Claude, etc. |
| Results = links | Results = direct recommendations |
| User clicks | AI recommends YOUR product |
| Position #1 = 30% clicks | Mention = Immediate trust |

### Why Surfaced?

Surfaced is the **first Shopify app dedicated to AEO**. It allows you to:
1. **Measure** your current visibility on AIs
2. **Understand** why your products aren't recommended
3. **Optimize** your catalog automatically
4. **Verify** in real-time if AIs mention you
5. **Outperform** your competitors on this new channel`,
        },
      },
      {
        id: 'value-proposition',
        title: { fr: "Ce que Surfaced fait pour vous", en: "What Surfaced does for you" },
        content: {
          fr: `### Votre ROI avec Surfaced

**Avant Surfaced** :
- 0% de visibilité IA
- Les clients demandent à ChatGPT → vos concurrents sont recommandés
- Vous perdez des ventes sans même le savoir

**Après Surfaced** :
- Visibilité IA mesurable et croissante
- Vos produits apparaissent dans les recommandations IA
- Trafic organique gratuit depuis ChatGPT, Claude, Perplexity

### Résultats clients typiques

| Métrique | Avant | Après 30 jours |
|----------|-------|----------------|
| Score IA moyen | 35/100 | 78/100 |
| Taux de mention | 5% | 35% |
| Trafic IA | 0 visites | 150+ visites/mois |

### Les 5 piliers de Surfaced

1. **📊 Audit IA** : Analysez chaque produit et recevez un score de 0 à 100
2. **✨ Optimisation IA** : Générez descriptions, titres et tags optimisés pour les IA
3. **🎯 Vérification** : Testez si les IA recommandent vraiment votre marque
4. **📈 Suivi** : Mesurez votre progression dans le temps
5. **🛠️ Outils AEO** : Sitemap, robots.txt, JSON-LD, llms.txt pour les crawlers IA`,
          en: `### Your ROI with Surfaced

**Before Surfaced**:
- 0% AI visibility
- Customers ask ChatGPT → your competitors are recommended
- You lose sales without even knowing

**After Surfaced**:
- Measurable and growing AI visibility
- Your products appear in AI recommendations
- Free organic traffic from ChatGPT, Claude, Perplexity

### Typical customer results

| Metric | Before | After 30 days |
|--------|--------|---------------|
| Average AI Score | 35/100 | 78/100 |
| Mention rate | 5% | 35% |
| AI Traffic | 0 visits | 150+ visits/month |

### The 5 pillars of Surfaced

1. **📊 AI Audit**: Analyze each product and get a score from 0 to 100
2. **✨ AI Optimization**: Generate descriptions, titles, and tags optimized for AIs
3. **🎯 Verification**: Test if AIs actually recommend your brand
4. **📈 Tracking**: Measure your progress over time
5. **🛠️ AEO Tools**: Sitemap, robots.txt, JSON-LD, llms.txt for AI crawlers`,
        },
      },
    ],
  },
  {
    id: 'getting-started',
    icon: '🚀',
    articles: [
      {
        id: 'quick-start',
        title: { fr: "Démarrage rapide (5 minutes)", en: "Quick start (5 minutes)" },
        content: {
          fr: `### Étape 1 : Lancez votre premier audit (30 sec)

1. Ouvrez Surfaced dans votre admin Shopify
2. Sur le **Dashboard**, cliquez sur **"Analyser ma boutique"**
3. Attendez 10-30 secondes pendant que Surfaced scanne vos produits

**Résultat** : Chaque produit reçoit un **Score IA** de 0 à 100.

### Étape 2 : Comprenez votre score (1 min)

Allez dans **Produits** et observez :
- 🔴 **0-39** : Critique - Action urgente requise
- 🟡 **40-69** : À améliorer - Optimisations recommandées
- 🟢 **70-100** : Bon - Bien optimisé pour les IA

**Conseil** : Commencez par vos **best-sellers** avec un score faible.

### Étape 3 : Optimisez un produit (2 min)

1. Allez dans **Optimiser**
2. Sélectionnez un produit avec un score faible
3. Cliquez sur **"Générer suggestions"**
4. Prévisualisez les améliorations (description, titre, meta)
5. Cliquez sur **"Appliquer"** pour sauvegarder

**Résultat** : Le score du produit augmente immédiatement.

### Étape 4 : Vérifiez votre visibilité (1 min)

1. Allez dans **Visibilité**
2. Entrez une requête type client : *"meilleur [votre produit] pour [usage]"*
3. Cliquez sur **"Vérifier"**
4. Observez si votre marque apparaît dans les réponses IA

### Étape 5 : Configurez llms.txt (30 sec)

1. Allez dans **llms.txt**
2. Cliquez sur **"Activer"**
3. C'est tout ! Les crawlers IA peuvent maintenant mieux comprendre votre boutique.

**🎉 Félicitations !** Vous avez fait vos premiers pas en AEO.`,
          en: `### Step 1: Run your first audit (30 sec)

1. Open Surfaced in your Shopify admin
2. On the **Dashboard**, click **"Analyze my store"**
3. Wait 10-30 seconds while Surfaced scans your products

**Result**: Each product receives an **AI Score** from 0 to 100.

### Step 2: Understand your score (1 min)

Go to **Products** and observe:
- 🔴 **0-39**: Critical - Urgent action required
- 🟡 **40-69**: Needs improvement - Optimizations recommended
- 🟢 **70-100**: Good - Well optimized for AIs

**Tip**: Start with your **best-sellers** that have low scores.

### Step 3: Optimize a product (2 min)

1. Go to **Optimize**
2. Select a product with a low score
3. Click **"Generate suggestions"**
4. Preview improvements (description, title, meta)
5. Click **"Apply"** to save

**Result**: The product score increases immediately.

### Step 4: Check your visibility (1 min)

1. Go to **Visibility**
2. Enter a customer-type query: *"best [your product] for [use case]"*
3. Click **"Check"**
4. See if your brand appears in AI responses

### Step 5: Configure llms.txt (30 sec)

1. Go to **llms.txt**
2. Click **"Enable"**
3. That's it! AI crawlers can now better understand your store.

**🎉 Congratulations!** You've taken your first steps in AEO.`,
        },
      },
      {
        id: 'understanding-score',
        title: { fr: 'Comprendre le Score IA', en: 'Understanding AI Score' },
        content: {
          fr: `### Comment est calculé le Score IA ?

Le Score IA (0-100) prédit la probabilité qu'une IA recommande votre produit.

### Les 3 catégories de facteurs

#### 🔴 Facteurs Critiques (40% du score)

Ces éléments **bloquent** les recommandations s'ils manquent :

| Facteur | Impact | Pourquoi |
|---------|--------|----------|
| Description présente | +15 pts | Les IA ne recommandent pas ce qu'elles ne comprennent pas |
| Images présentes | +10 pts | Signal de qualité et légitimité |
| Description > 150 mots | +15 pts | Plus de contexte = meilleures recommandations |

#### 🟡 Facteurs Importants (35% du score)

Ces éléments **améliorent** vos chances :

| Facteur | Impact | Pourquoi |
|---------|--------|----------|
| Meta title personnalisé | +10 pts | Résumé clair pour les IA |
| Meta description | +10 pts | Contexte additionnel |
| Type de produit défini | +8 pts | Catégorisation pour les IA |
| Tags pertinents | +7 pts | Mots-clés pour le matching |

#### 🟢 Facteurs Bonus (25% du score)

Ces éléments vous **distinguent** des concurrents :

| Facteur | Impact | Pourquoi |
|---------|--------|----------|
| Alt-text des images | +8 pts | Description visuelle pour les IA |
| Prix défini | +5 pts | Permet les comparaisons |
| Variantes documentées | +5 pts | Informations complètes |
| JSON-LD activé | +7 pts | Données structurées que les IA adorent |

### Niveaux de problèmes

| Icône | Niveau | Action |
|-------|--------|--------|
| 🔴 | Critique | Corrigez immédiatement - bloque les recommandations |
| 🟡 | Avertissement | Corrigez rapidement - réduit vos chances |
| 🔵 | Info | Amélioration optionnelle |`,
          en: `### How is the AI Score calculated?

The AI Score (0-100) predicts the likelihood that an AI will recommend your product.

### The 3 categories of factors

#### 🔴 Critical Factors (40% of score)

These elements **block** recommendations if missing:

| Factor | Impact | Why |
|--------|--------|-----|
| Description present | +15 pts | AIs don't recommend what they can't understand |
| Images present | +10 pts | Quality and legitimacy signal |
| Description > 150 words | +15 pts | More context = better recommendations |

#### 🟡 Important Factors (35% of score)

These elements **improve** your chances:

| Factor | Impact | Why |
|--------|--------|-----|
| Custom meta title | +10 pts | Clear summary for AIs |
| Meta description | +10 pts | Additional context |
| Product type defined | +8 pts | Categorization for AIs |
| Relevant tags | +7 pts | Keywords for matching |

#### 🟢 Bonus Factors (25% of score)

These elements **distinguish** you from competitors:

| Factor | Impact | Why |
|--------|--------|-----|
| Image alt-text | +8 pts | Visual description for AIs |
| Price defined | +5 pts | Enables comparisons |
| Documented variants | +5 pts | Complete information |
| JSON-LD enabled | +7 pts | Structured data that AIs love |

### Issue levels

| Icon | Level | Action |
|------|-------|--------|
| 🔴 | Critical | Fix immediately - blocks recommendations |
| 🟡 | Warning | Fix quickly - reduces your chances |
| 🔵 | Info | Optional improvement |`,
        },
      },
      {
        id: 'navigation',
        title: { fr: "Naviguer dans Surfaced", en: "Navigating Surfaced" },
        content: {
          fr: `### Vue d'ensemble de l'interface

Surfaced organise ses fonctionnalités en sections accessibles depuis le menu :

### 📊 Dashboard (Tableau de bord)

**Objectif** : Vue d'ensemble de votre visibilité IA

**Ce que vous voyez** :
- Score IA global de votre boutique
- Taux de mention sur les plateformes IA
- Graphique d'évolution
- Actions rapides recommandées

**Astuce** : Cliquez sur chaque métrique pour voir les détails.

### 📦 Produits

**Objectif** : Analyser et gérer vos produits individuellement

**Fonctionnalités** :
- Liste de tous vos produits avec leur score
- Filtres par score (critique, à améliorer, bon)
- Détail des problèmes pour chaque produit
- Lien direct vers l'optimisation

### ✨ Optimiser

**Objectif** : Améliorer vos fiches produits avec l'IA

**Fonctionnalités** :
- Génération automatique de descriptions
- Optimisation des titres et meta
- Suggestions de tags
- Prévisualisation avant/après

### 🎯 Visibilité

**Objectif** : Tester si les IA vous recommandent

**Fonctionnalités** :
- Test en temps réel sur 5 plateformes
- Historique de vos vérifications
- Détection des concurrents mentionnés
- Suivi de votre taux de mention

### 👥 Concurrents

**Objectif** : Surveiller vos concurrents

**Fonctionnalités** :
- Ajout de concurrents à suivre
- Comparaison des scores IA
- Alertes quand un concurrent vous dépasse

### 🛠️ Outils AEO

**Objectif** : Outils techniques pour l'AEO

**Sous-sections** :
- **Sitemap** : Générer un sitemap optimisé
- **Robots.txt** : Gérer les bots IA
- **llms.txt** : Fichier pour les crawlers IA
- **JSON-LD** : Données structurées
- **Qualité** : Détecter le contenu dupliqué
- **Rapports** : Exporter vos données`,
          en: `### Interface overview

Surfaced organizes its features in sections accessible from the menu:

### 📊 Dashboard

**Purpose**: Overview of your AI visibility

**What you see**:
- Global AI score of your store
- Mention rate on AI platforms
- Evolution chart
- Recommended quick actions

**Tip**: Click on each metric to see details.

### 📦 Products

**Purpose**: Analyze and manage your products individually

**Features**:
- List of all your products with their score
- Filters by score (critical, needs improvement, good)
- Problem details for each product
- Direct link to optimization

### ✨ Optimize

**Purpose**: Improve your product listings with AI

**Features**:
- Automatic description generation
- Title and meta optimization
- Tag suggestions
- Before/after preview

### 🎯 Visibility

**Purpose**: Test if AIs recommend you

**Features**:
- Real-time test on 5 platforms
- History of your checks
- Detection of mentioned competitors
- Mention rate tracking

### 👥 Competitors

**Purpose**: Monitor your competitors

**Features**:
- Add competitors to track
- AI score comparison
- Alerts when a competitor outranks you

### 🛠️ AEO Tools

**Purpose**: Technical tools for AEO

**Sub-sections**:
- **Sitemap**: Generate an optimized sitemap
- **Robots.txt**: Manage AI bots
- **llms.txt**: File for AI crawlers
- **JSON-LD**: Structured data
- **Quality**: Detect duplicate content
- **Reports**: Export your data`,
        },
      },
    ],
  },
  {
    id: 'features',
    icon: '⚡',
    articles: [
      {
        id: 'products-page',
        title: { fr: "Page Produits", en: "Products Page" },
        content: {
          fr: `### Vue d'ensemble

La page **Produits** affiche tous vos produits avec leur Score IA et les problèmes détectés.

### Comment l'utiliser

#### 1. Filtrer par priorité

Utilisez les filtres pour vous concentrer sur ce qui compte :

| Filtre | Affiche | Action recommandée |
|--------|---------|-------------------|
| Tous | Tous les produits | Vue d'ensemble |
| Critiques | Score < 40 | **Priorité #1** - Corrigez d'abord |
| À améliorer | Score 40-69 | Priorité #2 |
| Optimisés | Score 70+ | Maintenir |

#### 2. Comprendre les problèmes

Chaque produit liste ses problèmes :
- 🔴 **Rouge** : Bloque les recommandations IA
- 🟡 **Jaune** : Réduit vos chances
- 🔵 **Bleu** : Amélioration optionnelle

#### 3. Actions rapides

Pour chaque produit, vous pouvez :
- **Voir détails** : Analyse complète
- **Optimiser** : Aller directement à l'optimisation
- **Voir sur Shopify** : Ouvrir le produit dans votre admin

### Stratégie recommandée

1. **Semaine 1** : Corrigez tous les produits en rouge (critiques)
2. **Semaine 2-3** : Améliorez les produits jaunes (best-sellers d'abord)
3. **En continu** : Maintenez les scores au-dessus de 70

### Astuce Pro

Triez par **"Score croissant"** pour voir les pires produits en premier. Ce sont vos priorités.`,
          en: `### Overview

The **Products** page displays all your products with their AI Score and detected issues.

### How to use it

#### 1. Filter by priority

Use filters to focus on what matters:

| Filter | Displays | Recommended action |
|--------|----------|-------------------|
| All | All products | Overview |
| Critical | Score < 40 | **Priority #1** - Fix first |
| Needs improvement | Score 40-69 | Priority #2 |
| Optimized | Score 70+ | Maintain |

#### 2. Understand issues

Each product lists its problems:
- 🔴 **Red**: Blocks AI recommendations
- 🟡 **Yellow**: Reduces your chances
- 🔵 **Blue**: Optional improvement

#### 3. Quick actions

For each product, you can:
- **View details**: Complete analysis
- **Optimize**: Go directly to optimization
- **View on Shopify**: Open product in your admin

### Recommended strategy

1. **Week 1**: Fix all red products (critical)
2. **Week 2-3**: Improve yellow products (best-sellers first)
3. **Ongoing**: Maintain scores above 70

### Pro tip

Sort by **"Score ascending"** to see worst products first. These are your priorities.`,
        },
      },
      {
        id: 'optimizer',
        title: { fr: "Optimiseur IA", en: "AI Optimizer" },
        content: {
          fr: `### Qu'est-ce que c'est ?

L'Optimiseur IA génère automatiquement du contenu optimisé pour que les assistants IA recommandent vos produits.

### Ce qui est généré

| Élément | Description | Impact |
|---------|-------------|--------|
| **Description** | Texte de 200-400 mots structuré pour les IA | +15-25 pts |
| **Meta title** | Titre SEO/AEO optimisé (60 car.) | +10 pts |
| **Meta description** | Résumé accrocheur (160 car.) | +10 pts |
| **Tags** | Mots-clés pertinents | +5-7 pts |
| **Alt-text images** | Descriptions des images | +8 pts |

### Comment utiliser

#### Étape 1 : Sélectionner un produit
1. Allez dans **Optimiser**
2. Recherchez ou sélectionnez un produit
3. Le score actuel s'affiche

#### Étape 2 : Générer les suggestions
1. Cochez les éléments à optimiser
2. Cliquez sur **"Générer suggestions"**
3. Attendez 5-10 secondes

#### Étape 3 : Prévisualiser et modifier
1. Comparez **Avant** / **Après** côte à côte
2. **Modifiez** le texte si nécessaire (cliquez sur le champ)
3. Un badge "Modifié" apparaît si vous personnalisez

#### Étape 4 : Appliquer
1. Cliquez sur **"Appliquer à Shopify"**
2. Les changements sont envoyés directement à votre boutique
3. Le score est recalculé

### Conseils pour de meilleurs résultats

1. **Gardez les mots-clés IA** générés (ils sont importants)
2. **Ajoutez votre ton de marque** aux descriptions
3. **Vérifiez les faits** (prix, caractéristiques)
4. **Optimisez vos best-sellers en premier**

### Limites par plan

| Plan | Optimisations/mois | Coût par optimisation |
|------|-------------------|-----------------------|
| Free | 3 | - |
| Starter ($29) | 20 | ~$1.45 |
| Growth ($79) | 100 | ~$0.79 |
| Scale ($149) | 500 | ~$0.30 |`,
          en: `### What is it?

The AI Optimizer automatically generates optimized content so AI assistants recommend your products.

### What's generated

| Element | Description | Impact |
|---------|-------------|--------|
| **Description** | 200-400 word text structured for AIs | +15-25 pts |
| **Meta title** | Optimized SEO/AEO title (60 char) | +10 pts |
| **Meta description** | Catchy summary (160 char) | +10 pts |
| **Tags** | Relevant keywords | +5-7 pts |
| **Image alt-text** | Image descriptions | +8 pts |

### How to use

#### Step 1: Select a product
1. Go to **Optimize**
2. Search or select a product
3. Current score displays

#### Step 2: Generate suggestions
1. Check elements to optimize
2. Click **"Generate suggestions"**
3. Wait 5-10 seconds

#### Step 3: Preview and edit
1. Compare **Before** / **After** side by side
2. **Edit** text if needed (click on field)
3. "Modified" badge appears if you customize

#### Step 4: Apply
1. Click **"Apply to Shopify"**
2. Changes are sent directly to your store
3. Score is recalculated

### Tips for better results

1. **Keep generated AI keywords** (they're important)
2. **Add your brand tone** to descriptions
3. **Verify facts** (prices, features)
4. **Optimize best-sellers first**

### Limits per plan

| Plan | Optimizations/month | Cost per optimization |
|------|--------------------|-----------------------|
| Free | 3 | - |
| Starter ($29) | 20 | ~$1.45 |
| Growth ($79) | 100 | ~$0.79 |
| Scale ($149) | 500 | ~$0.30 |`,
        },
      },
      {
        id: 'visibility',
        title: { fr: "Vérification de Visibilité", en: "Visibility Check" },
        content: {
          fr: `### Qu'est-ce que c'est ?

Surfaced **interroge réellement** les assistants IA pour voir si votre marque apparaît dans leurs réponses.

### Plateformes testées

| Plateforme | Utilisateurs | Pourquoi c'est important |
|------------|--------------|-------------------------|
| **ChatGPT** | 200M+ | Le plus utilisé pour les recherches produits |
| **Claude** | 50M+ | Très populaire pour les recommandations |
| **Perplexity** | 10M+ | Moteur de recherche IA en croissance |
| **Gemini** | 100M+ | Intégré à Google |
| **Copilot** | 50M+ | Intégré à Microsoft/Bing |

### Comment lancer une vérification

#### 1. Créer une requête

Tapez une question comme un vrai client :
- ✅ *"meilleurs écouteurs bluetooth pour le sport"*
- ✅ *"casque audio sans fil qualité studio"*
- ❌ *"écouteurs"* (trop vague)

**Conseil** : Ajoutez le contexte d'usage (sport, travail, voyage...).

#### 2. Lancer la vérification

1. Cliquez sur **"Vérifier sur toutes les plateformes"**
2. Attendez 10-30 secondes
3. Les résultats s'affichent pour chaque plateforme

#### 3. Comprendre les résultats

| Indicateur | Signification |
|------------|---------------|
| ✅ **Mentionné** | Une IA a recommandé votre marque |
| ❌ **Non mentionné** | Votre marque n'apparaît pas |
| **Position** | Où vous apparaissez (1 = premier) |
| **Concurrents** | Autres marques mentionnées |
| **Contexte** | Comment vous êtes décrit |

### Stratégie de vérification

| Fréquence | Objectif |
|-----------|----------|
| Hebdomadaire | Suivre votre progression |
| Après optimisations | Valider l'impact des changements |
| Avant lancement produit | S'assurer que le nouveau produit est visible |

### Interpréter vos résultats

**Taux de mention < 20%** : Urgent - Vos produits sont mal optimisés
**Taux de mention 20-50%** : En progrès - Continuez à optimiser
**Taux de mention > 50%** : Excellent - Vous êtes bien positionné`,
          en: `### What is it?

Surfaced **actually queries** AI assistants to see if your brand appears in their responses.

### Platforms tested

| Platform | Users | Why it matters |
|----------|-------|----------------|
| **ChatGPT** | 200M+ | Most used for product searches |
| **Claude** | 50M+ | Very popular for recommendations |
| **Perplexity** | 10M+ | Growing AI search engine |
| **Gemini** | 100M+ | Integrated with Google |
| **Copilot** | 50M+ | Integrated with Microsoft/Bing |

### How to run a check

#### 1. Create a query

Type a question like a real customer:
- ✅ *"best bluetooth earbuds for sports"*
- ✅ *"wireless studio quality headphones"*
- ❌ *"headphones"* (too vague)

**Tip**: Add usage context (sports, work, travel...).

#### 2. Run the check

1. Click **"Check on all platforms"**
2. Wait 10-30 seconds
3. Results display for each platform

#### 3. Understand results

| Indicator | Meaning |
|-----------|---------|
| ✅ **Mentioned** | An AI recommended your brand |
| ❌ **Not mentioned** | Your brand doesn't appear |
| **Position** | Where you appear (1 = first) |
| **Competitors** | Other brands mentioned |
| **Context** | How you're described |

### Verification strategy

| Frequency | Objective |
|-----------|-----------|
| Weekly | Track your progress |
| After optimizations | Validate change impact |
| Before product launch | Ensure new product is visible |

### Interpreting your results

**Mention rate < 20%**: Urgent - Your products are poorly optimized
**Mention rate 20-50%**: Progress - Keep optimizing
**Mention rate > 50%**: Excellent - You're well positioned`,
        },
      },
      {
        id: 'competitors',
        title: { fr: "Suivi des Concurrents", en: "Competitor Tracking" },
        content: {
          fr: `### Pourquoi suivre vos concurrents ?

Quand un client demande une recommandation à ChatGPT, l'IA compare plusieurs options. Vous devez savoir :
- Qui sont vos concurrents les plus mentionnés
- Quel est leur score IA vs le vôtre
- Quand ils vous dépassent

### Ajouter un concurrent

1. Allez dans **Concurrents**
2. Cliquez sur **"Ajouter un concurrent"**
3. Entrez leur **domaine Shopify** (ex: concurrent.myshopify.com)
4. Ou leur **nom de marque** si vous ne connaissez pas le domaine

### Ce que vous voyez

Pour chaque concurrent :

| Métrique | Description |
|----------|-------------|
| **Nom** | Nom de la boutique |
| **Score IA estimé** | Estimation basée sur les mentions |
| **Taux de mention** | % de fois mentionné par les IA |
| **Tendance** | ↑ monte, ↓ descend, → stable |
| **Dernière vérification** | Quand on a vérifié |

### Comparer avec vous

Le tableau comparatif montre :
- **Votre position** vs chaque concurrent
- **Les requêtes** où ils vous battent
- **Les opportunités** où vous pouvez les dépasser

### Alertes automatiques

Activez les alertes pour être notifié quand :
- Un concurrent vous dépasse sur une requête clé
- Votre taux de mention baisse
- Un nouveau concurrent apparaît

### Limites par plan

| Plan | Concurrents suivis |
|------|-------------------|
| Free | 0 |
| Starter | 1 |
| Growth | 3 |
| Scale | 10 |`,
          en: `### Why track competitors?

When a customer asks ChatGPT for a recommendation, the AI compares multiple options. You need to know:
- Who are your most mentioned competitors
- What's their AI score vs yours
- When they outrank you

### Add a competitor

1. Go to **Competitors**
2. Click **"Add competitor"**
3. Enter their **Shopify domain** (e.g., competitor.myshopify.com)
4. Or their **brand name** if you don't know the domain

### What you see

For each competitor:

| Metric | Description |
|--------|-------------|
| **Name** | Store name |
| **Estimated AI Score** | Estimate based on mentions |
| **Mention rate** | % of times mentioned by AIs |
| **Trend** | ↑ rising, ↓ falling, → stable |
| **Last check** | When we last verified |

### Compare with you

The comparison table shows:
- **Your position** vs each competitor
- **Queries** where they beat you
- **Opportunities** where you can outrank them

### Automatic alerts

Enable alerts to be notified when:
- A competitor outranks you on a key query
- Your mention rate drops
- A new competitor appears

### Limits per plan

| Plan | Competitors tracked |
|------|---------------------|
| Free | 0 |
| Starter | 1 |
| Growth | 3 |
| Scale | 10 |`,
        },
      },
      {
        id: 'ab-testing',
        title: { fr: "Tests A/B", en: "A/B Testing" },
        content: {
          fr: `### Qu'est-ce que c'est ?

Les Tests A/B vous permettent de tester **différentes versions** de vos descriptions pour voir laquelle est la plus recommandée par les IA.

### Pourquoi faire des tests A/B ?

Deux descriptions peuvent avoir le même score IA mais des résultats très différents :
- Version A : mentionnée 20% du temps
- Version B : mentionnée 45% du temps

Le test A/B trouve la meilleure version **objectivement**.

### Comment créer un test A/B

#### Étape 1 : Choisir le produit
1. Allez dans **Tests A/B**
2. Cliquez sur **"Nouveau test"**
3. Sélectionnez un produit

#### Étape 2 : Définir les variantes
- **Variante A** : Votre description actuelle (contrôle)
- **Variante B** : Description alternative (générée ou personnalisée)

Vous pouvez tester :
- La description complète
- Le meta title
- Le meta description

#### Étape 3 : Lancer le test
1. Choisissez la durée (recommandé : 7 jours)
2. Définissez le nombre de vérifications
3. Cliquez sur **"Démarrer le test"**

#### Étape 4 : Analyser les résultats
Après la durée définie, vous voyez :
- Taux de mention de chaque variante
- Gagnant statistiquement significatif
- Contexte des mentions (comment chaque variante est décrite)

#### Étape 5 : Appliquer le gagnant
Cliquez sur **"Appliquer le gagnant"** pour mettre à jour votre produit automatiquement.

### Conseils pour des tests efficaces

1. **Testez une seule chose** à la fois (description OU titre, pas les deux)
2. **Attendez assez de données** (minimum 20 vérifications)
3. **Testez vos best-sellers** en priorité

### Disponibilité

| Plan | Tests A/B |
|------|-----------|
| Free | ❌ |
| Starter | ❌ |
| Growth | ✅ |
| Scale | ✅ |`,
          en: `### What is it?

A/B Tests let you test **different versions** of your descriptions to see which one is most recommended by AIs.

### Why run A/B tests?

Two descriptions can have the same AI score but very different results:
- Version A: mentioned 20% of the time
- Version B: mentioned 45% of the time

A/B testing finds the best version **objectively**.

### How to create an A/B test

#### Step 1: Choose the product
1. Go to **A/B Tests**
2. Click **"New test"**
3. Select a product

#### Step 2: Define variants
- **Variant A**: Your current description (control)
- **Variant B**: Alternative description (generated or custom)

You can test:
- Full description
- Meta title
- Meta description

#### Step 3: Run the test
1. Choose duration (recommended: 7 days)
2. Set number of checks
3. Click **"Start test"**

#### Step 4: Analyze results
After the defined duration, you see:
- Mention rate for each variant
- Statistically significant winner
- Mention context (how each variant is described)

#### Step 5: Apply the winner
Click **"Apply winner"** to automatically update your product.

### Tips for effective tests

1. **Test one thing** at a time (description OR title, not both)
2. **Wait for enough data** (minimum 20 checks)
3. **Test best-sellers** first

### Availability

| Plan | A/B Tests |
|------|-----------|
| Free | ❌ |
| Starter | ❌ |
| Growth | ✅ |
| Scale | ✅ |`,
        },
      },
    ],
  },
  {
    id: 'aeo-tools',
    icon: '🛠️',
    articles: [
      {
        id: 'llms-txt',
        title: { fr: "llms.txt - Le fichier essentiel", en: "llms.txt - The essential file" },
        content: {
          fr: `### Qu'est-ce que llms.txt ?

**llms.txt** est un fichier standardisé (comme robots.txt) qui aide les assistants IA à comprendre votre boutique. C'est le **sésame** pour être recommandé.

### Pourquoi c'est crucial

Sans llms.txt :
- Les IA doivent deviner ce que vous vendez
- Vos produits sont mal compris
- Moins de recommandations

Avec llms.txt :
- Les IA comprennent exactement votre offre
- Vos produits sont correctement catégorisés
- Plus de recommandations pertinentes

### Comment l'activer

1. Allez dans **llms.txt** depuis le menu
2. Cliquez sur **"Activer llms.txt"**
3. C'est fait ! Le fichier est généré automatiquement

### Ce que contient llms.txt

Le fichier généré inclut :
- **Nom de votre boutique**
- **Description** de ce que vous vendez
- **Catégories** de produits
- **Liste des produits** avec prix et descriptions
- **Instructions** pour les IA

### Personnalisation

Vous pouvez personnaliser :

| Option | Description |
|--------|-------------|
| **Description boutique** | Comment vous voulez être présenté |
| **Produits inclus** | Tous, seulement les publiés, sélection |
| **Instructions custom** | Directives spéciales pour les IA |
| **Bots autorisés** | GPTBot, ClaudeBot, etc. |

### Exemple de llms.txt généré

\`\`\`
# MaBoutique.com
> Boutique spécialisée en équipements audio haut de gamme

## Catégories
- Casques audio
- Écouteurs sans fil
- Accessoires

## Produits phares
- SoundMax Pro ($199) - Casque studio professionnel
- AirBuds Elite ($149) - Écouteurs sport étanches
...
\`\`\`

### Disponibilité

Tous les plans ont accès à llms.txt (gratuit inclus).`,
          en: `### What is llms.txt?

**llms.txt** is a standardized file (like robots.txt) that helps AI assistants understand your store. It's the **key** to being recommended.

### Why it's crucial

Without llms.txt:
- AIs have to guess what you sell
- Your products are poorly understood
- Fewer recommendations

With llms.txt:
- AIs understand exactly your offer
- Your products are correctly categorized
- More relevant recommendations

### How to enable it

1. Go to **llms.txt** from the menu
2. Click **"Enable llms.txt"**
3. Done! The file is generated automatically

### What llms.txt contains

The generated file includes:
- **Your store name**
- **Description** of what you sell
- **Product categories**
- **Product list** with prices and descriptions
- **Instructions** for AIs

### Customization

You can customize:

| Option | Description |
|--------|-------------|
| **Store description** | How you want to be presented |
| **Included products** | All, published only, selection |
| **Custom instructions** | Special directives for AIs |
| **Allowed bots** | GPTBot, ClaudeBot, etc. |

### Example generated llms.txt

\`\`\`
# MyStore.com
> Store specialized in high-end audio equipment

## Categories
- Headphones
- Wireless earbuds
- Accessories

## Featured products
- SoundMax Pro ($199) - Professional studio headphones
- AirBuds Elite ($149) - Waterproof sports earbuds
...
\`\`\`

### Availability

All plans have access to llms.txt (free included).`,
        },
      },
      {
        id: 'json-ld',
        title: { fr: "JSON-LD Schema", en: "JSON-LD Schema" },
        content: {
          fr: `### Qu'est-ce que JSON-LD ?

JSON-LD est un format de **données structurées** que les moteurs de recherche et les IA adorent. C'est comme donner un CV standardisé de vos produits aux IA.

### Pourquoi c'est important pour l'AEO

Les données structurées permettent aux IA de :
- **Comprendre** le type de produit instantanément
- **Extraire** les informations clés (prix, disponibilité, avis)
- **Comparer** facilement avec d'autres produits
- **Recommander** avec confiance

### Types de schemas générés

| Schema | Description | Utilité AEO |
|--------|-------------|-------------|
| **Product** | Informations produit | +7 pts score IA |
| **Organization** | Infos sur votre entreprise | Crédibilité |
| **BreadcrumbList** | Navigation | Structure du site |
| **FAQ** | Questions fréquentes | Contexte additionnel |
| **Review** | Avis clients | Preuve sociale |

### Comment activer

1. Allez dans **JSON-LD** depuis le menu
2. Activez les types de schemas souhaités
3. Prévisualisez le code généré
4. Cliquez sur **"Déployer"**

### Configuration avancée

| Option | Description |
|--------|-------------|
| **Inclure tous les produits** | Oui/Non |
| **Exclure certains produits** | Liste d'exclusion |
| **Données organisation** | Personnaliser nom, logo, contact |
| **Générer FAQ** | Auto-générer des FAQ par produit |

### Vérifier l'installation

Après activation :
1. Visitez une page produit de votre boutique
2. Clic droit → "Afficher le code source"
3. Cherchez \`<script type="application/ld+json">\`
4. Vous devriez voir les données structurées

### Disponibilité

| Plan | JSON-LD |
|------|---------|
| Free | ❌ |
| Starter | ✅ |
| Growth | ✅ |
| Scale | ✅ |`,
          en: `### What is JSON-LD?

JSON-LD is a **structured data** format that search engines and AIs love. It's like giving a standardized CV of your products to AIs.

### Why it matters for AEO

Structured data allows AIs to:
- **Understand** product type instantly
- **Extract** key info (price, availability, reviews)
- **Compare** easily with other products
- **Recommend** with confidence

### Types of schemas generated

| Schema | Description | AEO Benefit |
|--------|-------------|-------------|
| **Product** | Product information | +7 pts AI score |
| **Organization** | Company info | Credibility |
| **BreadcrumbList** | Navigation | Site structure |
| **FAQ** | Frequent questions | Additional context |
| **Review** | Customer reviews | Social proof |

### How to enable

1. Go to **JSON-LD** from the menu
2. Enable desired schema types
3. Preview generated code
4. Click **"Deploy"**

### Advanced configuration

| Option | Description |
|--------|-------------|
| **Include all products** | Yes/No |
| **Exclude certain products** | Exclusion list |
| **Organization data** | Customize name, logo, contact |
| **Generate FAQ** | Auto-generate FAQs per product |

### Verify installation

After activation:
1. Visit a product page on your store
2. Right-click → "View source"
3. Search for \`<script type="application/ld+json">\`
4. You should see the structured data

### Availability

| Plan | JSON-LD |
|------|---------|
| Free | ❌ |
| Starter | ✅ |
| Growth | ✅ |
| Scale | ✅ |`,
        },
      },
      {
        id: 'robots-sitemap',
        title: { fr: "Robots.txt & Sitemap", en: "Robots.txt & Sitemap" },
        content: {
          fr: `### Robots.txt pour les bots IA

Le fichier robots.txt contrôle quels bots peuvent explorer votre site. C'est crucial pour les crawlers IA.

#### Bots IA à autoriser

| Bot | Propriétaire | Importance |
|-----|--------------|------------|
| **GPTBot** | OpenAI (ChatGPT) | 🔴 Critique |
| **ClaudeBot** | Anthropic (Claude) | 🔴 Critique |
| **PerplexityBot** | Perplexity | 🟡 Important |
| **Google-Extended** | Google (Gemini) | 🟡 Important |
| **Bingbot** | Microsoft (Copilot) | 🟡 Important |

#### Comment configurer

1. Allez dans **Outils AEO → Robots.txt**
2. Cochez les bots que vous voulez autoriser
3. Cliquez sur **"Générer robots.txt"**
4. Copiez le code dans votre robots.txt Shopify

#### Exemple robots.txt optimisé AEO

\`\`\`
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /
\`\`\`

### Sitemap optimisé AEO

Le sitemap aide les crawlers à découvrir toutes vos pages.

#### Différence avec le sitemap standard

| Sitemap Standard | Sitemap AEO |
|------------------|-------------|
| Liste des URLs | URLs + contexte enrichi |
| Priorités génériques | Priorités basées sur Score IA |
| Fréquence standard | Fréquence optimisée |

#### Comment générer

1. Allez dans **Outils AEO → Sitemap**
2. Configurez les options (produits, collections, pages)
3. Cliquez sur **"Générer"**
4. Soumettez l'URL du sitemap aux moteurs de recherche`,
          en: `### Robots.txt for AI bots

The robots.txt file controls which bots can crawl your site. It's crucial for AI crawlers.

#### AI bots to allow

| Bot | Owner | Importance |
|-----|-------|------------|
| **GPTBot** | OpenAI (ChatGPT) | 🔴 Critical |
| **ClaudeBot** | Anthropic (Claude) | 🔴 Critical |
| **PerplexityBot** | Perplexity | 🟡 Important |
| **Google-Extended** | Google (Gemini) | 🟡 Important |
| **Bingbot** | Microsoft (Copilot) | 🟡 Important |

#### How to configure

1. Go to **AEO Tools → Robots.txt**
2. Check bots you want to allow
3. Click **"Generate robots.txt"**
4. Copy code to your Shopify robots.txt

#### Example AEO-optimized robots.txt

\`\`\`
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /
\`\`\`

### AEO-optimized Sitemap

The sitemap helps crawlers discover all your pages.

#### Difference from standard sitemap

| Standard Sitemap | AEO Sitemap |
|------------------|-------------|
| URL list | URLs + enriched context |
| Generic priorities | Priorities based on AI Score |
| Standard frequency | Optimized frequency |

#### How to generate

1. Go to **AEO Tools → Sitemap**
2. Configure options (products, collections, pages)
3. Click **"Generate"**
4. Submit sitemap URL to search engines`,
        },
      },
      {
        id: 'bulk-reports',
        title: { fr: "Optimisation en masse & Rapports", en: "Bulk Optimization & Reports" },
        content: {
          fr: `### Optimisation en masse

Optimisez plusieurs produits en une seule opération.

#### Cas d'usage

- Vous avez 50+ produits avec des alt-texts manquants
- Tous vos produits manquent de meta descriptions
- Vous voulez standardiser les tags

#### Comment utiliser

1. Allez dans **Outils AEO → Optimiseur en masse**
2. Sélectionnez le type d'optimisation :
   - Alt-text des images
   - Meta tags (title + description)
   - Tags produits
3. Filtrez les produits (tous, sans alt-text, score < 50...)
4. Cliquez sur **"Aperçu"** pour voir les changements proposés
5. Vérifiez et cliquez sur **"Appliquer à tous"**

#### Conseils

- Commencez par un **petit lot** (10 produits) pour vérifier la qualité
- Utilisez les **filtres** pour cibler les produits problématiques
- Vérifiez l'aperçu avant d'appliquer

### Rapports AEO

Exportez des rapports détaillés pour analyser ou partager.

#### Types de rapports

| Rapport | Contenu | Format |
|---------|---------|--------|
| **Audit complet** | Score IA, problèmes, recommandations | CSV, PDF |
| **Visibilité** | Historique des vérifications, taux | CSV |
| **Concurrents** | Comparatif de scores | CSV |
| **Progrès** | Évolution dans le temps | CSV, PDF |

#### Comment exporter

1. Allez dans **Outils AEO → Rapports**
2. Sélectionnez le type de rapport
3. Choisissez la période
4. Cliquez sur **"Exporter"**

#### Disponibilité

| Plan | Bulk Edit | Rapports |
|------|-----------|----------|
| Free | ❌ | ❌ |
| Starter | ✅ | ❌ |
| Growth | ✅ | ✅ |
| Scale | ✅ | ✅ |`,
          en: `### Bulk Optimization

Optimize multiple products in a single operation.

#### Use cases

- You have 50+ products with missing alt-texts
- All your products lack meta descriptions
- You want to standardize tags

#### How to use

1. Go to **AEO Tools → Bulk Optimizer**
2. Select optimization type:
   - Image alt-text
   - Meta tags (title + description)
   - Product tags
3. Filter products (all, no alt-text, score < 50...)
4. Click **"Preview"** to see proposed changes
5. Review and click **"Apply to all"**

#### Tips

- Start with a **small batch** (10 products) to verify quality
- Use **filters** to target problematic products
- Check preview before applying

### AEO Reports

Export detailed reports to analyze or share.

#### Report types

| Report | Content | Format |
|--------|---------|--------|
| **Full audit** | AI score, issues, recommendations | CSV, PDF |
| **Visibility** | Check history, rates | CSV |
| **Competitors** | Score comparison | CSV |
| **Progress** | Evolution over time | CSV, PDF |

#### How to export

1. Go to **AEO Tools → Reports**
2. Select report type
3. Choose period
4. Click **"Export"**

#### Availability

| Plan | Bulk Edit | Reports |
|------|-----------|---------|
| Free | ❌ | ❌ |
| Starter | ✅ | ❌ |
| Growth | ✅ | ✅ |
| Scale | ✅ | ✅ |`,
        },
      },
    ],
  },
  {
    id: 'best-practices',
    icon: '✨',
    articles: [
      {
        id: 'description-tips',
        title: { fr: 'Écrire des descriptions IA-friendly', en: 'Writing AI-friendly descriptions' },
        content: {
          fr: `### La règle d'or

Les IA comprennent mieux le texte **clair, structuré et informatif**. Oubliez le marketing flou.

### Structure idéale (4 parties)

\`\`\`
1. ACCROCHE (1 phrase)
   Résumé clair de ce qu'est le produit

2. CARACTÉRISTIQUES (liste à puces)
   • Caractéristique 1
   • Caractéristique 2
   • Caractéristique 3

3. CAS D'USAGE
   Pour qui ? Quand ? Comment l'utiliser ?

4. DIFFÉRENCIATEUR
   Ce qui rend ce produit unique
\`\`\`

### Exemple concret

❌ **Mauvais** :
*"Nos écouteurs sont incroyables ! Qualité premium, super son. Vous allez adorer ! Achetez maintenant !"*

Problèmes : Vague, pas de faits, pas de spécifications.

✅ **Bon** :
*"Les écouteurs SoundMax Pro sont des écouteurs Bluetooth 5.3 avec réduction de bruit active, conçus pour les professionnels et les audiophiles.*

*Caractéristiques :*
*• Autonomie : 30 heures (40h avec boîtier)*
*• Réduction de bruit active ANC jusqu'à -35dB*
*• Résistance IPX5 à l'eau et la transpiration*
*• Codec aptX HD pour qualité studio*

*Parfaits pour : trajets domicile-travail, sport, bureau en open space, voyages longue distance.*

*Ce qui distingue les SoundMax Pro : le seul casque de cette gamme de prix à offrir une certification Hi-Res Audio."*

### Longueur optimale

| Longueur | Score | Recommandation |
|----------|-------|----------------|
| < 50 mots | 🔴 | Trop court |
| 50-150 mots | 🟡 | Acceptable |
| 150-300 mots | 🟢 | Idéal |
| 300-500 mots | 🟢 | Très bien |
| > 500 mots | 🟡 | OK si pertinent |

### Mots à utiliser

**À inclure** :
- Spécifications techniques (dimensions, poids, matériaux)
- Chiffres précis (autonomie, capacité, puissance)
- Cas d'usage concrets
- Comparaisons factuelles

**À éviter** :
- "Incroyable", "Meilleur", "Unique" (sans preuve)
- Superlatifs vides
- Appels à l'action répétés
- Texte promotionnel excessif`,
          en: `### The golden rule

AIs understand text better when it's **clear, structured, and informative**. Forget vague marketing.

### Ideal structure (4 parts)

\`\`\`
1. HOOK (1 sentence)
   Clear summary of what the product is

2. FEATURES (bullet list)
   • Feature 1
   • Feature 2
   • Feature 3

3. USE CASES
   For whom? When? How to use it?

4. DIFFERENTIATOR
   What makes this product unique
\`\`\`

### Concrete example

❌ **Bad**:
*"Our headphones are amazing! Premium quality, great sound. You'll love them! Buy now!"*

Problems: Vague, no facts, no specifications.

✅ **Good**:
*"SoundMax Pro are Bluetooth 5.3 headphones with active noise cancellation, designed for professionals and audiophiles.*

*Features:*
*• Battery life: 30 hours (40h with case)*
*• Active noise cancellation ANC up to -35dB*
*• IPX5 water and sweat resistance*
*• aptX HD codec for studio quality*

*Perfect for: commuting, sports, open office, long-distance travel.*

*What sets SoundMax Pro apart: the only headphones in this price range with Hi-Res Audio certification."*

### Optimal length

| Length | Score | Recommendation |
|--------|-------|----------------|
| < 50 words | 🔴 | Too short |
| 50-150 words | 🟡 | Acceptable |
| 150-300 words | 🟢 | Ideal |
| 300-500 words | 🟢 | Very good |
| > 500 words | 🟡 | OK if relevant |

### Words to use

**Include**:
- Technical specs (dimensions, weight, materials)
- Precise numbers (battery life, capacity, power)
- Concrete use cases
- Factual comparisons

**Avoid**:
- "Amazing", "Best", "Unique" (without proof)
- Empty superlatives
- Repeated calls to action
- Excessive promotional text`,
        },
      },
      {
        id: 'images-alt',
        title: { fr: "Images et alt-text", en: "Images and alt-text" },
        content: {
          fr: `### Pourquoi les alt-texts sont importants pour l'AEO

Les IA ne "voient" pas les images. Elles lisent les alt-texts pour comprendre ce qui est montré.

### Format idéal d'un alt-text

\`[Type de produit] [Caractéristique principale] [Contexte/Usage]\`

### Exemples

| ❌ Mauvais | ✅ Bon |
|-----------|-------|
| "image1.jpg" | "Casque audio SoundMax Pro noir sur fond blanc" |
| "produit" | "Écouteurs sans fil dans leur boîtier de charge ouvert" |
| "photo casque" | "Personne portant le casque SoundMax Pro pendant un jogging" |

### Structure recommandée par image

**Image 1 (principale)** : Vue d'ensemble du produit
→ Alt : "[Nom produit] - vue de face sur fond [couleur]"

**Image 2** : Produit en usage
→ Alt : "[Nom produit] porté par [contexte d'utilisation]"

**Image 3** : Détail/accessoires
→ Alt : "Détail [partie] du [nom produit] montrant [caractéristique]"

**Image 4** : Packaging/contenu
→ Alt : "Contenu du coffret [nom produit] : [liste des éléments]"

### Conseils

1. **Soyez descriptif** : Décrivez ce qu'on voit réellement
2. **Incluez le nom du produit** : Toujours mentionner le nom
3. **Évitez le keyword stuffing** : Pas de liste de mots-clés
4. **60-125 caractères** : Longueur idéale

### Optimisation en masse

Utilisez l'**Optimiseur en masse** pour générer des alt-texts pour toutes vos images automatiquement :

1. Allez dans **Outils AEO → Optimiseur en masse**
2. Sélectionnez **"Alt-text des images"**
3. Filtrez sur "Images sans alt-text"
4. Générez et appliquez`,
          en: `### Why alt-texts matter for AEO

AIs don't "see" images. They read alt-texts to understand what's shown.

### Ideal alt-text format

\`[Product type] [Main feature] [Context/Usage]\`

### Examples

| ❌ Bad | ✅ Good |
|--------|---------|
| "image1.jpg" | "SoundMax Pro black headphones on white background" |
| "product" | "Wireless earbuds in open charging case" |
| "headphone photo" | "Person wearing SoundMax Pro headphones while jogging" |

### Recommended structure per image

**Image 1 (main)**: Product overview
→ Alt: "[Product name] - front view on [color] background"

**Image 2**: Product in use
→ Alt: "[Product name] worn by [usage context]"

**Image 3**: Detail/accessories
→ Alt: "Detail of [part] of [product name] showing [feature]"

**Image 4**: Packaging/contents
→ Alt: "[Product name] box contents: [list of items]"

### Tips

1. **Be descriptive**: Describe what's actually shown
2. **Include product name**: Always mention the name
3. **Avoid keyword stuffing**: No keyword lists
4. **60-125 characters**: Ideal length

### Bulk optimization

Use **Bulk Optimizer** to generate alt-texts for all images automatically:

1. Go to **AEO Tools → Bulk Optimizer**
2. Select **"Image alt-text"**
3. Filter on "Images without alt-text"
4. Generate and apply`,
        },
      },
      {
        id: 'weekly-routine',
        title: { fr: "Routine AEO hebdomadaire", en: "Weekly AEO routine" },
        content: {
          fr: `### Votre checklist AEO en 15 min/semaine

Suivez cette routine pour maintenir et améliorer votre visibilité IA.

### Lundi : Audit rapide (5 min)

1. ☐ Ouvrez le **Dashboard**
2. ☐ Vérifiez votre **Score IA global**
   - ↑ En hausse → Continuez ainsi
   - ↓ En baisse → Investiguer
3. ☐ Notez le nombre de produits **critiques**

### Mercredi : Optimisation (5 min)

1. ☐ Allez dans **Produits**
2. ☐ Filtrez par **"Score critique"**
3. ☐ Optimisez **2-3 produits** prioritaires
4. ☐ Appliquez les suggestions

### Vendredi : Vérification (5 min)

1. ☐ Allez dans **Visibilité**
2. ☐ Lancez **2 vérifications** avec des requêtes types
3. ☐ Notez votre **taux de mention**
4. ☐ Observez les **concurrents** mentionnés

### Mensuel : Revue complète (30 min)

| Tâche | Action |
|-------|--------|
| Rapport mensuel | Exportez le rapport d'audit |
| Analyse tendances | Comparez avec le mois précédent |
| Nouveaux produits | Vérifiez le score des nouveautés |
| Concurrents | Vérifiez si de nouveaux concurrents émergent |
| llms.txt | Vérifiez que le fichier est à jour |

### Indicateurs de succès

| Indicateur | Objectif mensuel |
|------------|------------------|
| Score IA moyen | +5 pts/mois |
| Produits critiques | -20%/mois |
| Taux de mention | +5%/mois |

### Astuce Pro

Créez un rappel récurrent dans votre calendrier :
- Lundi 9h : "Surfaced - Audit rapide"
- Mercredi 9h : "Surfaced - Optimisation"
- Vendredi 9h : "Surfaced - Vérification"`,
          en: `### Your AEO checklist in 15 min/week

Follow this routine to maintain and improve your AI visibility.

### Monday: Quick audit (5 min)

1. ☐ Open the **Dashboard**
2. ☐ Check your **global AI Score**
   - ↑ Rising → Keep it up
   - ↓ Falling → Investigate
3. ☐ Note the number of **critical** products

### Wednesday: Optimization (5 min)

1. ☐ Go to **Products**
2. ☐ Filter by **"Critical score"**
3. ☐ Optimize **2-3 priority products**
4. ☐ Apply suggestions

### Friday: Verification (5 min)

1. ☐ Go to **Visibility**
2. ☐ Run **2 checks** with typical queries
3. ☐ Note your **mention rate**
4. ☐ Observe **competitors** mentioned

### Monthly: Full review (30 min)

| Task | Action |
|------|--------|
| Monthly report | Export audit report |
| Trend analysis | Compare with previous month |
| New products | Check score of new items |
| Competitors | Check if new competitors emerge |
| llms.txt | Verify file is up to date |

### Success indicators

| Indicator | Monthly goal |
|-----------|--------------|
| Average AI score | +5 pts/month |
| Critical products | -20%/month |
| Mention rate | +5%/month |

### Pro tip

Create recurring reminders in your calendar:
- Monday 9am: "Surfaced - Quick audit"
- Wednesday 9am: "Surfaced - Optimization"
- Friday 9am: "Surfaced - Verification"`,
        },
      },
    ],
  },
  {
    id: 'plans',
    icon: '💳',
    articles: [
      {
        id: 'plan-comparison',
        title: { fr: 'Comparaison des plans', en: 'Plan comparison' },
        content: {
          fr: `### Vue d'ensemble

| Fonctionnalité | Free | Starter | Growth | Scale |
|----------------|------|---------|--------|-------|
| **Prix** | $0 | $29/mois | $79/mois | $149/mois |
| **Produits** | 10 | 100 | 500 | Illimité |
| **Vérifications/mois** | 3 | 10 | 50 | 200 |
| **Optimisations IA/mois** | 3 | 20 | 100 | 500 |
| **Concurrents** | 0 | 1 | 3 | 10 |

### Fonctionnalités par plan

| Fonctionnalité | Free | Starter | Growth | Scale |
|----------------|------|---------|--------|-------|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Audit IA | ✅ | ✅ | ✅ | ✅ |
| Optimiseur IA | ✅ | ✅ | ✅ | ✅ |
| llms.txt | ✅ | ✅ | ✅ | ✅ |
| Sitemap AEO | ✅ | ✅ | ✅ | ✅ |
| Robots.txt | ✅ | ✅ | ✅ | ✅ |
| JSON-LD | ❌ | ✅ | ✅ | ✅ |
| Qualité contenu | ❌ | ✅ | ✅ | ✅ |
| Bulk Optimizer | ❌ | ✅ | ✅ | ✅ |
| Tests A/B | ❌ | ❌ | ✅ | ✅ |
| Trafic IA | ❌ | ❌ | ✅ | ✅ |
| Rapports | ❌ | ❌ | ✅ | ✅ |
| API | ❌ | ❌ | ❌ | ✅ |
| Support prioritaire | ❌ | ❌ | ❌ | ✅ |

### Quel plan choisir ?

**Free** - Pour découvrir
- Vous voulez tester Surfaced
- Moins de 10 produits
- Budget : $0

**Starter** - Pour commencer
- Petite boutique (< 100 produits)
- Vous voulez des optimisations régulières
- Budget : $29/mois

**Growth** - Le plus populaire
- Boutique en croissance
- Vous voulez suivre vos concurrents
- Vous voulez des rapports et tests A/B
- Budget : $79/mois

**Scale** - Pour les pros
- Grand catalogue (500+ produits)
- Vous avez besoin de l'API
- Support prioritaire important
- Budget : $149/mois`,
          en: `### Overview

| Feature | Free | Starter | Growth | Scale |
|---------|------|---------|--------|-------|
| **Price** | $0 | $29/mo | $79/mo | $149/mo |
| **Products** | 10 | 100 | 500 | Unlimited |
| **Checks/month** | 3 | 10 | 50 | 200 |
| **AI optimizations/month** | 3 | 20 | 100 | 500 |
| **Competitors** | 0 | 1 | 3 | 10 |

### Features by plan

| Feature | Free | Starter | Growth | Scale |
|---------|------|---------|--------|-------|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| AI Audit | ✅ | ✅ | ✅ | ✅ |
| AI Optimizer | ✅ | ✅ | ✅ | ✅ |
| llms.txt | ✅ | ✅ | ✅ | ✅ |
| AEO Sitemap | ✅ | ✅ | ✅ | ✅ |
| Robots.txt | ✅ | ✅ | ✅ | ✅ |
| JSON-LD | ❌ | ✅ | ✅ | ✅ |
| Content quality | ❌ | ✅ | ✅ | ✅ |
| Bulk Optimizer | ❌ | ✅ | ✅ | ✅ |
| A/B Tests | ❌ | ❌ | ✅ | ✅ |
| AI Traffic | ❌ | ❌ | ✅ | ✅ |
| Reports | ❌ | ❌ | ✅ | ✅ |
| API | ❌ | ❌ | ❌ | ✅ |
| Priority support | ❌ | ❌ | ❌ | ✅ |

### Which plan to choose?

**Free** - To discover
- You want to test Surfaced
- Less than 10 products
- Budget: $0

**Starter** - To get started
- Small store (< 100 products)
- You want regular optimizations
- Budget: $29/month

**Growth** - Most popular
- Growing store
- You want to track competitors
- You want reports and A/B tests
- Budget: $79/month

**Scale** - For pros
- Large catalog (500+ products)
- You need API access
- Priority support important
- Budget: $149/month`,
        },
      },
      {
        id: 'api-access',
        title: { fr: "Accès API", en: "API Access" },
        content: {
          fr: `### Qu'est-ce que l'API Surfaced ?

L'API permet d'intégrer Surfaced dans vos propres outils et workflows.

### Disponibilité

L'API est disponible uniquement pour le plan **Scale** ($149/mois).

### Endpoints disponibles

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| \`/api/v1/audit\` | GET | Récupérer les résultats d'audit |
| \`/api/v1/audit\` | POST | Lancer un nouvel audit |
| \`/api/v1/products\` | GET | Liste des produits avec scores |
| \`/api/v1/visibility\` | POST | Lancer une vérification |
| \`/api/v1/visibility\` | GET | Historique des vérifications |

### Authentification

Utilisez votre clé API dans le header :

\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

Trouvez votre clé dans **Paramètres → API**.

### Exemple d'utilisation

\`\`\`javascript
// Récupérer l'audit
const response = await fetch('https://surfaced.app/api/v1/audit', {
  headers: {
    'Authorization': 'Bearer sk_live_xxxxx'
  }
});

const audit = await response.json();
console.log(audit.data.averageScore); // 72
\`\`\`

### Limites

| Plan | Requêtes/jour |
|------|---------------|
| Scale | 1000 |

### Cas d'usage

- Intégration dans votre tableau de bord interne
- Automatisation des audits
- Export de données vers d'autres outils
- Webhooks personnalisés`,
          en: `### What is the Surfaced API?

The API allows you to integrate Surfaced into your own tools and workflows.

### Availability

The API is only available for the **Scale** plan ($149/month).

### Available endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| \`/api/v1/audit\` | GET | Get audit results |
| \`/api/v1/audit\` | POST | Run new audit |
| \`/api/v1/products\` | GET | List products with scores |
| \`/api/v1/visibility\` | POST | Run visibility check |
| \`/api/v1/visibility\` | GET | Check history |

### Authentication

Use your API key in the header:

\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

Find your key in **Settings → API**.

### Usage example

\`\`\`javascript
// Get audit
const response = await fetch('https://surfaced.app/api/v1/audit', {
  headers: {
    'Authorization': 'Bearer sk_live_xxxxx'
  }
});

const audit = await response.json();
console.log(audit.data.averageScore); // 72
\`\`\`

### Limits

| Plan | Requests/day |
|------|--------------|
| Scale | 1000 |

### Use cases

- Integration into your internal dashboard
- Audit automation
- Data export to other tools
- Custom webhooks`,
        },
      },
      {
        id: 'billing-faq',
        title: { fr: 'Questions facturation', en: 'Billing FAQ' },
        content: {
          fr: `### Comment fonctionne la facturation ?

Surfaced utilise la **facturation Shopify**. Les frais apparaissent sur votre facture Shopify mensuelle, pas de facture séparée.

### Essai gratuit

Tous les plans payants incluent un **essai gratuit de 14 jours**. Vous n'êtes facturé qu'après.

### Changer de plan

**Upgrade (vers un plan supérieur)** :
- Immédiat
- Prorata calculé automatiquement
- Accès instantané aux nouvelles fonctionnalités

**Downgrade (vers un plan inférieur)** :
- Effectif à la fin du cycle de facturation
- Vous gardez l'accès jusqu'à la fin

### Annulation

Vous pouvez annuler à tout moment :
1. Allez dans **Paramètres**
2. Cliquez sur **"Gérer l'abonnement"**
3. Ou désinstallez l'app depuis l'admin Shopify

**Aucun engagement** - Annulez quand vous voulez.

### Remboursement

- Pendant l'essai gratuit : Aucun frais
- Après : Pas de remboursement au prorata
- Conseil : Downgrade avant la fin du cycle

### Questions fréquentes

**Q: Les frais sont-ils en plus de Shopify ?**
R: Oui, c'est un abonnement app séparé de votre abonnement Shopify.

**Q: Puis-je utiliser plusieurs boutiques ?**
R: Chaque boutique nécessite son propre abonnement.

**Q: Les prix vont-ils augmenter ?**
R: Les prix sont garantis pour les abonnés actuels.`,
          en: `### How does billing work?

Surfaced uses **Shopify billing**. Charges appear on your monthly Shopify invoice, no separate invoice.

### Free trial

All paid plans include a **14-day free trial**. You're only charged after.

### Changing plans

**Upgrade (to higher plan)**:
- Immediate
- Prorated automatically
- Instant access to new features

**Downgrade (to lower plan)**:
- Effective at end of billing cycle
- You keep access until then

### Cancellation

You can cancel anytime:
1. Go to **Settings**
2. Click **"Manage subscription"**
3. Or uninstall the app from Shopify admin

**No commitment** - Cancel anytime.

### Refund

- During free trial: No charges
- After: No prorated refunds
- Tip: Downgrade before cycle ends

### Frequently asked questions

**Q: Are charges on top of Shopify?**
A: Yes, it's a separate app subscription from your Shopify subscription.

**Q: Can I use multiple stores?**
A: Each store requires its own subscription.

**Q: Will prices increase?**
A: Prices are guaranteed for current subscribers.`,
        },
      },
    ],
  },
  {
    id: 'troubleshooting',
    icon: '🔧',
    articles: [
      {
        id: 'common-issues',
        title: { fr: 'Problèmes fréquents', en: 'Common issues' },
        content: {
          fr: `### "Mon score ne s'améliore pas"

**Causes possibles** :
1. Les IA mettent 1-4 semaines à indexer vos changements
2. Les modifications n'ont pas été appliquées à Shopify
3. D'autres problèmes critiques non résolus

**Solutions** :
- Vérifiez que les changements sont bien sur votre boutique
- Relancez un audit pour voir le nouveau score
- Corrigez les problèmes **critiques (rouges)** en priorité
- Attendez 2-4 semaines et relancez une vérification de visibilité

### "La vérification de visibilité échoue"

**Causes possibles** :
1. Vous avez atteint la limite de votre plan
2. La requête est trop vague
3. Problème temporaire avec l'API

**Solutions** :
- Vérifiez votre usage dans **Paramètres**
- Essayez une requête plus spécifique
- Réessayez dans quelques minutes

### "Je ne vois pas mes modifications"

**Causes possibles** :
1. Les changements n'ont pas été sauvegardés
2. Cache navigateur

**Solutions** :
- Vérifiez dans Shopify Admin que les changements sont là
- Rafraîchissez la page (Ctrl+F5)
- Déconnectez-vous et reconnectez-vous

### "L'optimisation ne génère rien"

**Causes possibles** :
1. Le produit n'a pas assez d'informations
2. Limite d'optimisations atteinte

**Solutions** :
- Ajoutez au moins un titre et une image au produit
- Vérifiez votre quota dans **Paramètres**

### "llms.txt ne fonctionne pas"

**Vérification** :
1. Visitez \`votreboutique.myshopify.com/llms.txt\`
2. Vous devriez voir le contenu du fichier

**Si erreur 404** :
- Réactivez llms.txt dans Surfaced
- Videz le cache de votre boutique`,
          en: `### "My score isn't improving"

**Possible causes**:
1. AIs take 1-4 weeks to index your changes
2. Changes weren't applied to Shopify
3. Other unresolved critical issues

**Solutions**:
- Verify changes are on your store
- Run a new audit to see new score
- Fix **critical (red)** issues first
- Wait 2-4 weeks and run a visibility check

### "Visibility check fails"

**Possible causes**:
1. You've reached your plan limit
2. Query is too vague
3. Temporary API issue

**Solutions**:
- Check your usage in **Settings**
- Try a more specific query
- Retry in a few minutes

### "I don't see my changes"

**Possible causes**:
1. Changes weren't saved
2. Browser cache

**Solutions**:
- Check in Shopify Admin that changes are there
- Refresh page (Ctrl+F5)
- Log out and log back in

### "Optimization generates nothing"

**Possible causes**:
1. Product doesn't have enough information
2. Optimization limit reached

**Solutions**:
- Add at least a title and image to product
- Check your quota in **Settings**

### "llms.txt doesn't work"

**Verification**:
1. Visit \`yourstore.myshopify.com/llms.txt\`
2. You should see file contents

**If 404 error**:
- Re-enable llms.txt in Surfaced
- Clear your store cache`,
        },
      },
      {
        id: 'contact-support',
        title: { fr: 'Contacter le support', en: 'Contact support' },
        content: {
          fr: `### Comment nous contacter

**Email** : support@surfaced.app

### Délais de réponse

| Plan | Délai |
|------|-------|
| Free | 48-72h |
| Starter | 48h |
| Growth | 24h |
| Scale | 4h (jours ouvrés) |

### Informations à fournir

Pour une résolution rapide, incluez :

1. **Votre domaine Shopify** : exemple.myshopify.com
2. **Votre plan** : Free/Starter/Growth/Scale
3. **Description du problème** : Ce qui se passe vs ce qui devrait se passer
4. **Étapes pour reproduire** : 1, 2, 3...
5. **Captures d'écran** : Si applicable

### Exemple de message efficace

*"Bonjour,*

*Boutique : maboutique.myshopify.com*
*Plan : Growth*

*Problème : Quand je clique sur "Générer suggestions" pour le produit XYZ, j'obtiens l'erreur "Limite atteinte" alors que mon compteur affiche 45/100 optimisations.*

*Étapes :*
*1. Aller dans Optimiser*
*2. Sélectionner le produit "Casque Audio Pro"*
*3. Cliquer sur Générer*

*Capture d'écran en pièce jointe.*

*Merci !"*

### Support en direct

Pour le plan **Scale**, un chat en direct est disponible dans l'app pendant les heures de bureau (9h-18h CET).`,
          en: `### How to contact us

**Email**: support@surfaced.app

### Response times

| Plan | Time |
|------|------|
| Free | 48-72h |
| Starter | 48h |
| Growth | 24h |
| Scale | 4h (business days) |

### Information to provide

For quick resolution, include:

1. **Your Shopify domain**: example.myshopify.com
2. **Your plan**: Free/Starter/Growth/Scale
3. **Problem description**: What happens vs what should happen
4. **Steps to reproduce**: 1, 2, 3...
5. **Screenshots**: If applicable

### Example of effective message

*"Hello,*

*Store: mystore.myshopify.com*
*Plan: Growth*

*Problem: When I click "Generate suggestions" for product XYZ, I get "Limit reached" error even though my counter shows 45/100 optimizations.*

*Steps:*
*1. Go to Optimize*
*2. Select product "Audio Pro Headphones"*
*3. Click Generate*

*Screenshot attached.*

*Thanks!"*

### Live support

For **Scale** plan, live chat is available in the app during business hours (9am-6pm CET).`,
        },
      },
    ],
  },
];

/**
 * Sanitize HTML entities in user content before markdown parsing
 * Only allows markdown syntax, escapes any raw HTML
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Simple markdown to HTML parser with sanitization
 * Escapes HTML before parsing markdown to prevent XSS
 */
function parseMarkdown(content: string): string {
  // First, escape any HTML in the content to prevent XSS
  let html = escapeHtml(content);

  // Normalize line endings
  html = html.replace(/\r\n/g, '\n');

  // Code blocks first (before other replacements)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto my-4 text-sm font-mono"><code>$2</code></pre>');

  // Headers (must be at start of line)
  html = html.replace(/^#### (.*$)/gm, '\n<h4 class="text-base font-semibold mt-5 mb-2 text-slate-800">$1</h4>\n');
  html = html.replace(/^### (.*$)/gm, '\n<h3 class="text-lg font-semibold mt-6 mb-3 text-slate-800">$1</h3>\n');
  html = html.replace(/^## (.*$)/gm, '\n<h2 class="text-xl font-bold mt-8 mb-4 text-slate-900">$1</h2>\n');

  // Bold and inline code
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono text-slate-800">$1</code>');

  // Checkboxes
  html = html.replace(/☐/g, '<span class="inline-block w-4 h-4 border border-slate-400 rounded mr-1 align-middle"></span>');
  html = html.replace(/☑/g, '<span class="inline-block w-4 h-4 bg-green-500 rounded mr-1 align-middle text-white text-xs text-center">✓</span>');

  // Tables - process before lists to avoid conflicts
  const tableRegex = /(\|.+\|\n)+/g;
  html = html.replace(tableRegex, (match) => {
    const rows = match.trim().split('\n');
    let tableHtml = '<table class="w-full border-collapse my-4 text-sm">';
    let isFirstRow = true;

    for (const row of rows) {
      const cells = row.split('|').filter(c => c.trim()).map(c => c.trim());
      // Skip separator rows (|---|---|)
      if (cells.every(c => /^-+$/.test(c))) continue;

      if (isFirstRow) {
        tableHtml += '<thead><tr class="bg-slate-50">';
        tableHtml += cells.map(c => `<th class="border border-slate-200 px-3 py-2 font-semibold text-left">${c}</th>`).join('');
        tableHtml += '</tr></thead><tbody>';
        isFirstRow = false;
      } else {
        tableHtml += '<tr>';
        tableHtml += cells.map(c => `<td class="border border-slate-200 px-3 py-2">${c}</td>`).join('');
        tableHtml += '</tr>';
      }
    }

    tableHtml += '</tbody></table>';
    return '\n' + tableHtml + '\n';
  });

  // Lists - process line by line to avoid nested issues
  const lines = html.split('\n');
  const processedLines: string[] = [];
  let inList = false;
  let listType: 'ul' | 'ol' | null = null;
  let listItems: string[] = [];

  const closeList = () => {
    if (listItems.length > 0) {
      const listClass = listType === 'ol' ? 'list-decimal' : 'list-disc';
      processedLines.push(`<${listType} class="${listClass} pl-6 my-3 space-y-1">`);
      processedLines.push(...listItems);
      processedLines.push(`</${listType}>`);
      listItems = [];
    }
    inList = false;
    listType = null;
  };

  for (const line of lines) {
    const ulMatch = line.match(/^- (.*)$/);
    const olMatch = line.match(/^(\d+)\. (.*)$/);

    if (ulMatch) {
      if (listType && listType !== 'ul') closeList();
      inList = true;
      listType = 'ul';
      listItems.push(`<li>${ulMatch[1]}</li>`);
    } else if (olMatch) {
      if (listType && listType !== 'ol') closeList();
      inList = true;
      listType = 'ol';
      listItems.push(`<li>${olMatch[2]}</li>`);
    } else {
      if (inList) closeList();
      processedLines.push(line);
    }
  }
  if (inList) closeList();

  html = processedLines.join('\n');

  // Paragraphs - split by double newlines, wrap non-HTML blocks
  const blocks = html.split(/\n\n+/);
  html = blocks.map(block => {
    const trimmed = block.trim();
    if (!trimmed) return '';
    // Don't wrap if already a block element
    if (/^<(h[1-6]|ul|ol|table|pre|div|blockquote)/.test(trimmed)) {
      return trimmed;
    }
    return `<p class="my-3 text-slate-600 leading-relaxed">${trimmed}</p>`;
  }).filter(Boolean).join('\n');

  // Clean up any remaining stray newlines
  html = html.replace(/\n+/g, '\n');
  html = html.replace(/<\/p>\n<p/g, '</p><p');

  return html;
}

// Logo component
const LogoIcon = () => (
  <svg viewBox="0 0 64 64" width="32" height="32" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="helpLogoGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#0EA5E9"/>
        <stop offset="100%" stopColor="#38BDF8"/>
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="14" fill="#0A1628"/>
    <path d="M10 46 Q20 38 32 38 Q44 38 54 46 Q44 30 32 30 Q20 30 10 46 Z" fill="url(#helpLogoGrad)" opacity="0.3"/>
    <path d="M8 40 Q18 28 32 28 Q46 28 56 40 Q46 20 32 20 Q18 20 8 40 Z" fill="url(#helpLogoGrad)" opacity="0.5"/>
    <path d="M6 34 Q16 18 32 18 Q48 18 58 34 Q48 12 32 12 Q16 12 6 34 Z" fill="url(#helpLogoGrad)"/>
    <circle cx="32" cy="16" r="4" fill="#38BDF8"/>
  </svg>
);

function HelpContent() {
  const { t, locale } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<string>('why-aeo');
  const [activeArticle, setActiveArticle] = useState<string>('what-is-aeo');
  const [searchQuery, setSearchQuery] = useState('');

  const currentCategory = helpCategories.find((c) => c.id === activeCategory);
  const currentArticle = currentCategory?.articles.find((a) => a.id === activeArticle);

  // Get category title/description from translations or fallback
  const getCategoryInfo = (id: string) => {
    const categoryNames: Record<string, { fr: string; en: string }> = {
      'why-aeo': { fr: 'Pourquoi l\'AEO ?', en: 'Why AEO?' },
      'getting-started': { fr: 'Démarrage', en: 'Getting Started' },
      'features': { fr: 'Fonctionnalités', en: 'Features' },
      'aeo-tools': { fr: 'Outils AEO', en: 'AEO Tools' },
      'best-practices': { fr: 'Bonnes pratiques', en: 'Best Practices' },
      'plans': { fr: 'Plans & Tarifs', en: 'Plans & Pricing' },
      'troubleshooting': { fr: 'Aide', en: 'Help' },
    };
    return { title: categoryNames[id]?.[locale] || id };
  };

  // Filter articles based on search
  const searchResults = searchQuery.length > 2
    ? helpCategories.flatMap((category) =>
        category.articles
          .filter(
            (article) =>
              article.title[locale].toLowerCase().includes(searchQuery.toLowerCase()) ||
              article.content[locale].toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((article) => ({ ...article, categoryId: category.id }))
      )
    : [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header - Clean and minimal */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <LogoIcon />
              <span className="text-xl font-bold" style={{ color: '#0A1628' }}>surfaced</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-600 font-medium">{t.help.title}</span>
            </Link>
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <a
                href="https://apps.shopify.com/surfaced"
                className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)' }}
              >
                {t.help.installApp}
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero - Focused and clean */}
      <section className="text-white py-16 px-4" style={{ background: 'linear-gradient(135deg, #0A1628 0%, #1E3A5F 50%, #0EA5E9 100%)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">{t.help.heroTitle}</h1>
          <p className="text-sky-100 mb-8">{t.help.heroSubtitle}</p>

          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <input
              type="text"
              placeholder={t.help.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-5 py-4 rounded-xl text-slate-900 placeholder-slate-400 shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
            <svg
              className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 max-h-80 overflow-auto z-10">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => {
                      setActiveCategory(result.categoryId);
                      setActiveArticle(result.id);
                      setSearchQuery('');
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100 last:border-0"
                  >
                    <div className="text-sm font-medium text-slate-900">{result.title[locale]}</div>
                    <div className="text-xs text-slate-500">{getCategoryInfo(result.categoryId).title}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Category Pills - Simplified */}
      <section className="py-6 px-4 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-2 justify-center">
            {helpCategories.map((category) => {
              const info = getCategoryInfo(category.id);
              return (
                <button
                  key={category.id}
                  onClick={() => {
                    setActiveCategory(category.id);
                    setActiveArticle(category.articles[0]?.id || '');
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                    activeCategory === category.id
                      ? 'text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  style={activeCategory === category.id ? { background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)' } : {}}
                >
                  <span>{category.icon}</span>
                  {info.title}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-slate-200 p-4 sticky top-24">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <span>{currentCategory?.icon}</span>
                  {currentCategory && getCategoryInfo(currentCategory.id).title}
                </h3>
                <nav className="space-y-1">
                  {currentCategory?.articles.map((article) => (
                    <button
                      key={article.id}
                      onClick={() => setActiveArticle(article.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        activeArticle === article.id
                          ? 'bg-sky-50 text-sky-700 font-medium border-l-2 border-sky-500'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {article.title[locale]}
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Article Content */}
            <main className="lg:col-span-3">
              <div className="bg-white rounded-xl border border-slate-200 p-8">
                {currentArticle && (
                  <>
                    <h1 className="text-3xl font-bold text-slate-900 mb-8">{currentArticle.title[locale]}</h1>
                    <div
                      className="help-content text-base"
                      dangerouslySetInnerHTML={{
                        __html: parseMarkdown(currentArticle.content[locale]),
                      }}
                    />
                  </>
                )}
              </div>

              {/* Feedback */}
              <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6 text-center">
                <p className="text-slate-600 mb-4">{t.help.wasHelpful}</p>
                <div className="flex justify-center gap-3">
                  <button className="px-5 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium">
                    {t.help.yes}
                  </button>
                  <button className="px-5 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium">
                    {t.help.no}
                  </button>
                </div>
              </div>

              {/* Contact Support */}
              <div className="mt-6 rounded-xl p-8 text-white text-center" style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)' }}>
                <h3 className="text-xl font-bold mb-2">{t.help.needMoreHelp}</h3>
                <p className="text-sky-100 mb-4">{t.help.teamHere}</p>
                <a
                  href="mailto:support@surfaced.app"
                  className="inline-block px-6 py-3 bg-white text-sky-600 font-semibold rounded-lg hover:bg-sky-50 transition-colors"
                >
                  {t.help.contactSupport}
                </a>
              </div>
            </main>
          </div>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer className="bg-white border-t border-slate-200 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Surfaced. {t.footer.copyright}
          </p>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link href="/" className="hover:text-sky-600 transition-colors">{t.help.home}</Link>
            <Link href="/privacy" className="hover:text-sky-600 transition-colors">{t.help.privacy}</Link>
            <Link href="/terms" className="hover:text-sky-600 transition-colors">{t.help.terms}</Link>
            <a href="mailto:support@surfaced.app" className="hover:text-sky-600 transition-colors">{t.help.support}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function HelpPage() {
  return (
    <LanguageProvider>
      <HelpContent />
    </LanguageProvider>
  );
}
