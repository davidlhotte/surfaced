import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { handleApiError } from '@/lib/utils/errors';
import { getShopFromRequest } from '@/lib/shopify/get-shop';
import { syncShopPlanFromSubscription } from '@/lib/shopify/billing';

export async function GET(request: NextRequest) {
  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: false });

    // Sync plan from Shopify subscription (for Managed Pricing)
    // This ensures our database reflects the actual subscription status
    try {
      await syncShopPlanFromSubscription(shopDomain);
    } catch (syncError) {
      // Don't fail the request if sync fails, just log it
      console.warn('Failed to sync plan from Shopify:', syncError);
    }

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
