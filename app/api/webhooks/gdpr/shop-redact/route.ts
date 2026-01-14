import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { logger, auditLog } from '@/lib/monitoring/logger';
import { verifyWebhookHmac } from '@/lib/shopify/webhooks';

/**
 * GDPR Shop Data Erasure Webhook
 * Called 48 hours after a shop uninstalls the app
 * @see https://shopify.dev/docs/apps/build/privacy-law-compliance
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const hmac = request.headers.get('x-shopify-hmac-sha256');

    // Verify webhook signature
    if (!hmac || !verifyWebhookHmac(body, hmac)) {
      logger.warn('Invalid GDPR webhook signature for shop/redact');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const data = JSON.parse(body);
    const { shop_domain } = data;

    logger.info({ shop: shop_domain }, 'GDPR shop/redact webhook received');

    // Delete all shop data
    const shop = await prisma.shop.findUnique({
      where: { shopDomain: shop_domain },
    });

    if (shop) {
      // Delete shop and all related data (stores, settings, audit logs cascade)
      await prisma.shop.delete({
        where: { shopDomain: shop_domain },
      });

      logger.info({ shop: shop_domain }, 'Shop data deleted for GDPR compliance');
      auditLog('shop_data_deleted', shop_domain, { reason: 'gdpr_shop_redact' });
    } else {
      logger.info({ shop: shop_domain }, 'Shop not found for GDPR redact - already deleted');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ error }, 'GDPR shop/redact webhook error');
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
