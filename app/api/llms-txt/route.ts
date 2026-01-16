import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils/errors';
import { getShopFromRequest } from '@/lib/shopify/get-shop';
import { prisma } from '@/lib/db/prisma';
import { decryptToken } from '@/lib/security/encryption';
import {
  getLlmsTxtConfig,
  updateLlmsTxtConfig,
  generateLlmsTxtForShop,
} from '@/lib/services/llms-txt';

/**
 * GET /api/llms-txt
 * Get the llms.txt config and preview for the shop
 */
export async function GET(request: NextRequest) {
  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: false });

    // Get shop with access token
    const shop = await prisma.shop.findUnique({
      where: { shopDomain },
      select: {
        accessToken: true,
        llmsTxtConfig: true,
      },
    });

    if (!shop) {
      return NextResponse.json(
        { success: false, error: 'Shop not found' },
        { status: 404 }
      );
    }

    // Get or create config
    const config = await getLlmsTxtConfig(shopDomain);

    if (!config) {
      return NextResponse.json(
        { success: false, error: 'Could not get config' },
        { status: 500 }
      );
    }

    // Generate preview
    let preview = '';
    let error = null;

    try {
      const accessToken = decryptToken(shop.accessToken);
      const result = await generateLlmsTxtForShop(shopDomain, accessToken);
      preview = result.content;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to generate preview';
    }

    return NextResponse.json({
      success: true,
      data: {
        config: {
          isEnabled: config.isEnabled,
          allowedBots: config.allowedBots,
          includeProducts: config.includeProducts,
          includeCollections: config.includeCollections,
          includeBlog: config.includeBlog,
          excludedProductIds: config.excludedProductIds,
          customInstructions: config.customInstructions,
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
 * POST /api/llms-txt
 * Update llms.txt config and regenerate
 */
export async function POST(request: NextRequest) {
  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: true });

    const body = await request.json();

    // Validate body
    const updates: Parameters<typeof updateLlmsTxtConfig>[1] = {};

    if (typeof body.isEnabled === 'boolean') {
      updates.isEnabled = body.isEnabled;
    }

    if (Array.isArray(body.allowedBots)) {
      updates.allowedBots = body.allowedBots.filter(
        (b: unknown) => typeof b === 'string'
      );
    }

    if (typeof body.includeProducts === 'boolean') {
      updates.includeProducts = body.includeProducts;
    }

    if (typeof body.includeCollections === 'boolean') {
      updates.includeCollections = body.includeCollections;
    }

    if (typeof body.includeBlog === 'boolean') {
      updates.includeBlog = body.includeBlog;
    }

    if (Array.isArray(body.excludedProductIds)) {
      updates.excludedProductIds = body.excludedProductIds.filter(
        (id: unknown) => typeof id === 'string'
      );
    }

    if (body.customInstructions !== undefined) {
      updates.customInstructions =
        typeof body.customInstructions === 'string'
          ? body.customInstructions
          : null;
    }

    // Update config
    const config = await updateLlmsTxtConfig(shopDomain, updates);

    // Get shop access token
    const shop = await prisma.shop.findUnique({
      where: { shopDomain },
      select: { accessToken: true },
    });

    if (!shop) {
      return NextResponse.json(
        { success: false, error: 'Shop not found' },
        { status: 404 }
      );
    }

    // Generate new content
    let content = '';
    let error = null;

    try {
      const accessToken = decryptToken(shop.accessToken);
      const result = await generateLlmsTxtForShop(shopDomain, accessToken);
      content = result.content;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to generate';
    }

    return NextResponse.json({
      success: true,
      data: {
        config: {
          isEnabled: config.isEnabled,
          allowedBots: config.allowedBots,
          includeProducts: config.includeProducts,
          includeCollections: config.includeCollections,
          includeBlog: config.includeBlog,
          excludedProductIds: config.excludedProductIds,
          customInstructions: config.customInstructions,
          lastGeneratedAt: config.lastGeneratedAt,
        },
        content,
        error,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
