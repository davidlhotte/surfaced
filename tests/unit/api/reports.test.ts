import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    shop: {
      findUnique: vi.fn(),
    },
    visibilityCheck: {
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock('@/lib/monitoring/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock getShopFromRequest
vi.mock('@/lib/shopify/get-shop', () => ({
  getShopFromRequest: vi.fn(),
}));

import { prisma } from '@/lib/db/prisma';
import { getShopFromRequest } from '@/lib/shopify/get-shop';

describe('Reports API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Report Format Selection', () => {
    it('should generate CSV for audit report when format=csv', async () => {
      // Mock shop data
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockResolvedValue('test.myshopify.com');
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
        shopDomain: 'test.myshopify.com',
        name: 'Test Shop',
        plan: 'PLUS',
        aiScore: 75,
        productsCount: 10,
        lastAuditAt: new Date(),
        productsAudit: [
          {
            id: 'p1',
            shopifyProductId: BigInt(123),
            title: 'Test Product',
            handle: 'test-product',
            aiScore: 80,
            hasImages: true,
            hasDescription: true,
            hasMetafields: false,
            descriptionLength: 150,
            issues: [],
            lastAuditAt: new Date(),
          },
        ],
      });
      (prisma.visibilityCheck.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (prisma.visibilityCheck.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

      // Import the handler dynamically after mocks are set up
      const { GET } = await import('@/app/api/reports/route');

      const request = new Request('http://localhost/api/reports?type=audit&format=csv&download=true');
      const response = await GET(request as never);

      expect(response.headers.get('content-type')).toBe('text/csv');
      expect(response.headers.get('content-disposition')).toContain('.csv');
    });

    it('should generate JSON for audit report when format=json', async () => {
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockResolvedValue('test.myshopify.com');
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
        shopDomain: 'test.myshopify.com',
        name: 'Test Shop',
        plan: 'PLUS',
        aiScore: 75,
        productsCount: 10,
        lastAuditAt: new Date(),
        productsAudit: [],
      });
      (prisma.visibilityCheck.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (prisma.visibilityCheck.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

      const { GET } = await import('@/app/api/reports/route');

      const request = new Request('http://localhost/api/reports?type=audit&format=json&download=true');
      const response = await GET(request as never);

      expect(response.headers.get('content-type')).toBe('application/json');
      expect(response.headers.get('content-disposition')).toContain('.json');
    });

    it('should generate TXT for audit report when format=txt', async () => {
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockResolvedValue('test.myshopify.com');
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
        shopDomain: 'test.myshopify.com',
        name: 'Test Shop',
        plan: 'PLUS',
        aiScore: 75,
        productsCount: 10,
        lastAuditAt: new Date(),
        productsAudit: [],
      });
      (prisma.visibilityCheck.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (prisma.visibilityCheck.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

      const { GET } = await import('@/app/api/reports/route');

      const request = new Request('http://localhost/api/reports?type=audit&format=txt&download=true');
      const response = await GET(request as never);

      expect(response.headers.get('content-type')).toBe('text/plain');
      expect(response.headers.get('content-disposition')).toContain('.txt');
    });
  });

  describe('Visibility Report Formats', () => {
    it('should generate CSV for visibility report when format=csv', async () => {
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockResolvedValue('test.myshopify.com');
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
        shopDomain: 'test.myshopify.com',
        name: 'Test Shop',
        plan: 'PLUS',
      });
      (prisma.visibilityCheck.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        {
          id: 'check-1',
          platform: 'chatgpt',
          query: 'test query',
          isMentioned: true,
          position: 2,
          responseQuality: 'good',
          competitorsFound: [],
          checkedAt: new Date(),
        },
      ]);

      const { GET } = await import('@/app/api/reports/route');

      const request = new Request('http://localhost/api/reports?type=visibility&format=csv&download=true');
      const response = await GET(request as never);

      expect(response.headers.get('content-type')).toBe('text/csv');
      expect(response.headers.get('content-disposition')).toContain('.csv');
    });

    it('should generate TXT for visibility report when format=txt', async () => {
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockResolvedValue('test.myshopify.com');
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
        shopDomain: 'test.myshopify.com',
        name: 'Test Shop',
        plan: 'PLUS',
      });
      (prisma.visibilityCheck.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const { GET } = await import('@/app/api/reports/route');

      const request = new Request('http://localhost/api/reports?type=visibility&format=txt&download=true');
      const response = await GET(request as never);

      expect(response.headers.get('content-type')).toBe('text/plain');
      expect(response.headers.get('content-disposition')).toContain('.txt');
    });

    it('should generate JSON for visibility report when format=json', async () => {
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockResolvedValue('test.myshopify.com');
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
        shopDomain: 'test.myshopify.com',
        name: 'Test Shop',
        plan: 'PLUS',
      });
      (prisma.visibilityCheck.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const { GET } = await import('@/app/api/reports/route');

      const request = new Request('http://localhost/api/reports?type=visibility&format=json&download=true');
      const response = await GET(request as never);

      expect(response.headers.get('content-type')).toBe('application/json');
      expect(response.headers.get('content-disposition')).toContain('.json');
    });
  });

  describe('Summary Report', () => {
    it('should always generate TXT for summary report regardless of format param', async () => {
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockResolvedValue('test.myshopify.com');
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
        shopDomain: 'test.myshopify.com',
        name: 'Test Shop',
        plan: 'PLUS',
        aiScore: 75,
        productsCount: 10,
        lastAuditAt: new Date(),
        productsAudit: [],
      });
      (prisma.visibilityCheck.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (prisma.visibilityCheck.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

      const { GET } = await import('@/app/api/reports/route');

      const request = new Request('http://localhost/api/reports?type=summary&format=csv&download=true');
      const response = await GET(request as never);

      expect(response.headers.get('content-type')).toBe('text/plain');
      expect(response.headers.get('content-disposition')).toContain('.txt');
    });
  });

  describe('Filename Generation', () => {
    it('should include "aeo" in filename', async () => {
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockResolvedValue('test.myshopify.com');
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
        shopDomain: 'test.myshopify.com',
        name: 'Test Shop',
        plan: 'PLUS',
        aiScore: 75,
        productsCount: 10,
        lastAuditAt: new Date(),
        productsAudit: [],
      });
      (prisma.visibilityCheck.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (prisma.visibilityCheck.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

      const { GET } = await import('@/app/api/reports/route');

      const request = new Request('http://localhost/api/reports?type=audit&format=csv&download=true');
      const response = await GET(request as never);

      const disposition = response.headers.get('content-disposition');
      expect(disposition).toContain('surfaced-aeo');
    });
  });
});
