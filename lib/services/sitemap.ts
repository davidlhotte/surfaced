import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/monitoring/logger';
import { fetchProducts, fetchShopInfo } from '@/lib/shopify/graphql';

// Types
export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  images?: Array<{
    loc: string;
    title?: string;
    caption?: string;
  }>;
}

export interface SitemapConfig {
  includeProducts: boolean;
  includeCollections: boolean;
  includePages: boolean;
  includeBlog: boolean;
  defaultChangefreq: SitemapUrl['changefreq'];
  productPriority: number;
  collectionPriority: number;
  pagePriority: number;
}

export const DEFAULT_SITEMAP_CONFIG: SitemapConfig = {
  includeProducts: true,
  includeCollections: true,
  includePages: true,
  includeBlog: true,
  defaultChangefreq: 'weekly',
  productPriority: 0.8,
  collectionPriority: 0.7,
  pagePriority: 0.5,
};

/**
 * Generate XML sitemap content
 */
export function generateSitemapXml(urls: SitemapUrl[]): string {
  const lines: string[] = [];

  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
  lines.push('        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">');

  for (const url of urls) {
    lines.push('  <url>');
    lines.push(`    <loc>${escapeXml(url.loc)}</loc>`);

    if (url.lastmod) {
      lines.push(`    <lastmod>${url.lastmod}</lastmod>`);
    }

    if (url.changefreq) {
      lines.push(`    <changefreq>${url.changefreq}</changefreq>`);
    }

    if (url.priority !== undefined) {
      lines.push(`    <priority>${url.priority.toFixed(1)}</priority>`);
    }

    // Image sitemap extension
    if (url.images && url.images.length > 0) {
      for (const image of url.images) {
        lines.push('    <image:image>');
        lines.push(`      <image:loc>${escapeXml(image.loc)}</image:loc>`);
        if (image.title) {
          lines.push(`      <image:title>${escapeXml(image.title)}</image:title>`);
        }
        if (image.caption) {
          lines.push(`      <image:caption>${escapeXml(image.caption)}</image:caption>`);
        }
        lines.push('    </image:image>');
      }
    }

    lines.push('  </url>');
  }

  lines.push('</urlset>');

  return lines.join('\n');
}

/**
 * Escape special XML characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate sitemap index for multiple sitemaps
 */
export function generateSitemapIndex(sitemaps: Array<{ loc: string; lastmod?: string }>): string {
  const lines: string[] = [];

  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');

  for (const sitemap of sitemaps) {
    lines.push('  <sitemap>');
    lines.push(`    <loc>${escapeXml(sitemap.loc)}</loc>`);
    if (sitemap.lastmod) {
      lines.push(`    <lastmod>${sitemap.lastmod}</lastmod>`);
    }
    lines.push('  </sitemap>');
  }

  lines.push('</sitemapindex>');

  return lines.join('\n');
}

/**
 * Generate AI-optimized sitemap for a shop
 */
export async function generateShopSitemap(
  shopDomain: string,
  config: SitemapConfig = DEFAULT_SITEMAP_CONFIG
): Promise<{
  sitemap: string;
  urlCount: number;
  imageCount: number;
}> {
  logger.info({ shopDomain }, 'Generating sitemap');

  const urls: SitemapUrl[] = [];
  let imageCount = 0;

  // Get shop info (validate access)
  await fetchShopInfo(shopDomain);
  const domain = shopDomain.includes('.myshopify.com')
    ? shopDomain
    : `${shopDomain}.myshopify.com`;

  // Add homepage
  urls.push({
    loc: `https://${domain}/`,
    changefreq: 'daily',
    priority: 1.0,
  });

  // Add products
  if (config.includeProducts) {
    const productsResponse = await fetchProducts(shopDomain, 250);

    for (const product of productsResponse.products.nodes) {
      const productUrl: SitemapUrl = {
        loc: `https://${domain}/products/${product.handle}`,
        changefreq: config.defaultChangefreq,
        priority: config.productPriority,
      };

      // Add product images
      if (product.images.nodes.length > 0) {
        productUrl.images = product.images.nodes.map(img => ({
          loc: img.url,
          title: product.title,
          caption: img.altText || product.title,
        }));
        imageCount += product.images.nodes.length;
      }

      urls.push(productUrl);
    }
  }

  // Add collections page
  if (config.includeCollections) {
    urls.push({
      loc: `https://${domain}/collections`,
      changefreq: 'weekly',
      priority: config.collectionPriority,
    });

    urls.push({
      loc: `https://${domain}/collections/all`,
      changefreq: 'daily',
      priority: config.collectionPriority,
    });
  }

  // Add standard pages
  if (config.includePages) {
    const standardPages = ['about', 'contact', 'faq', 'shipping', 'returns', 'privacy-policy', 'terms-of-service'];

    for (const page of standardPages) {
      urls.push({
        loc: `https://${domain}/pages/${page}`,
        changefreq: 'monthly',
        priority: config.pagePriority,
      });
    }
  }

  // Add blog
  if (config.includeBlog) {
    urls.push({
      loc: `https://${domain}/blogs/news`,
      changefreq: 'weekly',
      priority: 0.6,
    });
  }

  // Generate XML
  const sitemap = generateSitemapXml(urls);

  // Log the generation
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: { id: true },
  });

  if (shop) {
    await prisma.auditLog.create({
      data: {
        shopId: shop.id,
        action: 'sitemap_generated',
        details: {
          urlCount: urls.length,
          imageCount,
          includeProducts: config.includeProducts,
          includeCollections: config.includeCollections,
          includePages: config.includePages,
          includeBlog: config.includeBlog,
        },
      },
    });
  }

  logger.info({ shopDomain, urlCount: urls.length, imageCount }, 'Sitemap generated');

  return {
    sitemap,
    urlCount: urls.length,
    imageCount,
  };
}

