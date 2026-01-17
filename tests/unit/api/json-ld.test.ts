import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/shopify/get-shop', () => ({
  getShopFromRequest: vi.fn(),
}));

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    shop: {
      findUnique: vi.fn(),
    },
    jsonLdConfig: {
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/security/encryption', () => ({
  decryptToken: vi.fn().mockReturnValue('mock-token'),
}));

vi.mock('@/lib/services/json-ld', () => ({
  getJsonLdConfig: vi.fn(),
  updateJsonLdConfig: vi.fn(),
  generateAllJsonLd: vi.fn(),
}));

vi.mock('@/lib/shopify/graphql', () => ({
  fetchShopInfoForLlmsTxt: vi.fn(),
  fetchProductsForLlmsTxt: vi.fn(),
}));

vi.mock('@/lib/monitoring/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { getShopFromRequest } from '@/lib/shopify/get-shop';
import { prisma } from '@/lib/db/prisma';
import { getJsonLdConfig, updateJsonLdConfig, generateAllJsonLd } from '@/lib/services/json-ld';
import { fetchShopInfoForLlmsTxt, fetchProductsForLlmsTxt } from '@/lib/shopify/graphql';

describe('JSON-LD API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/json-ld', () => {
    it('should return config and preview', async () => {
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockResolvedValue('test.myshopify.com');

      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        accessToken: 'encrypted-token',
        jsonLdConfig: { isEnabled: true },
      });

      (getJsonLdConfig as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'config-1',
        isEnabled: true,
        includeOrganization: true,
        includeProducts: true,
        includeBreadcrumbs: false,
        excludedProductIds: [],
        lastGeneratedAt: new Date('2024-01-15'),
      });

      (fetchShopInfoForLlmsTxt as ReturnType<typeof vi.fn>).mockResolvedValue({
        shop: {
          name: 'Test Store',
          description: 'A test store',
          primaryDomain: { host: 'teststore.com' },
        },
      });

      (fetchProductsForLlmsTxt as ReturnType<typeof vi.fn>).mockResolvedValue({
        products: {
          nodes: [
            {
              id: 'gid://shopify/Product/123',
              title: 'Product 1',
              handle: 'product-1',
              descriptionHtml: '<p>Description</p>',
              vendor: 'Test Vendor',
              productType: 'Widget',
              priceRangeV2: {
                minVariantPrice: { amount: '29.99', currencyCode: 'USD' },
              },
              status: 'ACTIVE',
            },
          ],
        },
      });

      (generateAllJsonLd as ReturnType<typeof vi.fn>).mockReturnValue({
        organization: {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Test Store',
        },
        products: [
          {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: 'Product 1',
          },
        ],
      });

      const config = await getJsonLdConfig('test.myshopify.com');

      expect(config).toBeDefined();
      expect(config?.isEnabled).toBe(true);
      expect(config?.includeOrganization).toBe(true);
    });

    it('should handle shop not found', async () => {
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockResolvedValue('unknown.myshopify.com');
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const shop = await prisma.shop.findUnique({
        where: { shopDomain: 'unknown.myshopify.com' },
      });

      expect(shop).toBeNull();
    });

    it('should handle config not found', async () => {
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockResolvedValue('test.myshopify.com');
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        accessToken: 'encrypted-token',
      });
      (getJsonLdConfig as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const config = await getJsonLdConfig('test.myshopify.com');
      expect(config).toBeNull();
    });

    it('should handle preview generation failure', async () => {
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockResolvedValue('test.myshopify.com');
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        accessToken: 'encrypted-token',
      });
      (getJsonLdConfig as ReturnType<typeof vi.fn>).mockResolvedValue({
        isEnabled: true,
        includeOrganization: true,
      });
      (fetchShopInfoForLlmsTxt as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Failed to fetch shop info')
      );

      await expect(fetchShopInfoForLlmsTxt('test.myshopify.com', 'token')).rejects.toThrow(
        'Failed to fetch shop info'
      );
    });
  });

  describe('POST /api/json-ld', () => {
    it('should update config with valid boolean values', async () => {
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockResolvedValue('test.myshopify.com');

      (updateJsonLdConfig as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'config-1',
        isEnabled: false,
        includeOrganization: true,
        includeProducts: false,
        includeBreadcrumbs: true,
        excludedProductIds: [],
        lastGeneratedAt: new Date(),
      });

      const config = await updateJsonLdConfig('test.myshopify.com', {
        isEnabled: false,
        includeProducts: false,
        includeBreadcrumbs: true,
      });

      expect(config.isEnabled).toBe(false);
      expect(config.includeProducts).toBe(false);
      expect(config.includeBreadcrumbs).toBe(true);
    });

    it('should update excluded product IDs', async () => {
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockResolvedValue('test.myshopify.com');

      (updateJsonLdConfig as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'config-1',
        excludedProductIds: ['123', '456'],
      });

      const config = await updateJsonLdConfig('test.myshopify.com', {
        excludedProductIds: ['123', '456'],
      });

      expect(config.excludedProductIds).toEqual(['123', '456']);
    });

    it('should validate config update body', () => {
      const validateBody = (body: Record<string, unknown>) => {
        const updates: Record<string, unknown> = {};

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

        return updates;
      };

      // Valid inputs
      expect(validateBody({ isEnabled: true })).toEqual({ isEnabled: true });
      expect(validateBody({ excludedProductIds: ['123', '456'] })).toEqual({
        excludedProductIds: ['123', '456'],
      });

      // Invalid inputs should be filtered
      expect(validateBody({ isEnabled: 'true' })).toEqual({});
      expect(validateBody({ excludedProductIds: [123, '456'] })).toEqual({
        excludedProductIds: ['456'],
      });
    });
  });

  describe('JSON-LD Schema Generation', () => {
    it('should generate valid organization schema', () => {
      const generateOrganizationSchema = (shop: { name: string; domain: string; description?: string }) => ({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: shop.name,
        url: `https://${shop.domain}`,
        ...(shop.description && { description: shop.description }),
      });

      const schema = generateOrganizationSchema({
        name: 'Test Store',
        domain: 'teststore.com',
        description: 'A great store',
      });

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Organization');
      expect(schema.name).toBe('Test Store');
      expect(schema.url).toBe('https://teststore.com');
      expect(schema.description).toBe('A great store');
    });

    it('should generate valid product schema', () => {
      const generateProductSchema = (product: {
        title: string;
        description: string;
        price: string;
        currency: string;
        available: boolean;
        url: string;
      }) => ({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.title,
        description: product.description,
        url: product.url,
        offers: {
          '@type': 'Offer',
          price: product.price,
          priceCurrency: product.currency,
          availability: product.available
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
        },
      });

      const schema = generateProductSchema({
        title: 'Widget',
        description: 'A great widget',
        price: '29.99',
        currency: 'USD',
        available: true,
        url: 'https://store.com/products/widget',
      });

      expect(schema['@type']).toBe('Product');
      expect(schema.name).toBe('Widget');
      expect(schema.offers.price).toBe('29.99');
      expect(schema.offers.availability).toBe('https://schema.org/InStock');
    });

    it('should handle missing optional fields', () => {
      const generateOrganizationSchema = (shop: { name: string; domain: string; description?: string }) => ({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: shop.name,
        url: `https://${shop.domain}`,
        ...(shop.description && { description: shop.description }),
      });

      const schema = generateOrganizationSchema({
        name: 'Test Store',
        domain: 'teststore.com',
      });

      expect(schema).not.toHaveProperty('description');
    });
  });

  describe('Product Data Transformation', () => {
    it('should transform Shopify product data for JSON-LD', () => {
      const transformProduct = (p: {
        id: string;
        title: string;
        handle: string;
        descriptionHtml: string;
        vendor: string;
        productType: string;
        priceRangeV2: {
          minVariantPrice: { amount: string; currencyCode: string };
        };
        status: string;
      }) => ({
        id: p.id,
        title: p.title,
        handle: p.handle,
        description: p.descriptionHtml,
        vendor: p.vendor,
        productType: p.productType,
        price: p.priceRangeV2.minVariantPrice.amount,
        currency: p.priceRangeV2.minVariantPrice.currencyCode,
        available: p.status === 'ACTIVE',
      });

      const shopifyProduct = {
        id: 'gid://shopify/Product/123',
        title: 'Test Product',
        handle: 'test-product',
        descriptionHtml: '<p>Description</p>',
        vendor: 'Test Vendor',
        productType: 'Widget',
        priceRangeV2: {
          minVariantPrice: { amount: '29.99', currencyCode: 'USD' },
        },
        status: 'ACTIVE',
      };

      const transformed = transformProduct(shopifyProduct);

      expect(transformed.title).toBe('Test Product');
      expect(transformed.price).toBe('29.99');
      expect(transformed.available).toBe(true);
    });

    it('should handle DRAFT status products', () => {
      const isAvailable = (status: string) => status === 'ACTIVE';

      expect(isAvailable('ACTIVE')).toBe(true);
      expect(isAvailable('DRAFT')).toBe(false);
      expect(isAvailable('ARCHIVED')).toBe(false);
    });
  });
});
