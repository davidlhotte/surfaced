import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { decryptToken } from '@/lib/security/encryption';
import { fetchProducts, fetchShopInfo, fetchProductsCount } from '@/lib/shopify/graphql';
import { PLAN_LIMITS } from '@/lib/constants/plans';
import type { Plan } from '@prisma/client';

export async function GET(request: NextRequest) {
  const shopDomain = request.headers.get('x-shopify-shop-domain') || 'locateus-2.myshopify.com';

  const debug: Record<string, unknown> = {
    shopDomain,
    timestamp: new Date().toISOString(),
  };

  try {
    // Step 1: Check if shop exists in DB
    const shop = await prisma.shop.findUnique({
      where: { shopDomain },
      select: {
        id: true,
        shopDomain: true,
        accessToken: true,
        plan: true,
        installedAt: true,
        updatedAt: true,
      },
    });

    if (!shop) {
      debug.step1_shopLookup = 'FAILED - Shop not found';
      return NextResponse.json({ debug, success: false });
    }

    debug.step1_shopLookup = 'OK';
    debug.shopId = shop.id;
    debug.plan = shop.plan;
    debug.tokenLength = shop.accessToken?.length || 0;
    debug.installedAt = shop.installedAt?.toISOString();
    debug.updatedAt = shop.updatedAt?.toISOString();

    // Step 2: Try to decrypt token
    let decryptedToken: string;
    try {
      decryptedToken = decryptToken(shop.accessToken);
      debug.step2_decrypt = 'OK';
      debug.decryptedTokenLength = decryptedToken?.length || 0;
      debug.tokenPrefix = decryptedToken?.substring(0, 10) + '...';
    } catch (decryptError) {
      debug.step2_decrypt = 'FAILED';
      debug.decryptError = decryptError instanceof Error ? decryptError.message : 'Unknown';
      return NextResponse.json({ debug, success: false });
    }

    // Step 3: Test GraphQL call to Shopify
    const SHOPIFY_API_VERSION = '2025-01';
    const testQuery = `
      query {
        shop {
          name
          email
        }
        products(first: 50) {
          nodes {
            id
            title
          }
        }
      }
    `;

    try {
      const response = await fetch(
        `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': decryptedToken,
          },
          body: JSON.stringify({ query: testQuery }),
        }
      );

      debug.step3_graphqlStatus = response.status;
      debug.step3_graphqlOk = response.ok;

      const responseText = await response.text();
      debug.step3_responseLength = responseText.length;

      if (!response.ok) {
        debug.step3_graphql = 'FAILED';
        debug.step3_error = responseText.substring(0, 500);
        return NextResponse.json({ debug, success: false });
      }

      const json = JSON.parse(responseText);
      if (json.errors) {
        debug.step3_graphql = 'GRAPHQL_ERRORS';
        debug.step3_errors = json.errors;
        return NextResponse.json({ debug, success: false });
      }

      debug.step3_graphql = 'OK';
      debug.shopName = json.data?.shop?.name;
      debug.shopEmail = json.data?.shop?.email;
      debug.productsCount = json.data?.products?.nodes?.length || 0;
      debug.firstProducts = json.data?.products?.nodes?.slice(0, 3).map((p: { title: string }) => p.title);

    } catch (fetchError) {
      debug.step3_graphql = 'EXCEPTION';
      debug.step3_exception = fetchError instanceof Error ? fetchError.message : 'Unknown';
      return NextResponse.json({ debug, success: false });
    }

    return NextResponse.json({ debug, success: true });
  } catch (error) {
    debug.error = error instanceof Error ? error.message : 'Unknown error';
    debug.stack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json({ debug, success: false });
  }
}

// POST handler - tests full audit flow step by step
export async function POST(request: NextRequest) {
  const shopDomain = request.headers.get('x-shopify-shop-domain') || 'locateus-2.myshopify.com';

  const debug: Record<string, unknown> = {
    shopDomain,
    timestamp: new Date().toISOString(),
    steps: [],
  };

  const addStep = (name: string, status: string, data?: Record<string, unknown>) => {
    (debug.steps as unknown[]).push({ name, status, ...data });
  };

  try {
    // Step 1: Get shop from DB
    const shop = await prisma.shop.findUnique({
      where: { shopDomain },
      select: { id: true, plan: true },
    });

    if (!shop) {
      addStep('db_lookup', 'FAILED', { error: 'Shop not found' });
      return NextResponse.json({ debug, success: false });
    }
    addStep('db_lookup', 'OK', { shopId: shop.id, plan: shop.plan });

    // Step 2: Get plan limits
    const planLimits = PLAN_LIMITS[shop.plan as Plan];
    const maxProducts = planLimits.productsAudited;
    addStep('plan_limits', 'OK', { maxProducts });

    // Step 3: Fetch shop info
    try {
      const shopInfo = await fetchShopInfo(shopDomain);
      addStep('fetch_shop_info', 'OK', { shopName: shopInfo.shop.name });
    } catch (error) {
      addStep('fetch_shop_info', 'FAILED', { error: error instanceof Error ? error.message : 'Unknown' });
      return NextResponse.json({ debug, success: false });
    }

    // Step 4: Fetch products count
    let totalProducts: number;
    try {
      totalProducts = await fetchProductsCount(shopDomain);
      addStep('fetch_products_count', 'OK', { totalProducts });
    } catch (error) {
      addStep('fetch_products_count', 'FAILED', { error: error instanceof Error ? error.message : 'Unknown' });
      return NextResponse.json({ debug, success: false });
    }

    // Step 5: Fetch products with full data
    try {
      const productsResponse = await fetchProducts(shopDomain, Math.min(maxProducts, 50));
      const products = productsResponse.products.nodes;
      addStep('fetch_products', 'OK', {
        count: products.length,
        firstProduct: products[0]?.title,
        hasImages: products[0]?.images?.nodes?.length > 0,
        hasDescription: !!products[0]?.description,
      });

      // Step 6: Try to score first product
      if (products.length > 0) {
        const p = products[0];
        const description = p.description || '';
        const hasImages = p.images.nodes.length > 0;
        const hasDescription = description.length > 0;

        // Extract product ID
        const match = p.id.match(/\/(\d+)$/);
        const shopifyProductId = match ? BigInt(match[1]) : BigInt(0);

        addStep('score_product', 'OK', {
          title: p.title,
          productId: p.id,
          shopifyProductId: shopifyProductId.toString(),
          descriptionLength: description.length,
          hasImages,
          hasDescription,
          imagesCount: p.images.nodes.length,
          hasSeoTitle: !!p.seo?.title,
          hasSeoDesc: !!p.seo?.description,
        });

        // Step 7: Try to save to database
        try {
          const now = new Date();
          await prisma.productAudit.upsert({
            where: {
              shopId_shopifyProductId: {
                shopId: shop.id,
                shopifyProductId: shopifyProductId,
              },
            },
            update: {
              title: p.title,
              handle: p.handle,
              aiScore: 50, // Test score
              issues: [],
              hasImages,
              hasDescription,
              hasMetafields: false,
              descriptionLength: description.length,
              lastAuditAt: now,
            },
            create: {
              shopId: shop.id,
              shopifyProductId: shopifyProductId,
              title: p.title,
              handle: p.handle,
              aiScore: 50,
              issues: [],
              hasImages,
              hasDescription,
              hasMetafields: false,
              descriptionLength: description.length,
              lastAuditAt: now,
            },
          });
          addStep('db_save_product', 'OK', { productId: shopifyProductId.toString() });
        } catch (error) {
          addStep('db_save_product', 'FAILED', {
            error: error instanceof Error ? error.message : 'Unknown',
            stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined,
          });
          return NextResponse.json({ debug, success: false });
        }
      }

    } catch (error) {
      addStep('fetch_products', 'FAILED', {
        error: error instanceof Error ? error.message : 'Unknown',
        stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined,
      });
      return NextResponse.json({ debug, success: false });
    }

    return NextResponse.json({ debug, success: true });
  } catch (error) {
    debug.error = error instanceof Error ? error.message : 'Unknown error';
    debug.stack = error instanceof Error ? error.stack?.split('\n').slice(0, 10) : undefined;
    return NextResponse.json({ debug, success: false });
  }
}