/**
 * Validate URL to prevent SSRF attacks
 */
function validateSitemapUrl(urlString: string): URL {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    throw new Error('Invalid URL format');
  }

  // Only allow HTTPS
  if (url.protocol !== 'https:') {
    throw new Error('Only HTTPS URLs are allowed');
  }

  // Block internal/private IPs and localhost
  const hostname = url.hostname.toLowerCase();
  const blockedPatterns = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '10.',
    '192.168.',
    '172.16.',
    '172.17.',
    '172.18.',
    '172.19.',
    '172.20.',
    '172.21.',
    '172.22.',
    '172.23.',
    '172.24.',
    '172.25.',
    '172.26.',
    '172.27.',
    '172.28.',
    '172.29.',
    '172.30.',
    '172.31.',
    '169.254.',
    '[::1]',
    'internal',
  ];

  if (blockedPatterns.some(p => hostname.includes(p))) {
    throw new Error('Internal URLs are not allowed');
  }

  return url;
}

/**
 * Analyze existing sitemap for issues
 * SECURITY: Validates URL to prevent SSRF attacks
 */
export async function analyzeSitemap(sitemapUrl: string): Promise<{
  isValid: boolean;
  urlCount: number;
  issues: string[];
  suggestions: string[];
  score: number;
}> {
  const issues: string[] = [];
  const suggestions: string[] = [];

  try {
    // Validate URL before making request (SSRF protection)
    const validatedUrl = validateSitemapUrl(sitemapUrl);

    const response = await fetch(validatedUrl.toString(), {
      headers: {
        'User-Agent': 'Surfaced/1.0 (Sitemap Analyzer)',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return {
        isValid: false,
        urlCount: 0,
        issues: [`Sitemap not accessible: HTTP ${response.status}`],
        suggestions: ['Ensure your sitemap is publicly accessible'],
        score: 0,
      };
    }

    const content = await response.text();

    // Basic XML validation
    if (!content.includes('<?xml') || !content.includes('<urlset')) {
      issues.push('Invalid sitemap format');
    }

    // Count URLs
    const urlMatches = content.match(/<url>/g);
    const urlCount = urlMatches ? urlMatches.length : 0;

    if (urlCount === 0) {
      issues.push('Sitemap contains no URLs');
    }

    // Check for images
    const hasImages = content.includes('<image:image>');
    if (!hasImages) {
      suggestions.push('Add image sitemap entries to help search engines discover your product images');
    }

    // Check for lastmod
    const hasLastmod = content.includes('<lastmod>');
    if (!hasLastmod) {
      suggestions.push('Add lastmod dates to help crawlers prioritize fresh content');
    }

    // Check for priority
    const hasPriority = content.includes('<priority>');
    if (!hasPriority) {
      suggestions.push('Add priority values to indicate page importance');
    }

    // Check size
    if (content.length > 50 * 1024 * 1024) {
      issues.push('Sitemap exceeds 50MB limit');
    }

    if (urlCount > 50000) {
      issues.push('Sitemap exceeds 50,000 URL limit');
      suggestions.push('Split into multiple sitemaps with a sitemap index');
    }

    // Calculate score
    let score = 100;
    score -= issues.length * 20;
    score -= suggestions.length * 5;
    score = Math.max(0, Math.min(100, score));

    return {
      isValid: issues.filter(i => i.includes('Invalid') || i.includes('not accessible')).length === 0,
      urlCount,
      issues,
      suggestions,
      score,
    };
  } catch (error) {
    logger.error({ error, sitemapUrl }, 'Failed to analyze sitemap');
    return {
      isValid: false,
      urlCount: 0,
      issues: ['Failed to fetch or parse sitemap'],
      suggestions: ['Check that the sitemap URL is correct and accessible'],
      score: 0,
    };
  }
}
