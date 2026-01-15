import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { decryptToken } from '@/lib/security/encryption';

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
        createdAt: true,
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
    debug.createdAt = shop.createdAt?.toISOString();
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
          productsCount {
            count
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
      debug.productsCount = json.data?.shop?.productsCount?.count;

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
