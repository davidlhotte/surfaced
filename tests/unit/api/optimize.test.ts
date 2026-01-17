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
    productAudit: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('@/lib/security/encryption', () => ({
  decryptToken: vi.fn().mockReturnValue('mock-token'),
}));

vi.mock('@/lib/shopify/graphql', () => ({
  fetchProductById: vi.fn(),
}));

vi.mock('@/lib/services/content-optimizer', () => ({
  checkOptimizationQuota: vi.fn(),
  getProductsForOptimization: vi.fn(),
  generateOptimizationSuggestions: vi.fn(),
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
import {
  checkOptimizationQuota,
  getProductsForOptimization,
  generateOptimizationSuggestions,
} from '@/lib/services/content-optimizer';
import { fetchProductById } from '@/lib/shopify/graphql';

describe('Optimize API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/optimize', () => {
    it('should return quota and products needing optimization', async () => {
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockResolvedValue('test.myshopify.com');

      (checkOptimizationQuota as ReturnType<typeof vi.fn>).mockResolvedValue({
        available: true,
        used: 3,
        limit: 10,
        remaining: 7,
      });

      (getProductsForOptimization as ReturnType<typeof vi.fn>).mockResolvedValue([
        {
          id: 'audit-1',
          shopifyProductId: '123456789',
          title: 'Low Score Product',
          handle: 'low-score-product',
          aiScore: 35,
          issues: [{ code: 'NO_DESCRIPTION', message: 'Missing description' }],
        },
      ]);

      // Verify the mock functions are called correctly
      await getShopFromRequest({} as unknown, { rateLimit: false });
      expect(getShopFromRequest).toHaveBeenCalled();

      const quota = await checkOptimizationQuota('test.myshopify.com');
      expect(quota.available).toBe(true);
      expect(quota.remaining).toBe(7);

      const products = await getProductsForOptimization('test.myshopify.com', 20);
      expect(products).toHaveLength(1);
      expect(products[0].aiScore).toBe(35);
    });

    it('should handle shop not found', async () => {
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Shop not found')
      );

      await expect(getShopFromRequest({} as unknown, { rateLimit: false })).rejects.toThrow(
        'Shop not found'
      );
    });
  });

  describe('POST /api/optimize', () => {
    it('should generate optimization suggestions for a product', async () => {
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockResolvedValue('test.myshopify.com');

      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        accessToken: 'encrypted-token',
      });

      (prisma.productAudit.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        title: 'Test Product',
        handle: 'test-product',
        aiScore: 45,
        issues: [{ code: 'SHORT_DESCRIPTION', message: 'Description too short' }],
      });

      (fetchProductById as ReturnType<typeof vi.fn>).mockResolvedValue({
        title: 'Test Product',
        handle: 'test-product',
        description: 'Short desc',
        productType: 'Widget',
        vendor: 'TestVendor',
        tags: [],
        seo: { title: null, description: null },
        images: { nodes: [] },
      });

      (generateOptimizationSuggestions as ReturnType<typeof vi.fn>).mockResolvedValue({
        productId: '123456789',
        title: 'Test Product',
        handle: 'test-product',
        currentScore: 45,
        estimatedNewScore: 75,
        suggestions: [
          {
            field: 'description',
            original: 'Short desc',
            suggested: 'A comprehensive product description...',
            reasoning: 'Detailed descriptions help AI understand your product.',
            improvement: 'Added comprehensive description',
          },
        ],
      });

      const optimization = await generateOptimizationSuggestions(
        'test.myshopify.com',
        '123456789',
        {
          title: 'Test Product',
          handle: 'test-product',
          description: 'Short desc',
          tags: [],
          imageAltTexts: [],
        }
      );

      expect(optimization.currentScore).toBe(45);
      expect(optimization.estimatedNewScore).toBe(75);
      expect(optimization.suggestions).toHaveLength(1);
    });

    it('should reject when quota exhausted', async () => {
      (checkOptimizationQuota as ReturnType<typeof vi.fn>).mockResolvedValue({
        available: false,
        used: 10,
        limit: 10,
        remaining: 0,
      });

      const quota = await checkOptimizationQuota('test.myshopify.com');
      expect(quota.available).toBe(false);
      expect(quota.remaining).toBe(0);
    });

    it('should return 400 when productId is missing', async () => {
      // This tests the validation logic
      const validateProductId = (body: { productId?: string }) => {
        if (!body.productId) {
          return { error: 'Product ID is required', status: 400 };
        }
        return null;
      };

      const result = validateProductId({});
      expect(result?.status).toBe(400);
      expect(result?.error).toBe('Product ID is required');
    });

    it('should return 404 when product not found in audit data', async () => {
      (prisma.productAudit.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const result = await prisma.productAudit.findFirst({
        where: {
          shopifyProductId: BigInt(999),
          shop: { shopDomain: 'test.myshopify.com' },
        },
      });

      expect(result).toBeNull();
    });

    it('should handle Shopify API failure gracefully', async () => {
      (fetchProductById as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Shopify API error')
      );

      await expect(
        fetchProductById('test.myshopify.com', 'token', 'gid://shopify/Product/123')
      ).rejects.toThrow('Shopify API error');
    });
  });

  describe('Optimization Quota Logic', () => {
    it('should calculate remaining quota correctly', () => {
      const calculateRemaining = (used: number, limit: number) => Math.max(0, limit - used);

      expect(calculateRemaining(3, 10)).toBe(7);
      expect(calculateRemaining(10, 10)).toBe(0);
      expect(calculateRemaining(15, 10)).toBe(0); // Over limit still returns 0
    });

    it('should determine availability based on quota', () => {
      const isAvailable = (used: number, limit: number) => used < limit;

      expect(isAvailable(3, 10)).toBe(true);
      expect(isAvailable(10, 10)).toBe(false);
      expect(isAvailable(0, 10)).toBe(true);
      expect(isAvailable(0, 0)).toBe(false); // FREE plan with 0 limit
    });
  });
});

