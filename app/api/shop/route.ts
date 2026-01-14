import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { handleApiError } from '@/lib/utils/errors';
import { getShopFromRequest } from '@/lib/shopify/get-shop';

export async function GET(request: NextRequest) {
  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: false });

    const shop = await prisma.shop.findUnique({
      where: { shopDomain },
      select: {
        shopDomain: true,
        plan: true,
        installedAt: true,
      },
    });

    if (!shop) {
      return handleApiError(new Error('Shop not found'));
    }

    return NextResponse.json({
      success: true,
      data: shop,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
