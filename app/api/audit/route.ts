import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils/errors';
import { getShopFromRequest } from '@/lib/shopify/get-shop';
import { runAudit } from '@/lib/services/audit-engine';
import { logger } from '@/lib/monitoring/logger';
import { PLAN_LIMITS } from '@/lib/constants/plans';
import { cacheGet, cacheSet, cacheDel, cacheKeys, cacheTTL } from '@/lib/cache/redis';
import type { Plan } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    logger.info({}, 'Audit POST: Starting');
    const shopDomain = await getShopFromRequest(request, { rateLimit: true });
    logger.info({ shopDomain }, 'Audit POST: Shop authenticated');

    const result = await runAudit(shopDomain);
    logger.info({ shopDomain, auditedProducts: result.auditedProducts }, 'Audit POST: Completed');

    // Invalidate cache after new audit
    await cacheDel(cacheKeys.audit(shopDomain));
    await cacheDel(cacheKeys.dashboard(shopDomain));

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error({
      error: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
    }, 'Audit POST: Failed');
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: false });

    // Check cache first
    const cacheKey = cacheKeys.audit(shopDomain);
    const cached = await cacheGet<{ success: boolean; data: unknown }>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Get last audit result from database
    const { prisma } = await import('@/lib/db/prisma');

    // Optimized query: get shop data and issue counts in parallel
    const [shop, issueCounts] = await Promise.all([
      prisma.shop.findUnique({
        where: { shopDomain },
        include: {
          productsAudit: {
            orderBy: { lastAuditAt: 'desc' },
            take: 500, // Limit to 500 products for performance
          },
        },
      }),
      // Get issue counts directly from database (more efficient)
      prisma.$queryRaw<{ critical: bigint; warning: bigint; info: bigint }[]>`
        SELECT
          COUNT(CASE WHEN "aiScore" < 40 THEN 1 END) as critical,
          COUNT(CASE WHEN "aiScore" >= 40 AND "aiScore" < 70 THEN 1 END) as warning,
          COUNT(CASE WHEN "aiScore" >= 70 AND "aiScore" < 90 THEN 1 END) as info
        FROM "ProductAudit"
        WHERE "shopId" = (SELECT id FROM "Shop" WHERE "shopDomain" = ${shopDomain})
      `.catch(() => [{ critical: BigInt(0), warning: BigInt(0), info: BigInt(0) }]),
    ]);

    if (!shop) {
      return NextResponse.json(
        { success: false, error: 'Shop not found' },
        { status: 404 }
      );
    }

    // Get plan limits
    const planLimits = PLAN_LIMITS[shop.plan as Plan];
    const productLimit = planLimits.productsAudited;
    const isAtLimit = productLimit !== Infinity && shop.productsCount > productLimit;

    const counts = issueCounts[0] || { critical: BigInt(0), warning: BigInt(0), info: BigInt(0) };

    const auditStats = {
      totalProducts: shop.productsCount,
      auditedProducts: shop.productsAudit.length,
      averageScore: shop.aiScore ?? 0,
      lastAuditAt: shop.lastAuditAt?.toISOString() ?? null,
      issues: {
        critical: Number(counts.critical),
        warning: Number(counts.warning),
        info: Number(counts.info),
      },
      products: shop.productsAudit.map((p) => ({
        id: p.id,
        shopifyProductId: p.shopifyProductId.toString(),
        title: p.title,
        handle: p.handle,
        aiScore: p.aiScore,
        issues: p.issues,
        hasImages: p.hasImages,
        hasDescription: p.hasDescription,
        hasMetafields: p.hasMetafields,
        descriptionLength: p.descriptionLength,
        lastAuditAt: p.lastAuditAt.toISOString(),
      })),
      // Plan info for upgrade CTAs
      plan: {
        current: shop.plan,
        productLimit: productLimit === Infinity ? -1 : productLimit,
        isAtLimit,
        productsNotAnalyzed: isAtLimit ? shop.productsCount - productLimit : 0,
      },
    };

    const response = { success: true, data: auditStats };

    // Cache for 5 minutes
    await cacheSet(cacheKey, response, cacheTTL.medium);

    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error);
  }
}
