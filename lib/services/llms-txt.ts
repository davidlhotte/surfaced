import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/monitoring/logger';
import {
  fetchShopInfoForLlmsTxt,
  fetchProductsForLlmsTxt,
  fetchCollectionsForLlmsTxt,
} from '@/lib/shopify/graphql';
import type { LlmsTxtConfig } from '@prisma/client';

// Types
export interface LlmsTxtProduct {
  id: string;
  title: string;
  handle: string;
  description: string | null;
  productType: string | null;
  vendor: string | null;
  priceRange: {
    minVariantPrice: { amount: string; currencyCode: string };
    maxVariantPrice: { amount: string; currencyCode: string };
  } | null;
  availableForSale: boolean;
}

export interface LlmsTxtCollection {
  id: string;
  title: string;
  handle: string;
  description: string | null;
}

export interface LlmsTxtStore {
  name: string;
  domain: string;
  description?: string;
}

export interface GenerateLlmsTxtOptions {
  store: LlmsTxtStore;
  config: LlmsTxtConfig;
  products: LlmsTxtProduct[];
  collections: LlmsTxtCollection[];
}

/**
 * Strip HTML tags from a string
 */
function stripHtml(html: string | null): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Truncate text to a maximum length
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3).trim() + '...';
}

/**
 * Get main product categories from products
 */
function getMainCategories(products: LlmsTxtProduct[]): string[] {
  const types = new Map<string, number>();

  for (const product of products) {
    const type = product.productType || 'General';
    types.set(type, (types.get(type) || 0) + 1);
  }

  // Sort by count and take top 5
  return Array.from(types.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([type]) => type);
}

/**
 * Format price for display
 */
function formatPrice(priceRange: LlmsTxtProduct['priceRange']): string {
  if (!priceRange) return '';

  const min = parseFloat(priceRange.minVariantPrice.amount);
  const max = parseFloat(priceRange.maxVariantPrice.amount);
  const currency = priceRange.minVariantPrice.currencyCode;

  if (min === max) {
    return `${currency} ${min.toFixed(2)}`;
  }
  return `${currency} ${min.toFixed(2)} - ${max.toFixed(2)}`;
}

/**
 * Generate llms.txt content following the specification from llmstxt.org
 *
 * Format:
 * - H1 title (required)
 * - Blockquote summary (optional)
 * - Descriptive content (optional)
 * - H2 sections with file lists (optional)
 */
export function generateLlmsTxt(options: GenerateLlmsTxtOptions): string {
  const { store, config, products, collections } = options;
  const lines: string[] = [];

  // H1 Title (required)
  lines.push(`# ${store.name}`);
  lines.push('');

  // Blockquote summary
  const categories = getMainCategories(products);
  const categoryText = categories.length > 0
    ? `selling ${categories.join(', ')}`
    : 'online store';

  lines.push(`> ${store.name} is an e-commerce store ${categoryText}. Browse our products and collections below.`);
  lines.push('');

  // Store description if available
  if (store.description) {
    lines.push(store.description);
    lines.push('');
  }

  // Allowed bots section
  const allowedBots = config.allowedBots as string[];
  if (allowedBots && allowedBots.length > 0) {
    lines.push('## AI Crawlers');
    lines.push('');
    lines.push(`This content is optimized for: ${allowedBots.join(', ')}`);
    lines.push('');
  }

  // Products section
  if (config.includeProducts && products.length > 0) {
    const excludedIds = (config.excludedProductIds as string[]) || [];
    const filteredProducts = products
      .filter(p => !excludedIds.includes(p.id))
      .filter(p => p.availableForSale !== false)
      .slice(0, 500); // Limit for performance

    if (filteredProducts.length > 0) {
      lines.push('## Products');
      lines.push('');

      for (const product of filteredProducts) {
        const description = truncate(stripHtml(product.description), 150);
        const price = formatPrice(product.priceRange);
        const details = [description, price].filter(Boolean).join(' - ');

        const url = `https://${store.domain}/products/${product.handle}`;

        if (details) {
          lines.push(`- [${product.title}](${url}): ${details}`);
        } else {
          lines.push(`- [${product.title}](${url})`);
        }
      }

      lines.push('');
    }
  }

  // Collections section
  if (config.includeCollections && collections.length > 0) {
    lines.push('## Collections');
    lines.push('');

    for (const collection of collections) {
      const description = truncate(stripHtml(collection.description), 100);
      const url = `https://${store.domain}/collections/${collection.handle}`;

      if (description) {
        lines.push(`- [${collection.title}](${url}): ${description}`);
      } else {
        lines.push(`- [${collection.title}](${url})`);
      }
    }

    lines.push('');
  }

  // Custom instructions
  if (config.customInstructions) {
    lines.push('## Additional Information');
    lines.push('');
    lines.push(config.customInstructions);
    lines.push('');
  }

  // Optional section (for shorter context)
  lines.push('## Optional');
  lines.push('');
  lines.push(`- [All Products](https://${store.domain}/collections/all): Browse our complete product catalog`);
  lines.push(`- [Contact Us](https://${store.domain}/pages/contact): Get in touch with our team`);
  lines.push('');

  // Footer
  lines.push('---');
  lines.push(`*Generated by [Surfaced](https://surfaced.vercel.app) - AI Visibility for Shopify*`);
  lines.push(`*Last updated: ${new Date().toISOString().split('T')[0]}*`);

  return lines.join('\n');
}

