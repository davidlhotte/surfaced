/**
 * Centralized shop authentication and authorization
 *
 * This module provides a single source of truth for getting the authenticated
 * shop from API requests. It handles:
 * - Development mode with test shop
 * - Production authentication via Shopify session
 * - Rate limiting (optional)
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getShopSession } from '@/lib/shopify/auth';
import { UnauthorizedError, ValidationError } from '@/lib/utils/errors';
import { adminRateLimit, checkRateLimit } from '@/lib/security/rate-limit';
import { getDevShop } from '@/lib/utils/dev';
import { encryptToken } from '@/lib/security/encryption';
import { logger } from '@/lib/monitoring/logger';

// Module-level cache for dev shop creation (avoid repeated upserts)
let devShopCreated = false;

export type GetShopOptions = {
  /** Whether to apply rate limiting (default: true) */
  rateLimit?: boolean;
  /** Custom rate limit identifier prefix */
  rateLimitPrefix?: string;
};

/**
 * Get the authenticated shop from a request.
 *
 * In development mode, returns a test shop.
 * In production, validates the Shopify session and optionally applies rate limiting.
 *
 * @param request - The incoming Next.js request
 * @param options - Configuration options
 * @returns The shop domain
 * @throws UnauthorizedError if authentication fails
 * @throws ValidationError if rate limit exceeded
 */
export async function getShopFromRequest(
  request: NextRequest,
  options: GetShopOptions = {}
): Promise<string> {
  const { rateLimit = true } = options;

  logger.info({ url: request.nextUrl.pathname, rateLimit }, 'getShopFromRequest called');

  // Development mode - use test shop (NEVER in production)
  const devShop = getDevShop();
  if (devShop) {
    logger.info({ devShop }, 'Using development shop');
    // Ensure dev shop exists in DB (only once per server instance)
    if (!devShopCreated) {
      await prisma.shop.upsert({
        where: { shopDomain: devShop },
        update: {},
        create: {
          shopDomain: devShop,
          accessToken: encryptToken('dev-token-' + Date.now()),
        },
      });
      devShopCreated = true;
    }

    return devShop;
  }

  // Production: Get shop from session token or header
  const shop = request.headers.get('x-shopify-shop-domain');
  logger.info({ shop, hasShopHeader: !!shop }, 'Checking shop header');

  if (!shop) {
    logger.error('Missing x-shopify-shop-domain header');
    throw new UnauthorizedError('Missing shop domain');
  }

  const session = await getShopSession(shop);
  logger.info({ shop, hasSession: !!session }, 'Checked shop session');

  if (!session) {
    logger.error({ shop }, 'No valid session found for shop');
    throw new UnauthorizedError('Invalid session');
  }

  // Apply rate limiting if enabled
  if (rateLimit) {
    const rateLimitResult = await checkRateLimit(adminRateLimit, shop);
    if (!rateLimitResult.success) {
      logger.warn({ shop }, 'Rate limit exceeded');
      throw new ValidationError('Rate limit exceeded');
    }
  }

  logger.info({ shop }, 'Shop authenticated successfully');
  return shop;
}

/**
 * Get the shop data from the database.
 * Throws UnauthorizedError if shop not found.
 *
 * @param shopDomain - The shop domain to look up
 * @returns The shop record from the database
 */
export async function getShopData(shopDomain: string) {
  const shopData = await prisma.shop.findUnique({
    where: { shopDomain },
  });

  if (!shopData) {
    throw new UnauthorizedError('Shop not found');
  }

  return shopData;
}

/**
 * Get shop with settings from the database.
 * Throws UnauthorizedError if shop not found.
 *
 * @param shopDomain - The shop domain to look up
 * @returns The shop record with settings
 */
export async function getShopWithSettings(shopDomain: string) {
  const shopData = await prisma.shop.findUnique({
    where: { shopDomain },
    include: { settings: true },
  });

  if (!shopData) {
    throw new UnauthorizedError('Shop not found');
  }

  return shopData;
}
