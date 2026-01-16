import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/monitoring/logger';
import type { JsonLdConfig } from '@prisma/client';

// JSON-LD Types
export interface JsonLdProduct {
  '@context': string;
  '@type': string;
  name: string;
  description?: string;
  image?: string | string[];
  url: string;
  sku?: string;
  brand?: {
    '@type': string;
    name: string;
  };
  offers?: {
    '@type': string;
    price: string;
    priceCurrency: string;
    availability: string;
    url: string;
    priceValidUntil?: string;
    seller?: {
      '@type': string;
      name: string;
    };
  };
  aggregateRating?: {
    '@type': string;
    ratingValue: string;
    reviewCount: string;
  };
}

export interface JsonLdOrganization {
  '@context': string;
  '@type': string;
  name: string;
  url: string;
  logo?: string;
  description?: string;
  contactPoint?: {
    '@type': string;
    telephone?: string;
    email?: string;
    contactType: string;
  };
  sameAs?: string[];
}

export interface JsonLdBreadcrumb {
  '@context': string;
  '@type': string;
  itemListElement: {
    '@type': string;
    position: number;
    name: string;
    item?: string;
  }[];
}

export interface GenerateJsonLdOptions {
  shopDomain: string;
  shopName: string;
  shopDescription?: string;
  shopLogo?: string;
  shopEmail?: string;
  products: {
    id: string;
    title: string;
    handle: string;
    description?: string;
    images: string[];
    vendor?: string;
    productType?: string;
    price: string;
    currency: string;
    available: boolean;
    sku?: string;
  }[];
  config: JsonLdConfig;
}

/**
 * Strip HTML tags from a string
 */
function stripHtml(html: string | null | undefined): string {
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
 * Generate Product JSON-LD schema
 */
export function generateProductJsonLd(
  product: GenerateJsonLdOptions['products'][0],
  shopDomain: string,
  shopName: string
): JsonLdProduct {
  const description = truncate(stripHtml(product.description), 500);
  const productUrl = `https://${shopDomain}/products/${product.handle}`;

  const jsonLd: JsonLdProduct = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    url: productUrl,
  };

  if (description) {
    jsonLd.description = description;
  }

  if (product.images.length > 0) {
    jsonLd.image = product.images.length === 1 ? product.images[0] : product.images;
  }

  if (product.sku) {
    jsonLd.sku = product.sku;
  }

  if (product.vendor) {
    jsonLd.brand = {
      '@type': 'Brand',
      name: product.vendor,
    };
  }

  // Add offer (price information)
  if (product.price) {
    jsonLd.offers = {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency,
      availability: product.available
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: productUrl,
      seller: {
        '@type': 'Organization',
        name: shopName,
      },
    };
  }

  return jsonLd;
}

/**
 * Generate Organization JSON-LD schema
 */
export function generateOrganizationJsonLd(
  shopDomain: string,
  shopName: string,
  options?: {
    description?: string;
    logo?: string;
    email?: string;
    socialLinks?: string[];
  }
): JsonLdOrganization {
  const jsonLd: JsonLdOrganization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: shopName,
    url: `https://${shopDomain}`,
  };

  if (options?.description) {
    jsonLd.description = truncate(stripHtml(options.description), 500);
  }

  if (options?.logo) {
    jsonLd.logo = options.logo;
  }

  if (options?.email) {
    jsonLd.contactPoint = {
      '@type': 'ContactPoint',
      email: options.email,
      contactType: 'customer service',
    };
  }

  if (options?.socialLinks && options.socialLinks.length > 0) {
    jsonLd.sameAs = options.socialLinks;
  }

  return jsonLd;
}

/**
 * Generate Breadcrumb JSON-LD schema
 */
export function generateBreadcrumbJsonLd(
  items: { name: string; url?: string }[]
): JsonLdBreadcrumb {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.url ? { item: item.url } : {}),
    })),
  };
}

/**
 * Generate all JSON-LD schemas for a shop
 */
