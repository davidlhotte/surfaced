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
    id: 'getting-started',
    icon: '🚀',
    articles: [
      {
        id: 'what-is-surfaced',
        title: { fr: "Qu'est-ce que Surfaced ?", en: "What is Surfaced?" },
        content: {
          fr: `**Surfaced** est la première application Shopify dédiée à l'**AEO (AI Engine Optimization)**.

### Le problème
De plus en plus d'acheteurs utilisent ChatGPT, Claude, Perplexity pour trouver des produits. Si votre boutique n'est pas optimisée, vos produits restent invisibles.

### La solution
1. **Analyse** votre catalogue et attribue un score IA à chaque produit
2. **Identifie** les problèmes qui empêchent les IA de vous recommander
3. **Optimise** automatiquement vos descriptions, titres et tags
4. **Vérifie** si votre marque apparaît dans les réponses IA
5. **Suit** votre progression et celle de vos concurrents

### Le résultat
Plus de visibilité IA = plus de trafic organique gratuit = plus de ventes.`,
          en: `**Surfaced** is the first Shopify app dedicated to **AEO (AI Engine Optimization)**.

### The problem
More and more shoppers use ChatGPT, Claude, Perplexity to find products. If your store isn't optimized, your products remain invisible.

### The solution
1. **Analyzes** your catalog and assigns an AI score to each product
2. **Identifies** issues preventing AIs from recommending you
3. **Optimizes** your descriptions, titles, and tags automatically
4. **Checks** if your brand appears in AI responses
5. **Tracks** your progress and your competitors'

### The result
More AI visibility = more free organic traffic = more sales.`,
        },
      },
      {
        id: 'first-steps',
        title: { fr: 'Premiers pas', en: 'First steps' },
        content: {
          fr: `### 1. Lancez votre première analyse
Cliquez sur **"Analyser ma boutique"** sur le tableau de bord. Surfaced scanne tous vos produits et leur attribue un score IA de 0 à 100.

### 2. Consultez votre score global
- **80-100** : Excellent - Bien optimisé
- **60-79** : Bon - Quelques améliorations possibles
- **40-59** : Moyen - Optimisations recommandées
- **0-39** : Faible - Actions urgentes nécessaires

### 3. Identifiez les priorités
Dans **Produits**, concentrez-vous sur :
- Les produits avec des **problèmes critiques**
- Vos **best-sellers**

### 4. Lancez une vérification de visibilité
Dans **Visibilité**, vérifiez si ChatGPT & co. mentionnent déjà votre marque.

### 5. Optimisez vos premiers produits
Utilisez l'**Optimiseur IA** pour améliorer automatiquement vos descriptions.`,
          en: `### 1. Run your first analysis
Click **"Analyze my store"** on the dashboard. Surfaced scans all your products and assigns them an AI score from 0 to 100.

### 2. Check your global score
- **80-100**: Excellent - Well optimized
- **60-79**: Good - Some improvements possible
- **40-59**: Medium - Optimizations recommended
- **0-39**: Low - Urgent actions needed

### 3. Identify priorities
In **Products**, focus on:
- Products with **critical issues**
- Your **best-sellers**

### 4. Run a visibility check
In **Visibility**, check if ChatGPT & co. already mention your brand.

### 5. Optimize your first products
Use the **AI Optimizer** to automatically improve your descriptions.`,
        },
      },
      {
        id: 'understanding-score',
        title: { fr: 'Comprendre le Score IA', en: 'Understanding AI Score' },
        content: {
          fr: `### Comment est calculé le Score IA ?

Le Score IA (0-100) mesure la probabilité qu'un assistant IA recommande votre produit.

#### Facteurs Critiques (40%)
- **Présence de description** : Les IA ne recommandent pas ce qu'elles ne comprennent pas
- **Présence d'images** : Signal de qualité
- **Longueur de description** : Minimum 150 mots recommandés

#### Facteurs Importants (35%)
- **Métadonnées SEO** : Titre et description personnalisés
- **Catégorisation** : Type de produit défini
- **Tags** : Mots-clés pertinents

#### Facteurs Bonus (25%)
- **Alt-text des images**
- **Prix défini**
- **Variantes documentées**
- **Données structurées JSON-LD**

### Niveaux de problèmes
| Niveau | Signification |
|--------|---------------|
| 🔴 Critique | Bloque les recommandations IA |
| 🟡 Avertissement | Réduit vos chances |
| 🔵 Info | Amélioration optionnelle |`,
          en: `### How is the AI Score calculated?

The AI Score (0-100) measures the likelihood that an AI assistant will recommend your product.

#### Critical Factors (40%)
- **Description presence**: AIs don't recommend what they can't understand
- **Image presence**: Quality signal
- **Description length**: Minimum 150 words recommended

#### Important Factors (35%)
- **SEO metadata**: Custom title and description
- **Categorization**: Defined product type
- **Tags**: Relevant keywords

#### Bonus Factors (25%)
- **Image alt-text**
- **Price defined**
- **Documented variants**
- **JSON-LD structured data**

### Issue levels
| Level | Meaning |
|-------|---------|
| 🔴 Critical | Blocks AI recommendations |
| 🟡 Warning | Reduces your chances |
| 🔵 Info | Optional improvement |`,
        },
      },
    ],
  },
  {
    id: 'features',
    icon: '⚡',
    articles: [
      {
        id: 'ai-optimizer',
        title: { fr: "Optimiseur IA", en: "AI Optimizer" },
        content: {
          fr: `### Qu'est-ce que l'Optimiseur IA ?

L'Optimiseur IA génère automatiquement des descriptions, titres et tags optimisés pour vos produits.

### Comment l'utiliser
1. Allez dans **Optimiser**
2. Sélectionnez un produit
3. Choisissez ce que vous voulez optimiser (description, titre, tags)
4. Cliquez sur **Générer**
5. Prévisualisez et cliquez sur **Appliquer**

### Conseils
- Assurez-vous que votre produit a au moins un titre et une image
- Personnalisez le texte généré si nécessaire

### Limites par plan
| Plan | Optimisations/mois |
|------|-------------------|
| Gratuit | 3 |
| Starter | 20 |
| Growth | 100 |
| Scale | 500 |`,
          en: `### What is the AI Optimizer?

The AI Optimizer automatically generates optimized descriptions, titles, and tags for your products.

### How to use it
1. Go to **Optimize**
2. Select a product
3. Choose what to optimize (description, title, tags)
4. Click **Generate**
5. Preview and click **Apply**

### Tips
- Make sure your product has at least a title and image
- Customize the generated text if needed

### Limits per plan
| Plan | Optimizations/month |
|------|---------------------|
| Free | 3 |
| Starter | 20 |
| Growth | 100 |
| Scale | 500 |`,
        },
      },
      {
        id: 'visibility-check',
        title: { fr: 'Vérification de Visibilité', en: 'Visibility Check' },
        content: {
          fr: `### Comment ça fonctionne ?

Surfaced interroge réellement les assistants IA pour voir si votre marque est mentionnée.

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

### Fréquence recommandée
- **Hebdomadaire** : Suivre votre progression
- **Après optimisations** : Valider l'impact
- **Mensuelle minimum** : Avoir des données de tendance`,
          en: `### How does it work?

Surfaced actually queries AI assistants to see if your brand is mentioned.

### Platforms checked
- **ChatGPT** (OpenAI) - 200M+ users
- **Claude** (Anthropic) - 50M+ users
- **Perplexity** - 10M+ users
- **Google Gemini** - 100M+ users
- **Microsoft Copilot** - 50M+ users

### What you get
- **Mention rate**: % of times you're cited
- **Position**: Where you appear in the response
- **Context**: How you're mentioned
- **Competitors detected**: Who else is cited

### Recommended frequency
- **Weekly**: Track your progress
- **After optimizations**: Validate impact
- **Monthly minimum**: Have trend data`,
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
          fr: `### Principes clés

Les IA comprennent mieux le texte **clair, structuré et informatif**.

### Structure idéale
\`\`\`
[Accroche - 1 phrase résumant le produit]

[Caractéristiques principales]
• Caractéristique 1
• Caractéristique 2
• Caractéristique 3

[Cas d'usage - quand/comment utiliser]

[Ce qui différencie ce produit]
\`\`\`

### Exemple
❌ **Mauvais** : "Super écouteurs. Très bien. Achetez-les !"

✅ **Bon** : "Les écouteurs SoundMax Pro offrent une expérience audio immersive avec réduction de bruit active ANC.

• 30 heures d'autonomie
• Bluetooth 5.3 pour connexion stable
• Résistance IPX5 à l'eau

Parfaits pour : trajets, sport, bureau, voyages."

### Longueur
- **Minimum** : 150 mots
- **Idéal** : 200-400 mots`,
          en: `### Key principles

AIs understand text better when it's **clear, structured, and informative**.

### Ideal structure
\`\`\`
[Hook - 1 sentence summarizing the product]

[Main features]
• Feature 1
• Feature 2
• Feature 3

[Use cases - when/how to use]

[What differentiates this product]
\`\`\`

### Example
❌ **Bad**: "Great headphones. Very good. Buy them!"

✅ **Good**: "SoundMax Pro headphones offer an immersive audio experience with active noise cancellation ANC.

• 30 hours battery life
• Bluetooth 5.3 for stable connection
• IPX5 water resistance

Perfect for: commuting, sports, office, travel."

### Length
- **Minimum**: 150 words
- **Ideal**: 200-400 words`,
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
| Prix | $0 | $49/mois | $99/mois | $199/mois |
| Produits analysés | 10 | 100 | 500 | Illimité |
| Vérifications | 3/mois | 10/mois | 50/mois | 200/mois |
| Suggestions IA | 3/mois | 20/mois | 100/mois | 500/mois |
| Concurrents | 0 | 1 | 3 | 10 |
| JSON-LD | ❌ | ✅ | ✅ | ✅ |
| Tests A/B | ❌ | ❌ | ✅ | ✅ |
| API | ❌ | ❌ | ❌ | ✅ |

### Quel plan choisir ?

**Free** : Découvrir Surfaced et comprendre votre score IA.

**Starter** : Petites boutiques (<100 produits) qui veulent commencer.

**Growth** : Notre plan le plus populaire. Pour les boutiques sérieuses.

**Scale** : Catalogues importants avec accès API et support prioritaire.`,
          en: `### Overview

| Feature | Free | Starter | Growth | Scale |
|---------|------|---------|--------|-------|
| Price | $0 | $49/mo | $99/mo | $199/mo |
| Products analyzed | 10 | 100 | 500 | Unlimited |
| Visibility checks | 3/mo | 10/mo | 50/mo | 200/mo |
| AI suggestions | 3/mo | 20/mo | 100/mo | 500/mo |
| Competitors | 0 | 1 | 3 | 10 |
| JSON-LD | ❌ | ✅ | ✅ | ✅ |
| A/B Tests | ❌ | ❌ | ✅ | ✅ |
| API | ❌ | ❌ | ❌ | ✅ |

### Which plan to choose?

**Free**: Discover Surfaced and understand your AI score.

**Starter**: Small stores (<100 products) wanting to start.

**Growth**: Our most popular plan. For serious stores.

**Scale**: Large catalogs with API access and priority support.`,
        },
      },
      {
        id: 'billing-faq',
        title: { fr: 'Questions facturation', en: 'Billing FAQ' },
        content: {
          fr: `### Comment fonctionne la facturation ?

Surfaced utilise la facturation Shopify. Les frais apparaissent sur votre facture Shopify mensuelle.

### Puis-je changer de plan ?

Oui, à tout moment :
- **Upgrade** : Immédiat, prorata calculé
- **Downgrade** : Effectif à la fin du cycle

### Y a-t-il un essai gratuit ?

Oui ! Tous les plans payants ont un **essai gratuit de 14 jours**.

### Comment annuler ?

1. Allez dans **Paramètres** de l'app
2. Cliquez sur **Gérer l'abonnement**
3. Ou désinstallez l'app depuis l'admin Shopify

Aucun engagement, annulez quand vous voulez.`,
          en: `### How does billing work?

Surfaced uses Shopify billing. Charges appear on your monthly Shopify invoice.

### Can I change plans?

Yes, anytime:
- **Upgrade**: Immediate, prorated
- **Downgrade**: Effective at end of cycle

### Is there a free trial?

Yes! All paid plans have a **14-day free trial**.

### How to cancel?

1. Go to app **Settings**
2. Click **Manage subscription**
3. Or uninstall the app from Shopify admin

No commitment, cancel anytime.`,
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
1. Les optimisations n'ont pas été indexées par les IA (1-4 semaines)
2. Les changements n'ont pas été appliqués à Shopify
3. D'autres problèmes non résolus compensent

**Solution** :
- Vérifiez vos modifications sur votre boutique
- Relancez une analyse
- Concentrez-vous sur les problèmes critiques d'abord

### "La vérification de visibilité échoue"

**Causes possibles** :
1. Limite de plan atteinte
2. Requête trop vague
3. Problème temporaire avec l'API

**Solution** :
- Vérifiez votre usage dans Paramètres
- Essayez une requête plus spécifique
- Réessayez plus tard`,
          en: `### "My score isn't improving"

**Possible causes**:
1. Optimizations haven't been indexed by AIs (1-4 weeks)
2. Changes weren't applied to Shopify
3. Other unresolved issues compensate

**Solution**:
- Check your changes on your store
- Run a new analysis
- Focus on critical issues first

### "Visibility check fails"

**Possible causes**:
1. Plan limit reached
2. Query too vague
3. Temporary API issue

**Solution**:
- Check your usage in Settings
- Try a more specific query
- Try again later`,
        },
      },
      {
        id: 'contact-support',
        title: { fr: 'Contacter le support', en: 'Contact support' },
        content: {
          fr: `### Comment nous contacter

**Email** : support@surfaced.app

**Délai de réponse** :
- Plan gratuit/Starter : 48-72h
- Plan Growth : 24h
- Plan Scale : 4h (jours ouvrés)

### Informations à fournir

Pour une résolution rapide, incluez :

1. **Votre domaine Shopify** : exemple.myshopify.com
2. **Votre plan** : Gratuit/Starter/Growth/Scale
3. **Description du problème**
4. **Captures d'écran** si applicable`,
          en: `### How to contact us

**Email**: support@surfaced.app

**Response time**:
- Free/Starter plan: 48-72h
- Growth plan: 24h
- Scale plan: 4h (business days)

### Information to provide

For quick resolution, include:

1. **Your Shopify domain**: example.myshopify.com
2. **Your plan**: Free/Starter/Growth/Scale
3. **Problem description**
4. **Screenshots** if applicable`,
        },
      },
    ],
  },
];

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
  const [activeCategory, setActiveCategory] = useState<string>('getting-started');
  const [activeArticle, setActiveArticle] = useState<string>('what-is-surfaced');
  const [searchQuery, setSearchQuery] = useState('');

  const currentCategory = helpCategories.find((c) => c.id === activeCategory);
  const currentArticle = currentCategory?.articles.find((a) => a.id === activeArticle);

  // Get category title/description from translations
  const getCategoryInfo = (id: string) => {
    const map: Record<string, keyof typeof t.help.categories> = {
      'getting-started': 'gettingStarted',
      'features': 'features',
      'best-practices': 'bestPractices',
      'plans': 'plans',
      'troubleshooting': 'troubleshooting',
    };
    const key = map[id] || 'gettingStarted';
    return t.help.categories[key];
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
                    <h1 className="text-3xl font-bold text-slate-900 mb-6">{currentArticle.title[locale]}</h1>
                    <div
                      className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-a:text-sky-600 prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-slate-900 prose-pre:text-slate-100"
                      dangerouslySetInnerHTML={{
                        __html: currentArticle.content[locale]
                          .replace(/\n/g, '<br>')
                          .replace(/### (.*)/g, '<h3 class="text-lg font-semibold mt-6 mb-3 text-slate-800">$1</h3>')
                          .replace(/## (.*)/g, '<h2 class="text-xl font-bold mt-8 mb-4 text-slate-900">$1</h2>')
                          .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900">$1</strong>')
                          .replace(/`([^`]+)`/g, '<code>$1</code>')
                          .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre class="p-4 rounded-lg overflow-x-auto my-4"><code>$2</code></pre>')
                          .replace(/^- (.*)/gm, '<li class="ml-4">$1</li>')
                          .replace(/(<li[^>]*>.*<\/li>\n?)+/g, '<ul class="list-disc pl-4 my-3 space-y-1">$&</ul>')
                          .replace(/<\/ul><br>/g, '</ul>')
                          .replace(/\| (.*) \|/g, (match) => {
                            const cells = match.split('|').filter(Boolean).map((c) => c.trim());
                            return `<tr>${cells.map((c) => `<td class="border border-slate-200 px-3 py-2 text-sm">${c}</td>`).join('')}</tr>`;
                          }),
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
                    👍 {t.help.yes}
                  </button>
                  <button className="px-5 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium">
                    👎 {t.help.no}
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
