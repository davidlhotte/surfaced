import { NextRequest, NextResponse } from 'next/server';
import {
  exchangeSessionTokenForAccessToken,
  verifySessionToken,
} from '@/lib/shopify/auth';
import { prisma } from '@/lib/db/prisma';
import { encryptToken } from '@/lib/security/encryption';
import { logger, auditLog } from '@/lib/monitoring/logger';

/**
 * Token exchange endpoint for embedded apps
 * Exchanges a session token for an access token
 * @see https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/token-exchange
 */
export async function POST(request: NextRequest) {
  try {
    // Get session token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 }
      );
    }

    const sessionToken = authHeader.replace('Bearer ', '');

    // Verify and decode the session token
    const tokenData = verifySessionToken(sessionToken);
    if (!tokenData) {
      return NextResponse.json(
        { error: 'Invalid or expired session token' },
        { status: 401 }
      );
    }

    const { shop } = tokenData;
    logger.info({ shop }, 'Token exchange request received');

    // Check if we already have a valid access token for this shop
    const existingShop = await prisma.shop.findUnique({
      where: { shopDomain: shop },
    });

    // Exchange session token for offline access token
    const { accessToken, scope } = await exchangeSessionTokenForAccessToken(
      shop,
      sessionToken,
      'offline'
    );

    // Save/update the shop with the new access token
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

    // Create default settings if this is a new shop
    const shopData = await prisma.shop.findUnique({
      where: { shopDomain: shop },
      include: { settings: true },
    });

    if (shopData && !shopData.settings) {
      await prisma.settings.create({
        data: {
          shopId: shopData.id,
        },
      });
    }

    if (!existingShop) {
      auditLog('app_installed', shop, { method: 'token_exchange' });
    }

    logger.info({ shop, scope }, 'Token exchange successful');

    return NextResponse.json({
      success: true,
      shop,
      scope,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ error: errorMessage }, 'Token exchange error');
    return NextResponse.json(
      { error: 'Token exchange failed', details: errorMessage },
      { status: 500 }
    );
  }
}
