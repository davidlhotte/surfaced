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
import { fetchProductById } from '@/lib/shopify/graphql';

/**
 * GET /api/optimize
 * Get products that need optimization and quota info
 */
export async function GET(request: NextRequest) {
  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: false });

    // Get quota info
    const quota = await checkOptimizationQuota(shopDomain);

    // Get products that need optimization
    const products = await getProductsForOptimization(shopDomain, 20);

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
