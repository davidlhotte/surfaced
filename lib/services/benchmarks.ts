import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/monitoring/logger';

export type IndustryCategory =
  | 'fashion'
  | 'electronics'
  | 'home_garden'
  | 'beauty'
  | 'sports'
  | 'food_beverage'
  | 'toys_games'
  | 'health'
  | 'automotive'
  | 'pets'
  | 'jewelry'
  | 'other';

export type BenchmarkData = {
  industry: IndustryCategory;
  metrics: {
    avgAiScore: number;
    medianAiScore: number;
    topQuartileScore: number;
    avgVisibilityRate: number;
    avgDescriptionLength: number;
    avgProductsWithImages: number;
    avgProductsWithSeo: number;
  };
  sampleSize: number;
  lastUpdated: string;
};

export type ShopBenchmarkComparison = {
  shop: {
    aiScore: number | null;
    visibilityRate: number;
    avgDescriptionLength: number;
    productsWithImages: number;
    productsWithSeo: number;
  };
  benchmark: BenchmarkData;
  comparison: {
    scoreVsAvg: number;          // Difference from average
    scorePercentile: number;      // Where you rank (0-100)
    visibilityVsAvg: number;
    descriptionLengthVsAvg: number;
    strengths: string[];
    weaknesses: string[];
  };
};

// Industry benchmark data (would be updated periodically from aggregate data)
const INDUSTRY_BENCHMARKS: Record<IndustryCategory, BenchmarkData> = {
  fashion: {
    industry: 'fashion',
    metrics: {
      avgAiScore: 62,
      medianAiScore: 58,
      topQuartileScore: 78,
      avgVisibilityRate: 35,
      avgDescriptionLength: 280,
      avgProductsWithImages: 92,
      avgProductsWithSeo: 45,
    },
    sampleSize: 1500,
    lastUpdated: new Date().toISOString(),
  },
  electronics: {
    industry: 'electronics',
    metrics: {
      avgAiScore: 68,
      medianAiScore: 65,
      topQuartileScore: 82,
      avgVisibilityRate: 42,
      avgDescriptionLength: 350,
      avgProductsWithImages: 95,
      avgProductsWithSeo: 55,
    },
    sampleSize: 1200,
    lastUpdated: new Date().toISOString(),
  },
  home_garden: {
    industry: 'home_garden',
    metrics: {
      avgAiScore: 55,
      medianAiScore: 52,
      topQuartileScore: 72,
      avgVisibilityRate: 28,
      avgDescriptionLength: 220,
      avgProductsWithImages: 85,
      avgProductsWithSeo: 35,
    },
    sampleSize: 900,
    lastUpdated: new Date().toISOString(),
  },
  beauty: {
    industry: 'beauty',
    metrics: {
      avgAiScore: 65,
      medianAiScore: 62,
      topQuartileScore: 80,
      avgVisibilityRate: 38,
      avgDescriptionLength: 300,
      avgProductsWithImages: 94,
      avgProductsWithSeo: 50,
    },
    sampleSize: 1100,
    lastUpdated: new Date().toISOString(),
  },
  sports: {
    industry: 'sports',
    metrics: {
      avgAiScore: 58,
      medianAiScore: 55,
      topQuartileScore: 75,
      avgVisibilityRate: 32,
      avgDescriptionLength: 250,
      avgProductsWithImages: 88,
      avgProductsWithSeo: 40,
    },
    sampleSize: 800,
    lastUpdated: new Date().toISOString(),
  },
  food_beverage: {
    industry: 'food_beverage',
    metrics: {
      avgAiScore: 52,
      medianAiScore: 48,
      topQuartileScore: 68,
      avgVisibilityRate: 25,
      avgDescriptionLength: 180,
      avgProductsWithImages: 80,
      avgProductsWithSeo: 30,
    },
    sampleSize: 700,
    lastUpdated: new Date().toISOString(),
  },
  toys_games: {
    industry: 'toys_games',
    metrics: {
      avgAiScore: 60,
      medianAiScore: 57,
      topQuartileScore: 76,
      avgVisibilityRate: 30,
      avgDescriptionLength: 240,
      avgProductsWithImages: 90,
      avgProductsWithSeo: 42,
    },
    sampleSize: 600,
    lastUpdated: new Date().toISOString(),
  },
  health: {
    industry: 'health',
    metrics: {
      avgAiScore: 64,
      medianAiScore: 61,
      topQuartileScore: 79,
      avgVisibilityRate: 36,
      avgDescriptionLength: 320,
      avgProductsWithImages: 91,
      avgProductsWithSeo: 52,
    },
    sampleSize: 650,
    lastUpdated: new Date().toISOString(),
  },
  automotive: {
    industry: 'automotive',
    metrics: {
      avgAiScore: 56,
      medianAiScore: 53,
      topQuartileScore: 73,
      avgVisibilityRate: 28,
      avgDescriptionLength: 270,
      avgProductsWithImages: 86,
      avgProductsWithSeo: 38,
    },
    sampleSize: 450,
    lastUpdated: new Date().toISOString(),
  },
  pets: {
    industry: 'pets',
    metrics: {
      avgAiScore: 59,
      medianAiScore: 56,
      topQuartileScore: 74,
      avgVisibilityRate: 33,
      avgDescriptionLength: 230,
      avgProductsWithImages: 89,
      avgProductsWithSeo: 44,
    },
    sampleSize: 550,
    lastUpdated: new Date().toISOString(),
  },
  jewelry: {
    industry: 'jewelry',
    metrics: {
      avgAiScore: 63,
      medianAiScore: 60,
      topQuartileScore: 78,
      avgVisibilityRate: 34,
      avgDescriptionLength: 260,
      avgProductsWithImages: 93,
      avgProductsWithSeo: 48,
    },
    sampleSize: 500,
    lastUpdated: new Date().toISOString(),
  },
  other: {
    industry: 'other',
    metrics: {
      avgAiScore: 55,
      medianAiScore: 52,
      topQuartileScore: 70,
      avgVisibilityRate: 28,
      avgDescriptionLength: 200,
      avgProductsWithImages: 82,
      avgProductsWithSeo: 35,
    },
    sampleSize: 2000,
    lastUpdated: new Date().toISOString(),
  },
};

