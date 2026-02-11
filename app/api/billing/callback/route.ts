import { NextRequest, NextResponse } from 'next/server';
import { syncShopPlanFromSubscription } from '@/lib/shopify/billing';
import { logger, auditLog } from '@/lib/monitoring/logger';
import { isValidShopDomain } from '@/lib/utils/dev';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  const shop = request.nextUrl.searchParams.get('shop');
  const chargeId = request.nextUrl.searchParams.get('charge_id');

  if (!shop) {
    return NextResponse.json(
      { error: 'Missing shop parameter' },
      { status: 400 }
    );
  }

  // Validate shop domain format to prevent injection attacks
  if (!isValidShopDomain(shop)) {
    logger.warn({ shop }, 'Invalid shop domain format in billing callback');
    return NextResponse.json(
      { error: 'Invalid shop domain' },
      { status: 400 }
    );
  }

  // Verify the shop exists in our database (was previously installed)
  const existingShop = await prisma.shop.findUnique({
    where: { shopDomain: shop },
  });

  if (!existingShop) {
    logger.warn({ shop }, 'Unknown shop in billing callback');
    return NextResponse.json(
      { error: 'Shop not found' },
      { status: 404 }
    );
  }

  try {
    // Sync the shop's plan based on their Shopify subscription
    const plan = await syncShopPlanFromSubscription(shop);
    auditLog('plan_synced', shop, { plan, chargeId });

    // Redirect back to app settings page
    const redirectUrl = `https://${shop}/admin/apps/${process.env.SHOPIFY_API_KEY}/settings`;
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    logger.error({ error, shop, chargeId }, 'Billing callback error');
    return NextResponse.json(
      { error: 'Billing verification failed' },
      { status: 500 }
    );
  }
}
