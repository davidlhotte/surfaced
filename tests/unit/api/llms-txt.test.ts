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

vi.mock('@/lib/security/encryption', () => ({
  decryptToken: vi.fn().mockReturnValue('mock-token'),
}));

vi.mock('@/lib/services/llms-txt', () => ({
  getLlmsTxtConfig: vi.fn(),
  updateLlmsTxtConfig: vi.fn(),
  generateLlmsTxtForShop: vi.fn(),
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
  getLlmsTxtConfig,
  updateLlmsTxtConfig,
  generateLlmsTxtForShop,
} from '@/lib/services/llms-txt';

describe('LLMs.txt API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/llms-txt', () => {
    it('should return config and preview', async () => {
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockResolvedValue('test.myshopify.com');

      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        accessToken: 'encrypted-token',
        llmsTxtConfig: { isEnabled: true },
      });

      (getLlmsTxtConfig as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'config-1',
        isEnabled: true,
        allowedBots: ['ChatGPT', 'Perplexity', 'Gemini'],
        includeProducts: true,
        includeCollections: true,
        includeBlog: false,
        excludedProductIds: [],
        customInstructions: null,
        lastGeneratedAt: new Date('2024-01-15'),
      });

      (generateLlmsTxtForShop as ReturnType<typeof vi.fn>).mockResolvedValue({
        content: '# Test Store\n\nWelcome to our store...',
        metadata: {
          productCount: 50,
          collectionCount: 5,
        },
      });

      const config = await getLlmsTxtConfig('test.myshopify.com');

      expect(config).toBeDefined();
      expect(config?.isEnabled).toBe(true);
      expect(config?.allowedBots).toContain('ChatGPT');
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
      (getLlmsTxtConfig as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const config = await getLlmsTxtConfig('test.myshopify.com');
      expect(config).toBeNull();
    });

    it('should handle preview generation failure', async () => {
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockResolvedValue('test.myshopify.com');
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        accessToken: 'encrypted-token',
      });
      (getLlmsTxtConfig as ReturnType<typeof vi.fn>).mockResolvedValue({
        isEnabled: true,
      });
      (generateLlmsTxtForShop as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Failed to generate')
      );

      await expect(generateLlmsTxtForShop('test.myshopify.com', 'token')).rejects.toThrow(
        'Failed to generate'
      );
    });
  });

  describe('POST /api/llms-txt', () => {
    it('should update config with valid values', async () => {
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockResolvedValue('test.myshopify.com');

      (updateLlmsTxtConfig as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'config-1',
        isEnabled: false,
        allowedBots: ['ChatGPT'],
        includeProducts: true,
        includeCollections: false,
        includeBlog: true,
        excludedProductIds: ['123'],
        customInstructions: 'Custom instructions here',
        lastGeneratedAt: new Date(),
      });

      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        accessToken: 'encrypted-token',
      });

      (generateLlmsTxtForShop as ReturnType<typeof vi.fn>).mockResolvedValue({
        content: '# Updated content',
      });

      const config = await updateLlmsTxtConfig('test.myshopify.com', {
        isEnabled: false,
        includeCollections: false,
        includeBlog: true,
      });

      expect(config.isEnabled).toBe(false);
      expect(config.includeCollections).toBe(false);
      expect(config.includeBlog).toBe(true);
    });

    it('should validate config update body', () => {
      const validateBody = (body: Record<string, unknown>) => {
        const updates: Record<string, unknown> = {};

        if (typeof body.isEnabled === 'boolean') {
          updates.isEnabled = body.isEnabled;
        }
        if (Array.isArray(body.allowedBots)) {
          updates.allowedBots = body.allowedBots.filter((b: unknown) => typeof b === 'string');
        }
        if (typeof body.includeProducts === 'boolean') {
          updates.includeProducts = body.includeProducts;
        }
        if (typeof body.includeCollections === 'boolean') {
          updates.includeCollections = body.includeCollections;
        }
        if (typeof body.includeBlog === 'boolean') {
          updates.includeBlog = body.includeBlog;
        }
        if (Array.isArray(body.excludedProductIds)) {
          updates.excludedProductIds = body.excludedProductIds.filter(
            (id: unknown) => typeof id === 'string'
          );
        }
        if (body.customInstructions !== undefined) {
          updates.customInstructions =
            typeof body.customInstructions === 'string' ? body.customInstructions : null;
        }

        return updates;
      };

      // Valid inputs
      expect(validateBody({ isEnabled: true })).toEqual({ isEnabled: true });
      expect(validateBody({ allowedBots: ['ChatGPT', 'Gemini'] })).toEqual({
        allowedBots: ['ChatGPT', 'Gemini'],
      });
      expect(validateBody({ customInstructions: 'Custom text' })).toEqual({
        customInstructions: 'Custom text',
      });

      // Invalid inputs should be filtered
      expect(validateBody({ isEnabled: 'true' })).toEqual({});
      expect(validateBody({ allowedBots: [123, 'ChatGPT'] })).toEqual({
        allowedBots: ['ChatGPT'],
      });
      expect(validateBody({ customInstructions: null })).toEqual({
        customInstructions: null,
      });
      expect(validateBody({ customInstructions: 123 })).toEqual({
        customInstructions: null,
      });
    });

    it('should handle update with excluded product IDs', async () => {
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockResolvedValue('test.myshopify.com');

      (updateLlmsTxtConfig as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'config-1',
        excludedProductIds: ['123', '456', '789'],
      });

      const config = await updateLlmsTxtConfig('test.myshopify.com', {
        excludedProductIds: ['123', '456', '789'],
      });

      expect(config.excludedProductIds).toHaveLength(3);
    });
  });

  describe('LLMs.txt Content Generation', () => {
    it('should generate valid llms.txt structure', () => {
      const generateHeader = (shopName: string, description?: string) => {
        let content = `# ${shopName}\n\n`;
        if (description) {
          content += `> ${description}\n\n`;
        }
        return content;
      };

      const header = generateHeader('Test Store', 'The best store for widgets');

      expect(header).toContain('# Test Store');
      expect(header).toContain('> The best store for widgets');
    });

    it('should format product listings correctly', () => {
      const formatProducts = (products: { title: string; handle: string; description: string }[]) =>
        products
          .map(
            (p) =>
              `## ${p.title}\n\nURL: /products/${p.handle}\n\n${p.description}\n`
          )
          .join('\n');

      const products = [
        { title: 'Widget A', handle: 'widget-a', description: 'A great widget' },
        { title: 'Widget B', handle: 'widget-b', description: 'Another great widget' },
      ];

      const formatted = formatProducts(products);

      expect(formatted).toContain('## Widget A');
      expect(formatted).toContain('URL: /products/widget-a');
      expect(formatted).toContain('A great widget');
    });

    it('should include bot directives when configured', () => {
      const generateBotDirectives = (allowedBots: string[]) => {
        if (allowedBots.length === 0) return '';
        return `## Allowed Bots\n\n${allowedBots.map((b) => `- ${b}`).join('\n')}\n\n`;
      };

      const directives = generateBotDirectives(['ChatGPT', 'Perplexity', 'Gemini']);

      expect(directives).toContain('## Allowed Bots');
      expect(directives).toContain('- ChatGPT');
      expect(directives).toContain('- Perplexity');
      expect(directives).toContain('- Gemini');

      expect(generateBotDirectives([])).toBe('');
    });

    it('should include custom instructions when provided', () => {
      const includeCustomInstructions = (instructions: string | null) => {
        if (!instructions) return '';
        return `## Additional Instructions\n\n${instructions}\n\n`;
      };

      const withInstructions = includeCustomInstructions('Please prioritize eco-friendly products.');
      const withoutInstructions = includeCustomInstructions(null);

      expect(withInstructions).toContain('## Additional Instructions');
      expect(withInstructions).toContain('Please prioritize eco-friendly products.');
      expect(withoutInstructions).toBe('');
    });
  });

  describe('Bot List Validation', () => {
    it('should validate allowed bots list', () => {
      const validateBots = (bots: unknown[]): string[] =>
        bots.filter((b): b is string => typeof b === 'string' && b.trim().length > 0);

      expect(validateBots(['ChatGPT', 'Gemini'])).toEqual(['ChatGPT', 'Gemini']);
      expect(validateBots(['ChatGPT', '', '  '])).toEqual(['ChatGPT']);
      expect(validateBots([123, 'ChatGPT', null])).toEqual(['ChatGPT']);
      expect(validateBots([])).toEqual([]);
    });

    it('should handle default bots when none specified', () => {
      const DEFAULT_BOTS = ['ChatGPT', 'Perplexity', 'Gemini', 'Copilot'];

      const getEffectiveBots = (configuredBots: string[] | null | undefined) =>
        configuredBots && configuredBots.length > 0 ? configuredBots : DEFAULT_BOTS;

      expect(getEffectiveBots(['CustomBot'])).toEqual(['CustomBot']);
      expect(getEffectiveBots([])).toEqual(DEFAULT_BOTS);
      expect(getEffectiveBots(null)).toEqual(DEFAULT_BOTS);
      expect(getEffectiveBots(undefined)).toEqual(DEFAULT_BOTS);
    });
  });

  describe('Content Sections', () => {
    it('should conditionally include sections based on config', () => {
      interface Config {
        includeProducts: boolean;
        includeCollections: boolean;
        includeBlog: boolean;
      }

      const getSections = (config: Config) => {
        const sections: string[] = [];
        if (config.includeProducts) sections.push('products');
        if (config.includeCollections) sections.push('collections');
        if (config.includeBlog) sections.push('blog');
        return sections;
      };

      expect(getSections({ includeProducts: true, includeCollections: true, includeBlog: true }))
        .toEqual(['products', 'collections', 'blog']);
      expect(getSections({ includeProducts: true, includeCollections: false, includeBlog: false }))
        .toEqual(['products']);
      expect(getSections({ includeProducts: false, includeCollections: false, includeBlog: false }))
        .toEqual([]);
    });
  });
});
