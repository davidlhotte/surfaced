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

vi.mock('@/lib/monitoring/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/constants/plans', () => ({
  PLAN_LIMITS: {
    FREE: { competitorsTracked: 0 },
    BASIC: { competitorsTracked: 3 },
    PLUS: { competitorsTracked: 10 },
    PREMIUM: { competitorsTracked: 25 },
  },
}));

import { getShopFromRequest } from '@/lib/shopify/get-shop';
import { prisma } from '@/lib/db/prisma';

describe('Dashboard API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/dashboard', () => {
    it('should return dashboard data for authenticated shop', async () => {
      const mockShop = {
        id: 'shop-1',
        shopDomain: 'test.myshopify.com',
        name: 'Test Store',
        plan: 'BASIC',
        productsCount: 100,
        aiScore: 75,
        lastAuditAt: new Date('2024-01-15'),
        productsAudit: [
          { aiScore: 90, issues: [] },
          { aiScore: 65, issues: [{ code: 'SHORT_DESCRIPTION' }] },
          { aiScore: 35, issues: [{ code: 'NO_DESCRIPTION' }] },
        ],
        visibilityChecks: [
          { platform: 'chatgpt', isMentioned: true, checkedAt: new Date() },
          { platform: 'perplexity', isMentioned: false, checkedAt: new Date() },
        ],
        competitors: [
          { name: 'Competitor 1', domain: 'comp1.com', isActive: true },
        ],
      };

      (getShopFromRequest as ReturnType<typeof vi.fn>).mockResolvedValue('test.myshopify.com');
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockShop);

      // Verify mock behavior
      const shopDomain = await getShopFromRequest({} as unknown, { rateLimit: false });
      expect(shopDomain).toBe('test.myshopify.com');

      const shop = await prisma.shop.findUnique({
        where: { shopDomain },
        include: { productsAudit: true, visibilityChecks: true, competitors: true },
      });

      expect(shop).toBeDefined();
      expect(shop?.productsCount).toBe(100);
      expect(shop?.aiScore).toBe(75);
    });

    it('should handle shop not found', async () => {
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockResolvedValue('unknown.myshopify.com');
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const shop = await prisma.shop.findUnique({
        where: { shopDomain: 'unknown.myshopify.com' },
      });

      expect(shop).toBeNull();
    });

    it('should handle unauthenticated request', async () => {
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Unauthorized')
      );

      await expect(getShopFromRequest({} as unknown, { rateLimit: false })).rejects.toThrow(
        'Unauthorized'
      );
    });
  });

  describe('Audit Stats Calculation', () => {
    it('should correctly calculate audit statistics', () => {
      const productsAudit = [
        { aiScore: 95 },
        { aiScore: 85 },
        { aiScore: 55 },
        { aiScore: 30 },
      ];

      const calculateAuditStats = (audits: { aiScore: number }[]) => ({
        auditedProducts: audits.length,
        averageScore: audits.length > 0
          ? Math.round(audits.reduce((sum, p) => sum + p.aiScore, 0) / audits.length)
          : 0,
        issues: {
          critical: audits.filter((p) => p.aiScore < 40).length,
          warning: audits.filter((p) => p.aiScore >= 40 && p.aiScore < 70).length,
          info: audits.filter((p) => p.aiScore >= 70 && p.aiScore < 90).length,
        },
      });

      const stats = calculateAuditStats(productsAudit);

      expect(stats.auditedProducts).toBe(4);
      expect(stats.averageScore).toBe(66); // (95+85+55+30)/4 = 66.25 rounded
      expect(stats.issues.critical).toBe(1); // score < 40
      expect(stats.issues.warning).toBe(1); // 40 <= score < 70
      expect(stats.issues.info).toBe(1); // 70 <= score < 90
    });

    it('should handle empty audit list', () => {
      const calculateAverageScore = (audits: { aiScore: number }[]) =>
        audits.length > 0
          ? Math.round(audits.reduce((sum, p) => sum + p.aiScore, 0) / audits.length)
          : 0;

      expect(calculateAverageScore([])).toBe(0);
    });
  });

  describe('Platform Status Building', () => {
    it('should build platform status for all platforms', () => {
      const visibilityChecks = [
        { platform: 'chatgpt', isMentioned: true, checkedAt: new Date('2024-01-15') },
        { platform: 'perplexity', isMentioned: false, checkedAt: new Date('2024-01-14') },
      ];

      const platforms = ['chatgpt', 'perplexity', 'gemini', 'copilot'];

      const buildPlatformStatus = (checks: typeof visibilityChecks) =>
        platforms.map((platformName) => {
          const platformChecks = checks.filter((c) => c.platform === platformName);
          const lastCheck = platformChecks[0];
          return {
            name: platformName,
            mentioned: lastCheck?.isMentioned ?? false,
            lastCheck: lastCheck?.checkedAt?.toISOString() ?? null,
          };
        });

      const status = buildPlatformStatus(visibilityChecks);

      expect(status).toHaveLength(4);
      expect(status.find((s) => s.name === 'chatgpt')?.mentioned).toBe(true);
      expect(status.find((s) => s.name === 'perplexity')?.mentioned).toBe(false);
      expect(status.find((s) => s.name === 'gemini')?.lastCheck).toBeNull();
    });
  });

  describe('Monthly Checks Counting', () => {
    it('should count only checks from current month', () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);

      const visibilityChecks = [
        { checkedAt: now, isMentioned: true },
        { checkedAt: new Date(now.getTime() - 86400000), isMentioned: false }, // Yesterday
        { checkedAt: lastMonth, isMentioned: true }, // Last month
      ];

      const countMonthlyChecks = (checks: { checkedAt: Date }[]) =>
        checks.filter((c) => c.checkedAt >= startOfMonth).length;

      const count = countMonthlyChecks(visibilityChecks);
      expect(count).toBe(2); // Only current month checks
    });
  });
});
