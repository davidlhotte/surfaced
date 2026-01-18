import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils/errors';
import { getShopFromRequest } from '@/lib/shopify/get-shop';
import {
  generateApiKey,
  getApiKeys,
  revokeApiKey,
  deleteApiKey,
  getApiUsageStats,
  type ApiKeyScope,
} from '@/lib/services/public-api';

/**
 * GET /api/keys
 * Get all API keys for the shop
 */
export async function GET(request: NextRequest) {
  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: false });
    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('stats') === 'true';

    const keys = await getApiKeys(shopDomain);

    let stats = null;
    if (includeStats) {
      stats = await getApiUsageStats(shopDomain);
    }

    return NextResponse.json({
      success: true,
      data: {
        keys,
        stats,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/keys
 * Generate a new API key
 */
export async function POST(request: NextRequest) {
  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: true });
    const body = await request.json();

    const { name, scopes, rateLimit, expiresInDays } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Key name is required' },
        { status: 400 }
      );
    }

    // Validate scopes
    const validScopes: ApiKeyScope[] = ['read', 'write', 'audit', 'optimize'];
    const requestedScopes = (scopes || ['read']) as ApiKeyScope[];
    for (const scope of requestedScopes) {
      if (!validScopes.includes(scope)) {
        return NextResponse.json(
          { success: false, error: `Invalid scope: ${scope}` },
          { status: 400 }
        );
      }
    }

    const result = await generateApiKey(
      shopDomain,
      name,
      requestedScopes,
      rateLimit || 100,
      expiresInDays
    );

    return NextResponse.json({
      success: true,
      data: {
        key: result.key, // Only returned once!
        keyInfo: result.keyInfo,
        message: 'Save this key securely. It will not be shown again.',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/keys
 * Revoke or delete an API key
 */
export async function DELETE(request: NextRequest) {
  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: true });
    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('id');
    const permanent = searchParams.get('permanent') === 'true';

    if (!keyId) {
      return NextResponse.json(
        { success: false, error: 'Key ID is required' },
        { status: 400 }
      );
    }

    let success: boolean;
    if (permanent) {
      success = await deleteApiKey(shopDomain, keyId);
    } else {
      success = await revokeApiKey(shopDomain, keyId);
    }

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Key not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        action: permanent ? 'deleted' : 'revoked',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
