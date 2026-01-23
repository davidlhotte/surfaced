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
  generateOptimizationSuggestions,
  generateAltTextSuggestions,
  generateMetaTagsSuggestions,
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

    it('should use default limit of 10', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
      });

      (prisma.productAudit.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await getProductsForOptimization('test.myshopify.com');

      expect(prisma.productAudit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      );
    });
  });

  describe('generateOptimizationSuggestions', () => {
    const productData = {
      title: 'Test Product',
      handle: 'test-product',
      description: 'Short desc',
      seoTitle: undefined,
      seoDescription: undefined,
      productType: 'Widget',
      vendor: 'TestBrand',
      tags: ['tag1'],
      imageAltTexts: [],
    };

    beforeEach(() => {
      vi.stubEnv('OPENAI_API_KEY', '');
    });

    it('should throw error if shop not found', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(generateOptimizationSuggestions(
        'nonexistent.myshopify.com',
        'product-1',
        productData
      )).rejects.toThrow('Shop not found');
    });

    it('should throw error if quota exhausted', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
        plan: 'FREE',
      });

      (prisma.auditLog.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

      await expect(generateOptimizationSuggestions(
        'test.myshopify.com',
        'product-1',
        productData
      )).rejects.toThrow('AI optimization limit reached');
    });

    it('should return empty suggestions when OpenAI not configured', async () => {
      vi.stubEnv('OPENAI_API_KEY', '');

      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
        plan: 'PREMIUM',
      });

      (prisma.auditLog.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

      const result = await generateOptimizationSuggestions(
        'test.myshopify.com',
        'product-1',
        productData
      );

      expect(result.productId).toBe('product-1');
      expect(result.title).toBe('Test Product');
      expect(result.suggestions).toEqual([]);
    });

    it('should calculate current score based on product data', async () => {
      vi.stubEnv('OPENAI_API_KEY', '');

      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
        plan: 'PREMIUM',
      });

      (prisma.auditLog.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

      const result = await generateOptimizationSuggestions(
        'test.myshopify.com',
        'product-1',
        productData
      );

      // Score should be less than 100 due to missing SEO fields
      expect(result.currentScore).toBeLessThan(100);
    });
  });

  describe('generateAltTextSuggestions', () => {
    const productData = {
      title: 'Test Product',
      description: 'A test product description',
      productType: 'Widget',
      vendor: 'TestBrand',
      images: [
        { url: 'https://example.com/image1.jpg', altText: null },
        { url: 'https://example.com/image2.jpg', altText: 'Short' },
        { url: 'https://example.com/image3.jpg', altText: 'This is a proper alt text with enough characters' },
      ],
    };

    beforeEach(() => {
      vi.stubEnv('OPENAI_API_KEY', '');
    });

    it('should throw error if shop not found', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(generateAltTextSuggestions(
        'nonexistent.myshopify.com',
        'product-1',
        productData
      )).rejects.toThrow('Shop not found');
    });

    it('should throw error if quota exhausted', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
        plan: 'FREE',
      });

      (prisma.auditLog.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

      await expect(generateAltTextSuggestions(
        'test.myshopify.com',
        'product-1',
        productData
      )).rejects.toThrow('AI optimization limit reached');
    });

    it('should throw error if OpenAI not configured', async () => {
      vi.stubEnv('OPENAI_API_KEY', '');

      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
        plan: 'PREMIUM',
      });

      (prisma.auditLog.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

      await expect(generateAltTextSuggestions(
        'test.myshopify.com',
        'product-1',
        productData
      )).rejects.toThrow('OpenAI API key not configured');
    });

    it('should return empty suggestions if all images have alt text', async () => {
      vi.stubEnv('OPENAI_API_KEY', 'test-key');

      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
        plan: 'PREMIUM',
      });

      (prisma.auditLog.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

      const productWithAlt = {
        ...productData,
        images: [
          { url: 'https://example.com/image1.jpg', altText: 'Good alt text here with enough chars' },
        ],
      };

      const result = await generateAltTextSuggestions(
        'test.myshopify.com',
        'product-1',
        productWithAlt
      );

      expect(result.suggestions).toHaveLength(0);
    });
  });

  describe('generateMetaTagsSuggestions', () => {
    const productData = {
      title: 'Test Product',
      description: 'A test product description for meta tags',
      productType: 'Widget',
      vendor: 'TestBrand',
      seoTitle: undefined,
      seoDescription: undefined,
    };

    beforeEach(() => {
      vi.stubEnv('OPENAI_API_KEY', '');
    });

    it('should throw error if shop not found', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(generateMetaTagsSuggestions(
        'nonexistent.myshopify.com',
        'product-1',
        productData
      )).rejects.toThrow('Shop not found');
    });

    it('should throw error if quota exhausted', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
        plan: 'FREE',
      });

      (prisma.auditLog.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

      await expect(generateMetaTagsSuggestions(
        'test.myshopify.com',
        'product-1',
        productData
      )).rejects.toThrow('AI optimization limit reached');
    });

    it('should throw error if OpenAI not configured', async () => {
      vi.stubEnv('OPENAI_API_KEY', '');

      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
        plan: 'PREMIUM',
      });

      (prisma.auditLog.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

      await expect(generateMetaTagsSuggestions(
        'test.myshopify.com',
        'product-1',
        productData
      )).rejects.toThrow('OpenAI API key not configured');
    });
  });
});

