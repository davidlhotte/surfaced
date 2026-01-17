import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { Plan } from '@prisma/client';
import { logger } from '@/lib/monitoring/logger';

// DEV/ADMIN: Change plan directly for testing (no billing)
// Access via ?dev=surfaced query param on settings page
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plan } = body;

    // Get shop from header (set by authenticatedFetch)
    const shopDomain = request.headers.get('x-shopify-shop-domain');

    logger.info({ shopDomain, plan }, 'Dev plan change request');

    if (!shopDomain) {
      logger.warn({}, 'Dev plan change: missing shop domain header');
      return NextResponse.json(
        { success: false, error: 'Shop domain header missing' },
        { status: 400 }
      );
    }

    // Validate plan
    if (!['FREE', 'BASIC', 'PLUS', 'PREMIUM'].includes(plan)) {
      logger.warn({ plan }, 'Dev plan change: invalid plan');
      return NextResponse.json(
        { success: false, error: `Invalid plan: ${plan}` },
        { status: 400 }
      );
    }

    // Check if shop exists first
    const existingShop = await prisma.shop.findUnique({
      where: { shopDomain },
      select: { id: true, plan: true },
    });

    if (!existingShop) {
      logger.warn({ shopDomain }, 'Dev plan change: shop not found in database');
      return NextResponse.json(
        { success: false, error: `Shop not found: ${shopDomain}` },
        { status: 404 }
      );
    }

    await prisma.shop.update({
      where: { shopDomain },
      data: { plan: plan as Plan },
    });

    logger.info({ shopDomain, oldPlan: existingShop.plan, newPlan: plan }, 'Dev plan change successful');

    return NextResponse.json({
      success: true,
      data: { plan, shop: shopDomain, previousPlan: existingShop.plan },
    });
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : 'Unknown' }, 'Dev plan change error');
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to change plan' },
      { status: 500 }
    );
  }
}
