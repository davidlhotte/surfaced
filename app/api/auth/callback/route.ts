import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { exchangeCodeForToken, validateShop } from '@/lib/shopify/auth';
import { prisma } from '@/lib/db/prisma';
import { encryptToken } from '@/lib/security/encryption';
import { logger, auditLog } from '@/lib/monitoring/logger';

/**
 * Verify HMAC signature from Shopify OAuth callback
 * @see https://shopify.dev/docs/apps/build/authentication-authorization/access-token-types/online-access-tokens#verify-a-request
 */
function verifyHmac(searchParams: URLSearchParams): boolean {
  const hmac = searchParams.get('hmac');
  if (!hmac) return false;

  const apiSecret = process.env.SHOPIFY_API_SECRET;
  if (!apiSecret) {
    logger.error({}, 'SHOPIFY_API_SECRET not configured');
    return false;
  }

  // Create a copy of params without the hmac
  const params = new URLSearchParams(searchParams);
  params.delete('hmac');

  // Sort parameters alphabetically and create query string
  const sortedParams = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  // Calculate expected HMAC
  const calculatedHmac = createHmac('sha256', apiSecret)
    .update(sortedParams)
    .digest('hex');

  // Use timing-safe comparison
  const providedHmac = Buffer.from(hmac, 'hex');
  const computedHmac = Buffer.from(calculatedHmac, 'hex');

  if (providedHmac.length !== computedHmac.length) {
    return false;
  }

  return timingSafeEqual(providedHmac, computedHmac);
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const shop = searchParams.get('shop');
  const code = searchParams.get('code');
  const hmac = searchParams.get('hmac');

  if (!shop || !code || !hmac) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    );
  }

  // CRITICAL: Verify HMAC signature to ensure request is from Shopify
  if (!verifyHmac(searchParams)) {
    logger.error({ shop }, 'OAuth callback HMAC verification failed');
    return NextResponse.json(
      { error: 'Invalid HMAC signature' },
      { status: 401 }
    );
  }

  const isValid = await validateShop(shop);
  if (!isValid) {
    return NextResponse.json(
      { error: 'Invalid shop domain' },
      { status: 400 }
    );
  }

  try {
    logger.info({ shop, code: code?.substring(0, 10) }, 'OAuth callback received, HMAC verified');

    // Exchange code for access token (manual implementation)
    const { accessToken, scope } = await exchangeCodeForToken(shop, code);

    if (!accessToken) {
      logger.error({ shop }, 'Token exchange returned no access token');
      throw new Error('Failed to get access token');
    }

    logger.info({ shop, scope }, 'Access token obtained');

    // Save shop with encrypted token
    const encryptedToken = encryptToken(accessToken);
    await prisma.shop.upsert({
      where: { shopDomain: shop },
      update: {
        accessToken: encryptedToken,
        updatedAt: new Date(),
      },
      create: {
        shopDomain: shop,
        accessToken: encryptedToken,
      },
    });
    logger.info({ shop }, 'Session saved successfully');

    // Create default settings for new shops
    const existingShop = await prisma.shop.findUnique({
      where: { shopDomain: shop },
      include: { settings: true },
    });

    if (existingShop && !existingShop.settings) {
      await prisma.settings.create({
        data: {
          shopId: existingShop.id,
        },
      });
    }

    auditLog('app_installed', shop, {});

    // Redirect to app in Shopify admin
    const redirectUrl = `https://${shop}/admin/apps/${process.env.SHOPIFY_API_KEY}`;
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    logger.error({ error: errorMessage, stack: errorStack, shop }, 'OAuth callback error');
    return NextResponse.json(
      {
        error: 'Authentication failed',
        details: errorMessage,
        shop,
      },
      { status: 500 }
    );
  }
}
