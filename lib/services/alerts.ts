import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/monitoring/logger';

// Alert types
export type AlertType =
  | 'score_drop'           // AI score dropped significantly
  | 'visibility_issue'     // Not mentioned in AI search
  | 'weekly_report'        // Weekly summary
  | 'critical_issues'      // Products have critical issues
  | 'optimization_tip';    // Suggestion for improvement

export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Alert {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  readAt?: Date;
}

export interface AlertPreferences {
  emailAlerts: boolean;
  weeklyReport: boolean;
  scoreDropThreshold: number;   // Alert when score drops by this amount
  criticalAlertsOnly: boolean;  // Only send high/critical priority alerts
}

/**
 * Check for score drops and create alerts
 */
export async function checkForScoreDrops(shopDomain: string): Promise<Alert[]> {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: {
      id: true,
      aiScore: true,
      settings: {
        select: {
          emailAlerts: true,
        },
      },
    },
  });

  if (!shop) {
    return [];
  }

  const alerts: Alert[] = [];

  // Get the previous audit log to compare scores
  const previousAudits = await prisma.auditLog.findMany({
    where: {
      shopId: shop.id,
      action: 'audit_completed',
    },
    orderBy: { createdAt: 'desc' },
    take: 2,
  });

  if (previousAudits.length >= 2) {
    const currentDetails = previousAudits[0].details as { averageScore?: number } | null;
    const previousDetails = previousAudits[1].details as { averageScore?: number } | null;

    const currentScore = currentDetails?.averageScore ?? shop.aiScore ?? 0;
    const previousScore = previousDetails?.averageScore ?? 0;

    // Check if score dropped significantly (10+ points)
    if (previousScore - currentScore >= 10) {
      alerts.push({
        id: `score_drop_${Date.now()}`,
        type: 'score_drop',
        priority: previousScore - currentScore >= 20 ? 'critical' : 'high',
        title: 'AI Readiness Score Dropped',
        message: `Your AI readiness score dropped from ${previousScore} to ${currentScore} (-${previousScore - currentScore} points). This may affect how AI assistants recommend your products.`,
        actionUrl: '/admin/audit',
        actionLabel: 'View Audit',
        metadata: {
          previousScore,
          currentScore,
          drop: previousScore - currentScore,
        },
        createdAt: new Date(),
      });
    }
  }

  return alerts;
}

/**
 * Check for visibility issues and create alerts
 */
export async function checkForVisibilityIssues(shopDomain: string): Promise<Alert[]> {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: {
      id: true,
      name: true,
    },
  });

  if (!shop) {
    return [];
  }

  const alerts: Alert[] = [];

  // Get recent visibility checks
  const recentChecks = await prisma.visibilityCheck.findMany({
    where: {
      shopId: shop.id,
      checkedAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      },
    },
    orderBy: { checkedAt: 'desc' },
  });

  if (recentChecks.length > 0) {
    const mentionedCount = recentChecks.filter((c) => c.isMentioned).length;
    const totalChecks = recentChecks.length;
    const mentionRate = (mentionedCount / totalChecks) * 100;

    // Alert if mention rate is below 30%
    if (mentionRate < 30) {
      alerts.push({
        id: `visibility_issue_${Date.now()}`,
        type: 'visibility_issue',
        priority: mentionRate === 0 ? 'critical' : 'high',
        title: 'Low AI Visibility Detected',
        message: mentionRate === 0
          ? `${shop.name || 'Your brand'} was not mentioned in any of the ${totalChecks} AI searches in the last 7 days. Consider improving your product content and SEO.`
          : `${shop.name || 'Your brand'} was only mentioned in ${mentionedCount} of ${totalChecks} AI searches (${Math.round(mentionRate)}%). This is below the recommended threshold.`,
        actionUrl: '/admin/visibility',
        actionLabel: 'Check Visibility',
        metadata: {
          mentionedCount,
          totalChecks,
          mentionRate,
        },
        createdAt: new Date(),
      });
    }
  }

  return alerts;
}

/**
 * Check for critical product issues
 */
export async function checkForCriticalIssues(shopDomain: string): Promise<Alert[]> {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: { id: true },
  });

  if (!shop) {
    return [];
  }

  const alerts: Alert[] = [];

  // Count products with critical scores
  const criticalProducts = await prisma.productAudit.count({
    where: {
      shopId: shop.id,
      aiScore: { lt: 40 },
    },
  });

  if (criticalProducts > 0) {
    alerts.push({
      id: `critical_issues_${Date.now()}`,
      type: 'critical_issues',
      priority: criticalProducts > 10 ? 'critical' : 'high',
      title: 'Products with Critical Issues',
      message: `${criticalProducts} product${criticalProducts !== 1 ? 's have' : ' has'} critical AI readiness issues (score below 40). These products are unlikely to be recommended by AI assistants.`,
      actionUrl: '/admin/audit',
      actionLabel: 'Fix Issues',
      metadata: {
        criticalCount: criticalProducts,
      },
      createdAt: new Date(),
    });
  }

  return alerts;
}

/**
 * Generate weekly report data
 */
