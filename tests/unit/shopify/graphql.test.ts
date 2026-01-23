import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock dependencies
vi.mock('@/lib/shopify/auth', () => ({
  getShopSession: vi.fn(),
}));

vi.mock('@/lib/monitoring/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import { getShopSession } from '@/lib/shopify/auth';
import {
  shopifyGraphQL,
  fetchProducts,
  fetchShopInfo,
  fetchProductsCount,
  fetchShopInfoForLlmsTxt,
  fetchProductsForLlmsTxt,
  fetchCollectionsForLlmsTxt,
  fetchProductById,
  fetchProductWithTimestamp,
  updateProduct,
} from '@/lib/shopify/graphql';

describe('Shopify GraphQL', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('shopifyGraphQL', () => {
    it('should make authenticated GraphQL request', async () => {
      vi.mocked(getShopSession).mockResolvedValue({
        accessToken: 'test-token',
        shop: 'test-shop.myshopify.com',
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { test: 'result' } }),
      });

      const result = await shopifyGraphQL('test-shop.myshopify.com', 'query { test }');

      expect(result).toEqual({ test: 'result' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('test-shop.myshopify.com/admin/api/'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': 'test-token',
          }),
        })
      );
    });

    it('should throw error if no session found', async () => {
      vi.mocked(getShopSession).mockResolvedValue(null);

      await expect(
        shopifyGraphQL('test-shop.myshopify.com', 'query { test }')
      ).rejects.toThrow('No valid session found for shop');
    });

    it('should throw error if session has no access token', async () => {
      vi.mocked(getShopSession).mockResolvedValue({
        accessToken: null,
        shop: 'test-shop.myshopify.com',
      } as any);

      await expect(
        shopifyGraphQL('test-shop.myshopify.com', 'query { test }')
      ).rejects.toThrow('No valid session found for shop');
    });

    it('should throw error on HTTP error response', async () => {
      vi.mocked(getShopSession).mockResolvedValue({
        accessToken: 'test-token',
        shop: 'test-shop.myshopify.com',
      });

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized'),
      });

      await expect(
        shopifyGraphQL('test-shop.myshopify.com', 'query { test }')
      ).rejects.toThrow('GraphQL request failed: 401');
    });

    it('should throw error on GraphQL errors', async () => {
      vi.mocked(getShopSession).mockResolvedValue({
        accessToken: 'test-token',
        shop: 'test-shop.myshopify.com',
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          errors: [{ message: 'Invalid query' }],
        }),
      });

      await expect(
        shopifyGraphQL('test-shop.myshopify.com', 'query { invalid }')
      ).rejects.toThrow('GraphQL errors');
    });

    it('should pass variables to request', async () => {
      vi.mocked(getShopSession).mockResolvedValue({
        accessToken: 'test-token',
        shop: 'test-shop.myshopify.com',
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: {} }),
      });

      await shopifyGraphQL('test-shop.myshopify.com', 'query($id: ID!)', { id: '123' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"variables":{"id":"123"}'),
        })
      );
    });
  });

  describe('fetchProducts', () => {
    it('should fetch products with pagination', async () => {
      vi.mocked(getShopSession).mockResolvedValue({
        accessToken: 'test-token',
        shop: 'test-shop.myshopify.com',
      });

      const mockProducts = {
        data: {
          products: {
            nodes: [
              { id: 'gid://shopify/Product/1', title: 'Product 1' },
              { id: 'gid://shopify/Product/2', title: 'Product 2' },
            ],
            pageInfo: { hasNextPage: false, endCursor: null },
          },
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockProducts),
      });

      const result = await fetchProducts('test-shop.myshopify.com', 50);

      expect(result.products.nodes).toHaveLength(2);
      expect(result.products.pageInfo.hasNextPage).toBe(false);
    });

    it('should pass cursor for pagination', async () => {
      vi.mocked(getShopSession).mockResolvedValue({
        accessToken: 'test-token',
        shop: 'test-shop.myshopify.com',
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: { products: { nodes: [], pageInfo: { hasNextPage: false } } },
        }),
      });

      await fetchProducts('test-shop.myshopify.com', 50, 'cursor-abc');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"after":"cursor-abc"'),
        })
      );
    });
  });

  describe('fetchShopInfo', () => {
    it('should fetch shop information', async () => {
      vi.mocked(getShopSession).mockResolvedValue({
        accessToken: 'test-token',
        shop: 'test-shop.myshopify.com',
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: {
            shop: {
              name: 'Test Shop',
              email: 'test@example.com',
              primaryDomain: { host: 'testshop.com' },
              plan: { displayName: 'Basic' },
            },
          },
        }),
      });

      const result = await fetchShopInfo('test-shop.myshopify.com');

      expect(result.shop.name).toBe('Test Shop');
      expect(result.shop.email).toBe('test@example.com');
      expect(result.shop.productsCount.count).toBe(0);
    });
  });

  describe('fetchProductsCount', () => {
    it('should return product count', async () => {
      vi.mocked(getShopSession).mockResolvedValue({
        accessToken: 'test-token',
        shop: 'test-shop.myshopify.com',
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: {
            products: {
              nodes: Array(25).fill({ id: 'gid://shopify/Product/1' }),
              pageInfo: { hasNextPage: false },
            },
          },
        }),
      });

      const count = await fetchProductsCount('test-shop.myshopify.com');

      expect(count).toBe(25);
    });
  });

  describe('fetchShopInfoForLlmsTxt', () => {
    it('should fetch shop info with access token', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: {
            shop: {
              name: 'LLMs Shop',
              description: 'A test shop',
              primaryDomain: { host: 'llmsshop.com' },
              currencyCode: 'USD',
            },
          },
        }),
      });

      const result = await fetchShopInfoForLlmsTxt(
        'test-shop.myshopify.com',
        'direct-token'
      );

      expect(result.shop.name).toBe('LLMs Shop');
      expect(result.shop.currencyCode).toBe('USD');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Shopify-Access-Token': 'direct-token',
          }),
        })
      );
    });

    it('should throw error on failed request', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
      });

      await expect(
        fetchShopInfoForLlmsTxt('test-shop.myshopify.com', 'bad-token')
      ).rejects.toThrow('GraphQL request failed: 403');
    });

    it('should throw error on GraphQL errors', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          errors: [{ message: 'Access denied' }],
        }),
      });

      await expect(
        fetchShopInfoForLlmsTxt('test-shop.myshopify.com', 'token')
      ).rejects.toThrow('GraphQL errors');
    });
  });

  describe('fetchProductsForLlmsTxt', () => {
    it('should fetch active products for llms.txt', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: {
            products: {
              nodes: [
                {
                  id: 'gid://shopify/Product/1',
                  title: 'Active Product',
                  handle: 'active-product',
                  status: 'ACTIVE',
                  priceRangeV2: {
                    minVariantPrice: { amount: '10.00', currencyCode: 'USD' },
                    maxVariantPrice: { amount: '20.00', currencyCode: 'USD' },
                  },
                },
              ],
              pageInfo: { hasNextPage: false, endCursor: null },
            },
          },
        }),
      });

      const result = await fetchProductsForLlmsTxt(
        'test-shop.myshopify.com',
        'token',
        250
      );

      expect(result.products.nodes).toHaveLength(1);
      expect(result.products.nodes[0].title).toBe('Active Product');
    });

    it('should pass cursor for pagination', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: { products: { nodes: [], pageInfo: { hasNextPage: false } } },
        }),
      });

      await fetchProductsForLlmsTxt(
        'test-shop.myshopify.com',
        'token',
        250,
        'cursor-xyz'
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"after":"cursor-xyz"'),
        })
      );
    });
  });

  describe('fetchCollectionsForLlmsTxt', () => {
    it('should fetch collections with descriptions', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: {
            collections: {
              nodes: [
                {
                  id: 'gid://shopify/Collection/1',
                  title: 'Sale',
                  handle: 'sale',
                  descriptionHtml: '<p>On sale now!</p>',
                },
              ],
              pageInfo: { hasNextPage: false, endCursor: null },
            },
          },
        }),
      });

      const result = await fetchCollectionsForLlmsTxt(
        'test-shop.myshopify.com',
        'token'
      );

      expect(result.collections.nodes).toHaveLength(1);
      expect(result.collections.nodes[0].title).toBe('Sale');
    });
  });

  describe('fetchProductById', () => {
    it('should fetch single product by GID', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: {
            product: {
              id: 'gid://shopify/Product/123',
              title: 'Single Product',
              handle: 'single-product',
              descriptionHtml: '<p>Description</p>',
              description: 'Description',
              seo: { title: 'SEO Title', description: 'SEO Desc' },
              tags: ['tag1', 'tag2'],
              status: 'ACTIVE',
            },
          },
        }),
      });

      const result = await fetchProductById(
        'test-shop.myshopify.com',
        'token',
        'gid://shopify/Product/123'
      );

      expect(result?.title).toBe('Single Product');
      expect(result?.tags).toHaveLength(2);
    });

    it('should return null if product not found', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: { product: null },
        }),
      });

      const result = await fetchProductById(
        'test-shop.myshopify.com',
        'token',
        'gid://shopify/Product/nonexistent'
      );

      expect(result).toBeNull();
    });
  });

  describe('fetchProductWithTimestamp', () => {
    it('should fetch product with updatedAt field', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: {
            product: {
              id: 'gid://shopify/Product/123',
              title: 'Product with Timestamp',
              updatedAt: '2024-01-15T10:30:00Z',
              handle: 'test',
              status: 'ACTIVE',
            },
          },
        }),
      });

      const result = await fetchProductWithTimestamp(
        'test-shop.myshopify.com',
        'token',
        'gid://shopify/Product/123'
      );

      expect(result?.updatedAt).toBe('2024-01-15T10:30:00Z');
    });
  });

  describe('updateProduct', () => {
    it('should update product and return result', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: {
            productUpdate: {
              product: {
                id: 'gid://shopify/Product/123',
                title: 'Updated Title',
                updatedAt: '2024-01-15T11:00:00Z',
              },
              userErrors: [],
            },
          },
        }),
      });

      const result = await updateProduct(
        'test-shop.myshopify.com',
        'token',
        'gid://shopify/Product/123',
        { title: 'Updated Title' }
      );

      expect(result.productUpdate.product?.title).toBe('Updated Title');
      expect(result.productUpdate.userErrors).toHaveLength(0);
    });

    it('should throw error on failed update', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Bad Request'),
      });

      await expect(
        updateProduct(
          'test-shop.myshopify.com',
          'token',
          'gid://shopify/Product/123',
          { title: '' }
        )
      ).rejects.toThrow('Product update failed: 400');
    });

    it('should pass SEO input correctly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: {
            productUpdate: {
              product: { id: '123', title: 'Test', updatedAt: '2024-01-15' },
              userErrors: [],
            },
          },
        }),
      });

      await updateProduct(
        'test-shop.myshopify.com',
        'token',
        'gid://shopify/Product/123',
        {
          seo: {
            title: 'New SEO Title',
            description: 'New SEO Desc',
          },
        }
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('seo'),
        })
      );
    });
  });

  describe('API Version', () => {
    it('should use correct API version in URL', async () => {
      vi.mocked(getShopSession).mockResolvedValue({
        accessToken: 'test-token',
        shop: 'test-shop.myshopify.com',
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: {} }),
      });

      await shopifyGraphQL('test-shop.myshopify.com', 'query { test }');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/admin\/api\/\d{4}-\d{2}\/graphql\.json/),
        expect.any(Object)
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      vi.mocked(getShopSession).mockResolvedValue({
        accessToken: 'test-token',
        shop: 'test-shop.myshopify.com',
      });

      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(
        shopifyGraphQL('test-shop.myshopify.com', 'query { test }')
      ).rejects.toThrow('Network error');
    });

    it('should handle JSON parse errors', async () => {
      vi.mocked(getShopSession).mockResolvedValue({
        accessToken: 'test-token',
        shop: 'test-shop.myshopify.com',
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      await expect(
        shopifyGraphQL('test-shop.myshopify.com', 'query { test }')
      ).rejects.toThrow('Invalid JSON');
    });
  });
});
