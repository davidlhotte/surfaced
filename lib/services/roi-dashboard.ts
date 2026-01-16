import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/monitoring/logger';

// Time period for analytics
export type TimePeriod = '7d' | '30d' | '90d' | '365d';

export interface TrendDataPoint {
  date: string;
  value: number;
}

export interface ScoreDistribution {
  excellent: number;  // 90-100
  good: number;       // 70-89
  needsWork: number;  // 40-69
  critical: number;   // 0-39
}

export interface VisibilityMetrics {
  totalChecks: number;
  mentioned: number;
  mentionRate: number;
  byPlatform: {
    platform: string;
    checks: number;
    mentioned: number;
    rate: number;
  }[];
}

export interface ROIMetrics {
  // Score metrics
  currentScore: number;
  scoreAtPeriodStart: number;
  scoreImprovement: number;
  scoreImprovementPercent: number;

  // Product metrics
  totalProducts: number;
  productsImproved: number;
  productsWithCriticalIssues: number;

  // Visibility metrics
  visibility: VisibilityMetrics;

  // Optimization metrics
  optimizationsUsed: number;

  // Trends
  scoreTrend: TrendDataPoint[];
  visibilityTrend: TrendDataPoint[];

  // Distribution
  scoreDistribution: ScoreDistribution;
}

/**
 * Get the start date for a time period
 */
function getPeriodStartDate(period: TimePeriod): Date {
  const now = new Date();
  switch (period) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case '365d':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

/**
 * Get ROI dashboard metrics for a shop
 */
export async function getROIMetrics(
  shopDomain: string,
  period: TimePeriod = '30d'
): Promise<ROIMetrics> {
  logger.info({ shopDomain, period }, 'Fetching ROI metrics');

  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: {
      id: true,
      aiScore: true,
      productsCount: true,
    },
  });

  if (!shop) {
    throw new Error('Shop not found');
  }

  const periodStart = getPeriodStartDate(period);
  const currentScore = shop.aiScore ?? 0;

  // Get score at period start from audit logs
  const oldestAudit = await prisma.auditLog.findFirst({
    where: {
      shopId: shop.id,
      action: 'audit_completed',
      createdAt: { gte: periodStart },
    },
    orderBy: { createdAt: 'asc' },
  });

  const oldestDetails = oldestAudit?.details as { averageScore?: number } | null;
  const scoreAtPeriodStart = oldestDetails?.averageScore ?? currentScore;
  const scoreImprovement = currentScore - scoreAtPeriodStart;
  const scoreImprovementPercent = scoreAtPeriodStart > 0
    ? Math.round((scoreImprovement / scoreAtPeriodStart) * 100)
    : 0;

  // Get product metrics
  const [totalProducts, criticalProducts, productAudits] = await Promise.all([
    prisma.productAudit.count({ where: { shopId: shop.id } }),
    prisma.productAudit.count({
      where: { shopId: shop.id, aiScore: { lt: 40 } },
    }),
    prisma.productAudit.findMany({
      where: { shopId: shop.id },
      select: { aiScore: true },
    }),
  ]);

  // Calculate score distribution
  const scoreDistribution: ScoreDistribution = {
    excellent: productAudits.filter((p) => p.aiScore >= 90).length,
    good: productAudits.filter((p) => p.aiScore >= 70 && p.aiScore < 90).length,
    needsWork: productAudits.filter((p) => p.aiScore >= 40 && p.aiScore < 70).length,
    critical: productAudits.filter((p) => p.aiScore < 40).length,
  };

  // Get visibility metrics
  const visibilityChecks = await prisma.visibilityCheck.findMany({
    where: {
      shopId: shop.id,
      checkedAt: { gte: periodStart },
    },
    select: {
      platform: true,
      isMentioned: true,
      checkedAt: true,
    },
  });

  const mentionedChecks = visibilityChecks.filter((c) => c.isMentioned);
  const mentionRate = visibilityChecks.length > 0
    ? Math.round((mentionedChecks.length / visibilityChecks.length) * 100)
    : 0;

  // Group by platform
  const platformStats: Record<string, { checks: number; mentioned: number }> = {};
  for (const check of visibilityChecks) {
    if (!platformStats[check.platform]) {
      platformStats[check.platform] = { checks: 0, mentioned: 0 };
    }
    platformStats[check.platform].checks++;
    if (check.isMentioned) {
      platformStats[check.platform].mentioned++;
    }
  }

  const byPlatform = Object.entries(platformStats).map(([platform, stats]) => ({
    platform,
    checks: stats.checks,
    mentioned: stats.mentioned,
    rate: stats.checks > 0 ? Math.round((stats.mentioned / stats.checks) * 100) : 0,
  }));

  // Get optimization count
  const optimizationsUsed = await prisma.auditLog.count({
    where: {
      shopId: shop.id,
      action: 'ai_optimization',
      createdAt: { gte: periodStart },
    },
  });

  // Generate score trend
  const scoreTrend = await generateScoreTrend(shop.id, period);

  // Generate visibility trend
  const visibilityTrend = await generateVisibilityTrend(shop.id, period);

  // Count improved products (products with score improvement in the period)
  // For now, we estimate based on score change
  const productsImproved = scoreImprovement > 0
    ? Math.round((scoreImprovement / 10) * totalProducts * 0.3)
    : 0;

  return {
    currentScore,
    scoreAtPeriodStart,
    scoreImprovement,
    scoreImprovementPercent,
    totalProducts,
    productsImproved: Math.min(productsImproved, totalProducts),
    productsWithCriticalIssues: criticalProducts,
    visibility: {
      totalChecks: visibilityChecks.length,
      mentioned: mentionedChecks.length,
      mentionRate,
      byPlatform,
    },
    optimizationsUsed,
    scoreTrend,
    visibilityTrend,
    scoreDistribution,
  };
}