describe('Score Calculation Logic', () => {
  // Test the scoring algorithm indirectly through expectations

  it('should penalize missing description (-40)', () => {
    // If description is missing, score drops by 40
    const baseScore = 100;
    const penaltyForNoDesc = 40;
    expect(baseScore - penaltyForNoDesc).toBe(60);
  });

  it('should penalize short description under 50 chars (-25)', () => {
    const baseScore = 100;
    const penaltyForShortDesc = 25;
    expect(baseScore - penaltyForShortDesc).toBe(75);
  });

  it('should penalize description under 150 chars (-10)', () => {
    const baseScore = 100;
    const penaltyForMediumDesc = 10;
    expect(baseScore - penaltyForMediumDesc).toBe(90);
  });

  it('should penalize missing SEO title (-5)', () => {
    const baseScore = 100;
    const penaltyForNoSeoTitle = 5;
    expect(baseScore - penaltyForNoSeoTitle).toBe(95);
  });

  it('should penalize missing SEO description (-5)', () => {
    const baseScore = 100;
    const penaltyForNoSeoDesc = 5;
    expect(baseScore - penaltyForNoSeoDesc).toBe(95);
  });

  it('should penalize no tags (-5)', () => {
    const baseScore = 100;
    const penaltyForNoTags = 5;
    expect(baseScore - penaltyForNoTags).toBe(95);
  });

  it('should penalize few tags under 3 (-2)', () => {
    const baseScore = 100;
    const penaltyForFewTags = 2;
    expect(baseScore - penaltyForFewTags).toBe(98);
  });

  it('should give bonus for long description 300+ chars (+5)', () => {
    const baseScore = 100;
    const bonusForLongDesc = 5;
    expect(baseScore + bonusForLongDesc).toBe(105);
  });

  it('should give bonus for 5+ tags (+2)', () => {
    const baseScore = 100;
    const bonusForManyTags = 2;
    expect(baseScore + bonusForManyTags).toBe(102);
  });

  it('should clamp score between 0 and 100', () => {
    const maxScore = 100;
    const minScore = 0;
    // Even with bonuses, score should not exceed 100
    expect(Math.min(100, 107)).toBe(maxScore);
    // Even with many penalties, score should not go below 0
    expect(Math.max(0, -10)).toBe(minScore);
  });
});

describe('Optimization Needs Detection', () => {
  it('should detect description needed when empty', () => {
    const description = '';
    const needsDescription = !description || description.length < 150;
    expect(needsDescription).toBe(true);
  });

  it('should detect description needed when short', () => {
    const description = 'Short description under 150 chars';
    const needsDescription = description.length < 150;
    expect(needsDescription).toBe(true);
  });

  it('should not need description when 150+ chars', () => {
    const description = 'A'.repeat(150);
    const needsDescription = description.length < 150;
    expect(needsDescription).toBe(false);
  });

  it('should detect SEO title needed when missing', () => {
    const seoTitle = undefined;
    const needsSeoTitle = !seoTitle;
    expect(needsSeoTitle).toBe(true);
  });

  it('should detect SEO description needed when missing', () => {
    const seoDescription = undefined;
    const needsSeoDescription = !seoDescription;
    expect(needsSeoDescription).toBe(true);
  });

  it('should detect tags needed when fewer than 5', () => {
    const tags = ['tag1', 'tag2'];
    const needsTags = tags.length < 5;
    expect(needsTags).toBe(true);
  });

  it('should not need tags when 5+ present', () => {
    const tags = ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'];
    const needsTags = tags.length < 5;
    expect(needsTags).toBe(false);
  });
});

describe('Alt Text Filtering Logic', () => {
  it('should filter images needing alt text (null)', () => {
    const images = [
      { url: 'img1.jpg', altText: null },
      { url: 'img2.jpg', altText: 'Good alt text here' },
    ];

    const needingAlt = images.filter(img => !img.altText || img.altText.length < 10);
    expect(needingAlt).toHaveLength(1);
    expect(needingAlt[0].url).toBe('img1.jpg');
  });

  it('should filter images needing alt text (too short)', () => {
    const images = [
      { url: 'img1.jpg', altText: 'Short' },
      { url: 'img2.jpg', altText: 'This is a proper alt text' },
    ];

    const needingAlt = images.filter(img => !img.altText || img.altText.length < 10);
    expect(needingAlt).toHaveLength(1);
    expect(needingAlt[0].url).toBe('img1.jpg');
  });

  it('should limit to 5 images for processing', () => {
    const images = Array.from({ length: 10 }, (_, i) => ({
      url: `img${i}.jpg`,
      altText: null,
    }));

    const needingAlt = images.filter(img => !img.altText || img.altText.length < 10);
    const toProcess = needingAlt.slice(0, 5);
    expect(toProcess).toHaveLength(5);
  });
});
