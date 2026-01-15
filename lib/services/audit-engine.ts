import { prisma } from '@/lib/db/prisma';
import { fetchProducts, fetchShopInfo, fetchProductsCount, type ShopifyProduct } from '@/lib/shopify/graphql';
import { PLAN_LIMITS } from '@/lib/constants/plans';
import { logger } from '@/lib/monitoring/logger';
import type { Plan } from '@prisma/client';

export type AuditIssue = {
  type: 'critical' | 'warning' | 'info';
  code: string;
  message: string;
  field?: string;
};

export type ProductAuditResult = {
  shopifyProductId: string; // String representation of BigInt for JSON serialization
  title: string;
  handle: string;
  aiScore: number;
  issues: AuditIssue[];
  hasImages: boolean;
  hasDescription: boolean;
  hasMetafields: boolean;
  descriptionLength: number;
};

export type AuditResult = {
  totalProducts: number;
  auditedProducts: number;
  averageScore: number;
  issues: {
    critical: number;
    warning: number;
    info: number;
  };
  products: ProductAuditResult[];
};

function extractProductId(gid: string): string {
  // gid format: gid://shopify/Product/123456789
  // Returns string for JSON serialization, convert to BigInt when saving to DB
  const match = gid.match(/\/(\d+)$/);
  if (!match) throw new Error(`Invalid product GID: ${gid}`);
  return match[1];
}

function calculateProductScore(product: ShopifyProduct): ProductAuditResult {
  const issues: AuditIssue[] = [];
  let score = 100;

  const description = product.description || '';
  const descriptionLength = description.length;
  const hasImages = product.images.nodes.length > 0;
  const hasDescription = descriptionLength > 0;
  const hasMetafields = product.metafields.nodes.length > 0;

  // Critical issues (heavy penalties)
  if (!hasDescription) {
    issues.push({
      type: 'critical',
      code: 'NO_DESCRIPTION',
      message: 'Product has no description. AI cannot recommend products without descriptions.',
      field: 'description',
    });
    score -= 40;
  } else if (descriptionLength < 50) {
    issues.push({
      type: 'critical',
      code: 'SHORT_DESCRIPTION',
      message: `Description is too short (${descriptionLength} chars). Aim for at least 150 characters.`,
      field: 'description',
    });
    score -= 25;
  } else if (descriptionLength < 150) {
    issues.push({
      type: 'warning',
      code: 'BRIEF_DESCRIPTION',
      message: `Description could be longer (${descriptionLength} chars). 200+ characters recommended.`,
      field: 'description',
    });
    score -= 10;
  }

  if (!hasImages) {
    issues.push({
      type: 'critical',
      code: 'NO_IMAGES',
      message: 'Product has no images. Visual content helps AI understand your product.',
      field: 'images',
    });
    score -= 30;
  }

  // Warning issues (medium penalties)
  const imagesWithoutAlt = product.images.nodes.filter((img) => !img.altText);
  if (imagesWithoutAlt.length > 0 && hasImages) {
    issues.push({
      type: 'warning',
      code: 'MISSING_ALT_TEXT',
      message: `${imagesWithoutAlt.length} image(s) missing alt text. Alt text helps AI understand images.`,
      field: 'images',
    });
    score -= 5 * Math.min(imagesWithoutAlt.length, 3);
  }

  if (!product.seo.title) {
    issues.push({
      type: 'warning',
      code: 'NO_SEO_TITLE',
      message: 'No SEO title set. Custom SEO titles help AI understand your product better.',
      field: 'seo.title',
    });
    score -= 5;
  }

  if (!product.seo.description) {
    issues.push({
      type: 'warning',
      code: 'NO_SEO_DESCRIPTION',
      message: 'No SEO description set. Meta descriptions provide context to AI.',
      field: 'seo.description',
    });
    score -= 5;
  }

  if (!product.productType) {
    issues.push({
      type: 'warning',
      code: 'NO_PRODUCT_TYPE',
      message: 'No product type set. Product categorization helps AI recommendations.',
      field: 'productType',
    });
    score -= 5;
  }

  if (product.tags.length === 0) {
    issues.push({
      type: 'warning',
      code: 'NO_TAGS',
      message: 'No tags set. Tags help AI understand product attributes.',
      field: 'tags',
    });
    score -= 5;
  }

  // Info issues (minor suggestions)
  if (!hasMetafields) {
    issues.push({
      type: 'info',
      code: 'NO_METAFIELDS',
      message: 'Consider adding custom metafields for richer product data.',
      field: 'metafields',
    });
    score -= 2;
  }

  if (!product.vendor) {
    issues.push({
      type: 'info',
      code: 'NO_VENDOR',
      message: 'No vendor set. Brand information can improve AI recommendations.',
      field: 'vendor',
    });
    score -= 2;
  }

  // Bonus points for good practices
  if (descriptionLength >= 300) {
    score += 5; // Bonus for rich descriptions
  }

  if (product.images.nodes.length >= 3) {
    score += 3; // Bonus for multiple images
  }

  if (product.tags.length >= 5) {
    score += 2; // Bonus for good tagging
  }

  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));

  return {
    shopifyProductId: extractProductId(product.id),
    title: product.title,
    handle: product.handle,
    aiScore: score,
    issues,
    hasImages,
    hasDescription,
    hasMetafields,
    descriptionLength,
  };
}

