import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing the module
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    shop: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    productAudit: {
      upsert: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/shopify/graphql', () => ({
  fetchProducts: vi.fn(),
  fetchShopInfo: vi.fn(),
}));

vi.mock('@/lib/monitoring/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Import after mocks
import { runAudit, type AuditResult } from '@/lib/services/audit-engine';
import { prisma } from '@/lib/db/prisma';
import { fetchProducts, fetchShopInfo } from '@/lib/shopify/graphql';

describe('Audit Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('runAudit', () => {
    it('should throw error if shop not found', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(runAudit('nonexistent.myshopify.com')).rejects.toThrow('Shop not found');
    });

    it('should audit products and return results', async () => {
      // Mock shop
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
        plan: 'FREE',
      });

      // Mock shop info
      (fetchShopInfo as ReturnType<typeof vi.fn>).mockResolvedValue({
        shop: {
          name: 'Test Shop',
          email: 'test@shop.com',
          productsCount: { count: 2 },
        },
      });

      // Mock products
      (fetchProducts as ReturnType<typeof vi.fn>).mockResolvedValue({
        products: {
          nodes: [
            {
              id: 'gid://shopify/Product/123456789',
              title: 'Product 1',
              handle: 'product-1',
              description: 'This is a great product with lots of details about what it does.',
              descriptionHtml: '<p>This is a great product with lots of details about what it does.</p>',
              productType: 'Widget',
              vendor: 'TestVendor',
              tags: ['tag1', 'tag2', 'tag3'],
              images: {
                nodes: [
                  { url: 'https://example.com/img1.jpg', altText: 'Product image' },
                ],
              },
              metafields: {
                nodes: [],
              },
              seo: {
                title: 'Product 1 - Best Widget',
                description: 'Buy the best widget',
              },
            },
            {
              id: 'gid://shopify/Product/987654321',
              title: 'Product 2',
              handle: 'product-2',
              description: '',
              descriptionHtml: '',
              productType: '',
              vendor: '',
              tags: [],
              images: {
                nodes: [],
              },
              metafields: {
                nodes: [],
              },
              seo: {
                title: null,
                description: null,
              },
            },
          ],
        },
      });

      // Mock database operations
      (prisma.productAudit.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({});
      (prisma.shop.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
      (prisma.auditLog.create as ReturnType<typeof vi.fn>).mockResolvedValue({});

      const result: AuditResult = await runAudit('test.myshopify.com');

      expect(result.totalProducts).toBe(2);
      expect(result.auditedProducts).toBe(2);
      expect(result.products).toHaveLength(2);

      // Product 1 should have a good score (has description, images, etc.)
      const product1 = result.products.find(p => p.title === 'Product 1');
      expect(product1?.aiScore).toBeGreaterThanOrEqual(70);
      expect(product1?.hasDescription).toBe(true);
      expect(product1?.hasImages).toBe(true);

      // Product 2 should have a poor score (no description, no images)
      const product2 = result.products.find(p => p.title === 'Product 2');
      expect(product2?.aiScore).toBeLessThan(40);
      expect(product2?.hasDescription).toBe(false);
      expect(product2?.hasImages).toBe(false);
      expect(product2?.issues.some(i => i.code === 'NO_DESCRIPTION')).toBe(true);
      expect(product2?.issues.some(i => i.code === 'NO_IMAGES')).toBe(true);

      // Verify database was updated
      expect(prisma.productAudit.upsert).toHaveBeenCalledTimes(2);
      expect(prisma.shop.update).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should calculate correct issue counts', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
        plan: 'FREE',
      });

      (fetchShopInfo as ReturnType<typeof vi.fn>).mockResolvedValue({
        shop: {
          name: 'Test Shop',
          email: 'test@shop.com',
          productsCount: { count: 3 },
        },
      });

      (fetchProducts as ReturnType<typeof vi.fn>).mockResolvedValue({
        products: {
          nodes: [
            // Critical product (score < 40)
            {
              id: 'gid://shopify/Product/1',
              title: 'Critical Product',
              handle: 'critical',
              description: '',
              descriptionHtml: '',
              productType: '',
              vendor: '',
              tags: [],
              images: { nodes: [] },
              metafields: { nodes: [] },
              seo: { title: null, description: null },
            },
            // Warning product (score 40-69)
            {
              id: 'gid://shopify/Product/2',
              title: 'Warning Product',
              handle: 'warning',
              description: 'Short description here',
              descriptionHtml: '<p>Short description here</p>',
              productType: '',
              vendor: '',
              tags: [],
              images: { nodes: [{ url: 'img.jpg', altText: '' }] },
              metafields: { nodes: [] },
              seo: { title: null, description: null },
            },
            // Good product (score 70+)
            {
              id: 'gid://shopify/Product/3',
              title: 'Good Product',
              handle: 'good',
              description: 'This is a very detailed product description that provides all the information a customer needs.',
              descriptionHtml: '<p>This is a very detailed product description.</p>',
              productType: 'Type',
              vendor: 'Vendor',
              tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
              images: {
                nodes: [
                  { url: 'img1.jpg', altText: 'Alt 1' },
                  { url: 'img2.jpg', altText: 'Alt 2' },
                  { url: 'img3.jpg', altText: 'Alt 3' },
                ],
              },
              metafields: { nodes: [{ key: 'test', value: 'value' }] },
              seo: { title: 'SEO Title', description: 'SEO Desc' },
            },
          ],
        },
      });

      (prisma.productAudit.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({});
      (prisma.shop.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
      (prisma.auditLog.create as ReturnType<typeof vi.fn>).mockResolvedValue({});

      const result = await runAudit('test.myshopify.com');

      // Critical = score < 40, Warning = 40-69, Info = 70-89, Good = 90+
      expect(result.issues.critical).toBe(1);
      expect(result.issues.warning).toBe(1);
      // The "Good Product" has score 90+ so it doesn't count as info (70-89)
      expect(result.issues.info).toBe(0);
    });
  });
});
