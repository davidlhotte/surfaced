import { NextRequest, NextResponse } from 'next/server';
import { analyzeDuplicateContent, getProductDuplicateSuggestions } from '@/lib/services/duplicate-content';
import { getShopFromRequest } from '@/lib/shopify/get-shop';
import { handleApiError } from '@/lib/utils/errors';
import { PLAN_LIMITS } from '@/lib/constants/plans';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/monitoring/logger';

export async function GET(request: NextRequest) {
  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: false });

    // Check plan access
    const shop = await prisma.shop.findUnique({
      where: { shopDomain },
      select: { plan: true },
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const _planLimits = PLAN_LIMITS[shop.plan]; // Access to verify plan exists
    if (shop.plan === 'FREE') {
      return NextResponse.json(
        { error: 'Upgrade required to access duplicate content analysis' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (productId) {
      // Get suggestions for specific product
      const suggestions = await getProductDuplicateSuggestions(shopDomain, productId);
      return NextResponse.json(suggestions);
    }

    // Full shop analysis
    const report = await analyzeDuplicateContent(shopDomain);
    return NextResponse.json(report);
  } catch (error) {
    logger.error({ error }, 'Failed to analyze duplicate content');
    return handleApiError(error);
  }
}