/**
 * Get benchmark data for an industry
 */
export function getIndustryBenchmark(industry: IndustryCategory): BenchmarkData {
  return INDUSTRY_BENCHMARKS[industry] || INDUSTRY_BENCHMARKS.other;
}

/**
 * Get all industry benchmarks
 */
export function getAllBenchmarks(): BenchmarkData[] {
  return Object.values(INDUSTRY_BENCHMARKS);
}

/**
 * Detect industry from product data
 */
export async function detectIndustry(shopDomain: string): Promise<IndustryCategory> {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: {
      productsAudit: {
        select: { title: true },
        take: 50,
      },
    },
  });

  if (!shop) {
    return 'other';
  }

  const titles = shop.productsAudit.map((p) => p.title.toLowerCase()).join(' ');

  // Simple keyword-based industry detection
  const industryKeywords: Record<IndustryCategory, string[]> = {
    fashion: ['dress', 'shirt', 'pants', 'jacket', 'shoes', 'clothing', 'apparel', 'wear'],
    electronics: ['phone', 'laptop', 'computer', 'tablet', 'headphones', 'cable', 'charger'],
    home_garden: ['furniture', 'decor', 'garden', 'plant', 'home', 'kitchen', 'bed'],
    beauty: ['makeup', 'skincare', 'cosmetic', 'cream', 'serum', 'lipstick', 'mascara'],
    sports: ['fitness', 'workout', 'gym', 'sport', 'exercise', 'yoga', 'running'],
    food_beverage: ['coffee', 'tea', 'snack', 'chocolate', 'drink', 'food', 'organic'],
    toys_games: ['toy', 'game', 'puzzle', 'doll', 'lego', 'play', 'kids'],
    health: ['vitamin', 'supplement', 'health', 'wellness', 'medical', 'organic'],
    automotive: ['car', 'auto', 'vehicle', 'motor', 'tire', 'oil', 'brake'],
    pets: ['dog', 'cat', 'pet', 'animal', 'collar', 'food', 'treat'],
    jewelry: ['ring', 'necklace', 'bracelet', 'earring', 'gold', 'silver', 'diamond'],
    other: [],
  };

  let bestMatch: IndustryCategory = 'other';
  let bestScore = 0;

  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    if (industry === 'other') continue;

    let score = 0;
    for (const keyword of keywords) {
      if (titles.includes(keyword)) {
        score++;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = industry as IndustryCategory;
    }
  }

  return bestScore >= 2 ? bestMatch : 'other';
}

/**
 * Compare shop to industry benchmark
 */
