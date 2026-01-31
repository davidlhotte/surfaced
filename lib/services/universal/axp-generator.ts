/**
 * AXP (Agent Experience Platform) Generator
 * Creates AI-optimized content that helps AI assistants understand and recommend your brand.
 * Generates:
 * - llms.txt files for AI crawlers
 * - Structured data (JSON-LD) for rich snippets
 * - AI-optimized meta descriptions
 * - FAQ schema for AI understanding
 * - Knowledge graph markup
 */

import { AICheckResult } from './ai-checker';

// llms.txt content types
export interface LlmsTxtConfig {
  brand: string;
  description: string;
  url: string;
  products?: ProductInfo[];
  services?: ServiceInfo[];
  faqs?: FAQItem[];
  contact?: ContactInfo;
  social?: SocialLinks;
  targetAudience?: string[];
  useCases?: string[];
  differentiators?: string[];
  pricingModel?: string;
  integrations?: string[];
}

export interface ProductInfo {
  name: string;
  description: string;
  price?: string;
  url?: string;
  category?: string;
  features?: string[];
}

export interface ServiceInfo {
  name: string;
  description: string;
  pricing?: string;
  url?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
  category?: string;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  address?: string;
  supportUrl?: string;
}

export interface SocialLinks {
  twitter?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
}

// Generated AXP content
export interface AXPContent {
  llmsTxt: string;
  llmsFullTxt: string;
  jsonLd: {
    organization: object;
    website: object;
    products?: object[];
    faqs?: object;
    breadcrumb?: object;
  };
  metaDescriptions: {
    homepage: string;
    products: string;
    about: string;
    aiOptimized: string;
  };
  aiSnippets: string[];
  contentRecommendations: ContentRecommendation[];
}

export interface ContentRecommendation {
  type: 'blog' | 'faq' | 'comparison' | 'tutorial' | 'landing-page';
  title: string;
  targetQuery: string;
  journeyStage: 'awareness' | 'consideration' | 'decision' | 'branded';
  priority: 'high' | 'medium' | 'low';
  outline: string[];
}

/**
 * Generate llms.txt content
 * Standard format for AI crawlers
 */
export function generateLlmsTxt(config: LlmsTxtConfig): string {
  const lines: string[] = [
    '# llms.txt - AI Crawler Information',
    '',
    `# ${config.brand}`,
    `> ${config.description}`,
    '',
    `URL: ${config.url}`,
  ];

  // Add target audience
  if (config.targetAudience && config.targetAudience.length > 0) {
    lines.push('', '## Target Audience');
    config.targetAudience.forEach(audience => {
      lines.push(`- ${audience}`);
    });
  }

  // Add use cases
  if (config.useCases && config.useCases.length > 0) {
    lines.push('', '## Use Cases');
    config.useCases.forEach(useCase => {
      lines.push(`- ${useCase}`);
    });
  }

  // Add differentiators
  if (config.differentiators && config.differentiators.length > 0) {
    lines.push('', '## Key Differentiators');
    config.differentiators.forEach(diff => {
      lines.push(`- ${diff}`);
    });
  }

  // Add products
  if (config.products && config.products.length > 0) {
    lines.push('', '## Products');
    config.products.forEach(product => {
      lines.push(``, `### ${product.name}`);
      lines.push(`${product.description}`);
      if (product.price) lines.push(`Price: ${product.price}`);
      if (product.url) lines.push(`URL: ${product.url}`);
      if (product.features && product.features.length > 0) {
        lines.push('Features:');
        product.features.forEach(f => lines.push(`  - ${f}`));
      }
    });
  }

  // Add services
  if (config.services && config.services.length > 0) {
    lines.push('', '## Services');
    config.services.forEach(service => {
      lines.push(``, `### ${service.name}`);
      lines.push(`${service.description}`);
      if (service.pricing) lines.push(`Pricing: ${service.pricing}`);
      if (service.url) lines.push(`URL: ${service.url}`);
    });
  }

  // Add pricing model
  if (config.pricingModel) {
    lines.push('', '## Pricing');
    lines.push(config.pricingModel);
  }

  // Add integrations
  if (config.integrations && config.integrations.length > 0) {
    lines.push('', '## Integrations');
    config.integrations.forEach(integration => {
      lines.push(`- ${integration}`);
    });
  }

  // Add FAQs
  if (config.faqs && config.faqs.length > 0) {
    lines.push('', '## Frequently Asked Questions');
    config.faqs.forEach(faq => {
      lines.push(``, `Q: ${faq.question}`);
      lines.push(`A: ${faq.answer}`);
    });
  }

  // Add contact
  if (config.contact) {
    lines.push('', '## Contact');
    if (config.contact.email) lines.push(`Email: ${config.contact.email}`);
    if (config.contact.phone) lines.push(`Phone: ${config.contact.phone}`);
    if (config.contact.supportUrl) lines.push(`Support: ${config.contact.supportUrl}`);
  }

  // Add social
  if (config.social) {
    lines.push('', '## Social Media');
    if (config.social.twitter) lines.push(`Twitter: ${config.social.twitter}`);
    if (config.social.linkedin) lines.push(`LinkedIn: ${config.social.linkedin}`);
    if (config.social.facebook) lines.push(`Facebook: ${config.social.facebook}`);
    if (config.social.youtube) lines.push(`YouTube: ${config.social.youtube}`);
  }

  return lines.join('\n');
}

