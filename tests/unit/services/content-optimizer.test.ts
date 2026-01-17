import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    shop: {
      findUnique: vi.fn(),
    },
    productAudit: {
      findMany: vi.fn(),
    },
    auditLog: {
      count: vi.fn(),
      create: vi.fn(),
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

vi.mock('@/lib/constants/plans', () => ({
  PLAN_LIMITS: {
    FREE: { aiOptimizationsPerMonth: 0 },
    BASIC: { aiOptimizationsPerMonth: 10 },
    PLUS: { aiOptimizationsPerMonth: 50 },
    PREMIUM: { aiOptimizationsPerMonth: 999 },
  },
}));

// Mock OpenAI - must be done before importing the module
vi.mock('openai', () => {
  class MockOpenAI {
    chat = {
      completions: {
        create: vi.fn(),
      },
    };
  }
  return { default: MockOpenAI };
});

// Import after mocks
import { prisma } from '@/lib/db/prisma';
import {
  checkOptimizationQuota,
  getProductsForOptimization,
} from '@/lib/services/content-optimizer';

describe('Content Optimizer Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkOptimizationQuota', () => {
    it('should throw error if shop not found', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(checkOptimizationQuota('nonexistent.myshopify.com'))
        .rejects.toThrow('Shop not found');
    });

    it('should return available=false for FREE plan (0 limit)', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
        plan: 'FREE',
      });

      (prisma.auditLog.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

      const result = await checkOptimizationQuota('test.myshopify.com');

      expect(result.available).toBe(false);
      expect(result.limit).toBe(0);
      expect(result.used).toBe(0);
      expect(result.remaining).toBe(0);
    });

    it('should return available=true for BASIC plan with quota remaining', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
        plan: 'BASIC',
      });

      (prisma.auditLog.count as ReturnType<typeof vi.fn>).mockResolvedValue(3);

      const result = await checkOptimizationQuota('test.myshopify.com');

      expect(result.available).toBe(true);
      expect(result.limit).toBe(10);
      expect(result.used).toBe(3);
      expect(result.remaining).toBe(7);
    });

    it('should return available=false when quota exhausted', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
        plan: 'BASIC',
      });

      (prisma.auditLog.count as ReturnType<typeof vi.fn>).mockResolvedValue(10);

      const result = await checkOptimizationQuota('test.myshopify.com');

      expect(result.available).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should query only current month optimizations', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
        plan: 'PLUS',
      });

      (prisma.auditLog.count as ReturnType<typeof vi.fn>).mockResolvedValue(5);

      await checkOptimizationQuota('test.myshopify.com');

      expect(prisma.auditLog.count).toHaveBeenCalledWith({
        where: {
          shopId: 'shop-1',
          action: 'ai_optimization',
          createdAt: expect.objectContaining({
            gte: expect.any(Date),
          }),
        },
      });
    });
  });

  describe('getProductsForOptimization', () => {
    it('should throw error if shop not found', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(getProductsForOptimization('nonexistent.myshopify.com'))
        .rejects.toThrow('Shop not found');
    });

    it('should return products with score below 70', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
      });

      (prisma.productAudit.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        {
          id: 'audit-1',
          shopifyProductId: BigInt(123456789),
          title: 'Low Score Product',
          handle: 'low-score-product',
          aiScore: 35,
          issues: [{ code: 'NO_DESCRIPTION', message: 'Missing description' }],
        },
        {
          id: 'audit-2',
          shopifyProductId: BigInt(987654321),
          title: 'Medium Score Product',
          handle: 'medium-score-product',
          aiScore: 55,
          issues: [{ code: 'SHORT_DESCRIPTION', message: 'Description too short' }],
        },
      ]);

      const products = await getProductsForOptimization('test.myshopify.com');

      expect(products).toHaveLength(2);
      expect(products[0].title).toBe('Low Score Product');
      expect(products[0].shopifyProductId).toBe('123456789');
      expect(products[0].aiScore).toBe(35);
      expect(products[0].issues).toHaveLength(1);
    });

    it('should order products by score ascending (worst first)', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
      });

      (prisma.productAudit.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await getProductsForOptimization('test.myshopify.com', 20);

      expect(prisma.productAudit.findMany).toHaveBeenCalledWith({
        where: {
          shopId: 'shop-1',
          aiScore: { lt: 70 },
        },
        orderBy: { aiScore: 'asc' },
        take: 20,
        select: expect.any(Object),
      });
    });

    it('should respect the limit parameter', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
      });

      (prisma.productAudit.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await getProductsForOptimization('test.myshopify.com', 5);

      expect(prisma.productAudit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        })
      );
    });

    it('should handle empty issues array', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
      });

      (prisma.productAudit.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        {
          id: 'audit-1',
          shopifyProductId: BigInt(123456789),
          title: 'Product',
          handle: 'product',
          aiScore: 50,
          issues: null,
        },
      ]);

      const products = await getProductsForOptimization('test.myshopify.com');

      expect(products[0].issues).toEqual([]);
    });
  });
});