export function generateAllJsonLd(options: GenerateJsonLdOptions): {
  organization: JsonLdOrganization;
  products: JsonLdProduct[];
  breadcrumbs: JsonLdBreadcrumb;
} {
  const { shopDomain, shopName, shopDescription, shopLogo, shopEmail, products, config } = options;

  // Organization schema
  const organization = generateOrganizationJsonLd(shopDomain, shopName, {
    description: shopDescription,
    logo: shopLogo,
    email: shopEmail,
  });

  // Product schemas (only if enabled and products exist)
  const productSchemas: JsonLdProduct[] = [];
  if (config.includeProducts && products.length > 0) {
    const excludedIds = (config.excludedProductIds as string[]) || [];
    const filteredProducts = products
      .filter((p) => !excludedIds.includes(p.id))
      .filter((p) => p.available)
      .slice(0, 100); // Limit for performance

    for (const product of filteredProducts) {
      productSchemas.push(generateProductJsonLd(product, shopDomain, shopName));
    }
  }

  // Breadcrumb schema (home page)
  const breadcrumbs = generateBreadcrumbJsonLd([
    { name: 'Home', url: `https://${shopDomain}` },
    { name: 'Products', url: `https://${shopDomain}/collections/all` },
  ]);

  return {
    organization,
    products: productSchemas,
    breadcrumbs,
  };
}

/**
 * Get or create JSON-LD config for a shop
 */
export async function getJsonLdConfig(shopDomain: string): Promise<JsonLdConfig | null> {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    include: { jsonLdConfig: true },
  });

  if (!shop) {
    return null;
  }

  // Return existing config or create default
  if (shop.jsonLdConfig) {
    return shop.jsonLdConfig;
  }

  // Create default config
  const config = await prisma.jsonLdConfig.create({
    data: {
      shopId: shop.id,
      isEnabled: true,
      includeOrganization: true,
      includeProducts: true,
      includeBreadcrumbs: true,
      excludedProductIds: [],
    },
  });

  logger.info({ shopDomain }, 'Created default JSON-LD config');

  return config;
}

/**
 * Update JSON-LD config
 */
export async function updateJsonLdConfig(
  shopDomain: string,
  updates: Partial<{
    isEnabled: boolean;
    includeOrganization: boolean;
    includeProducts: boolean;
    includeBreadcrumbs: boolean;
    excludedProductIds: string[];
    customOrganizationData: Prisma.InputJsonValue | null;
  }>
): Promise<JsonLdConfig> {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: { id: true },
  });

  if (!shop) {
    throw new Error('Shop not found');
  }

  // Build update object explicitly to satisfy Prisma types
  const updateData: Prisma.JsonLdConfigUpdateInput = {
    updatedAt: new Date(),
  };

  if (updates.isEnabled !== undefined) updateData.isEnabled = updates.isEnabled;
  if (updates.includeOrganization !== undefined) updateData.includeOrganization = updates.includeOrganization;
  if (updates.includeProducts !== undefined) updateData.includeProducts = updates.includeProducts;
  if (updates.includeBreadcrumbs !== undefined) updateData.includeBreadcrumbs = updates.includeBreadcrumbs;
  if (updates.excludedProductIds !== undefined) updateData.excludedProductIds = updates.excludedProductIds;
  if (updates.customOrganizationData !== undefined) {
    updateData.customOrganizationData = updates.customOrganizationData === null
      ? Prisma.JsonNull
      : updates.customOrganizationData;
  }

  const config = await prisma.jsonLdConfig.upsert({
    where: { shopId: shop.id },
    update: updateData,
    create: {
      shopId: shop.id,
      isEnabled: updates.isEnabled ?? true,
      includeOrganization: updates.includeOrganization ?? true,
      includeProducts: updates.includeProducts ?? true,
      includeBreadcrumbs: updates.includeBreadcrumbs ?? true,
      excludedProductIds: updates.excludedProductIds ?? [],
      customOrganizationData: updates.customOrganizationData === null
        ? Prisma.JsonNull
        : (updates.customOrganizationData ?? Prisma.JsonNull),
    },
  });

  logger.info({ shopDomain, config: config.id }, 'Updated JSON-LD config');

  return config;
}
