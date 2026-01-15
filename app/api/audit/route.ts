import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils/errors';
import { getShopFromRequest } from '@/lib/shopify/get-shop';
import { runAudit } from '@/lib/services/audit-engine';
import { logger } from '@/lib/monitoring/logger';

export async function POST(request: NextRequest) {
  try {
    logger.info({}, 'Audit POST: Starting');
    const shopDomain = await getShopFromRequest(request, { rateLimit: true });
    logger.info({ shopDomain }, 'Audit POST: Shop authenticated');

    const result = await runAudit(shopDomain);
    logger.info({ shopDomain, auditedProducts: result.auditedProducts }, 'Audit POST: Completed');

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

    // Get last audit result from database
    const { prisma } = await import('@/lib/db/prisma');

    const shop = await prisma.shop.findUnique({
      where: { shopDomain },
      include: {
        productsAudit: {
          orderBy: { lastAuditAt: 'desc' },
        },
      },
    });

    if (!shop) {
      return NextResponse.json(
        { success: false, error: 'Shop not found' },
        { status: 404 }
      );
    }

    const auditStats = {
      totalProducts: shop.productsCount,
      auditedProducts: shop.productsAudit.length,
      averageScore: shop.aiScore ?? 0,
      lastAuditAt: shop.lastAuditAt?.toISOString() ?? null,
      issues: {
        critical: shop.productsAudit.filter((p) => p.aiScore < 40).length,
        warning: shop.productsAudit.filter((p) => p.aiScore >= 40 && p.aiScore < 70).length,
        info: shop.productsAudit.filter((p) => p.aiScore >= 70 && p.aiScore < 90).length,
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
    };

    return NextResponse.json({
      success: true,
      data: auditStats,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
