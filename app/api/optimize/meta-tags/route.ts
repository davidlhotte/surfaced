import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils/errors';
import { getShopFromRequest } from '@/lib/shopify/get-shop';
import { generateMetaTagsSuggestions } from '@/lib/services/content-optimizer';
import { fetchProducts } from '@/lib/shopify/graphql';
import { logger } from '@/lib/monitoring/logger';

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

    logger.info({ shopDomain, productId }, 'Meta tags generation requested');

    // Fetch product data from Shopify
    const productsResponse = await fetchProducts(shopDomain, 50);
    const product = productsResponse.products.nodes.find(p => {
      const id = p.id.match(/\/(\d+)$/)?.[1];
      return id === productId;
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    const result = await generateMetaTagsSuggestions(shopDomain, productId, {
      title: product.title,
      description: product.description,
      productType: product.productType,
      vendor: product.vendor,
      seoTitle: product.seo.title || undefined,
      seoDescription: product.seo.description || undefined,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error({ error }, 'Meta tags generation failed');
    return handleApiError(error);
  }
}
