import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/monitoring/logger';
import { verifyWebhookHmac } from '@/lib/shopify/webhooks';

/**
 * GDPR Customer Data Erasure Webhook
 * Called when a customer requests their data to be deleted
 * @see https://shopify.dev/docs/apps/build/privacy-law-compliance
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const hmac = request.headers.get('x-shopify-hmac-sha256');

    // Verify webhook signature
    if (!hmac || !verifyWebhookHmac(body, hmac)) {
      logger.warn('Invalid GDPR webhook signature for customers/redact');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const data = JSON.parse(body);
    const { shop_domain, customer } = data;

    logger.info(
      { shop: shop_domain, customerId: customer?.id },
      'GDPR customers/redact webhook received'
    );

    // LocateUs doesn't store customer data directly
    // Store locations are merchant data, not customer data
    // Log the request for compliance purposes
    logger.info(
      { shop: shop_domain, customerId: customer?.id },
      'GDPR customer data erasure request acknowledged - no customer data stored'
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ error }, 'GDPR customers/redact webhook error');
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
