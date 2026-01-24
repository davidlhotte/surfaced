export interface BlogArticle {
  slug: string;
  title: string;
  titleFr: string;
  description: string;
  descriptionFr: string;
  content: string;
  contentFr: string;
  author: string;
  date: string;
  readTime: number;
  category: 'aeo' | 'shopify' | 'ai' | 'tutorial';
  featured?: boolean;
}

export const articles: BlogArticle[] = [
  {
    slug: 'what-is-aeo-complete-guide-2025',
    title: 'AEO: The Complete Guide for E-commerce (2025)',
    titleFr: 'AEO : Le Guide Complet pour E-commerce (2025)',
    description: 'Learn what AI Engine Optimization is, why it matters for e-commerce, and how to optimize your Shopify store for ChatGPT, Claude, and Perplexity.',
    descriptionFr: 'Découvrez ce qu\'est l\'AI Engine Optimization, pourquoi c\'est crucial pour le e-commerce, et comment optimiser votre boutique Shopify pour ChatGPT, Claude et Perplexity.',
    author: 'Surfaced Team',
    date: '2025-01-24',
    readTime: 8,
    category: 'aeo',
    featured: true,
    content: `
# AEO: The Complete Guide for E-commerce (2025)

## The Problem You Don't See Yet

Have you noticed your Google traffic declining, but can't figure out why? You're not alone.

A quiet revolution is happening in how consumers discover products. More and more shoppers are bypassing Google entirely and asking AI assistants like ChatGPT, Perplexity, and Claude for product recommendations.

**The numbers are staggering:**
- ChatGPT processes over 1 billion searches per week
- AI-referred traffic increased by 1,200% between July 2024 and February 2025
- Gartner predicts 25% of organic search traffic will shift to AI by 2026
- 70%+ of searches are now "zero-click" — users get answers without visiting websites

## What is AEO (AI Engine Optimization)?

**AEO (AI Engine Optimization)** is the practice of optimizing your content so that AI assistants recommend your products and brand.

Think of it like SEO, but for AI:
- **SEO** optimizes for Google's algorithm
- **AEO** optimizes for AI language models

| Aspect | SEO | AEO |
|--------|-----|-----|
| Target | Google/Bing | ChatGPT, Claude, Perplexity |
| Goal | Rank #1 in search results | Get cited in AI responses |
| Metrics | Rankings, clicks | Mentions, citations |
| Content style | Keywords + backlinks | Conversational, structured |

## Why AEO Matters for E-commerce

When someone asks ChatGPT *"What's the best natural face cream for dry skin?"*, the AI doesn't show a list of links. It gives a direct answer with specific product recommendations.

**If your products aren't optimized for AI, you're invisible.**

The brands that AI recommends get:
- **Free organic traffic** (no ad spend)
- **Higher conversion rates** (40% higher engagement from AI-referred visitors)
- **First-mover advantage** (most competitors haven't adapted yet)

## The 5 Pillars of E-commerce AEO

### 1. Structured Data (JSON-LD Product Schema)

AI assistants rely heavily on structured data to understand your products. Implement proper JSON-LD Product schema on every product page:

\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Organic Rose Face Cream",
  "description": "A hydrating natural face cream...",
  "brand": {"@type": "Brand", "name": "YourBrand"},
  "offers": {
    "@type": "Offer",
    "price": "29.99",
    "priceCurrency": "USD"
  }
}
\`\`\`

### 2. Conversational Product Descriptions

AI models prefer natural, conversational content over keyword-stuffed descriptions.

**Bad (keyword stuffing):**
> "Natural face cream organic moisturizer for dry skin hydrating cream best face cream 2025"

**Good (conversational):**
> "Our rose face cream is perfect for anyone with dry or sensitive skin. Made with organic rosehip oil and shea butter, it provides 24-hour hydration without feeling greasy."

### 3. FAQ Content

Add FAQ sections to your product pages. AI assistants love structured Q&A content:

- What skin types is this product best for?
- How long does shipping take?
- Is this product cruelty-free?
- What's the return policy?

### 4. The llms.txt File

The llms.txt file is like robots.txt, but for AI crawlers. It tells AI assistants what your site is about and which products to recommend.

\`\`\`
# llms.txt for YourStore

## About Us
We are YourStore, a sustainable beauty brand founded in 2020...

## Our Products
- Organic Rose Face Cream: Best for dry skin, $29.99
- Vitamin C Serum: Best for brightening, $34.99

## Shipping & Returns
Free shipping on orders over $50. 30-day returns.
\`\`\`

### 5. AI Visibility Monitoring

You can't improve what you don't measure. Regularly check if AI assistants are recommending your products:

- Ask ChatGPT, Claude, and Perplexity about your product category
- Track mentions of your brand
- Compare visibility against competitors

## How to Get Started

1. **Audit your current AI visibility** — Ask AI assistants about products in your niche. Do you appear?

2. **Fix your structured data** — Ensure every product has proper JSON-LD schema

3. **Rewrite product descriptions** — Make them conversational and answer common questions

4. **Add FAQ sections** — Include 3-5 Q&As per product page

5. **Create your llms.txt** — Help AI crawlers understand your store

6. **Monitor and iterate** — Check your AI visibility monthly and optimize underperforming products

## The Window of Opportunity

We're in the early days of the AI search revolution. Most e-commerce merchants haven't even heard of AEO yet.

**Those who adapt now will have a decisive advantage over competitors who wait.**

The merchants optimizing for AI today will be the ones AI recommends tomorrow.

---

*Ready to check your AI visibility? [Try Surfaced free](https://apps.shopify.com/surfaced) — complete AEO for Shopify.*
`,
    contentFr: `
# AEO : Le Guide Complet pour E-commerce (2025)

## Le problème que vous ne voyez pas encore

Avez-vous remarqué une baisse de votre trafic Google sans pouvoir l'expliquer ? Vous n'êtes pas seul.

Une révolution silencieuse se produit dans la façon dont les consommateurs découvrent les produits. De plus en plus d'acheteurs contournent Google et demandent directement à des assistants IA comme ChatGPT, Perplexity et Claude des recommandations de produits.

**Les chiffres sont impressionnants :**
- ChatGPT traite plus d'1 milliard de recherches par semaine
- Le trafic provenant de l'IA a augmenté de 1 200% entre juillet 2024 et février 2025
- Gartner prédit que 25% du trafic SEO migrera vers l'IA d'ici 2026
- Plus de 70% des recherches sont maintenant "zero-click" — les utilisateurs obtiennent des réponses sans visiter de sites

## Qu'est-ce que l'AEO (AI Engine Optimization) ?

**L'AEO (AI Engine Optimization)** est la pratique d'optimiser votre contenu pour que les assistants IA recommandent vos produits et votre marque.

C'est comme le SEO, mais pour l'IA :
- **Le SEO** optimise pour l'algorithme de Google
- **L'AEO** optimise pour les modèles de langage IA

| Aspect | SEO | AEO |
|--------|-----|-----|
| Cible | Google/Bing | ChatGPT, Claude, Perplexity |
| Objectif | Être #1 dans les résultats | Être cité dans les réponses IA |
| Métriques | Classements, clics | Mentions, citations |
| Style de contenu | Mots-clés + backlinks | Conversationnel, structuré |

## Pourquoi l'AEO est crucial pour le e-commerce

Quand quelqu'un demande à ChatGPT *"Quelle est la meilleure crème visage naturelle pour peau sèche ?"*, l'IA ne montre pas une liste de liens. Elle donne une réponse directe avec des recommandations de produits spécifiques.

**Si vos produits ne sont pas optimisés pour l'IA, vous êtes invisible.**

Les marques que l'IA recommande obtiennent :
- **Du trafic organique gratuit** (pas de dépense publicitaire)
- **Des taux de conversion plus élevés** (+40% d'engagement pour les visiteurs venant de l'IA)
- **Un avantage de premier arrivant** (la plupart des concurrents n'ont pas encore adapté)

## Les 5 Piliers de l'AEO pour E-commerce

### 1. Données Structurées (JSON-LD Product Schema)

Les assistants IA s'appuient fortement sur les données structurées pour comprendre vos produits. Implémentez un schema JSON-LD Product correct sur chaque page produit :

\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Crème Visage Bio à la Rose",
  "description": "Une crème hydratante naturelle...",
  "brand": {"@type": "Brand", "name": "VotreMarque"},
  "offers": {
    "@type": "Offer",
    "price": "29.99",
    "priceCurrency": "EUR"
  }
}
\`\`\`

### 2. Descriptions de Produits Conversationnelles

Les modèles IA préfèrent un contenu naturel et conversationnel plutôt que des descriptions bourrées de mots-clés.

**Mauvais (bourrage de mots-clés) :**
> "Crème visage naturelle bio hydratante peau sèche meilleure crème 2025"

**Bon (conversationnel) :**
> "Notre crème à la rose est parfaite pour les peaux sèches ou sensibles. Formulée avec de l'huile de rose musquée bio et du beurre de karité, elle offre une hydratation 24h sans effet gras."

### 3. Contenu FAQ

Ajoutez des sections FAQ à vos pages produits. Les assistants IA adorent le contenu Q&R structuré :

- Pour quels types de peau ce produit est-il recommandé ?
- Quels sont les délais de livraison ?
- Ce produit est-il cruelty-free ?
- Quelle est la politique de retour ?

### 4. Le Fichier llms.txt

Le fichier llms.txt est comme robots.txt, mais pour les crawlers IA. Il indique aux assistants IA ce qu'est votre site et quels produits recommander.

\`\`\`
# llms.txt pour VotreBoutique

## À Propos
Nous sommes VotreBoutique, une marque de beauté durable fondée en 2020...

## Nos Produits
- Crème Visage Bio à la Rose : Idéale peau sèche, 29,99€
- Sérum Vitamine C : Idéal pour l'éclat, 34,99€

## Livraison & Retours
Livraison gratuite dès 50€. Retours sous 30 jours.
\`\`\`

### 5. Monitoring de Visibilité IA

On ne peut pas améliorer ce qu'on ne mesure pas. Vérifiez régulièrement si les assistants IA recommandent vos produits :

- Posez des questions à ChatGPT, Claude et Perplexity sur votre catégorie de produits
- Suivez les mentions de votre marque
- Comparez votre visibilité à celle de vos concurrents

## Comment Commencer

1. **Auditez votre visibilité IA actuelle** — Demandez aux assistants IA des produits dans votre niche. Apparaissez-vous ?

2. **Corrigez vos données structurées** — Assurez-vous que chaque produit a un schema JSON-LD correct

3. **Réécrivez vos descriptions produits** — Rendez-les conversationnelles et répondez aux questions courantes

4. **Ajoutez des sections FAQ** — Incluez 3-5 Q&R par page produit

5. **Créez votre llms.txt** — Aidez les crawlers IA à comprendre votre boutique

6. **Monitorez et itérez** — Vérifiez votre visibilité IA mensuellement et optimisez les produits sous-performants

## La Fenêtre d'Opportunité

Nous sommes aux débuts de la révolution de la recherche IA. La plupart des marchands e-commerce n'ont même pas encore entendu parler de l'AEO.

**Ceux qui s'adaptent maintenant auront un avantage décisif sur les concurrents qui attendent.**

Les marchands qui optimisent pour l'IA aujourd'hui seront ceux que l'IA recommandera demain.

---

*Prêt à vérifier votre visibilité IA ? [Essayez Surfaced gratuitement](https://apps.shopify.com/surfaced) — AEO complet pour Shopify.*
`,
  },
];

export function getArticleBySlug(slug: string): BlogArticle | undefined {
  return articles.find(article => article.slug === slug);
}

export function getAllArticles(): BlogArticle[] {
  return articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getFeaturedArticles(): BlogArticle[] {
  return articles.filter(article => article.featured);
}
