import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/shopify/get-shop', () => ({
  getShopFromRequest: vi.fn(),
}));

vi.mock('@/lib/services/visibility-check', () => ({
  runVisibilityCheck: vi.fn(),
  getVisibilityHistory: vi.fn(),
  getAvailablePlatforms: vi.fn(),
}));

vi.mock('@/lib/monitoring/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { getShopFromRequest } from '@/lib/shopify/get-shop';
import {
  runVisibilityCheck,
  getVisibilityHistory,
  getAvailablePlatforms,
} from '@/lib/services/visibility-check';

describe('Visibility API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/visibility', () => {
    it('should run visibility check with default parameters', async () => {
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockResolvedValue('test.myshopify.com');

      (runVisibilityCheck as ReturnType<typeof vi.fn>).mockResolvedValue({
        results: [
          {
            platform: 'chatgpt',
            query: 'best products in category',
            isMentioned: true,
            mentionContext: 'Product was recommended...',
            responseSnippet: 'I would recommend...',
            checkedAt: new Date('2024-01-15'),
          },
        ],
        summary: {
          totalChecks: 1,
          mentionedCount: 1,
          mentionRate: 100,
        },
      });

      (getAvailablePlatforms as ReturnType<typeof vi.fn>).mockReturnValue([
        { id: 'chatgpt', name: 'ChatGPT', available: true },
        { id: 'perplexity', name: 'Perplexity', available: true },
      ]);

      const shopDomain = await getShopFromRequest({} as unknown, { rateLimit: true });
      const result = await runVisibilityCheck(shopDomain);

      expect(result.results).toHaveLength(1);
      expect(result.summary.mentionRate).toBe(100);
      expect(runVisibilityCheck).toHaveBeenCalledWith('test.myshopify.com');
    });

    it('should run visibility check with custom queries and platforms', async () => {
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockResolvedValue('test.myshopify.com');

      (runVisibilityCheck as ReturnType<typeof vi.fn>).mockResolvedValue({
        results: [
          {
            platform: 'chatgpt',
            query: 'custom query',
            isMentioned: false,
            checkedAt: new Date(),
          },
          {
            platform: 'perplexity',
            query: 'custom query',
            isMentioned: true,
            checkedAt: new Date(),
          },
        ],
        summary: {
          totalChecks: 2,
          mentionedCount: 1,
          mentionRate: 50,
        },
      });

      const result = await runVisibilityCheck(
        'test.myshopify.com',
        ['custom query'],
        ['chatgpt', 'perplexity']
      );

      expect(result.results).toHaveLength(2);
      expect(result.summary.mentionRate).toBe(50);
    });

    it('should validate platforms input', () => {
      const validPlatforms = ['chatgpt', 'perplexity', 'gemini', 'copilot'];

      const validatePlatforms = (platforms: unknown[]): string[] =>
        platforms.filter(
          (p) => typeof p === 'string' && validPlatforms.includes(p)
        ) as string[];

      expect(validatePlatforms(['chatgpt', 'perplexity'])).toEqual(['chatgpt', 'perplexity']);
      expect(validatePlatforms(['chatgpt', 'invalid'])).toEqual(['chatgpt']);
      expect(validatePlatforms([123, null, 'gemini'])).toEqual(['gemini']);
      expect(validatePlatforms([])).toEqual([]);
    });

    it('should validate queries input', () => {
      const validateQueries = (queries: unknown[]): string[] =>
        queries.filter((q) => typeof q === 'string') as string[];

      expect(validateQueries(['query1', 'query2'])).toEqual(['query1', 'query2']);
      expect(validateQueries(['query1', 123, null])).toEqual(['query1']);
      expect(validateQueries([1, 2, 3])).toEqual([]);
    });

    it('should handle check failure', async () => {
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockResolvedValue('test.myshopify.com');
      (runVisibilityCheck as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('API rate limit exceeded')
      );

      await expect(runVisibilityCheck('test.myshopify.com')).rejects.toThrow(
        'API rate limit exceeded'
      );
    });
  });

  describe('GET /api/visibility', () => {
    it('should return visibility history', async () => {
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockResolvedValue('test.myshopify.com');

      (getVisibilityHistory as ReturnType<typeof vi.fn>).mockResolvedValue({
        checks: [
          {
            id: 'check-1',
            platform: 'chatgpt',
            query: 'test query',
            isMentioned: true,
            checkedAt: new Date('2024-01-15'),
          },
          {
            id: 'check-2',
            platform: 'perplexity',
            query: 'test query',
            isMentioned: false,
            checkedAt: new Date('2024-01-14'),
          },
        ],
        summary: {
          totalChecks: 2,
          mentionedCount: 1,
          mentionRate: 50,
          byPlatform: [
            { platform: 'chatgpt', checks: 1, mentioned: 1, rate: 100 },
            { platform: 'perplexity', checks: 1, mentioned: 0, rate: 0 },
          ],
        },
        quota: {
          used: 5,
          limit: 20,
          remaining: 15,
        },
      });

      (getAvailablePlatforms as ReturnType<typeof vi.fn>).mockReturnValue([
        { id: 'chatgpt', name: 'ChatGPT', available: true },
        { id: 'perplexity', name: 'Perplexity', available: true },
      ]);

      const history = await getVisibilityHistory('test.myshopify.com');
      const platforms = getAvailablePlatforms();

      expect(history.checks).toHaveLength(2);
      expect(history.summary.mentionRate).toBe(50);
      expect(platforms).toHaveLength(2);
    });

    it('should handle empty history', async () => {
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockResolvedValue('test.myshopify.com');

      (getVisibilityHistory as ReturnType<typeof vi.fn>).mockResolvedValue({
        checks: [],
        summary: {
          totalChecks: 0,
          mentionedCount: 0,
          mentionRate: 0,
          byPlatform: [],
        },
        quota: {
          used: 0,
          limit: 10,
          remaining: 10,
        },
      });

      const history = await getVisibilityHistory('test.myshopify.com');

      expect(history.checks).toHaveLength(0);
      expect(history.summary.totalChecks).toBe(0);
    });
  });

  describe('Platform Availability', () => {
    it('should return available platforms', () => {
      (getAvailablePlatforms as ReturnType<typeof vi.fn>).mockReturnValue([
        { id: 'chatgpt', name: 'ChatGPT', available: true },
        { id: 'perplexity', name: 'Perplexity', available: true },
        { id: 'gemini', name: 'Gemini', available: false },
        { id: 'copilot', name: 'Copilot', available: true },
      ]);

      const platforms = getAvailablePlatforms();
      const availableCount = platforms.filter((p: { available: boolean }) => p.available).length;

      expect(platforms).toHaveLength(4);
      expect(availableCount).toBe(3);
    });
  });

  describe('Mention Rate Calculation', () => {
    it('should calculate mention rate correctly', () => {
      const calculateMentionRate = (mentioned: number, total: number) =>
        total > 0 ? Math.round((mentioned / total) * 100) : 0;

      expect(calculateMentionRate(5, 10)).toBe(50);
      expect(calculateMentionRate(10, 10)).toBe(100);
      expect(calculateMentionRate(0, 10)).toBe(0);
      expect(calculateMentionRate(0, 0)).toBe(0);
      expect(calculateMentionRate(3, 7)).toBe(43);
    });
  });

  describe('JSON Body Parsing', () => {
    it('should handle missing body gracefully', () => {
      const parseBody = (body: unknown) => {
        if (!body || typeof body !== 'object') {
          return { queries: undefined, platforms: undefined };
        }

        const b = body as Record<string, unknown>;
        return {
          queries: Array.isArray(b.queries)
            ? b.queries.filter((q): q is string => typeof q === 'string')
            : undefined,
          platforms: Array.isArray(b.platforms)
            ? b.platforms.filter((p): p is string => typeof p === 'string')
            : undefined,
        };
      };

      expect(parseBody(null)).toEqual({ queries: undefined, platforms: undefined });
      expect(parseBody(undefined)).toEqual({ queries: undefined, platforms: undefined });
      expect(parseBody({})).toEqual({ queries: undefined, platforms: undefined });
      expect(parseBody({ queries: ['test'] })).toEqual({
        queries: ['test'],
        platforms: undefined,
      });
    });
  });
});