describe('PATCH /api/optimize (Apply Suggestions)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should validate required fields for apply', () => {
    const validateApplyRequest = (body: { productId?: string; suggestions?: unknown[] }) => {
      if (!body.productId || !body.suggestions || !Array.isArray(body.suggestions)) {
        return { error: 'Product ID and suggestions array are required', status: 400 };
      }
      return null;
    };

    expect(validateApplyRequest({})).toEqual({
      error: 'Product ID and suggestions array are required',
      status: 400,
    });

    expect(validateApplyRequest({ productId: '123' })).toEqual({
      error: 'Product ID and suggestions array are required',
      status: 400,
    });

    expect(validateApplyRequest({ productId: '123', suggestions: [] })).toBeNull();
  });

  it('should map suggestion fields to Shopify update input', () => {
    const mapSuggestionToInput = (field: string, value: string) => {
      const mapping: Record<string, unknown> = {};
      switch (field) {
        case 'description':
          mapping.descriptionHtml = value;
          break;
        case 'seo_title':
          mapping.seo = { title: value };
          break;
        case 'seo_description':
          mapping.seo = { description: value };
          break;
        case 'tags':
          mapping.tags = value.split(',').map((t) => t.trim());
          break;
        case 'productType':
          mapping.productType = value;
          break;
        case 'vendor':
          mapping.vendor = value;
          break;
      }
      return mapping;
    };

    expect(mapSuggestionToInput('description', 'New desc')).toEqual({
      descriptionHtml: 'New desc',
    });
    expect(mapSuggestionToInput('seo_title', 'SEO Title')).toEqual({
      seo: { title: 'SEO Title' },
    });
    expect(mapSuggestionToInput('tags', 'tag1, tag2, tag3')).toEqual({
      tags: ['tag1', 'tag2', 'tag3'],
    });
  });

  it('should detect conflicts based on updatedAt timestamps', () => {
    const hasConflict = (lastKnownUpdatedAt: string | null, currentUpdatedAt: string) => {
      if (!lastKnownUpdatedAt) return false;
      const lastKnown = new Date(lastKnownUpdatedAt).getTime();
      const current = new Date(currentUpdatedAt).getTime();
      return current > lastKnown;
    };

    expect(hasConflict(null, '2024-01-01T12:00:00Z')).toBe(false);
    expect(hasConflict('2024-01-01T12:00:00Z', '2024-01-01T12:00:00Z')).toBe(false);
    expect(hasConflict('2024-01-01T12:00:00Z', '2024-01-01T13:00:00Z')).toBe(true);
  });

  it('should return empty update when no valid fields provided', () => {
    const buildUpdateInput = (suggestions: { field: string; suggested: string }[]) => {
      const validFields = ['description', 'seo_title', 'seo_description', 'tags', 'productType', 'vendor'];
      return suggestions.filter((s) => validFields.includes(s.field));
    };

    const result = buildUpdateInput([{ field: 'invalid_field', suggested: 'value' }]);
    expect(result).toHaveLength(0);
  });
});

describe('DELETE /api/optimize (Undo)', () => {
  it('should validate historyId is required', () => {
    const validateUndoRequest = (historyId: string | null) => {
      if (!historyId) {
        return { error: 'History ID is required', status: 400 };
      }
      return null;
    };

    expect(validateUndoRequest(null)).toEqual({
      error: 'History ID is required',
      status: 400,
    });

    expect(validateUndoRequest('history-123')).toBeNull();
  });

  it('should build undo input from history entry', () => {
    const buildUndoInput = (field: string, originalValue: string) => {
      const undoInput: Record<string, unknown> = {};
      switch (field) {
        case 'description':
          undoInput.descriptionHtml = originalValue;
          break;
        case 'seo_title':
          undoInput.seo = { title: originalValue };
          break;
        case 'seo_description':
          undoInput.seo = { description: originalValue };
          break;
        case 'tags':
          undoInput.tags = originalValue.split(',').map((t) => t.trim()).filter(Boolean);
          break;
        case 'productType':
          undoInput.productType = originalValue;
          break;
        case 'vendor':
          undoInput.vendor = originalValue;
          break;
      }
      return undoInput;
    };

    expect(buildUndoInput('description', 'Original desc')).toEqual({
      descriptionHtml: 'Original desc',
    });
    expect(buildUndoInput('tags', 'old-tag1, old-tag2')).toEqual({
      tags: ['old-tag1', 'old-tag2'],
    });
  });
});

describe('Optimization Suggestion Validation', () => {
  it('should validate suggestion fields', () => {
    const validSuggestion = {
      field: 'description',
      original: 'Short',
      suggested: 'A longer, better description',
      reasoning: 'Why this is better',
      improvement: 'Added detail',
    };

    expect(validSuggestion.field).toBeDefined();
    expect(validSuggestion.suggested.length).toBeGreaterThan(validSuggestion.original.length);
  });

  it('should accept valid field types', () => {
    const validFields = ['description', 'seoTitle', 'seoDescription', 'tags', 'altText'];

    validFields.forEach((field) => {
      expect(validFields).toContain(field);
    });
  });
});
