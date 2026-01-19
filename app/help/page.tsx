'use client';

import { useState } from 'react';
import Link from 'next/link';

type HelpCategory = {
  id: string;
  title: string;
  icon: string;
  description: string;
  articles: HelpArticle[];
};

type HelpArticle = {
  id: string;
  title: string;
  content: string;
};

const helpCategories: HelpCategory[] = [
  {
    id: 'getting-started',
    title: 'Prise en main',
    icon: '🚀',
    description: 'Commencez avec Surfaced en quelques minutes',
    articles: [
      {
        id: 'what-is-surfaced',
        title: "Qu'est-ce que Surfaced ?",
        content: `
**Surfaced** est la première application Shopify dédiée à l'**AEO (AI Engine Optimization)** - l'optimisation pour les moteurs IA.

### Le problème que nous résolvons

De plus en plus d'acheteurs utilisent ChatGPT, Claude, Perplexity et d'autres assistants IA pour trouver des produits à acheter. Si votre boutique n'est pas optimisée pour ces IA, vos produits restent invisibles à ces clients potentiels.

### Ce que fait Surfaced

1. **Analyse** votre catalogue et attribue un score IA à chaque produit
2. **Identifie** les problèmes qui empêchent les IA de recommander vos produits
3. **Optimise** automatiquement vos descriptions, titres et tags
4. **Vérifie** si votre marque apparaît dans les réponses des assistants IA
5. **Suit** votre progression et celle de vos concurrents

### Le résultat

Plus de visibilité sur les assistants IA = plus de trafic organique gratuit = plus de ventes.
        `,
      },
      {
        id: 'first-steps',
        title: 'Premiers pas après installation',
        content: `
### 1. Lancez votre première analyse

Après installation, cliquez sur **"Analyser ma boutique"** sur le tableau de bord. Surfaced va scanner tous vos produits et leur attribuer un score IA de 0 à 100.

### 2. Consultez votre score global

Votre **Score IA global** apparaît sur le tableau de bord. Il représente la moyenne de vos produits et indique à quel point votre boutique est "visible" pour les assistants IA.

- **80-100** : Excellent - Vos produits sont bien optimisés
- **60-79** : Bon - Quelques améliorations possibles
- **40-59** : Moyen - Optimisations recommandées
- **0-39** : Faible - Actions urgentes nécessaires

### 3. Identifiez les produits prioritaires

Allez dans **Produits** pour voir le score de chaque produit. Concentrez-vous d'abord sur :
- Les produits avec des **problèmes critiques** (pas d'image, pas de description)
- Vos **best-sellers** - maximisez leur visibilité IA

### 4. Lancez une vérification de visibilité

Dans **Visibilité**, lancez votre première vérification pour voir si ChatGPT & co. mentionnent déjà votre marque.

### 5. Optimisez vos premiers produits

Utilisez l'**Optimiseur IA** pour améliorer automatiquement vos descriptions. L'IA génère du contenu optimisé que vous pouvez appliquer en un clic.
        `,
      },
      {
        id: 'understanding-score',
        title: 'Comprendre le Score IA',
        content: `
### Comment est calculé le Score IA ?

Le Score IA (0-100) mesure la probabilité qu'un assistant IA recommande votre produit. Il analyse 15+ facteurs :

#### Facteurs Critiques (40% du score)
- **Présence de description** : Les IA ne peuvent pas recommander ce qu'elles ne comprennent pas
- **Présence d'images** : Signal de qualité et de professionnalisme
- **Longueur de description** : Minimum 150 mots recommandés

#### Facteurs Importants (35% du score)
- **Métadonnées SEO** : Titre et description SEO personnalisés
- **Catégorisation** : Type de produit défini
- **Tags** : Mots-clés pertinents

#### Facteurs Bonus (25% du score)
- **Alt-text des images** : Descriptions accessibles
- **Prix défini** : Information cruciale pour les recommandations
- **Variantes documentées** : Options claires
- **Données structurées** : JSON-LD

### Interprétation des problèmes

| Niveau | Signification |
|--------|---------------|
| 🔴 Critique | Bloque les recommandations IA |
| 🟡 Avertissement | Réduit vos chances |
| 🔵 Info | Amélioration optionnelle |
        `,
      },
    ],
  },
  {
    id: 'features',
    title: 'Fonctionnalités',
    icon: '⚡',
    description: 'Guide détaillé de chaque fonctionnalité',
    articles: [
      {
        id: 'ai-optimizer',
        title: "Optimiseur IA",
        content: `
### Qu'est-ce que l'Optimiseur IA ?

L'Optimiseur IA utilise l'intelligence artificielle pour générer automatiquement des descriptions, titres et tags optimisés pour vos produits.

### Comment l'utiliser

1. Allez dans **Optimiser** depuis le tableau de bord
2. Sélectionnez un produit à optimiser
3. Choisissez ce que vous voulez optimiser :
   - Description complète
   - Titre SEO
   - Meta description
   - Tags
4. Cliquez sur **Générer**
5. Prévisualisez le résultat
6. Cliquez sur **Appliquer** pour mettre à jour Shopify

### Conseils pour de meilleurs résultats

- Assurez-vous que votre produit a au moins un titre et une image
- Plus vous avez d'informations (prix, variantes), meilleur sera le résultat
- Personnalisez le texte généré si nécessaire - l'IA est un point de départ

### Limites par plan

| Plan | Optimisations/mois |
|------|-------------------|
| Gratuit | 0 |
| Starter | 10 |
| Pro | 50 |
| Business | Illimité |
        `,
      },
      {
        id: 'visibility-check',
        title: 'Vérification de Visibilité',
        content: `
### Comment fonctionne la vérification de visibilité ?

Surfaced interroge réellement les assistants IA avec des requêtes liées à votre industrie pour voir si votre marque est mentionnée.

### Plateformes vérifiées

- **ChatGPT** (OpenAI) - 200M+ utilisateurs
- **Claude** (Anthropic) - 50M+ utilisateurs
- **Perplexity** - 10M+ utilisateurs
- **Google Gemini** - 100M+ utilisateurs
- **Microsoft Copilot** - 50M+ utilisateurs

### Ce que vous obtenez

- **Taux de mention** : % de fois où vous êtes cité
- **Position** : Où vous apparaissez dans la réponse
- **Contexte** : Comment vous êtes mentionné
- **Concurrents détectés** : Qui d'autre est cité

### Lancer une vérification

1. Allez dans **Visibilité**
2. Entrez une requête de recherche (ex: "meilleurs écouteurs sport")
3. Sélectionnez les plateformes à vérifier
4. Cliquez sur **Vérifier**

### Fréquence recommandée

- **Hebdomadaire** : Suivre votre progression
- **Après optimisations** : Valider l'impact
- **Mensuelle minimum** : Avoir des données de tendance
        `,
      },
      {
        id: 'competitor-tracking',
        title: 'Suivi des Concurrents',
        content: `
### Pourquoi suivre vos concurrents ?

Comprendre comment vos concurrents apparaissent dans les recommandations IA vous aide à identifier des opportunités et à ajuster votre stratégie.

### Ajouter un concurrent

1. Allez dans **Concurrents**
2. Cliquez sur **Ajouter un concurrent**
3. Entrez leur nom de marque et/ou domaine
4. Surfaced commencera à suivre leur visibilité IA

### Ce que vous voyez

- **Taux de mention comparé** : Vous vs. concurrent
- **Tendances** : Évolution sur 30/60/90 jours
- **Alertes** : Notification si un concurrent vous dépasse
- **Requêtes communes** : Où vous êtes en compétition

### Limites par plan

| Plan | Concurrents |
|------|-------------|
| Gratuit | 0 |
| Starter | 0 |
| Pro | 3 |
| Business | 10 |
        `,
      },
      {
        id: 'llms-txt',
        title: 'Générateur llms.txt',
        content: `
### Qu'est-ce que llms.txt ?

Le fichier **llms.txt** est un standard émergent (comme robots.txt pour Google) qui indique aux IA comment comprendre et présenter votre site.

### Pourquoi c'est important

- Donne aux IA un **résumé structuré** de votre boutique
- Indique vos **produits phares** et **différenciateurs**
- Aide les IA à **mieux vous représenter**

### Contenu généré

\`\`\`
# Nom de votre boutique
> Votre slogan ou proposition de valeur

## À propos
Description de votre entreprise et positionnement unique.

## Produits populaires
- Produit 1 : Description courte
- Produit 2 : Description courte
- Produit 3 : Description courte

## Catégories
- Mode, Accessoires, Chaussures...

## Contact
- Site : votreboutique.com
- Email : contact@votreboutique.com
\`\`\`

### Comment l'utiliser

1. Allez dans **Outils IA** depuis le tableau de bord
2. Sélectionnez **Fichier llms.txt**
3. Choisissez quelles IA peuvent vous recommander
4. Cliquez sur **Générer mon fichier llms.txt**
5. Téléchargez et installez dans votre thème Shopify
        `,
      },
      {
        id: 'json-ld',
        title: 'Schémas JSON-LD',
        content: `
### Qu'est-ce que JSON-LD ?

JSON-LD est un format de **données structurées** qui aide les moteurs de recherche ET les IA à comprendre vos produits de manière précise.

### Avantages

- **Rich snippets Google** : Étoiles, prix, disponibilité dans les résultats
- **Compréhension IA** : Les IA extraient facilement les informations
- **SEO amélioré** : Google valorise les données structurées

### Schémas générés

- **Product** : Informations complètes du produit
- **Offer** : Prix, disponibilité, devises
- **AggregateRating** : Notes et avis
- **Brand** : Informations de marque
- **Organization** : Votre entreprise

### Comment les installer

1. Allez dans **Outils IA** depuis le tableau de bord
2. Sélectionnez **Schémas JSON-LD**
3. Choisissez ce que vous voulez afficher dans Google
4. Cliquez sur **Générer mes schémas JSON-LD**
5. Copiez le code et collez-le dans theme.liquid avant &lt;/head&gt;

Testez ensuite sur le **Google Rich Results Test** pour vérifier que tout fonctionne.
        `,
      },
      {
        id: 'ab-testing',
        title: 'Tests A/B de Contenu',
        content: `
### Pourquoi faire des tests A/B ?

Testez différentes versions de vos descriptions pour voir laquelle génère le plus de mentions IA.

### Comment ça marche

1. Sélectionnez un produit
2. Créez 2 variations de description (A et B)
3. Surfaced teste les deux avec les IA
4. Après suffisamment de données, vous voyez le gagnant
5. Appliquez la meilleure version

### Exemple de test

**Version A** : "Écouteurs sans fil avec réduction de bruit active"

**Version B** : "Écouteurs Bluetooth premium - 30h d'autonomie - Réduction de bruit ANC - Parfaits pour le sport et les trajets"

La version B sera probablement mieux comprise par les IA car plus détaillée.

### Bonnes pratiques

- Testez **une variable à la fois**
- Laissez le test tourner **au moins 2 semaines**
- Utilisez les résultats pour optimiser **tous** vos produits similaires
        `,
      },
    ],
  },
  {
    id: 'best-practices',
    title: 'Bonnes Pratiques',
    icon: '✨',
    description: 'Conseils pour maximiser votre visibilité IA',
    articles: [
      {
        id: 'description-tips',
        title: 'Écrire des descriptions IA-friendly',
        content: `
### Principes clés

Les IA comprennent mieux le texte qui est **clair, structuré et informatif**.

### La structure idéale

\`\`\`
[Accroche - 1 phrase qui résume le produit]

[Caractéristiques principales - liste à puces]
• Caractéristique 1
• Caractéristique 2
• Caractéristique 3

[Cas d'usage - quand/comment utiliser]

[Spécifications techniques si applicable]

[Ce qui différencie ce produit]
\`\`\`

### Exemple concret

❌ **Mauvais** :
"Super écouteurs. Très bien. Achetez-les !"

✅ **Bon** :
"Les écouteurs SoundMax Pro offrent une expérience audio immersive avec réduction de bruit active ANC.

• 30 heures d'autonomie
• Bluetooth 5.3 pour connexion stable
• Résistance IPX5 à l'eau et la sueur
• Coussinets mémoire de forme ultra-confortables

Parfaits pour : trajets quotidiens, séances de sport, travail au bureau, voyages en avion.

Ce qui les distingue : algorithme de réduction de bruit adaptatif qui s'ajuste automatiquement à votre environnement."

### Longueur recommandée

- **Minimum** : 150 mots
- **Idéal** : 200-400 mots
- **Maximum utile** : 600 mots
        `,
      },
      {
        id: 'keywords-strategy',
        title: 'Stratégie de mots-clés',
        content: `
### Pourquoi les mots-clés comptent pour l'IA

Les IA utilisent les mots-clés pour **matcher** votre produit avec les requêtes des utilisateurs. Si quelqu'un demande "écouteurs sport waterproof", votre produit doit contenir ces termes.

### Types de mots-clés à inclure

#### 1. Mots-clés produit
- Nom du type de produit
- Catégorie
- Sous-catégorie

#### 2. Mots-clés attributs
- Matériaux (coton, cuir, acier...)
- Couleurs
- Tailles
- Caractéristiques (waterproof, rechargeable...)

#### 3. Mots-clés usage
- Occasions (mariage, sport, bureau...)
- Pour qui (homme, femme, enfant, pro...)
- Saisonnalité (été, hiver, Noël...)

#### 4. Mots-clés problème/solution
- Le problème que résout le produit
- Les bénéfices

### Où placer les mots-clés

1. **Titre du produit** : Les plus importants
2. **Description** : Naturellement dans le texte
3. **Tags Shopify** : Tous les pertinents
4. **Alt-text images** : Descriptif avec mots-clés
5. **Meta description** : Résumé avec termes clés
        `,
      },
      {
        id: 'images-optimization',
        title: 'Optimiser les images pour l\'IA',
        content: `
### Pourquoi les images comptent

Bien que les IA textuelles ne "voient" pas vos images, elles utilisent les **métadonnées** et **alt-texts** pour comprendre le contexte visuel.

### Alt-text : la clé

L'alt-text (texte alternatif) décrit l'image. C'est ce que les IA lisent.

❌ **Mauvais** : "image1.jpg" ou "produit"

✅ **Bon** : "Écouteurs sans fil SoundMax Pro noirs portés par un homme faisant du jogging"

### Comment écrire un bon alt-text

1. **Décrivez ce que montre l'image**
2. **Incluez le nom du produit**
3. **Ajoutez le contexte d'usage**
4. **Mentionnez les couleurs/variantes**

### Nommage des fichiers

Renommez vos fichiers avant upload :
- ❌ IMG_4523.jpg
- ✅ ecouteurs-soundmax-pro-noir-sport.jpg

### Nombre d'images recommandé

- **Minimum** : 3 images par produit
- **Idéal** : 5-8 images (différents angles, contextes)
- Incluez des images "lifestyle" (produit en situation)
        `,
      },
    ],
  },
  {
    id: 'plans',
    title: 'Plans & Facturation',
    icon: '💳',
    description: 'Tout sur les plans et la facturation',
    articles: [
      {
        id: 'plan-comparison',
        title: 'Comparaison des plans',
        content: `
### Vue d'ensemble

| Fonctionnalité | Free Trial | Starter | Growth | Scale |
|----------------|------------|---------|--------|-------|
| Prix | 0$ | 49$/mois | 99$/mois | 199$/mois |
| Produits analysés | 10 | 100 | 500 | Illimité |
| Vérifications visibilité | 3/mois | 10/mois | 50/mois | 200/mois |
| Optimisations IA | 3/mois | 20/mois | 100/mois | 500/mois |
| Concurrents | 0 | 1 | 3 | 10 |
| llms.txt | ✅ | ✅ | ✅ | ✅ |
| JSON-LD | ❌ | ✅ | ✅ | ✅ |
| Tests A/B | ❌ | ❌ | ✅ | ✅ |
| Export CSV | ❌ | ❌ | ✅ | ✅ |
| Historique | 7 jours | 30 jours | 90 jours | 1 an |
| API | ❌ | ❌ | ❌ | ✅ |
| Support | Email | Email | Email | Priorité |

### Quel plan choisir ?

**Free Trial** : Parfait pour découvrir Surfaced et comprendre votre score IA.

**Starter** : Pour les petites boutiques (<100 produits) qui veulent commencer à optimiser.

**Growth** : Notre plan le plus populaire. Pour les boutiques sérieuses qui veulent des résultats.

**Scale** : Pour les catalogues importants avec accès API et support prioritaire.
        `,
      },
      {
        id: 'billing-faq',
        title: 'Questions facturation',
        content: `
### Comment fonctionne la facturation ?

Surfaced utilise la facturation Shopify. Les frais apparaissent sur votre facture Shopify mensuelle.

### Puis-je changer de plan ?

Oui, à tout moment :
- **Upgrade** : Immédiat, prorata calculé
- **Downgrade** : Effectif à la fin du cycle

### Y a-t-il un essai gratuit ?

Oui ! Tous les plans payants ont un **essai gratuit de 7 jours**. Vous ne serez pas facturé si vous annulez avant.

### Que se passe-t-il si j'atteins ma limite ?

Vous recevez une notification. Vous pouvez :
- Attendre le prochain cycle (renouvellement mensuel)
- Upgrader pour avoir plus de crédits immédiatement

### Comment annuler ?

1. Allez dans **Paramètres** de l'app
2. Cliquez sur **Gérer l'abonnement**
3. Ou désinstallez l'app depuis l'admin Shopify

Aucun engagement, annulez quand vous voulez.
        `,
      },
    ],
  },
  {
    id: 'api',
    title: 'API Publique',
    icon: '🔌',
    description: 'Documentation de l\'API pour développeurs',
    articles: [
      {
        id: 'api-overview',
        title: "Vue d'ensemble de l'API",
        content: `
### Introduction

L'API Surfaced vous permet d'accéder programmatiquement à vos données d'audit, de visibilité et de produits.

**Disponible sur** : Plan Business uniquement

### Base URL

\`\`\`
https://app.surfaced.app/api/v1
\`\`\`

### Authentification

Utilisez une clé API dans le header :

\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

### Obtenir une clé API

1. Allez dans **Paramètres > API**
2. Cliquez sur **Générer une clé**
3. Copiez et stockez la clé en sécurité (elle ne sera plus affichée)

### Rate Limits

- **100 requêtes/minute** par clé API
- Headers retournés : \`X-RateLimit-Limit\`, \`X-RateLimit-Remaining\`
        `,
      },
      {
        id: 'api-endpoints',
        title: 'Endpoints disponibles',
        content: `
### GET /audit

Récupère les résultats d'audit de votre boutique.

\`\`\`bash
curl -H "Authorization: Bearer YOUR_KEY" \\
  https://app.surfaced.app/api/v1/audit
\`\`\`

**Réponse** :
\`\`\`json
{
  "success": true,
  "data": {
    "shop": {
      "aiScore": 72,
      "productsCount": 150,
      "lastAuditAt": "2024-01-15T10:30:00Z"
    },
    "issues": {
      "critical": 3,
      "warning": 12,
      "info": 25
    }
  }
}
\`\`\`

### GET /products

Liste vos produits avec leurs scores.

**Paramètres** :
- \`page\` (default: 1)
- \`limit\` (default: 50, max: 100)
- \`sort\` : \`score_asc\`, \`score_desc\`, \`updated_desc\`
- \`minScore\` / \`maxScore\` : Filtrer par score

### GET /visibility

Récupère l'historique des vérifications de visibilité.

**Paramètres** :
- \`platform\` : \`chatgpt\`, \`claude\`, \`perplexity\`, \`gemini\`, \`copilot\`
- \`days\` (default: 30)

### POST /visibility/check

Lance une nouvelle vérification de visibilité.

\`\`\`json
{
  "query": "meilleurs écouteurs sport",
  "platforms": ["chatgpt", "claude"]
}
\`\`\`
        `,
      },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Dépannage',
    icon: '🔧',
    description: 'Solutions aux problèmes courants',
    articles: [
      {
        id: 'common-issues',
        title: 'Problèmes fréquents',
        content: `
### "Mon score ne s'améliore pas"

**Causes possibles** :
1. Les optimisations n'ont pas encore été indexées par les IA (1-4 semaines)
2. Les changements n'ont pas été appliqués à Shopify
3. D'autres problèmes non résolus compensent les améliorations

**Solution** :
- Vérifiez que vos modifications sont bien visibles sur votre boutique
- Relancez une analyse pour recalculer le score
- Concentrez-vous sur les problèmes critiques d'abord

### "La vérification de visibilité échoue"

**Causes possibles** :
1. Limite de plan atteinte
2. Requête trop vague ou hors sujet
3. Problème temporaire avec l'API d'un assistant IA

**Solution** :
- Vérifiez votre usage dans Paramètres
- Essayez une requête plus spécifique
- Réessayez plus tard

### "Mes produits ne sont pas analysés"

**Causes possibles** :
1. Limite de produits du plan atteinte
2. Produits en brouillon (non publiés)
3. Analyse en cours

**Solution** :
- Vérifiez votre limite dans Paramètres
- Publiez vos produits dans Shopify
- Attendez la fin de l'analyse en cours
        `,
      },
      {
        id: 'contact-support',
        title: 'Contacter le support',
        content: `
### Comment nous contacter

**Email** : support@surfaced.app

**Délai de réponse** :
- Plan gratuit/Starter : 48-72h
- Plan Pro : 24h
- Plan Business : 4h (jours ouvrés)

### Informations à fournir

Pour une résolution rapide, incluez :

1. **Votre domaine Shopify** : exemple.myshopify.com
2. **Votre plan** : Gratuit/Starter/Pro/Business
3. **Description du problème** : Ce que vous essayez de faire
4. **Captures d'écran** : Si applicable
5. **Étapes pour reproduire** : Comment arriver au problème

### Ressources avant de contacter

- Consultez cette documentation
- Vérifiez la [page status](https://status.surfaced.app)
- Rejoignez notre communauté pour des conseils
        `,
      },
    ],
  },
];

export default function HelpPage() {
  const [activeCategory, setActiveCategory] = useState<string>('getting-started');
  const [activeArticle, setActiveArticle] = useState<string>('what-is-surfaced');
  const [searchQuery, setSearchQuery] = useState('');

  const currentCategory = helpCategories.find((c) => c.id === activeCategory);
  const currentArticle = currentCategory?.articles.find((a) => a.id === activeArticle);

  // Filter articles based on search
  const searchResults = searchQuery.length > 2
    ? helpCategories.flatMap((category) =>
        category.articles
          .filter(
            (article) =>
              article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              article.content.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((article) => ({ ...article, categoryId: category.id, categoryTitle: category.title }))
      )
    : [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-bold text-slate-900">Surfaced</span>
              <span className="text-slate-400 mx-2">/</span>
              <span className="text-slate-600">Centre d&apos;aide</span>
            </Link>
            <a
              href="https://apps.shopify.com/surfaced"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Installer l&apos;app
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Comment pouvons-nous vous aider ?</h1>
          <p className="text-indigo-100 mb-8">
            Guides, tutoriels et réponses à vos questions sur Surfaced
          </p>

          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <input
              type="text"
              placeholder="Rechercher dans l'aide..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-5 py-4 rounded-xl text-slate-900 placeholder-slate-400 shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
            />
            <svg
              className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 max-h-96 overflow-auto z-10">
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
                    <div className="text-sm font-medium text-slate-900">{result.title}</div>
                    <div className="text-xs text-slate-500">{result.categoryTitle}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Category Pills */}
      <section className="py-8 px-4 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-3 justify-center">
            {helpCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setActiveCategory(category.id);
                  setActiveArticle(category.articles[0]?.id || '');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === category.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{category.icon}</span>
                {category.title}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-slate-200 p-4 sticky top-24">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <span>{currentCategory?.icon}</span>
                  {currentCategory?.title}
                </h3>
                <nav className="space-y-1">
                  {currentCategory?.articles.map((article) => (
                    <button
                      key={article.id}
                      onClick={() => setActiveArticle(article.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeArticle === article.id
                          ? 'bg-indigo-50 text-indigo-700 font-medium'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {article.title}
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
                    <h1 className="text-3xl font-bold text-slate-900 mb-6">{currentArticle.title}</h1>
                    <div
                      className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-a:text-indigo-600 prose-code:bg-slate-100 prose-code:px-1 prose-code:rounded prose-pre:bg-slate-900 prose-pre:text-slate-100"
                      dangerouslySetInnerHTML={{
                        __html: currentArticle.content
                          .replace(/\n/g, '<br>')
                          .replace(/### (.*)/g, '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>')
                          .replace(/## (.*)/g, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>')
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/`([^`]+)`/g, '<code>$1</code>')
                          .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="p-4 rounded-lg overflow-x-auto"><code>$2</code></pre>')
                          .replace(/- (.*)/g, '<li>$1</li>')
                          .replace(/(<li>.*<\/li>)/g, '<ul class="list-disc pl-6 my-2">$1</ul>')
                          .replace(/<\/ul><br><ul[^>]*>/g, '')
                          .replace(/\| (.*) \|/g, (match) => {
                            const cells = match.split('|').filter(Boolean).map((c) => c.trim());
                            return `<tr>${cells.map((c) => `<td class="border px-3 py-2">${c}</td>`).join('')}</tr>`;
                          }),
                      }}
                    />
                  </>
                )}
              </div>

              {/* Was this helpful */}
              <div className="mt-8 bg-white rounded-xl border border-slate-200 p-6 text-center">
                <p className="text-slate-600 mb-4">Cet article vous a-t-il aidé ?</p>
                <div className="flex justify-center gap-4">
                  <button className="px-6 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
                    👍 Oui
                  </button>
                  <button className="px-6 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
                    👎 Non
                  </button>
                </div>
              </div>

              {/* Contact Support */}
              <div className="mt-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white text-center">
                <h3 className="text-xl font-bold mb-2">Besoin d&apos;aide supplémentaire ?</h3>
                <p className="text-indigo-100 mb-4">Notre équipe est là pour vous aider</p>
                <a
                  href="mailto:support@surfaced.app"
                  className="inline-block px-6 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  Contacter le support
                </a>
              </div>
            </main>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Surfaced. Tous droits réservés.
          </p>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link href="/" className="hover:text-indigo-600">Accueil</Link>
            <Link href="/privacy" className="hover:text-indigo-600">Confidentialité</Link>
            <Link href="/terms" className="hover:text-indigo-600">Conditions</Link>
            <a href="mailto:support@surfaced.app" className="hover:text-indigo-600">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