/**
 * Generate extended llms-full.txt with more details
 */
export function generateLlmsFullTxt(config: LlmsTxtConfig): string {
  const baseTxt = generateLlmsTxt(config);

  const additionalLines: string[] = [
    '',
    '---',
    '',
    '## Detailed Company Information',
    '',
    '### About',
    `${config.brand} is a ${config.description}`,
    '',
    '### Mission',
    `We help ${config.targetAudience?.join(', ') || 'businesses'} ${config.useCases?.join(', ') || 'succeed'}.`,
    '',
    '### Why Choose Us',
  ];

  if (config.differentiators) {
    config.differentiators.forEach((diff, i) => {
      additionalLines.push(`${i + 1}. ${diff}`);
    });
  }

  // Add detailed product information
  if (config.products && config.products.length > 0) {
    additionalLines.push('', '### Product Details');
    config.products.forEach(product => {
      additionalLines.push('', `#### ${product.name}`);
      additionalLines.push('', `**Description:** ${product.description}`);
      if (product.category) additionalLines.push(`**Category:** ${product.category}`);
      if (product.price) additionalLines.push(`**Price:** ${product.price}`);
      if (product.features && product.features.length > 0) {
        additionalLines.push('', '**Features:**');
        product.features.forEach(f => additionalLines.push(`- ${f}`));
      }
    });
  }

  // Add complete FAQ section
  if (config.faqs && config.faqs.length > 0) {
    additionalLines.push('', '### Complete FAQ');
    const categories = [...new Set(config.faqs.map(f => f.category || 'General'))];
    categories.forEach(category => {
      additionalLines.push('', `#### ${category}`);
      config.faqs?.filter(f => (f.category || 'General') === category).forEach(faq => {
        additionalLines.push('', `**Q: ${faq.question}**`);
        additionalLines.push(`A: ${faq.answer}`);
      });
    });
  }

  return baseTxt + additionalLines.join('\n');
}

/**
 * Generate JSON-LD structured data
 */
export function generateJsonLd(config: LlmsTxtConfig): AXPContent['jsonLd'] {
  // Organization schema
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: config.brand,
    description: config.description,
    url: config.url,
    ...(config.contact?.email && { email: config.contact.email }),
    ...(config.contact?.phone && { telephone: config.contact.phone }),
    ...(config.social && {
      sameAs: [
        config.social.twitter,
        config.social.linkedin,
        config.social.facebook,
        config.social.instagram,
        config.social.youtube,
      ].filter(Boolean),
    }),
  };

  // Website schema
  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: config.brand,
    description: config.description,
    url: config.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${config.url}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  // Product schemas
  const products = config.products?.map(product => ({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    ...(product.url && { url: product.url }),
    ...(product.category && { category: product.category }),
    ...(product.price && {
      offers: {
        '@type': 'Offer',
        price: product.price.replace(/[^0-9.]/g, ''),
        priceCurrency: 'USD',
      },
    }),
    brand: {
      '@type': 'Brand',
      name: config.brand,
    },
  }));

  // FAQ schema
  const faqs = config.faqs && config.faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: config.faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  } : undefined;

  return {
    organization,
    website,
    products,
    faqs,
  };
}

