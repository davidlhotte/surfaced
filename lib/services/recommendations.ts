import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/monitoring/logger';

export type RecommendationCategory =
  | 'content'
  | 'seo'
  | 'structure'
  | 'visibility'
  | 'competitive';

export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low';

export type Recommendation = {
  id: string;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  title: string;
  description: string;
  impact: string;
  actionUrl?: string;
  actionLabel?: string;
  estimatedImpact: number; // Expected score improvement (0-20)
  effortLevel: 'easy' | 'medium' | 'hard';
  affectedProducts?: number;
  metadata?: Record<string, unknown>;
};

export type RecommendationSummary = {
  totalRecommendations: number;
  byPriority: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  byCategory: Record<RecommendationCategory, number>;
  estimatedTotalImpact: number;
  topRecommendations: Recommendation[];
  allRecommendations: Recommendation[];
};

/**
 * Generate personalized recommendations for a shop
 */
export async function generateRecommendations(
  shopDomain: string
): Promise<RecommendationSummary> {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: {
      id: true,
      aiScore: true,
      productsCount: true,
      plan: true,
      productsAudit: {
        select: {
          shopifyProductId: true,
          title: true,
          aiScore: true,
          issues: true,
          hasImages: true,
          hasDescription: true,
          descriptionLength: true,
        },
      },
      visibilityChecks: {
        where: {
          checkedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          isMentioned: true,
          platform: true,
        },
      },
      competitors: {
        where: { isActive: true },
        select: { id: true },
      },
    },
  });

  if (!shop) {
    throw new Error('Shop not found');
  }

  const recommendations: Recommendation[] = [];
  let recommendationId = 1;

  // Analyze products and generate recommendations
  const productsWithoutImages = shop.productsAudit.filter((p) => !p.hasImages);
  const productsWithoutDescription = shop.productsAudit.filter((p) => !p.hasDescription);
  const productsWithShortDescription = shop.productsAudit.filter(
    (p) => p.hasDescription && p.descriptionLength < 150
  );
  const productsWithLowScore = shop.productsAudit.filter((p) => p.aiScore < 40);

  // Critical: Products without images
  if (productsWithoutImages.length > 0) {
    recommendations.push({
      id: `rec_${recommendationId++}`,
      category: 'content',
      priority: 'critical',
      title: 'Add images to products',
      description: `${productsWithoutImages.length} product${productsWithoutImages.length > 1 ? 's have' : ' has'} no images. AI assistants heavily rely on visual content to understand and recommend products.`,
      impact: 'Products with images are 3x more likely to be recommended by AI.',
      actionUrl: '/admin/products',
      actionLabel: 'View Products',
      estimatedImpact: 15,
      effortLevel: 'medium',
      affectedProducts: productsWithoutImages.length,
      metadata: {
        productIds: productsWithoutImages.slice(0, 10).map((p) => p.shopifyProductId.toString()),
      },
    });
  }

  // Critical: Products without descriptions
  if (productsWithoutDescription.length > 0) {
    recommendations.push({
      id: `rec_${recommendationId++}`,
      category: 'content',
      priority: 'critical',
      title: 'Add descriptions to products',
      description: `${productsWithoutDescription.length} product${productsWithoutDescription.length > 1 ? 's have' : ' has'} no description. AI cannot understand or recommend products without text content.`,
      impact: 'Descriptions are essential for AI to understand your products.',
      actionUrl: '/admin/optimize',
      actionLabel: 'Use AI Optimizer',
      estimatedImpact: 20,
      effortLevel: 'medium',
      affectedProducts: productsWithoutDescription.length,
    });
  }

  // High: Short descriptions
  if (productsWithShortDescription.length > 0) {
    recommendations.push({
      id: `rec_${recommendationId++}`,
      category: 'content',
      priority: 'high',
      title: 'Expand short descriptions',
      description: `${productsWithShortDescription.length} product${productsWithShortDescription.length > 1 ? 's have' : ' has'} descriptions under 150 characters. Longer, detailed descriptions help AI understand product features better.`,
      impact: 'Detailed descriptions improve AI understanding by up to 40%.',
      actionUrl: '/admin/optimize',
      actionLabel: 'Optimize Content',
      estimatedImpact: 10,
      effortLevel: 'easy',
      affectedProducts: productsWithShortDescription.length,
    });
  }

  // Analyze visibility data
  const totalChecks = shop.visibilityChecks.length;
  const mentionedChecks = shop.visibilityChecks.filter((c) => c.isMentioned).length;
  const mentionRate = totalChecks > 0 ? (mentionedChecks / totalChecks) * 100 : 0;

  // High: Low visibility
  if (totalChecks > 0 && mentionRate < 30) {
    recommendations.push({
      id: `rec_${recommendationId++}`,
      category: 'visibility',
      priority: 'high',
      title: 'Improve AI visibility',
      description: `Your brand is only mentioned in ${Math.round(mentionRate)}% of AI searches. This is below the recommended 50% threshold.`,
      impact: 'Higher visibility directly correlates with more organic traffic.',
      actionUrl: '/admin/visibility',
      actionLabel: 'Check Visibility',
      estimatedImpact: 15,
      effortLevel: 'medium',
    });
  }

  // Medium: No visibility checks
  if (totalChecks === 0) {
    recommendations.push({
      id: `rec_${recommendationId++}`,
      category: 'visibility',
      priority: 'medium',
      title: 'Run visibility checks',
      description: 'You have not run any AI visibility checks. Understanding where you appear in AI searches is crucial for optimization.',
      impact: 'Visibility data helps prioritize optimization efforts.',
      actionUrl: '/admin/visibility',
      actionLabel: 'Check Visibility',
      estimatedImpact: 5,
      effortLevel: 'easy',
    });
  }

  // Medium: No competitors tracked
  if (shop.competitors.length === 0) {
    recommendations.push({
      id: `rec_${recommendationId++}`,
      category: 'competitive',
      priority: 'medium',
      title: 'Track competitors',
      description: 'You are not tracking any competitors. Understanding how competitors appear in AI results helps identify opportunities.',
      impact: 'Competitor insights help you find gaps in their strategy.',
      actionUrl: '/admin/competitors',
      actionLabel: 'Add Competitors',
      estimatedImpact: 5,
      effortLevel: 'easy',
    });
  }

  // Analyze issue patterns
  const issueCounts: Record<string, number> = {};
  for (const product of shop.productsAudit) {
    const issues = product.issues as Array<{ code: string }>;
    for (const issue of issues) {
      issueCounts[issue.code] = (issueCounts[issue.code] || 0) + 1;
    }
  }

  // SEO recommendations based on common issues
  if (issueCounts['MISSING_SEO_TITLE'] > 5) {
    recommendations.push({
      id: `rec_${recommendationId++}`,
      category: 'seo',
      priority: 'high',
      title: 'Add SEO titles',
      description: `${issueCounts['MISSING_SEO_TITLE']} products are missing SEO titles. Custom titles help AI understand product relevance.`,
      impact: 'SEO titles improve search ranking and AI understanding.',
      actionUrl: '/admin/optimize',
      actionLabel: 'Optimize SEO',
      estimatedImpact: 8,
      effortLevel: 'easy',
      affectedProducts: issueCounts['MISSING_SEO_TITLE'],
    });
  }

  if (issueCounts['MISSING_SEO_DESCRIPTION'] > 5) {
    recommendations.push({
      id: `rec_${recommendationId++}`,
      category: 'seo',
      priority: 'medium',
      title: 'Add SEO descriptions',
      description: `${issueCounts['MISSING_SEO_DESCRIPTION']} products are missing SEO descriptions. Meta descriptions help AI summarize your products.`,
      impact: 'Better meta descriptions improve click-through rates.',
      actionUrl: '/admin/optimize',
      actionLabel: 'Optimize SEO',
      estimatedImpact: 6,
      effortLevel: 'easy',
      affectedProducts: issueCounts['MISSING_SEO_DESCRIPTION'],
    });
  }

  // Structure recommendations
  if (issueCounts['NO_PRODUCT_TYPE'] > 10) {
    recommendations.push({
      id: `rec_${recommendationId++}`,
      category: 'structure',
      priority: 'medium',
      title: 'Categorize products',
      description: `${issueCounts['NO_PRODUCT_TYPE']} products have no product type set. Categories help AI organize and find products.`,
      impact: 'Proper categorization improves product discoverability.',
      estimatedImpact: 5,
      effortLevel: 'medium',
      affectedProducts: issueCounts['NO_PRODUCT_TYPE'],
    });
  }

  if (issueCounts['NO_TAGS'] > 10) {
    recommendations.push({
      id: `rec_${recommendationId++}`,
      category: 'structure',
      priority: 'low',
      title: 'Add product tags',
      description: `${issueCounts['NO_TAGS']} products have no tags. Tags help AI find products for specific queries.`,
      impact: 'Tags improve product matching for niche queries.',
      actionUrl: '/admin/optimize',
      actionLabel: 'Add Tags',
      estimatedImpact: 4,
      effortLevel: 'easy',
      affectedProducts: issueCounts['NO_TAGS'],
    });
  }

  // Sort by priority and impact
  const priorityOrder: Record<RecommendationPriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  recommendations.sort((a, b) => {
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.estimatedImpact - a.estimatedImpact;
  });

  // Build summary
  const byPriority = {
    critical: recommendations.filter((r) => r.priority === 'critical').length,
    high: recommendations.filter((r) => r.priority === 'high').length,
    medium: recommendations.filter((r) => r.priority === 'medium').length,
    low: recommendations.filter((r) => r.priority === 'low').length,
  };

  const byCategory: Record<RecommendationCategory, number> = {
    content: recommendations.filter((r) => r.category === 'content').length,
    seo: recommendations.filter((r) => r.category === 'seo').length,
    structure: recommendations.filter((r) => r.category === 'structure').length,
    visibility: recommendations.filter((r) => r.category === 'visibility').length,
    competitive: recommendations.filter((r) => r.category === 'competitive').length,
  };

  const estimatedTotalImpact = Math.min(
    100 - (shop.aiScore || 0),
    recommendations.reduce((sum, r) => sum + r.estimatedImpact, 0)
  );

  logger.info(
    { shopDomain, totalRecommendations: recommendations.length },
    'Recommendations generated'
  );

  return {
    totalRecommendations: recommendations.length,
    byPriority,
    byCategory,
    estimatedTotalImpact,
    topRecommendations: recommendations.slice(0, 5),
    allRecommendations: recommendations,
  };
}

/**
 * Get quick wins (easy + high impact recommendations)
 */
export async function getQuickWins(shopDomain: string): Promise<Recommendation[]> {
  const summary = await generateRecommendations(shopDomain);

  return summary.allRecommendations
    .filter((r) => r.effortLevel === 'easy' && r.estimatedImpact >= 5)
    .slice(0, 3);
}
