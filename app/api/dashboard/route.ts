import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { handleApiError } from '@/lib/utils/errors';
import { getShopFromRequest } from '@/lib/shopify/get-shop';
import { PLAN_LIMITS } from '@/lib/constants/plans';
import { logger } from '@/lib/monitoring/logger';
import { cacheGet, cacheSet } from '@/lib/cache/redis';

// Cache TTL: 30 seconds for dashboard (frequently accessed, relatively stable data)
const DASHBOARD_CACHE_TTL = 30;

export async function GET(request: NextRequest) {
  logger.info('Dashboard API called');

  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: false });
    logger.info({ shopDomain }, 'Dashboard request authenticated');

    // Try to get from cache first
    const cacheKey = `dashboard:${shopDomain}`;
    const cachedData = await cacheGet<object>(cacheKey);
    if (cachedData) {
      logger.info({ shopDomain }, 'Dashboard data served from cache');
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true,
      });
    }

    // Start of month for quota calculations
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Optimized query: only fetch what we need, use database aggregations where possible
    const [shop, auditStats, visibilityStats] = await Promise.all([
      // Basic shop info + competitors
      prisma.shop.findUnique({
        where: { shopDomain },
        select: {
          id: true,
          name: true,
          shopDomain: true,
          plan: true,
          productsCount: true,
          aiScore: true,
          lastAuditAt: true,
          competitors: {
            where: { isActive: true },
            select: { name: true, domain: true },
            take: 5,
          },
        },
      }),
      // Audit statistics via database aggregation
      prisma.productAudit.groupBy({
        by: ['shopId'],
        where: { shop: { shopDomain } },
        _count: true,
        _avg: { aiScore: true },
      }).then(async (result) => {
        if (result.length === 0) return { count: 0, avgScore: 0, critical: 0, warning: 0, info: 0 };
        const shopId = result[0].shopId;
        const [critical, warning, info] = await Promise.all([
          prisma.productAudit.count({ where: { shopId, aiScore: { lt: 40 } } }),
          prisma.productAudit.count({ where: { shopId, aiScore: { gte: 40, lt: 70 } } }),
          prisma.productAudit.count({ where: { shopId, aiScore: { gte: 70, lt: 90 } } }),
        ]);
        return {
          count: result[0]._count,
          avgScore: Math.round(result[0]._avg.aiScore || 0),
          critical,
          warning,
          info,
        };
      }),
      // Visibility statistics via database
      prisma.shop.findUnique({
        where: { shopDomain },
        select: { id: true },
      }).then(async (shopResult) => {
        if (!shopResult) return { platforms: [], monthlyChecks: 0, mentionedCount: 0 };
        const [recentChecks, monthlyChecks, mentionedCount] = await Promise.all([
          prisma.visibilityCheck.findMany({
            where: { shopId: shopResult.id },
            orderBy: { checkedAt: 'desc' },
            take: 10,
            select: { platform: true, isMentioned: true, checkedAt: true },
          }),
          prisma.visibilityCheck.count({
            where: { shopId: shopResult.id, checkedAt: { gte: startOfMonth } },
          }),
          prisma.visibilityCheck.count({
            where: { shopId: shopResult.id, isMentioned: true },
          }),
        ]);
        return { recentChecks, monthlyChecks, mentionedCount };
      }),
    ]);

    if (!shop) {
      logger.error({ shopDomain }, 'Shop not found in database');
      return handleApiError(new Error('Shop not found'));
    }

    logger.info({
      shopDomain,
      productsCount: shop.productsCount,
      auditCount: auditStats.count,
      competitorsCount: shop.competitors.length,
    }, 'Dashboard data loaded');

    // Build visibility status from recent checks
    const platformsStatus = ['chatgpt', 'perplexity', 'gemini', 'copilot'].map((platformName) => {
      const lastCheck = visibilityStats.recentChecks?.find((c) => c.platform === platformName);
      return {
        name: platformName,
        mentioned: lastCheck?.isMentioned ?? false,
        lastCheck: lastCheck?.checkedAt?.toISOString() ?? null,
      };
    });

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
      audit: {
        totalProducts: shop.productsCount,
        auditedProducts: auditStats.count,
        averageScore: auditStats.avgScore,
        issues: {
          critical: auditStats.critical,
          warning: auditStats.warning,
          info: auditStats.info,
        },
      },
      visibility: {
        lastCheck: visibilityStats.recentChecks?.[0]?.checkedAt?.toISOString() ?? null,
        mentionedCount: visibilityStats.mentionedCount,
        totalChecks: visibilityStats.monthlyChecks,
        platforms: platformsStatus,
      },
      competitors: {
        tracked: shop.competitors.length,
        limit: planLimits.competitorsTracked,
        topCompetitor: shop.competitors[0]?.name ?? shop.competitors[0]?.domain ?? null,
      },
    };

    // Cache the result
    await cacheSet(cacheKey, dashboardData, DASHBOARD_CACHE_TTL);

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