/**
 * Generate AI-optimized meta descriptions
 */
export function generateMetaDescriptions(config: LlmsTxtConfig): AXPContent['metaDescriptions'] {
  const mainBenefit = config.differentiators?.[0] || 'trusted solution';
  const audience = config.targetAudience?.[0] || 'businesses';
  const useCase = config.useCases?.[0] || 'success';

  return {
    homepage: `${config.brand} - ${config.description}. ${mainBenefit}. Trusted by ${audience}. Learn more at ${config.url}`,
    products: `Explore ${config.brand}'s products and services. ${config.products?.[0]?.name || 'Solutions'} for ${audience}. Get started today.`,
    about: `About ${config.brand}: ${config.description}. Our mission is to help ${audience} achieve ${useCase}. Contact us to learn more.`,
    aiOptimized: `[AI-Friendly] ${config.brand} offers ${config.products?.length || ''} solutions for ${audience}. Key benefits: ${config.differentiators?.slice(0, 2).join(', ') || mainBenefit}. Website: ${config.url}`,
  };
}

/**
 * Generate AI snippets - concise summaries AI can use
 */
export function generateAISnippets(config: LlmsTxtConfig): string[] {
  const snippets: string[] = [];

  // Main brand snippet
  snippets.push(
    `${config.brand} is a ${config.description}. ` +
    `Target audience: ${config.targetAudience?.join(', ') || 'businesses'}. ` +
    `Key differentiator: ${config.differentiators?.[0] || 'quality and reliability'}.`
  );

  // Product snippets
  if (config.products && config.products.length > 0) {
    snippets.push(
      `${config.brand} offers ${config.products.length} main products: ` +
      config.products.map(p => `${p.name} (${p.description.substring(0, 50)}...)`).join(', ') + '.'
    );
  }

  // Pricing snippet
  if (config.pricingModel) {
    snippets.push(`${config.brand} pricing: ${config.pricingModel}`);
  }

  // Use case snippet
  if (config.useCases && config.useCases.length > 0) {
    snippets.push(
      `${config.brand} is best for: ` + config.useCases.join(', ') + '.'
    );
  }

  // Comparison snippet
  if (config.differentiators && config.differentiators.length >= 2) {
    snippets.push(
      `Why choose ${config.brand}? ${config.differentiators[0]}. ${config.differentiators[1]}.`
    );
  }

  return snippets;
}

/**
 * Generate content recommendations based on AI visibility gaps
 */