export async function runAudit(shopDomain: string): Promise<AuditResult> {
  logger.info({ shopDomain }, 'Starting AI readiness audit');

  // Get shop info and determine limits
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: { id: true, plan: true },
  });

  if (!shop) {
    logger.error({ shopDomain }, 'Shop not found in database');
    throw new Error('Shop not found');
  }

  logger.info({ shopDomain, shopId: shop.id, plan: shop.plan }, 'Shop found in database');

  const planLimits = PLAN_LIMITS[shop.plan as Plan];
  const maxProducts = planLimits.productsAudited;

  logger.info({ shopDomain, maxProducts }, 'Fetching shop info from Shopify');

  // Fetch shop info
  let shopInfo;
  try {
    shopInfo = await fetchShopInfo(shopDomain);
    logger.info({ shopDomain, shopName: shopInfo.shop.name }, 'Shop info fetched successfully');
  } catch (error) {
    logger.error({ shopDomain, error: error instanceof Error ? error.message : 'Unknown' }, 'Failed to fetch shop info');
    throw error;
  }

  // Get product count (separate query since Shopify doesn't expose totalCount)
  let totalProducts: number;
  try {
    totalProducts = await fetchProductsCount(shopDomain);
    logger.info({ shopDomain, totalProducts }, 'Product count fetched successfully');
  } catch (error) {
    logger.error({ shopDomain, error: error instanceof Error ? error.message : 'Unknown' }, 'Failed to fetch product count');
    throw error;
  }

  // Fetch products (up to plan limit)
  const productsResponse = await fetchProducts(shopDomain, Math.min(maxProducts, 50));
  const products = productsResponse.products.nodes;

  // Audit each product
  const auditResults = products.map(calculateProductScore);

  // Calculate statistics
  const averageScore =
    auditResults.length > 0
      ? Math.round(
          auditResults.reduce((sum, p) => sum + p.aiScore, 0) / auditResults.length
        )
      : 0;

  const issuesCounts = {
    critical: auditResults.filter((p) => p.aiScore < 40).length,
    warning: auditResults.filter((p) => p.aiScore >= 40 && p.aiScore < 70).length,
    info: auditResults.filter((p) => p.aiScore >= 70 && p.aiScore < 90).length,
  };

  // Save audit results to database
  const now = new Date();

  // Upsert each product audit
  for (const result of auditResults) {
    // Convert string productId back to BigInt for database storage
    const productIdBigInt = BigInt(result.shopifyProductId);

    await prisma.productAudit.upsert({
      where: {
        shopId_shopifyProductId: {
          shopId: shop.id,
          shopifyProductId: productIdBigInt,
        },
      },
      update: {
        title: result.title,
        handle: result.handle,
        aiScore: result.aiScore,
        issues: result.issues,
        hasImages: result.hasImages,
        hasDescription: result.hasDescription,
        hasMetafields: result.hasMetafields,
        descriptionLength: result.descriptionLength,
        lastAuditAt: now,
      },
      create: {
        shopId: shop.id,
        shopifyProductId: productIdBigInt,
        title: result.title,
        handle: result.handle,
        aiScore: result.aiScore,
        issues: result.issues,
        hasImages: result.hasImages,
        hasDescription: result.hasDescription,
        hasMetafields: result.hasMetafields,
        descriptionLength: result.descriptionLength,
        lastAuditAt: now,
      },
    });
  }

  // Update shop-level metrics
  await prisma.shop.update({
    where: { shopDomain },
    data: {
      productsCount: totalProducts,
      aiScore: averageScore,
      lastAuditAt: now,
      name: shopInfo.shop.name,
      email: shopInfo.shop.email,
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      shopId: shop.id,
      action: 'audit_completed',
      details: {
        totalProducts,
        auditedProducts: auditResults.length,
        averageScore,
        issues: issuesCounts,
      },
    },
  });

  logger.info(
    { shopDomain, auditedProducts: auditResults.length, averageScore },
    'Audit completed'
  );

  return {
    totalProducts,
    auditedProducts: auditResults.length,
    averageScore,
    issues: issuesCounts,
    products: auditResults,
  };
}
