import { NextRequest, NextResponse } from 'next/server';
import {
  verifyWebhookHmac,
  handleAppUninstalled,
  handleShopUpdate,
  handleCustomersDataRequest,
  handleCustomersRedact,
  handleShopRedact,
} from '@/lib/shopify/webhooks';
import { logger } from '@/lib/monitoring/logger';

export async function POST(request: NextRequest) {
  const hmac = request.headers.get('x-shopify-hmac-sha256');
  const topic = request.headers.get('x-shopify-topic');
  const shop = request.headers.get('x-shopify-shop-domain');

  if (!hmac || !topic || !shop) {
    return NextResponse.json(
      { error: 'Missing required headers' },
      { status: 400 }
    );
  }

  const body = await request.text();

  // Verify HMAC
  const isValid = verifyWebhookHmac(body, hmac);
  if (!isValid) {
    logger.warn({ topic, shop }, 'Invalid webhook HMAC');
    return NextResponse.json(
      { error: 'Invalid HMAC' },
      { status: 401 }
    );
  }

  const payload = JSON.parse(body);

  try {
    switch (topic) {
      case 'app/uninstalled':
        await handleAppUninstalled(shop);
        break;

      case 'shop/update':
        await handleShopUpdate(shop, payload);
        break;

      case 'customers/data_request':
        await handleCustomersDataRequest(shop, payload);
        break;

      case 'customers/redact':
        await handleCustomersRedact(shop, payload);
        break;

      case 'shop/redact':
        await handleShopRedact(shop);
        break;

      default:
        logger.warn({ topic, shop }, 'Unknown webhook topic');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ error, topic, shop }, 'Webhook processing error');
    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500 }
    );
  }
}