/**
 * Get or create llms.txt config for a shop
 */
export async function getLlmsTxtConfig(shopDomain: string): Promise<LlmsTxtConfig | null> {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    include: { llmsTxtConfig: true },
  });

  if (!shop) {
    return null;
  }

  // Return existing config or create default
  if (shop.llmsTxtConfig) {
    return shop.llmsTxtConfig;
  }

  // Create default config
  const config = await prisma.llmsTxtConfig.create({
    data: {
      shopId: shop.id,
      isEnabled: true,
      allowedBots: ['ChatGPT-User', 'GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended'],
      includeProducts: true,
      includeCollections: true,
      includeBlog: false,
      excludedProductIds: [],
    },
  });

  logger.info({ shopDomain }, 'Created default llms.txt config');

  return config;
}

/**
 * Update llms.txt config
 */
export async function updateLlmsTxtConfig(
  shopDomain: string,
  updates: Partial<{
    isEnabled: boolean;
    allowedBots: string[];
    includeProducts: boolean;
    includeCollections: boolean;
    includeBlog: boolean;
    excludedProductIds: string[];
    customInstructions: string | null;
  }>
): Promise<LlmsTxtConfig> {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: { id: true },
  });

  if (!shop) {
    throw new Error('Shop not found');
  }

  const config = await prisma.llmsTxtConfig.upsert({
    where: { shopId: shop.id },
    update: {
      ...updates,
      lastGeneratedAt: new Date(),
      updatedAt: new Date(),
    },
    create: {
      shopId: shop.id,
      isEnabled: updates.isEnabled ?? true,
      allowedBots: updates.allowedBots ?? ['ChatGPT-User', 'GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended'],
      includeProducts: updates.includeProducts ?? true,
      includeCollections: updates.includeCollections ?? true,
      includeBlog: updates.includeBlog ?? false,
      excludedProductIds: updates.excludedProductIds ?? [],
      customInstructions: updates.customInstructions ?? null,
    },
  });

  logger.info({ shopDomain, config: config.id }, 'Updated llms.txt config');

  return config;
}

/**
 * Generate llms.txt for a shop by fetching data from Shopify (GraphQL API)
 */
export async function generateLlmsTxtForShop(
  shopDomain: string,
  accessToken: string
): Promise<{ content: string; config: LlmsTxtConfig }> {
  const config = await getLlmsTxtConfig(shopDomain);

  if (!config) {
    throw new Error('Shop not found');
  }

  if (!config.isEnabled) {
    throw new Error('llms.txt generation is disabled for this shop');
  }

  // Fetch shop info via GraphQL
  const shopData = await fetchShopInfoForLlmsTxt(shopDomain, accessToken);
  const shopifyShop = shopData.shop;

  // Fetch products via GraphQL
  const products: LlmsTxtProduct[] = [];
  if (config.includeProducts) {
    const productsData = await fetchProductsForLlmsTxt(shopDomain, accessToken, 250);

    for (const p of productsData.products.nodes) {
      products.push({
        id: p.id,
        title: p.title,
        handle: p.handle,
        description: p.descriptionHtml,
        productType: p.productType,
        vendor: p.vendor,
        priceRange: {
          minVariantPrice: {
            amount: p.priceRangeV2.minVariantPrice.amount,
            currencyCode: p.priceRangeV2.minVariantPrice.currencyCode,
          },
          maxVariantPrice: {
            amount: p.priceRangeV2.maxVariantPrice.amount,
            currencyCode: p.priceRangeV2.maxVariantPrice.currencyCode,
          },
        },
        availableForSale: p.status === 'ACTIVE',
      });
    }
  }

  // Fetch collections via GraphQL (includes both custom and smart collections)
  const collections: LlmsTxtCollection[] = [];
  if (config.includeCollections) {
    const collectionsData = await fetchCollectionsForLlmsTxt(shopDomain, accessToken, 250);

    for (const c of collectionsData.collections.nodes) {
      collections.push({
        id: c.id,
        title: c.title,
        handle: c.handle,
        description: c.descriptionHtml,
      });
    }
  }

  // Generate content
  const store: LlmsTxtStore = {
    name: shopifyShop.name || shopDomain.replace('.myshopify.com', ''),
    domain: shopifyShop.primaryDomain?.host || shopDomain,
    description: shopifyShop.description || undefined,
  };

  const content = generateLlmsTxt({ store, config, products, collections });

  // Update last generated timestamp
  await prisma.llmsTxtConfig.update({
    where: { id: config.id },
    data: { lastGeneratedAt: new Date() },
  });

  logger.info(
    { shopDomain, productsCount: products.length, collectionsCount: collections.length },
    'Generated llms.txt'
  );

  return { content, config };
}