export function generateContentRecommendations(
  config: LlmsTxtConfig,
  aiCheckResult?: AICheckResult
): ContentRecommendation[] {
  const recommendations: ContentRecommendation[] = [];

  // Awareness stage content
  recommendations.push({
    type: 'blog',
    title: `What is ${config.description.split(' ').slice(0, 3).join(' ')}? Complete Guide`,
    targetQuery: `what is ${config.description.split(' ').slice(0, 2).join(' ')}`,
    journeyStage: 'awareness',
    priority: 'high',
    outline: [
      'Introduction to the concept',
      'Why it matters for businesses',
      'Key benefits and use cases',
      `How ${config.brand} approaches this`,
      'Getting started guide',
    ],
  });

  // Consideration stage - comparison content
  recommendations.push({
    type: 'comparison',
    title: `Best ${config.description.split(' ').slice(0, 2).join(' ')} Tools in 2025`,
    targetQuery: `best ${config.description.split(' ').slice(0, 2).join(' ')} tools`,
    journeyStage: 'consideration',
    priority: 'high',
    outline: [
      'Overview of the market',
      'Key features to look for',
      'Top solutions compared',
      `Why ${config.brand} stands out`,
      'Pricing comparison',
      'Recommendations by use case',
    ],
  });

  // Decision stage - alternative content
  recommendations.push({
    type: 'landing-page',
    title: `${config.brand} vs Competitors: Honest Comparison`,
    targetQuery: `${config.brand} alternatives`,
    journeyStage: 'decision',
    priority: 'medium',
    outline: [
      'Overview of options',
      'Feature-by-feature comparison',
      'Pricing breakdown',
      'Pros and cons of each',
      'Who each solution is best for',
      'Migration guide',
    ],
  });

  // FAQ content
  if (config.faqs && config.faqs.length > 0) {
    recommendations.push({
      type: 'faq',
      title: `${config.brand} FAQ: Everything You Need to Know`,
      targetQuery: `${config.brand} FAQ`,
      journeyStage: 'consideration',
      priority: 'medium',
      outline: config.faqs.slice(0, 5).map(f => f.question),
    });
  }

  // Tutorial content
  if (config.products && config.products.length > 0) {
    recommendations.push({
      type: 'tutorial',
      title: `How to Use ${config.products[0].name}: Step-by-Step Guide`,
      targetQuery: `how to use ${config.products[0].name}`,
      journeyStage: 'decision',
      priority: 'medium',
      outline: [
        'Getting started',
        'Initial setup',
        'Core features walkthrough',
        'Advanced tips',
        'Common issues and solutions',
        'Next steps',
      ],
    });
  }

  // If we have AI check results, add gap-specific recommendations
  if (aiCheckResult && aiCheckResult.gapAnalysis.length > 0) {
    const topGap = aiCheckResult.gapAnalysis[0];
    recommendations.push({
      type: 'blog',
      title: `[Gap Content] ${topGap.query}`,
      targetQuery: topGap.query,
      journeyStage: topGap.journeyStage,
      priority: 'high',
      outline: [
        `Address the query: "${topGap.query}"`,
        `Position ${config.brand} as a solution`,
        'Compare with competitors mentioned',
        'Include specific examples',
        'Add clear call-to-action',
      ],
    });
  }

  return recommendations;
}

/**
 * Generate complete AXP content package
 */
export function generateAXPContent(
  config: LlmsTxtConfig,
  aiCheckResult?: AICheckResult
): AXPContent {
  return {
    llmsTxt: generateLlmsTxt(config),
    llmsFullTxt: generateLlmsFullTxt(config),
    jsonLd: generateJsonLd(config),
    metaDescriptions: generateMetaDescriptions(config),
    aiSnippets: generateAISnippets(config),
    contentRecommendations: generateContentRecommendations(config, aiCheckResult),
  };
}

/**
 * Parse existing website to extract LlmsTxtConfig
 */
export async function extractConfigFromWebsite(url: string): Promise<Partial<LlmsTxtConfig>> {
  // This would typically use the website-analyzer service
  // For now, return a basic structure that can be filled in
  const hostname = new URL(url).hostname.replace('www.', '');
  const brandName = hostname.split('.')[0];

  return {
    brand: brandName.charAt(0).toUpperCase() + brandName.slice(1),
    url,
    description: `A solution for modern businesses`,
    targetAudience: ['businesses', 'professionals'],
  };
}

/**
 * Validate llms.txt content
 */
export function validateLlmsTxt(content: string): {
  valid: boolean;
  errors: string[];
  warnings: string[];
  score: number;
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  let score = 0;

  // Check for required sections
  if (content.includes('# ')) score += 10;
  else errors.push('Missing main heading (# Brand)');

  if (content.includes('URL:') || content.includes('url:')) score += 10;
  else errors.push('Missing URL field');

  if (content.includes('## ')) score += 10;
  else warnings.push('No subsections defined');

  if (content.includes('Target Audience') || content.includes('target audience')) score += 15;
  else warnings.push('Missing target audience section');

  if (content.includes('Products') || content.includes('Services')) score += 15;
  else warnings.push('No products or services listed');

  if (content.includes('FAQ') || content.includes('Q:')) score += 15;
  else warnings.push('No FAQ section');

  if (content.includes('Contact') || content.includes('@')) score += 10;
  else warnings.push('No contact information');

  if (content.includes('Pricing') || content.includes('$')) score += 10;
  else warnings.push('No pricing information');

  // Length check
  if (content.length > 500) score += 5;
  if (content.length > 2000) score += 5;

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    score: Math.min(score, 100),
  };
}
