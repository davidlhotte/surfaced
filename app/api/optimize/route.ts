import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils/errors';
import { getShopFromRequest } from '@/lib/shopify/get-shop';
import { prisma } from '@/lib/db/prisma';
import { decryptToken } from '@/lib/security/encryption';
import {
  generateOptimizationSuggestions,
  getProductsForOptimization,
  checkOptimizationQuota,
} from '@/lib/services/content-optimizer';
import {
  fetchProductById,
  fetchProductWithTimestamp,
  updateProduct,
  type ProductUpdateInput,
} from '@/lib/shopify/graphql';
import { runAudit } from '@/lib/services/audit-engine';
import { logger } from '@/lib/monitoring/logger';

/**
 * GET /api/optimize
 * Get products that need optimization, quota info, and history
 */
export async function GET(request: NextRequest) {
  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: false });

    // Get quota info
    const quota = await checkOptimizationQuota(shopDomain);

    // Get products that need optimization
    const products = await getProductsForOptimization(shopDomain, 20);

    // Get recent optimization history
    const history = await prisma.productOptimizationHistory.findMany({
      where: {
        shop: { shopDomain },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        shopifyProductId: true,
        productTitle: true,
        field: true,
        originalValue: true,
        appliedValue: true,
        scoreBefore: true,
        scoreAfter: true,
        status: true,
        createdAt: true,
        undoneAt: true,
      },
    });

    // Serialize BigInt
    const serializedHistory = history.map((h) => ({
      ...h,
      shopifyProductId: h.shopifyProductId.toString(),
      createdAt: h.createdAt.toISOString(),
      undoneAt: h.undoneAt?.toISOString() || null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        quota: {
          used: quota.used,
          limit: quota.limit,
          remaining: quota.remaining,
          available: quota.available,
        },
        products,
        history: serializedHistory,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/optimize
 * Generate optimization suggestions for a product
 */
export async function POST(request: NextRequest) {
  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: true });

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Get shop with access token
    const shop = await prisma.shop.findUnique({
      where: { shopDomain },
      select: {
        accessToken: true,
      },
    });

    if (!shop) {
      return NextResponse.json(
        { success: false, error: 'Shop not found' },
        { status: 404 }
      );
    }

    // Get the product from audit data first
    const productAudit = await prisma.productAudit.findFirst({
      where: {
        shopifyProductId: BigInt(productId),
        shop: { shopDomain },
      },
      select: {
        title: true,
        handle: true,
        aiScore: true,
        issues: true,
      },
    });

    if (!productAudit) {
      return NextResponse.json(
        { success: false, error: 'Product not found in audit data. Run an audit first.' },
        { status: 404 }
      );
    }

    // Fetch fresh product data from Shopify
    const accessToken = decryptToken(shop.accessToken);
    const productGid = `gid://shopify/Product/${productId}`;

    let productData;
    try {
      productData = await fetchProductById(shopDomain, accessToken, productGid);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch product from Shopify' },
        { status: 500 }
      );
    }

    if (!productData) {
      return NextResponse.json(
        { success: false, error: 'Product not found in Shopify' },
        { status: 404 }
      );
    }

    // Generate optimization suggestions
    const optimization = await generateOptimizationSuggestions(
      shopDomain,
      productId,
      {
        title: productData.title,
        handle: productData.handle,
        description: productData.description || '',
        seoTitle: productData.seo?.title || undefined,
        seoDescription: productData.seo?.description || undefined,
        productType: productData.productType || undefined,
        vendor: productData.vendor || undefined,
        tags: productData.tags || [],
        imageAltTexts: productData.images?.nodes?.map((img: { altText: string | null }) => img.altText || '') || [],
      }
    );

    // Get updated quota
    const quota = await checkOptimizationQuota(shopDomain);

    return NextResponse.json({
      success: true,
      data: {
        optimization,
        quota: {
          used: quota.used,
          limit: quota.limit,
          remaining: quota.remaining,
          available: quota.available,
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/optimize
 * Apply optimization suggestions to a product
 */
export async function PATCH(request: NextRequest) {
  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: true });

    const body = await request.json();
    const { productId, suggestions, lastKnownUpdatedAt } = body;

    if (!productId || !suggestions || !Array.isArray(suggestions)) {
      return NextResponse.json(
        { success: false, error: 'Product ID and suggestions array are required' },
        { status: 400 }
      );
    }

    // Get shop with access token
    const shop = await prisma.shop.findUnique({
      where: { shopDomain },
      select: {
        id: true,
        accessToken: true,
      },
    });

    if (!shop) {
      return NextResponse.json(
        { success: false, error: 'Shop not found' },
        { status: 404 }
      );
    }

    const accessToken = decryptToken(shop.accessToken);
    const productGid = `gid://shopify/Product/${productId}`;

    // Fetch current product state for conflict detection
    const currentProduct = await fetchProductWithTimestamp(shopDomain, accessToken, productGid);

    if (!currentProduct) {
      return NextResponse.json(
        { success: false, error: 'Product not found in Shopify' },
        { status: 404 }
      );
    }

    // Check for conflicts - warn if product was modified since suggestions were generated
    let hasConflict = false;
    if (lastKnownUpdatedAt) {
      const lastKnown = new Date(lastKnownUpdatedAt).getTime();
      const currentUpdated = new Date(currentProduct.updatedAt).getTime();
      hasConflict = currentUpdated > lastKnown;
    }

    // Get current score before update
    const auditBefore = await prisma.productAudit.findFirst({
      where: {
        shopifyProductId: BigInt(productId),
        shop: { shopDomain },
      },
      select: { aiScore: true },
    });
    const scoreBefore = auditBefore?.aiScore ?? null;

    // Build update input from suggestions
    const updateInput: ProductUpdateInput = {};
    const historyEntries: {
      field: string;
      originalValue: string;
      appliedValue: string;
      reasoning: string | null;
    }[] = [];

    for (const suggestion of suggestions) {
      const { field, suggested, reasoning } = suggestion;

      switch (field) {
        case 'description':
          updateInput.descriptionHtml = suggested;
          historyEntries.push({
            field: 'description',
            originalValue: currentProduct.descriptionHtml || '',
            appliedValue: suggested,
            reasoning,
          });
          break;
        case 'seo_title':
          updateInput.seo = { ...updateInput.seo, title: suggested };
          historyEntries.push({
            field: 'seo_title',
            originalValue: currentProduct.seo?.title || '',
            appliedValue: suggested,
            reasoning,
          });
          break;
        case 'seo_description':
          updateInput.seo = { ...updateInput.seo, description: suggested };
          historyEntries.push({
            field: 'seo_description',
            originalValue: currentProduct.seo?.description || '',
            appliedValue: suggested,
            reasoning,
          });
          break;
        case 'tags':
          // Tags come as comma-separated string, convert to array
          updateInput.tags = suggested.split(',').map((t: string) => t.trim());
          historyEntries.push({
            field: 'tags',
            originalValue: currentProduct.tags?.join(', ') || '',
            appliedValue: suggested,
            reasoning,
          });
          break;
        case 'productType':
          updateInput.productType = suggested;
          historyEntries.push({
            field: 'productType',
            originalValue: currentProduct.productType || '',
            appliedValue: suggested,
            reasoning,
          });
          break;
        case 'vendor':
          updateInput.vendor = suggested;
          historyEntries.push({
            field: 'vendor',
            originalValue: currentProduct.vendor || '',
            appliedValue: suggested,
            reasoning,
          });
          break;
        default:
          logger.warn({ field }, 'Unknown field in optimization suggestion');
      }
    }

    if (Object.keys(updateInput).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Apply changes to Shopify
    const updateResult = await updateProduct(shopDomain, accessToken, productGid, updateInput);

    if (updateResult.productUpdate.userErrors.length > 0) {
      const errors = updateResult.productUpdate.userErrors.map((e) => e.message).join(', ');
      logger.error({ shopDomain, productId, errors }, 'Product update failed');
      return NextResponse.json(
        { success: false, error: `Update failed: ${errors}` },
        { status: 400 }
      );
    }

    // Save history entries
    for (const entry of historyEntries) {
      await prisma.productOptimizationHistory.create({
        data: {
          shopId: shop.id,
          shopifyProductId: BigInt(productId),
          productTitle: currentProduct.title,
          field: entry.field,
          originalValue: entry.originalValue,
          appliedValue: entry.appliedValue,
          reasoning: entry.reasoning,
          scoreBefore,
          status: 'applied',
        },
      });
    }

    // Re-run audit for this product to get new score
    let scoreAfter = scoreBefore;
    try {
      // Trigger a quick re-audit
      const auditResult = await runAudit(shopDomain);
      scoreAfter = auditResult.averageScore;

      // Update history with new score
      await prisma.productOptimizationHistory.updateMany({
        where: {
          shopId: shop.id,
          shopifyProductId: BigInt(productId),
          scoreAfter: null,
        },
        data: { scoreAfter },
      });
    } catch (e) {
      logger.error({ error: e }, 'Failed to re-audit after optimization');
    }

    return NextResponse.json({
      success: true,
      data: {
        applied: historyEntries.length,
        hadConflict: hasConflict,
        scoreBefore,
        scoreAfter,
        product: {
          id: productId,
          title: currentProduct.title,
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/optimize
 * Undo a previously applied optimization
 */
export async function DELETE(request: NextRequest) {
  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: true });
    const { searchParams } = new URL(request.url);
    const historyId = searchParams.get('historyId');

    if (!historyId) {
      return NextResponse.json(
        { success: false, error: 'History ID is required' },
        { status: 400 }
      );
    }

    // Get the history entry
    const historyEntry = await prisma.productOptimizationHistory.findFirst({
      where: {
        id: historyId,
        shop: { shopDomain },
        status: 'applied',
      },
    });

    if (!historyEntry) {
      return NextResponse.json(
        { success: false, error: 'History entry not found or already undone' },
        { status: 404 }
      );
    }

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

    const accessToken = decryptToken(shop.accessToken);
    const productGid = `gid://shopify/Product/${historyEntry.shopifyProductId}`;

    // Build undo update
    const undoInput: ProductUpdateInput = {};

    switch (historyEntry.field) {
      case 'description':
        undoInput.descriptionHtml = historyEntry.originalValue;
        break;
      case 'seo_title':
        undoInput.seo = { title: historyEntry.originalValue };
        break;
      case 'seo_description':
        undoInput.seo = { description: historyEntry.originalValue };
        break;
      case 'tags':
        undoInput.tags = historyEntry.originalValue.split(',').map((t) => t.trim()).filter(Boolean);
        break;
      case 'productType':
        undoInput.productType = historyEntry.originalValue;
        break;
      case 'vendor':
        undoInput.vendor = historyEntry.originalValue;
        break;
    }

    // Apply undo to Shopify
    const updateResult = await updateProduct(shopDomain, accessToken, productGid, undoInput);

    if (updateResult.productUpdate.userErrors.length > 0) {
      const errors = updateResult.productUpdate.userErrors.map((e) => e.message).join(', ');
      return NextResponse.json(
        { success: false, error: `Undo failed: ${errors}` },
        { status: 400 }
      );
    }

    // Mark as undone
    await prisma.productOptimizationHistory.update({
      where: { id: historyId },
      data: {
        status: 'undone',
        undoneAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        undone: true,
        field: historyEntry.field,
        productId: historyEntry.shopifyProductId.toString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
