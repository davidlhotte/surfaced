import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { decryptToken } from '@/lib/security/encryption';
import { getShopFromRequest } from '@/lib/shopify/get-shop';

// Debug endpoint to check token status - REMOVE IN PRODUCTION
export async function GET(request: NextRequest) {
  try {
    const shop = await getShopFromRequest(request);

    const shopData = await prisma.shop.findUnique({
      where: { shopDomain: shop },
    });

    if (!shopData) {
      return NextResponse.json({
        error: 'Shop not found in database',
        shop,
      });
    }

    // Check token format (don't expose the actual token)
    const encryptedToken = shopData.accessToken;
    let tokenStatus = 'unknown';
    let decryptedPreview = '';

    try {
      const decrypted = decryptToken(encryptedToken);
      tokenStatus = 'decryption_success';

      if (decrypted.startsWith('dev-token')) {
        tokenStatus = 'dev_token';
        decryptedPreview = decrypted.substring(0, 20) + '...';
      } else if (decrypted.startsWith('shpat_') || decrypted.startsWith('shpua_')) {
        tokenStatus = 'valid_shopify_token';
        decryptedPreview = decrypted.substring(0, 10) + '...(hidden)';
      } else {
        tokenStatus = 'unknown_format';
        decryptedPreview = decrypted.substring(0, 10) + '...(hidden)';
      }
    } catch (decryptError) {
      tokenStatus = 'decryption_failed';
      decryptedPreview = String(decryptError);
    }

    return NextResponse.json({
      success: true,
      shop: shopData.shopDomain,
      plan: shopData.plan,
      tokenInfo: {
        encryptedLength: encryptedToken?.length || 0,
        hasColonSeparator: encryptedToken?.includes(':') || false,
        tokenStatus,
        decryptedPreview,
      },
      installedAt: shopData.installedAt,
      updatedAt: shopData.updatedAt,
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