/**
 * Generate score trend data points
 */
async function generateScoreTrend(
  shopId: string,
  period: TimePeriod
): Promise<TrendDataPoint[]> {
  const periodStart = getPeriodStartDate(period);

  // Get audit logs with scores
  const audits = await prisma.auditLog.findMany({
    where: {
      shopId,
      action: 'audit_completed',
      createdAt: { gte: periodStart },
    },
    orderBy: { createdAt: 'asc' },
    select: {
      createdAt: true,
      details: true,
    },
  });

  const trend: TrendDataPoint[] = [];

  for (const audit of audits) {
    const details = audit.details as { averageScore?: number } | null;
    if (details?.averageScore !== undefined) {
      trend.push({
        date: audit.createdAt.toISOString().split('T')[0],
        value: details.averageScore,
      });
    }
  }

  // If no data, return empty array
  if (trend.length === 0) {
    return [];
  }

  // Dedupe by date (keep last value per day)
  const byDate: Record<string, number> = {};
  for (const point of trend) {
    byDate[point.date] = point.value;
  }

  return Object.entries(byDate)
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Generate visibility trend data points
 */
async function generateVisibilityTrend(
  shopId: string,
  period: TimePeriod
): Promise<TrendDataPoint[]> {
  const periodStart = getPeriodStartDate(period);

  // Get visibility checks
  const checks = await prisma.visibilityCheck.findMany({
    where: {
      shopId,
      checkedAt: { gte: periodStart },
    },
    orderBy: { checkedAt: 'asc' },
    select: {
      checkedAt: true,
      isMentioned: true,
    },
  });

  // Group by date
  const byDate: Record<string, { mentioned: number; total: number }> = {};

  for (const check of checks) {
    const date = check.checkedAt.toISOString().split('T')[0];
    if (!byDate[date]) {
      byDate[date] = { mentioned: 0, total: 0 };
    }
    byDate[date].total++;
    if (check.isMentioned) {
      byDate[date].mentioned++;
    }
  }

  // Calculate daily mention rates
  return Object.entries(byDate)
    .map(([date, stats]) => ({
      date,
      value: stats.total > 0 ? Math.round((stats.mentioned / stats.total) * 100) : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get estimated ROI based on metrics
 */
export function calculateEstimatedROI(metrics: ROIMetrics): {
  visibilityIncrease: string;
  potentialReachIncrease: string;
  qualityImprovement: string;
} {
  // Calculate visibility increase
  let visibilityIncrease = '0%';
  if (metrics.visibility.totalChecks > 0) {
    // Compare current mention rate to industry average (estimated 20%)
    const industryAverage = 20;
    const improvement = metrics.visibility.mentionRate - industryAverage;
    if (improvement > 0) {
      visibilityIncrease = `+${improvement}% above average`;
    } else {
      visibilityIncrease = `${improvement}% vs average`;
    }
  }

  // Calculate potential reach increase
  const reachMultiplier = Math.max(1, metrics.scoreImprovement / 10);
  const potentialReachIncrease = metrics.scoreImprovement > 0
    ? `~${Math.round(reachMultiplier * 15)}% more AI recommendations`
    : 'No change';

  // Calculate quality improvement
  const excellentPercent = metrics.totalProducts > 0
    ? Math.round(((metrics.scoreDistribution.excellent + metrics.scoreDistribution.good) / metrics.totalProducts) * 100)
    : 0;
  const qualityImprovement = `${excellentPercent}% of products AI-ready`;

  return {
    visibilityIncrease,
    potentialReachIncrease,
    qualityImprovement,
  };
}
