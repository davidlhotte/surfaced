import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils/errors';
import { getShopFromRequest } from '@/lib/shopify/get-shop';
import { prisma } from '@/lib/db/prisma';
import { decryptToken } from '@/lib/security/encryption';
import {
  getJsonLdConfig,
  updateJsonLdConfig,
  generateAllJsonLd,
  type GenerateJsonLdOptions,
} from '@/lib/services/json-ld';
import {
  fetchShopInfoForLlmsTxt,
  fetchProductsForLlmsTxt,
} from '@/lib/shopify/graphql';

/**
 * GET /api/json-ld
 * Get the JSON-LD config and preview for the shop
 */
export async function GET(request: NextRequest) {
  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: false });

    // Get shop with access token
    const shop = await prisma.shop.findUnique({
      where: { shopDomain },
      select: {
        accessToken: true,
        jsonLdConfig: true,
      },
    });

    if (!shop) {
      return NextResponse.json(
        { success: false, error: 'Shop not found' },
        { status: 404 }
      );
    }

    // Get or create config
    const config = await getJsonLdConfig(shopDomain);

    if (!config) {
      return NextResponse.json(
        { success: false, error: 'Could not get config' },
        { status: 500 }
      );
    }

    // Generate preview
    let preview = null;
    let error = null;

    try {
      const accessToken = decryptToken(shop.accessToken);

      // Fetch shop info
      const shopData = await fetchShopInfoForLlmsTxt(shopDomain, accessToken);

      // Fetch products (limited for preview)
      const productsData = await fetchProductsForLlmsTxt(shopDomain, accessToken, 10);

      const products = productsData.products.nodes.map((p) => ({
        id: p.id,
        title: p.title,
        handle: p.handle,
        description: p.descriptionHtml,
        images: [], // Would need to fetch images separately
        vendor: p.vendor,
        productType: p.productType,
        price: p.priceRangeV2.minVariantPrice.amount,
        currency: p.priceRangeV2.minVariantPrice.currencyCode,
        available: p.status === 'ACTIVE',
      }));

      const options: GenerateJsonLdOptions = {
        shopDomain: shopData.shop.primaryDomain?.host || shopDomain,
        shopName: shopData.shop.name,
        shopDescription: shopData.shop.description || undefined,
        products,
        config,
      };

      preview = generateAllJsonLd(options);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to generate preview';
    }

    return NextResponse.json({
      success: true,
      data: {
        config: {
          isEnabled: config.isEnabled,
          includeOrganization: config.includeOrganization,
          includeProducts: config.includeProducts,
          includeBreadcrumbs: config.includeBreadcrumbs,
          excludedProductIds: config.excludedProductIds,
          lastGeneratedAt: config.lastGeneratedAt,
        },
        preview,
        previewError: error,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/json-ld
 * Update JSON-LD config
 */
export async function POST(request: NextRequest) {
  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: true });

    const body = await request.json();

    // Validate body
    const updates: Parameters<typeof updateJsonLdConfig>[1] = {};

    if (typeof body.isEnabled === 'boolean') {
      updates.isEnabled = body.isEnabled;
    }

    if (typeof body.includeOrganization === 'boolean') {
      updates.includeOrganization = body.includeOrganization;
    }

    if (typeof body.includeProducts === 'boolean') {
      updates.includeProducts = body.includeProducts;
    }

    if (typeof body.includeBreadcrumbs === 'boolean') {
      updates.includeBreadcrumbs = body.includeBreadcrumbs;
    }

    if (Array.isArray(body.excludedProductIds)) {
      updates.excludedProductIds = body.excludedProductIds.filter(
        (id: unknown) => typeof id === 'string'
      );
    }

    // Update config
    const config = await updateJsonLdConfig(shopDomain, updates);

    // Update last generated timestamp
    await prisma.jsonLdConfig.update({
      where: { id: config.id },
      data: { lastGeneratedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      data: {
        config: {
          isEnabled: config.isEnabled,
          includeOrganization: config.includeOrganization,
          includeProducts: config.includeProducts,
          includeBreadcrumbs: config.includeBreadcrumbs,
          excludedProductIds: config.excludedProductIds,
          lastGeneratedAt: new Date(),
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
