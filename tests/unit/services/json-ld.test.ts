import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    shop: {
      findUnique: vi.fn(),
    },
    jsonLdConfig: {
      create: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock('@/lib/monitoring/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Import after mocks
import { prisma } from '@/lib/db/prisma';
import {
  generateProductJsonLd,
  generateOrganizationJsonLd,
  generateBreadcrumbJsonLd,
  generateAllJsonLd,
  getJsonLdConfig,
  updateJsonLdConfig,
} from '@/lib/services/json-ld';
import type { JsonLdConfig } from '@prisma/client';

// Helper to create mock config
const createMockConfig = (overrides: Partial<JsonLdConfig> = {}): JsonLdConfig => ({
  id: 'config-1',
  shopId: 'shop-1',
  isEnabled: true,
  includeOrganization: true,
  includeProducts: true,
  includeBreadcrumbs: true,
  excludedProductIds: [],
  lastGeneratedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('JSON-LD Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateProductJsonLd', () => {
    it('should generate valid product schema', () => {
      const product = {
        id: '123',
        title: 'Test Product',
        handle: 'test-product',
        description: 'A great product for testing',
        images: ['https://example.com/img.jpg'],
        vendor: 'Test Brand',
        productType: 'Widget',
        price: '29.99',
        currency: 'USD',
        available: true,
        sku: 'TEST-123',
      };

      const jsonLd = generateProductJsonLd(product, 'test.myshopify.com', 'Test Store');

      expect(jsonLd['@context']).toBe('https://schema.org');
      expect(jsonLd['@type']).toBe('Product');
      expect(jsonLd.name).toBe('Test Product');
      expect(jsonLd.url).toBe('https://test.myshopify.com/products/test-product');
      expect(jsonLd.description).toBe('A great product for testing');
      expect(jsonLd.sku).toBe('TEST-123');
      expect(jsonLd.brand?.name).toBe('Test Brand');
    });

    it('should include offer with price information', () => {
      const product = {
        id: '123',
        title: 'Test Product',
        handle: 'test-product',
        images: [],
        price: '49.99',
        currency: 'EUR',
        available: true,
      };

      const jsonLd = generateProductJsonLd(product, 'shop.myshopify.com', 'Shop');

      expect(jsonLd.offers).toBeDefined();
      expect(jsonLd.offers?.price).toBe('49.99');
      expect(jsonLd.offers?.priceCurrency).toBe('EUR');
      expect(jsonLd.offers?.availability).toBe('https://schema.org/InStock');
      expect(jsonLd.offers?.seller?.name).toBe('Shop');
    });

    it('should mark out of stock products correctly', () => {
      const product = {
        id: '123',
        title: 'Sold Out Product',
        handle: 'sold-out',
        images: [],
        price: '99.99',
        currency: 'USD',
        available: false,
      };

      const jsonLd = generateProductJsonLd(product, 'shop.myshopify.com', 'Shop');

      expect(jsonLd.offers?.availability).toBe('https://schema.org/OutOfStock');
    });

    it('should handle multiple images', () => {
      const product = {
        id: '123',
        title: 'Multi Image Product',
        handle: 'multi-image',
        images: [
          'https://example.com/img1.jpg',
          'https://example.com/img2.jpg',
          'https://example.com/img3.jpg',
        ],
        price: '19.99',
        currency: 'USD',
        available: true,
      };

      const jsonLd = generateProductJsonLd(product, 'shop.myshopify.com', 'Shop');

      expect(Array.isArray(jsonLd.image)).toBe(true);
      expect((jsonLd.image as string[]).length).toBe(3);
    });

    it('should handle single image as string', () => {
      const product = {
        id: '123',
        title: 'Single Image Product',
        handle: 'single-image',
        images: ['https://example.com/img.jpg'],
        price: '19.99',
        currency: 'USD',
        available: true,
      };

      const jsonLd = generateProductJsonLd(product, 'shop.myshopify.com', 'Shop');

      expect(typeof jsonLd.image).toBe('string');
      expect(jsonLd.image).toBe('https://example.com/img.jpg');
    });

    it('should strip HTML from description', () => {
      const product = {
        id: '123',
        title: 'HTML Description Product',
        handle: 'html-desc',
        description: '<p>This is a <strong>bold</strong> description &amp; more.</p>',
        images: [],
        price: '19.99',
        currency: 'USD',
        available: true,
      };

      const jsonLd = generateProductJsonLd(product, 'shop.myshopify.com', 'Shop');

      expect(jsonLd.description).toBe('This is a bold description & more.');
    });

    it('should truncate long descriptions', () => {
      const longDescription = 'A'.repeat(600);
      const product = {
        id: '123',
        title: 'Long Description Product',
        handle: 'long-desc',
        description: longDescription,
        images: [],
        price: '19.99',
        currency: 'USD',
        available: true,
      };

      const jsonLd = generateProductJsonLd(product, 'shop.myshopify.com', 'Shop');

      expect(jsonLd.description?.length).toBeLessThanOrEqual(500);
      expect(jsonLd.description?.endsWith('...')).toBe(true);
    });

    it('should not include optional fields when missing', () => {
      const product = {
        id: '123',
        title: 'Minimal Product',
        handle: 'minimal',
        images: [],
        price: '9.99',
        currency: 'USD',
        available: true,
      };

      const jsonLd = generateProductJsonLd(product, 'shop.myshopify.com', 'Shop');

      expect(jsonLd.description).toBeUndefined();
      expect(jsonLd.brand).toBeUndefined();
      expect(jsonLd.sku).toBeUndefined();
      expect(jsonLd.image).toBeUndefined();
    });
  });

  describe('generateOrganizationJsonLd', () => {
    it('should generate valid organization schema', () => {
      const jsonLd = generateOrganizationJsonLd('shop.myshopify.com', 'Test Store');

      expect(jsonLd['@context']).toBe('https://schema.org');
      expect(jsonLd['@type']).toBe('Organization');
      expect(jsonLd.name).toBe('Test Store');
      expect(jsonLd.url).toBe('https://shop.myshopify.com');
    });

    it('should include optional fields when provided', () => {
      const jsonLd = generateOrganizationJsonLd('shop.myshopify.com', 'Test Store', {
        description: 'Best store in the world',
        logo: 'https://shop.myshopify.com/logo.png',
        email: 'support@shop.com',
        socialLinks: ['https://twitter.com/shop', 'https://facebook.com/shop'],
      });

      expect(jsonLd.description).toBe('Best store in the world');
      expect(jsonLd.logo).toBe('https://shop.myshopify.com/logo.png');
      expect(jsonLd.contactPoint?.email).toBe('support@shop.com');
      expect(jsonLd.contactPoint?.contactType).toBe('customer service');
      expect(jsonLd.sameAs).toHaveLength(2);
    });

    it('should strip HTML from description', () => {
      const jsonLd = generateOrganizationJsonLd('shop.myshopify.com', 'Test Store', {
        description: '<p>We sell <em>great</em> products!</p>',
      });

      expect(jsonLd.description).toBe('We sell great products!');
    });
  });

  describe('generateBreadcrumbJsonLd', () => {
    it('should generate valid breadcrumb schema', () => {
      const items = [
        { name: 'Home', url: 'https://shop.com' },
        { name: 'Products', url: 'https://shop.com/products' },
        { name: 'Category', url: 'https://shop.com/category' },
      ];

      const jsonLd = generateBreadcrumbJsonLd(items);

      expect(jsonLd['@context']).toBe('https://schema.org');
      expect(jsonLd['@type']).toBe('BreadcrumbList');
      expect(jsonLd.itemListElement).toHaveLength(3);
      expect(jsonLd.itemListElement[0].position).toBe(1);
      expect(jsonLd.itemListElement[1].position).toBe(2);
      expect(jsonLd.itemListElement[2].position).toBe(3);
    });

    it('should handle items without URLs', () => {
      const items = [
        { name: 'Home', url: 'https://shop.com' },
        { name: 'Current Page' }, // No URL for current page
      ];

      const jsonLd = generateBreadcrumbJsonLd(items);

      expect(jsonLd.itemListElement[0].item).toBe('https://shop.com');
      expect(jsonLd.itemListElement[1].item).toBeUndefined();
    });
  });

  describe('generateAllJsonLd', () => {
    it('should generate all schema types', () => {
      const options = {
        shopDomain: 'shop.myshopify.com',
        shopName: 'Test Shop',
        shopDescription: 'Best shop ever',
        products: [
          {
            id: '1',
            title: 'Product 1',
            handle: 'product-1',
            images: ['https://example.com/img.jpg'],
            price: '19.99',
            currency: 'USD',
            available: true,
          },
        ],
        config: createMockConfig({ includeProducts: true }),
      };

      const result = generateAllJsonLd(options);

      expect(result.organization).toBeDefined();
      expect(result.products).toHaveLength(1);
      expect(result.breadcrumbs).toBeDefined();
    });

    it('should exclude products when disabled in config', () => {
      const options = {
        shopDomain: 'shop.myshopify.com',
        shopName: 'Test Shop',
        products: [
          {
            id: '1',
            title: 'Product 1',
            handle: 'product-1',
            images: [],
            price: '19.99',
            currency: 'USD',
            available: true,
          },
        ],
        config: createMockConfig({ includeProducts: false }),
      };

      const result = generateAllJsonLd(options);

      expect(result.products).toHaveLength(0);
    });

    it('should exclude specific products by ID', () => {
      const options = {
        shopDomain: 'shop.myshopify.com',
        shopName: 'Test Shop',
        products: [
          { id: '1', title: 'Include Me', handle: 'include', images: [], price: '10', currency: 'USD', available: true },
          { id: '2', title: 'Exclude Me', handle: 'exclude', images: [], price: '20', currency: 'USD', available: true },
          { id: '3', title: 'Also Include', handle: 'also', images: [], price: '30', currency: 'USD', available: true },
        ],
        config: createMockConfig({ includeProducts: true, excludedProductIds: ['2'] }),
      };

      const result = generateAllJsonLd(options);

      expect(result.products).toHaveLength(2);
      expect(result.products.find(p => p.name === 'Exclude Me')).toBeUndefined();
    });

    it('should exclude unavailable products', () => {
      const options = {
        shopDomain: 'shop.myshopify.com',
        shopName: 'Test Shop',
        products: [
          { id: '1', title: 'Available', handle: 'available', images: [], price: '10', currency: 'USD', available: true },
          { id: '2', title: 'Sold Out', handle: 'sold-out', images: [], price: '20', currency: 'USD', available: false },
        ],
        config: createMockConfig({ includeProducts: true }),
      };

      const result = generateAllJsonLd(options);

      expect(result.products).toHaveLength(1);
      expect(result.products[0].name).toBe('Available');
    });

    it('should limit products to 100', () => {
      const products = Array.from({ length: 150 }, (_, i) => ({
        id: String(i),
        title: `Product ${i}`,
        handle: `product-${i}`,
        images: [],
        price: '10',
        currency: 'USD',
        available: true,
      }));

      const options = {
        shopDomain: 'shop.myshopify.com',
        shopName: 'Test Shop',
        products,
        config: createMockConfig({ includeProducts: true }),
      };

      const result = generateAllJsonLd(options);

      expect(result.products).toHaveLength(100);
    });
  });

  describe('getJsonLdConfig', () => {
    it('should return null if shop not found', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const config = await getJsonLdConfig('nonexistent.myshopify.com');

      expect(config).toBeNull();
    });

    it('should return existing config', async () => {
      const mockConfig = {
        id: 'config-1',
        isEnabled: true,
        includeProducts: true,
      };

      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
        jsonLdConfig: mockConfig,
      });

      const config = await getJsonLdConfig('test.myshopify.com');

      expect(config).toEqual(mockConfig);
    });

    it('should create default config if none exists', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
        jsonLdConfig: null,
      });

      const mockCreatedConfig = {
        id: 'new-config',
        shopId: 'shop-1',
        isEnabled: true,
        includeOrganization: true,
        includeProducts: true,
        includeBreadcrumbs: true,
        excludedProductIds: [],
      };

      (prisma.jsonLdConfig.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockCreatedConfig);

      const config = await getJsonLdConfig('test.myshopify.com');

      expect(prisma.jsonLdConfig.create).toHaveBeenCalledWith({
        data: {
          shopId: 'shop-1',
          isEnabled: true,
          includeOrganization: true,
          includeProducts: true,
          includeBreadcrumbs: true,
          excludedProductIds: [],
        },
      });
      expect(config).toEqual(mockCreatedConfig);
    });
  });

  describe('updateJsonLdConfig', () => {
    it('should throw error if shop not found', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(
        updateJsonLdConfig('nonexistent.myshopify.com', { isEnabled: false })
      ).rejects.toThrow('Shop not found');
    });

    it('should update config with partial data', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
      });

      const mockUpdatedConfig = {
        id: 'config-1',
        isEnabled: false,
        includeProducts: true,
      };

      (prisma.jsonLdConfig.upsert as ReturnType<typeof vi.fn>).mockResolvedValue(mockUpdatedConfig);

      const config = await updateJsonLdConfig('test.myshopify.com', {
        isEnabled: false,
      });

      expect(prisma.jsonLdConfig.upsert).toHaveBeenCalled();
      expect(config.isEnabled).toBe(false);
    });

    it('should update excluded product IDs', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
      });

      (prisma.jsonLdConfig.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({
        excludedProductIds: ['1', '2', '3'],
      });

      await updateJsonLdConfig('test.myshopify.com', {
        excludedProductIds: ['1', '2', '3'],
      });

      expect(prisma.jsonLdConfig.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            excludedProductIds: ['1', '2', '3'],
          }),
        })
      );
    });
  });
});
