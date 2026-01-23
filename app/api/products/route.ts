import { NextRequest, NextResponse } from 'next/server';
import { getShopFromRequest } from '@/lib/shopify/get-shop';
import { fetchProducts } from '@/lib/shopify/graphql';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/monitoring/logger';
import { handleApiError } from '@/lib/utils/errors';

export async function GET(request: NextRequest) {
  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: false });
    logger.info({ shopDomain }, 'Products API called');

    // Get limit from query params (default 100, max 250)
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = Math.min(parseInt(limitParam || '100', 10), 250);

    // Fetch products from Shopify
    const productsResponse = await fetchProducts(shopDomain, limit);

    // Get AI scores from database for these products
    const shop = await prisma.shop.findUnique({
      where: { shopDomain },
      select: { id: true },
    });

    let productAudits: Record<string, number> = {};
    if (shop) {
      const audits = await prisma.productAudit.findMany({
        where: { shopId: shop.id },
        select: { shopifyProductId: true, aiScore: true },
      });
      productAudits = audits.reduce((acc, audit) => {
        // Convert BigInt to string for use as key
        acc[audit.shopifyProductId.toString()] = audit.aiScore;
        return acc;
      }, {} as Record<string, number>);
    }

    // Transform products to match expected format
    const products = productsResponse.products.nodes.map((p) => {
      // Extract numeric ID from Shopify GID (gid://shopify/Product/123456)
      const numericId = p.id.split('/').pop() || '';
      return {
        id: p.id,
        title: p.title,
        handle: p.handle,
        images: {
          edges: p.images.nodes.map((img) => ({
            node: { url: img.url, altText: img.altText },
          })),
        },
        aiScore: productAudits[numericId] || null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        products,
        pageInfo: productsResponse.products.pageInfo,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Products API error');
    return handleApiError(error);
  }
}
