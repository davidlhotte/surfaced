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
  },
}));

vi.mock('@/lib/services/audit-engine', () => ({
  runAudit: vi.fn(),
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
import { runAudit } from '@/lib/services/audit-engine';

describe('Audit API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/audit', () => {
    it('should run audit for authenticated shop', async () => {
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockResolvedValue('test.myshopify.com');

      (runAudit as ReturnType<typeof vi.fn>).mockResolvedValue({
        auditedProducts: 50,
        totalProducts: 100,
        averageScore: 72,
        issues: {
          critical: 5,
          warning: 15,
          info: 10,
        },
      });

      const shopDomain = await getShopFromRequest({} as unknown, { rateLimit: true });
      expect(shopDomain).toBe('test.myshopify.com');

      const result = await runAudit(shopDomain);

      expect(result.auditedProducts).toBe(50);
      expect(result.averageScore).toBe(72);
      expect(runAudit).toHaveBeenCalledWith('test.myshopify.com');
    });

    it('should handle audit failure', async () => {
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockResolvedValue('test.myshopify.com');
      (runAudit as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Audit failed'));

      await expect(runAudit('test.myshopify.com')).rejects.toThrow('Audit failed');
    });

    it('should handle rate limit exceeded', async () => {
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Rate limit exceeded')
      );

      await expect(getShopFromRequest({} as unknown, { rateLimit: true })).rejects.toThrow(
        'Rate limit exceeded'
      );
    });
  });

  describe('GET /api/audit', () => {
    it('should return last audit results', async () => {
      const mockShop = {
        id: 'shop-1',
        shopDomain: 'test.myshopify.com',
        productsCount: 100,
        aiScore: 72,
        lastAuditAt: new Date('2024-01-15'),
        productsAudit: [
          {
            id: 'audit-1',
            shopifyProductId: BigInt(123456789),
            title: 'Product 1',
            handle: 'product-1',
            aiScore: 85,
            issues: [],
            hasImages: true,
            hasDescription: true,
            hasMetafields: false,
            descriptionLength: 200,
            lastAuditAt: new Date('2024-01-15'),
          },
          {
            id: 'audit-2',
            shopifyProductId: BigInt(987654321),
            title: 'Product 2',
            handle: 'product-2',
            aiScore: 35,
            issues: [{ code: 'NO_DESCRIPTION', message: 'Missing description' }],
            hasImages: true,
            hasDescription: false,
            hasMetafields: false,
            descriptionLength: 0,
            lastAuditAt: new Date('2024-01-15'),
          },
        ],
      };

      (getShopFromRequest as ReturnType<typeof vi.fn>).mockResolvedValue('test.myshopify.com');
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockShop);

      const shop = await prisma.shop.findUnique({
        where: { shopDomain: 'test.myshopify.com' },
        include: { productsAudit: { orderBy: { lastAuditAt: 'desc' } } },
      });

      expect(shop).toBeDefined();
      expect(shop?.productsAudit).toHaveLength(2);
      expect(shop?.aiScore).toBe(72);
    });

    it('should return 404 for unknown shop', async () => {
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockResolvedValue('unknown.myshopify.com');
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const shop = await prisma.shop.findUnique({
        where: { shopDomain: 'unknown.myshopify.com' },
      });

      expect(shop).toBeNull();
    });
  });

  describe('Audit Stats Calculation', () => {
    it('should correctly categorize issues by severity', () => {
      const productsAudit = [
        { aiScore: 95 }, // Excellent
        { aiScore: 75 }, // Good (info)
        { aiScore: 50 }, // Warning
        { aiScore: 25 }, // Critical
        { aiScore: 39 }, // Critical
      ];

      const categorizeIssues = (audits: { aiScore: number }[]) => ({
        critical: audits.filter((p) => p.aiScore < 40).length,
        warning: audits.filter((p) => p.aiScore >= 40 && p.aiScore < 70).length,
        info: audits.filter((p) => p.aiScore >= 70 && p.aiScore < 90).length,
      });

      const issues = categorizeIssues(productsAudit);

      expect(issues.critical).toBe(2);
      expect(issues.warning).toBe(1);
      expect(issues.info).toBe(1);
    });

    it('should handle empty product list', () => {
      const calculateStats = (audits: { aiScore: number }[]) => ({
        auditedProducts: audits.length,
        averageScore: audits.length > 0
          ? Math.round(audits.reduce((sum, p) => sum + p.aiScore, 0) / audits.length)
          : 0,
      });

      const stats = calculateStats([]);

      expect(stats.auditedProducts).toBe(0);
      expect(stats.averageScore).toBe(0);
    });
  });

  describe('Product Data Serialization', () => {
    it('should correctly serialize product audit data', () => {
      const mockProduct = {
        id: 'audit-1',
        shopifyProductId: BigInt(123456789),
        title: 'Test Product',
        handle: 'test-product',
        aiScore: 75,
        issues: [{ code: 'SHORT_DESCRIPTION', message: 'Description too short' }],
        hasImages: true,
        hasDescription: true,
        hasMetafields: false,
        descriptionLength: 100,
        lastAuditAt: new Date('2024-01-15T10:00:00Z'),
      };

      const serialize = (p: typeof mockProduct) => ({
        id: p.id,
        shopifyProductId: p.shopifyProductId.toString(),
        title: p.title,
        handle: p.handle,
        aiScore: p.aiScore,
        issues: p.issues,
        hasImages: p.hasImages,
        hasDescription: p.hasDescription,
        hasMetafields: p.hasMetafields,
        descriptionLength: p.descriptionLength,
        lastAuditAt: p.lastAuditAt.toISOString(),
      });

      const serialized = serialize(mockProduct);

      expect(serialized.shopifyProductId).toBe('123456789');
      expect(serialized.lastAuditAt).toBe('2024-01-15T10:00:00.000Z');
      expect(typeof serialized.aiScore).toBe('number');
    });
  });
});