export async function generateWeeklyReport(shopDomain: string): Promise<{
  period: { start: Date; end: Date };
  metrics: {
    aiScore: number;
    scoreChange: number;
    productsAudited: number;
    criticalIssues: number;
    visibilityChecks: number;
    mentionRate: number;
  };
  topIssues: { code: string; count: number }[];
  recommendations: string[];
} | null> {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: {
      id: true,
      aiScore: true,
      plan: true,
    },
  });

  if (!shop) {
    return null;
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const now = new Date();

  // Get current metrics
  const productsAudited = await prisma.productAudit.count({
    where: { shopId: shop.id },
  });

  const criticalProducts = await prisma.productAudit.count({
    where: {
      shopId: shop.id,
      aiScore: { lt: 40 },
    },
  });

  // Get visibility data
  const visibilityChecks = await prisma.visibilityCheck.findMany({
    where: {
      shopId: shop.id,
      checkedAt: { gte: weekAgo },
    },
  });

  const mentionedCount = visibilityChecks.filter((c) => c.isMentioned).length;
  const mentionRate = visibilityChecks.length > 0
    ? (mentionedCount / visibilityChecks.length) * 100
    : 0;

  // Get score change
  const previousAudit = await prisma.auditLog.findFirst({
    where: {
      shopId: shop.id,
      action: 'audit_completed',
      createdAt: { lt: weekAgo },
    },
    orderBy: { createdAt: 'desc' },
  });

  const previousDetails = previousAudit?.details as { averageScore?: number } | null;
  const previousScore = previousDetails?.averageScore ?? shop.aiScore ?? 0;
  const currentScore = shop.aiScore ?? 0;
  const scoreChange = currentScore - previousScore;

  // Get top issues
  const productsWithIssues = await prisma.productAudit.findMany({
    where: { shopId: shop.id },
    select: { issues: true },
  });

  const issueCounts: Record<string, number> = {};
  for (const product of productsWithIssues) {
    const issues = product.issues as Array<{ code: string }>;
    for (const issue of issues) {
      issueCounts[issue.code] = (issueCounts[issue.code] || 0) + 1;
    }
  }

  const topIssues = Object.entries(issueCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([code, count]) => ({ code, count }));

  // Generate recommendations
  const recommendations: string[] = [];

  if (criticalProducts > 0) {
    recommendations.push(`Fix critical issues in ${criticalProducts} product${criticalProducts !== 1 ? 's' : ''} to improve AI visibility.`);
  }

  if (mentionRate < 50) {
    recommendations.push('Improve product descriptions and SEO to increase AI mention rate.');
  }

  if (topIssues.some((i) => i.code === 'NO_DESCRIPTION')) {
    recommendations.push('Add descriptions to products without any description text.');
  }

  if (topIssues.some((i) => i.code === 'NO_IMAGES')) {
    recommendations.push('Upload images for products that are missing visual content.');
  }

  if (shop.plan === 'FREE') {
    recommendations.push('Upgrade to a paid plan to audit more products and run more visibility checks.');
  }

  return {
    period: { start: weekAgo, end: now },
    metrics: {
      aiScore: currentScore,
      scoreChange,
      productsAudited,
      criticalIssues: criticalProducts,
      visibilityChecks: visibilityChecks.length,
      mentionRate,
    },
    topIssues,
    recommendations,
  };
}

/**
 * Get all active alerts for a shop
 */
export async function getActiveAlerts(shopDomain: string): Promise<Alert[]> {
  const alerts: Alert[] = [];

  // Run all alert checks
  const scoreAlerts = await checkForScoreDrops(shopDomain);
  const visibilityAlerts = await checkForVisibilityIssues(shopDomain);
  const criticalAlerts = await checkForCriticalIssues(shopDomain);

  alerts.push(...scoreAlerts, ...visibilityAlerts, ...criticalAlerts);

  // Sort by priority and date
  const priorityOrder: Record<AlertPriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  alerts.sort((a, b) => {
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return alerts;
}

/**
 * Get alert preferences for a shop
 */
export async function getAlertPreferences(shopDomain: string): Promise<AlertPreferences> {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: {
      settings: {
        select: {
          emailAlerts: true,
          weeklyReport: true,
        },
      },
    },
  });

  return {
    emailAlerts: shop?.settings?.emailAlerts ?? true,
    weeklyReport: shop?.settings?.weeklyReport ?? true,
    scoreDropThreshold: 10,
    criticalAlertsOnly: false,
  };
}

/**
 * Update alert preferences
 */
export async function updateAlertPreferences(
  shopDomain: string,
  preferences: Partial<Pick<AlertPreferences, 'emailAlerts' | 'weeklyReport'>>
): Promise<AlertPreferences> {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: { id: true },
  });

  if (!shop) {
    throw new Error('Shop not found');
  }

  await prisma.settings.upsert({
    where: { shopId: shop.id },
    update: preferences,
    create: {
      shopId: shop.id,
      ...preferences,
    },
  });

  logger.info({ shopDomain, preferences }, 'Updated alert preferences');

  return getAlertPreferences(shopDomain);
}

/**
 * Log an alert being sent (for tracking)
 */
export async function logAlertSent(
  shopDomain: string,
  alertType: AlertType,
  details?: Record<string, unknown>
): Promise<void> {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: { id: true },
  });

  if (!shop) {
    return;
  }

  await prisma.auditLog.create({
    data: {
      shopId: shop.id,
      action: `alert_${alertType}`,
      details: details ?? {},
    },
  });

  logger.info({ shopDomain, alertType }, 'Alert logged');
}