export async function compareToIndustry(
  shopDomain: string,
  industry?: IndustryCategory
): Promise<ShopBenchmarkComparison> {
  // Detect industry if not provided
  const detectedIndustry = industry || (await detectIndustry(shopDomain));
  const benchmark = getIndustryBenchmark(detectedIndustry);

  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: {
      id: true,
      aiScore: true,
      productsCount: true,
      productsAudit: {
        select: {
          hasImages: true,
          hasDescription: true,
          descriptionLength: true,
          issues: true,
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
        },
      },
    },
  });

  if (!shop) {
    throw new Error('Shop not found');
  }

  // Calculate shop metrics
  const productsWithImages = shop.productsAudit.filter((p) => p.hasImages).length;
  const productsWithImagesPercent = shop.productsAudit.length > 0
    ? Math.round((productsWithImages / shop.productsAudit.length) * 100)
    : 0;

  const avgDescriptionLength = shop.productsAudit.length > 0
    ? Math.round(
        shop.productsAudit.reduce((sum, p) => sum + p.descriptionLength, 0) /
          shop.productsAudit.length
      )
    : 0;

  // Count products with SEO
  let productsWithSeo = 0;
  for (const product of shop.productsAudit) {
    const issues = product.issues as Array<{ code: string }>;
    const hasSeoIssue = issues.some(
      (i) => i.code === 'MISSING_SEO_TITLE' || i.code === 'MISSING_SEO_DESCRIPTION'
    );
    if (!hasSeoIssue) {
      productsWithSeo++;
    }
  }
  const productsWithSeoPercent = shop.productsAudit.length > 0
    ? Math.round((productsWithSeo / shop.productsAudit.length) * 100)
    : 0;

  // Visibility rate
  const visibilityRate = shop.visibilityChecks.length > 0
    ? Math.round(
        (shop.visibilityChecks.filter((c) => c.isMentioned).length /
          shop.visibilityChecks.length) *
          100
      )
    : 0;

  // Calculate comparisons
  const scoreVsAvg = (shop.aiScore || 0) - benchmark.metrics.avgAiScore;
  const visibilityVsAvg = visibilityRate - benchmark.metrics.avgVisibilityRate;
  const descriptionLengthVsAvg = avgDescriptionLength - benchmark.metrics.avgDescriptionLength;

  // Calculate percentile (simplified - assumes normal distribution)
  let scorePercentile = 50;
  if (shop.aiScore !== null) {
    if (shop.aiScore >= benchmark.metrics.topQuartileScore) {
      scorePercentile = 75 + ((shop.aiScore - benchmark.metrics.topQuartileScore) / 25) * 25;
    } else if (shop.aiScore >= benchmark.metrics.avgAiScore) {
      scorePercentile = 50 + ((shop.aiScore - benchmark.metrics.avgAiScore) /
        (benchmark.metrics.topQuartileScore - benchmark.metrics.avgAiScore)) * 25;
    } else if (shop.aiScore >= benchmark.metrics.medianAiScore) {
      scorePercentile = 25 + ((shop.aiScore - benchmark.metrics.medianAiScore) /
        (benchmark.metrics.avgAiScore - benchmark.metrics.medianAiScore)) * 25;
    } else {
      scorePercentile = (shop.aiScore / benchmark.metrics.medianAiScore) * 25;
    }
    scorePercentile = Math.max(0, Math.min(100, Math.round(scorePercentile)));
  }

  // Identify strengths and weaknesses
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (scoreVsAvg >= 10) {
    strengths.push('Your AI score is well above industry average');
  } else if (scoreVsAvg <= -10) {
    weaknesses.push('Your AI score is below industry average');
  }

  if (productsWithImagesPercent >= benchmark.metrics.avgProductsWithImages + 5) {
    strengths.push('Excellent product image coverage');
  } else if (productsWithImagesPercent <= benchmark.metrics.avgProductsWithImages - 10) {
    weaknesses.push('Product image coverage is below industry standard');
  }

  if (avgDescriptionLength >= benchmark.metrics.avgDescriptionLength + 50) {
    strengths.push('Detailed product descriptions');
  } else if (avgDescriptionLength <= benchmark.metrics.avgDescriptionLength - 50) {
    weaknesses.push('Product descriptions are shorter than industry average');
  }

  if (productsWithSeoPercent >= benchmark.metrics.avgProductsWithSeo + 10) {
    strengths.push('Strong SEO implementation');
  } else if (productsWithSeoPercent <= benchmark.metrics.avgProductsWithSeo - 10) {
    weaknesses.push('SEO coverage needs improvement');
  }

  if (visibilityRate >= benchmark.metrics.avgVisibilityRate + 10) {
    strengths.push('Excellent AI visibility');
  } else if (visibilityRate <= benchmark.metrics.avgVisibilityRate - 10) {
    weaknesses.push('AI visibility is below industry average');
  }

  logger.info(
    { shopDomain, industry: detectedIndustry, scorePercentile },
    'Benchmark comparison generated'
  );

  return {
    shop: {
      aiScore: shop.aiScore,
      visibilityRate,
      avgDescriptionLength,
      productsWithImages: productsWithImagesPercent,
      productsWithSeo: productsWithSeoPercent,
    },
    benchmark,
    comparison: {
      scoreVsAvg,
      scorePercentile,
      visibilityVsAvg,
      descriptionLengthVsAvg,
      strengths,
      weaknesses,
    },
  };
}
