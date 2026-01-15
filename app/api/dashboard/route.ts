import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { handleApiError } from '@/lib/utils/errors';
import { getShopFromRequest } from '@/lib/shopify/get-shop';
import { PLAN_LIMITS } from '@/lib/constants/plans';
import { logger } from '@/lib/monitoring/logger';

export async function GET(request: NextRequest) {
  logger.info('Dashboard API called');

  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: false });
    logger.info({ shopDomain }, 'Dashboard request authenticated');

    const shop = await prisma.shop.findUnique({
      where: { shopDomain },
      include: {
        productsAudit: true,
        visibilityChecks: {
          orderBy: { checkedAt: 'desc' },
          take: 10,
        },
        competitors: {
          where: { isActive: true },
        },
      },
    });

    if (!shop) {
      logger.error({ shopDomain }, 'Shop not found in database');
      return handleApiError(new Error('Shop not found'));
    }

    logger.info({
      shopDomain,
      productsCount: shop.productsCount,
      auditCount: shop.productsAudit.length,
      visibilityChecksCount: shop.visibilityChecks.length,
      competitorsCount: shop.competitors.length,
    }, 'Dashboard data loaded');

    // Calculate audit statistics
    const auditStats = {
      totalProducts: shop.productsCount,
      auditedProducts: shop.productsAudit.length,
      averageScore: shop.productsAudit.length > 0
        ? Math.round(
            shop.productsAudit.reduce((sum, p) => sum + p.aiScore, 0) /
              shop.productsAudit.length
          )
        : 0,
      issues: {
        critical: shop.productsAudit.filter((p) => p.aiScore < 40).length,
        warning: shop.productsAudit.filter((p) => p.aiScore >= 40 && p.aiScore < 70).length,
        info: shop.productsAudit.filter((p) => p.aiScore >= 70 && p.aiScore < 90).length,
      },
    };

    // Build visibility status
    const platformsStatus = ['chatgpt', 'perplexity', 'gemini', 'copilot'].map(
      (platformName) => {
        const checks = shop.visibilityChecks.filter(
          (c) => c.platform === platformName
        );
        const lastCheck = checks[0];
        return {
          name: platformName,
          mentioned: lastCheck?.isMentioned ?? false,
          lastCheck: lastCheck?.checkedAt?.toISOString() ?? null,
        };
      }
    );

    // Get current month checks count
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyChecksCount = shop.visibilityChecks.filter(
      (c) => c.checkedAt >= startOfMonth
    ).length;

    const mentionedCount = shop.visibilityChecks.filter(
      (c) => c.isMentioned
    ).length;

    // Competitor info
    const planLimits = PLAN_LIMITS[shop.plan];

    const dashboardData = {
      shop: {
        name: shop.name || shop.shopDomain,
        domain: shop.shopDomain,
        plan: shop.plan,
        productsCount: shop.productsCount,
        aiScore: shop.aiScore,
        lastAuditAt: shop.lastAuditAt?.toISOString() ?? null,
      },
      audit: auditStats,
      visibility: {
        lastCheck: shop.visibilityChecks[0]?.checkedAt?.toISOString() ?? null,
        mentionedCount,
        totalChecks: monthlyChecksCount,
        platforms: platformsStatus,
      },
      competitors: {
        tracked: shop.competitors.length,
        limit: planLimits.competitorsTracked,
        topCompetitor: shop.competitors[0]?.name ?? shop.competitors[0]?.domain ?? null,
      },
    };

    return NextResponse.json(
      {
        success: true,
        data: dashboardData,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
        },
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
