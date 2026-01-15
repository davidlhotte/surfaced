import { getShopSession } from './auth';
import { logger } from '@/lib/monitoring/logger';

const SHOPIFY_API_VERSION = '2025-01';

export type ShopifyProduct = {
  id: string;
  title: string;
  handle: string;
  descriptionHtml: string;
  description: string;
  featuredImage: {
    url: string;
  } | null;
  images: {
    nodes: {
      url: string;
      altText: string | null;
    }[];
  };
  metafields: {
    nodes: {
      key: string;
      value: string;
      namespace: string;
    }[];
  };
  seo: {
    title: string | null;
    description: string | null;
  };
  vendor: string;
  productType: string;
  tags: string[];
  status: string;
};

export type ProductsResponse = {
  products: {
    nodes: ShopifyProduct[];
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
  };
};

export type ShopInfoResponse = {
  shop: {
    name: string;
    email: string;
    primaryDomain: {
      host: string;
    };
    plan: {
      displayName: string;
    };
    productsCount: {
      count: number;
    };
  };
};

export async function shopifyGraphQL<T>(
  shopDomain: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  logger.info({ shopDomain }, 'shopifyGraphQL: Getting session');
  const session = await getShopSession(shopDomain);
  if (!session || !session.accessToken) {
    logger.error({ shopDomain, hasSession: !!session, hasToken: !!(session?.accessToken) }, 'No valid session found');
    throw new Error('No valid session found for shop');
  }
  logger.info({ shopDomain, tokenLength: session.accessToken.length }, 'shopifyGraphQL: Session obtained');

  const response = await fetch(
    `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': session.accessToken,
      },
      body: JSON.stringify({ query, variables }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    logger.error({ shopDomain, status: response.status, error: errorText }, 'GraphQL request failed');
    throw new Error(`GraphQL request failed: ${response.status}`);
  }

  const json = await response.json();

  if (json.errors) {
    logger.error({ shopDomain, errors: json.errors }, 'GraphQL errors');
    throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  }

  return json.data as T;
}

export async function fetchProducts(
  shopDomain: string,
  first: number = 50,
  cursor?: string
): Promise<ProductsResponse> {
  const query = `
    query GetProducts($first: Int!, $after: String) {
      products(first: $first, after: $after) {
        nodes {
          id
          title
          handle
          descriptionHtml
          description
          featuredImage {
            url
          }
          images(first: 10) {
            nodes {
              url
              altText
            }
          }
          metafields(first: 20) {
            nodes {
              key
              value
              namespace
            }
          }
          seo {
            title
            description
          }
          vendor
          productType
          tags
          status
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  return shopifyGraphQL<ProductsResponse>(shopDomain, query, {
    first,
    after: cursor,
  });
}

export async function fetchShopInfo(shopDomain: string): Promise<ShopInfoResponse> {
  const query = `
    query GetShopInfo {
      shop {
        name
        email
        primaryDomain {
          host
        }
        plan {
          displayName
        }
      }
    }
  `;

  const result = await shopifyGraphQL<{
    shop: {
      name: string;
      email: string;
      primaryDomain: { host: string };
      plan: { displayName: string };
    };
  }>(shopDomain, query);

  // Get product count from a separate query (products are fetched anyway)
  // We'll estimate from the fetchProducts call in the audit
  return {
    shop: {
      ...result.shop,
      productsCount: {
        count: 0, // Will be updated after fetching products
      },
    },
  };
}

export async function fetchProductsCount(shopDomain: string): Promise<number> {
  // Fetch first batch to get accurate count - Shopify doesn't expose totalCount directly
  const query = `
    query GetProductsCount {
      products(first: 250) {
        nodes {
          id
        }
        pageInfo {
          hasNextPage
        }
      }
    }
  `;

  const result = await shopifyGraphQL<{
    products: {
      nodes: { id: string }[];
      pageInfo: { hasNextPage: boolean };
    };
  }>(shopDomain, query);

  // If there's no next page, we have exact count
  // Otherwise, we report what we got (max 250 for FREE plan anyway)
  return result.products.nodes.length;
}
