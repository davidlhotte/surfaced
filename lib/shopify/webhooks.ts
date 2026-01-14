import crypto from 'crypto';
import { prisma } from '@/lib/db/prisma';
import { cacheDel, cacheKeys } from '@/lib/cache/redis';
import { logger, auditLog } from '@/lib/monitoring/logger';

export function verifyWebhookHmac(body: string, hmacHeader: string): boolean {
  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret) {
    logger.error('SHOPIFY_API_SECRET not configured');
    return false;
  }

  const generatedHash = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(generatedHash),
      Buffer.from(hmacHeader)
    );
  } catch {
    return false;
  }
}

export type WebhookTopic =
  | 'app/uninstalled'
  | 'shop/update'
  | 'customers/data_request'
  | 'customers/redact'
  | 'shop/redact';

export async function handleAppUninstalled(shopDomain: string): Promise<void> {
  logger.info({ shopDomain }, 'Processing app uninstall');

  try {
    // Delete all shop data (GDPR compliant)
    await prisma.store.deleteMany({
      where: { shop: { shopDomain } },
    });

    await prisma.settings.deleteMany({
      where: { shop: { shopDomain } },
    });

    await prisma.auditLog.deleteMany({
      where: { shop: { shopDomain } },
    });

    await prisma.shop.delete({
      where: { shopDomain },
    });

    // Clear cache
    await cacheDel(cacheKeys.stores(shopDomain));
    await cacheDel(cacheKeys.settings(shopDomain));
    await cacheDel(cacheKeys.shop(shopDomain));

    auditLog('app_uninstalled', shopDomain, { dataDeleted: true });
  } catch (error) {
    logger.error({ error, shopDomain }, 'Failed to process app uninstall');
    throw error;
  }
}

export async function handleShopUpdate(
  shopDomain: string,
  _payload: Record<string, unknown>
): Promise<void> {
  logger.info({ shopDomain }, 'Processing shop update');
  // Handle shop updates if needed
}

// GDPR Webhooks

export async function handleCustomersDataRequest(
  shopDomain: string,
  _payload: Record<string, unknown>
): Promise<void> {
  // LocateUs doesn't store customer data, so we respond with empty data
  logger.info({ shopDomain }, 'Customers data request received');
  auditLog('customers_data_request', shopDomain, { hasData: false });
}

export async function handleCustomersRedact(
  shopDomain: string,
  _payload: Record<string, unknown>
): Promise<void> {
  // LocateUs doesn't store customer data, nothing to redact
  logger.info({ shopDomain }, 'Customers redact request received');
  auditLog('customers_redact', shopDomain, { dataRedacted: false });
}

export async function handleShopRedact(shopDomain: string): Promise<void> {
  // Same as app uninstalled - delete all shop data
  logger.info({ shopDomain }, 'Shop redact request received');
  await handleAppUninstalled(shopDomain);
  auditLog('shop_redact', shopDomain, { dataRedacted: true });
}
