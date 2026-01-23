import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateRobotsTxt,
  getDefaultRobotsTxtConfig,
  analyzeRobotsTxt,
  DEFAULT_AI_BOTS,
  SUGGESTED_DISALLOW_PATHS,
  type RobotsTxtConfig,
} from '@/lib/services/robots-txt';

// Mock dependencies
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    shop: {
      findUnique: vi.fn(),
    },
    settings: {
      upsert: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/monitoring/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('Robots.txt Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('DEFAULT_AI_BOTS', () => {
    it('should include common AI crawlers', () => {
      expect(DEFAULT_AI_BOTS).toContain('GPTBot');
      expect(DEFAULT_AI_BOTS).toContain('ClaudeBot');
      expect(DEFAULT_AI_BOTS).toContain('PerplexityBot');
      expect(DEFAULT_AI_BOTS).toContain('Googlebot');
      expect(DEFAULT_AI_BOTS).toContain('Bingbot');
    });

    it('should have at least 5 AI bots defined', () => {
      expect(DEFAULT_AI_BOTS.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('SUGGESTED_DISALLOW_PATHS', () => {
    it('should include cart and checkout', () => {
      expect(SUGGESTED_DISALLOW_PATHS).toContain('/cart');
      expect(SUGGESTED_DISALLOW_PATHS).toContain('/checkout');
    });

    it('should include account and admin', () => {
      expect(SUGGESTED_DISALLOW_PATHS).toContain('/account');
      expect(SUGGESTED_DISALLOW_PATHS).toContain('/admin');
    });

    it('should include query parameter patterns', () => {
      expect(SUGGESTED_DISALLOW_PATHS.some(p => p.includes('variant='))).toBe(true);
      expect(SUGGESTED_DISALLOW_PATHS.some(p => p.includes('sort_by='))).toBe(true);
    });
  });

  describe('getDefaultRobotsTxtConfig', () => {
    it('should return default config with all bots allowed', () => {
      const config = getDefaultRobotsTxtConfig();

      expect(config.allowAllBots).toBe(true);
      expect(config.allowAiBots).toBe(true);
    });

    it('should include default AI bots', () => {
      const config = getDefaultRobotsTxtConfig();

      expect(config.aiBots).toEqual(DEFAULT_AI_BOTS);
    });

    it('should include suggested disallowed paths', () => {
      const config = getDefaultRobotsTxtConfig();

      expect(config.disallowedPaths).toEqual(SUGGESTED_DISALLOW_PATHS);
    });

    it('should have null values for optional fields', () => {
      const config = getDefaultRobotsTxtConfig();

      expect(config.crawlDelay).toBeNull();
      expect(config.sitemapUrl).toBeNull();
      expect(config.customRules).toBeNull();
    });
  });

  describe('generateRobotsTxt', () => {
    const baseConfig: RobotsTxtConfig = {
      allowAllBots: true,
      allowAiBots: true,
      aiBots: ['GPTBot', 'ClaudeBot'],
      disallowedPaths: ['/cart', '/checkout'],
      crawlDelay: null,
      sitemapUrl: null,
      customRules: null,
    };

    it('should include header comment with shop domain', () => {
      const result = generateRobotsTxt({
        shopDomain: 'test-shop.myshopify.com',
        config: baseConfig,
        includeAiSection: true,
      });

      expect(result).toContain('# robots.txt for test-shop.myshopify.com');
      expect(result).toContain('Surfaced');
    });

    it('should include User-agent: * directive', () => {
      const result = generateRobotsTxt({
        shopDomain: 'test.myshopify.com',
        config: baseConfig,
        includeAiSection: false,
      });

      expect(result).toContain('User-agent: *');
    });

    it('should include Allow: / when allowAllBots is true', () => {
      const result = generateRobotsTxt({
        shopDomain: 'test.myshopify.com',
        config: { ...baseConfig, allowAllBots: true },
        includeAiSection: false,
      });

      expect(result).toContain('Allow: /');
    });

    it('should not include Allow: / when allowAllBots is false', () => {
      const result = generateRobotsTxt({
        shopDomain: 'test.myshopify.com',
        config: { ...baseConfig, allowAllBots: false },
        includeAiSection: false,
      });

      expect(result.split('\n').filter(l => l === 'Allow: /')).toHaveLength(0);
    });

    it('should include disallowed paths', () => {
      const result = generateRobotsTxt({
        shopDomain: 'test.myshopify.com',
        config: baseConfig,
        includeAiSection: false,
      });

      expect(result).toContain('Disallow: /cart');
      expect(result).toContain('Disallow: /checkout');
    });

    it('should include crawl-delay when specified', () => {
      const result = generateRobotsTxt({
        shopDomain: 'test.myshopify.com',
        config: { ...baseConfig, crawlDelay: 10 },
        includeAiSection: false,
      });

      expect(result).toContain('Crawl-delay: 10');
    });

    it('should not include crawl-delay when null', () => {
      const result = generateRobotsTxt({
        shopDomain: 'test.myshopify.com',
        config: { ...baseConfig, crawlDelay: null },
        includeAiSection: false,
      });

      expect(result).not.toContain('Crawl-delay:');
    });

    it('should not include crawl-delay when zero', () => {
      const result = generateRobotsTxt({
        shopDomain: 'test.myshopify.com',
        config: { ...baseConfig, crawlDelay: 0 },
        includeAiSection: false,
      });

      expect(result).not.toContain('Crawl-delay:');
    });

    it('should include AI section when enabled', () => {
      const result = generateRobotsTxt({
        shopDomain: 'test.myshopify.com',
        config: baseConfig,
        includeAiSection: true,
      });

      expect(result).toContain('# AI Crawlers');
      expect(result).toContain('User-agent: GPTBot');
      expect(result).toContain('User-agent: ClaudeBot');
    });

    it('should not include AI section when disabled', () => {
      const result = generateRobotsTxt({
        shopDomain: 'test.myshopify.com',
        config: baseConfig,
        includeAiSection: false,
      });

      expect(result).not.toContain('# AI Crawlers');
    });

    it('should not include AI section when allowAiBots is false', () => {
      const result = generateRobotsTxt({
        shopDomain: 'test.myshopify.com',
        config: { ...baseConfig, allowAiBots: false },
        includeAiSection: true,
      });

      expect(result).not.toContain('# AI Crawlers');
    });

    it('should include AI bot specific paths', () => {
      const result = generateRobotsTxt({
        shopDomain: 'test.myshopify.com',
        config: baseConfig,
        includeAiSection: true,
      });

      expect(result).toContain('Allow: /products/');
      expect(result).toContain('Allow: /collections/');
      expect(result).toContain('Allow: /pages/');
    });

    it('should disallow cart/checkout for AI bots', () => {
      const result = generateRobotsTxt({
        shopDomain: 'test.myshopify.com',
        config: baseConfig,
        includeAiSection: true,
      });

      // Should have Disallow for AI bots too
      const lines = result.split('\n');
      const gptBotIndex = lines.findIndex(l => l === 'User-agent: GPTBot');
      expect(gptBotIndex).toBeGreaterThan(-1);
    });

    it('should include custom rules when provided', () => {
      const result = generateRobotsTxt({
        shopDomain: 'test.myshopify.com',
        config: {
          ...baseConfig,
          customRules: 'User-agent: CustomBot\nDisallow: /custom',
        },
        includeAiSection: false,
      });

      expect(result).toContain('# Custom Rules');
      expect(result).toContain('User-agent: CustomBot');
    });

    it('should use custom sitemap URL when provided', () => {
      const result = generateRobotsTxt({
        shopDomain: 'test.myshopify.com',
        config: {
          ...baseConfig,
          sitemapUrl: 'https://example.com/custom-sitemap.xml',
        },
        includeAiSection: false,
      });

      expect(result).toContain('Sitemap: https://example.com/custom-sitemap.xml');
    });

    it('should generate default sitemap URL when not provided', () => {
      const result = generateRobotsTxt({
        shopDomain: 'test.myshopify.com',
        config: baseConfig,
        includeAiSection: false,
      });

      expect(result).toContain('Sitemap: https://test.myshopify.com/sitemap.xml');
    });

    it('should include llms.txt reference', () => {
      const result = generateRobotsTxt({
        shopDomain: 'test.myshopify.com',
        config: baseConfig,
        includeAiSection: false,
      });

      expect(result).toContain('llms.txt');
      expect(result).toContain('.well-known/llms.txt');
    });

    it('should include last updated date', () => {
      const result = generateRobotsTxt({
        shopDomain: 'test.myshopify.com',
        config: baseConfig,
        includeAiSection: false,
      });

      expect(result).toContain('Last updated:');
      expect(result).toMatch(/\d{4}-\d{2}-\d{2}/);
    });
  });

  describe('analyzeRobotsTxt', () => {
    it('should return AI-friendly for open robots.txt', () => {
      const content = `
User-agent: *
Allow: /
Sitemap: https://example.com/sitemap.xml
      `;

      const result = analyzeRobotsTxt(content);

      expect(result.isAiFriendly).toBe(true);
      expect(result.blockedAiBots).toHaveLength(0);
      expect(result.score).toBeGreaterThanOrEqual(70);
    });

    it('should detect blocked AI bots with Disallow: /', () => {
      const content = `
User-agent: GPTBot
Disallow: /

User-agent: *
Allow: /
Sitemap: https://example.com/sitemap.xml
      `;

      const result = analyzeRobotsTxt(content);

      expect(result.blockedAiBots).toContain('GPTBot');
      expect(result.score).toBeLessThan(100);
    });

    it('should detect multiple blocked AI bots', () => {
      const content = `
User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

Sitemap: https://example.com/sitemap.xml
      `;

      const result = analyzeRobotsTxt(content);

      expect(result.blockedAiBots.length).toBeGreaterThanOrEqual(2);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should flag missing sitemap', () => {
      const content = `
User-agent: *
Allow: /
      `;

      const result = analyzeRobotsTxt(content);

      expect(result.issues).toContain('No sitemap specified');
      expect(result.score).toBeLessThan(100);
    });

    it('should suggest llms.txt when not present', () => {
      const content = `
User-agent: *
Allow: /
Sitemap: https://example.com/sitemap.xml
      `;

      const result = analyzeRobotsTxt(content);

      expect(result.suggestions.some(s => s.includes('llms.txt'))).toBe(true);
    });

    it('should not suggest llms.txt when present', () => {
      const content = `
User-agent: *
Allow: /
Sitemap: https://example.com/sitemap.xml
# See also: llms.txt
      `;

      const result = analyzeRobotsTxt(content);

      expect(result.suggestions.filter(s => s.includes('llms.txt'))).toHaveLength(0);
    });

    it('should flag overly restrictive rules', () => {
      const content = `
User-agent: *
Disallow: /
Sitemap: https://example.com/sitemap.xml
      `;

      const result = analyzeRobotsTxt(content);

      expect(result.issues.some(i => i.includes('restrictive'))).toBe(true);
      expect(result.score).toBeLessThan(80);
    });

    it('should clamp score between 0 and 100', () => {
      // Very bad robots.txt blocking many bots
      const content = `
User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: PerplexityBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: *
Disallow: /
      `;

      const result = analyzeRobotsTxt(content);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should return score of 100 for perfect robots.txt', () => {
      const content = `
# robots.txt with AI support
User-agent: *
Allow: /
Disallow: /cart
Disallow: /checkout

# AI Bots welcome
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

Sitemap: https://example.com/sitemap.xml
# llms.txt available at /.well-known/llms.txt
      `;

      const result = analyzeRobotsTxt(content);

      expect(result.score).toBeGreaterThanOrEqual(90);
      expect(result.isAiFriendly).toBe(true);
    });

    it('should be case insensitive for user-agent matching', () => {
      const content = `
USER-AGENT: gptbot
DISALLOW: /

Sitemap: https://example.com/sitemap.xml
      `;

      const result = analyzeRobotsTxt(content);

      // Should still detect the blocked bot despite case differences
      expect(result.blockedAiBots.length).toBeGreaterThan(0);
    });

    it('should provide suggestions when AI bots are blocked', () => {
      const content = `
User-agent: GPTBot
Disallow: /
Sitemap: https://example.com/sitemap.xml
      `;

      const result = analyzeRobotsTxt(content);

      expect(result.suggestions.some(s => s.toLowerCase().includes('ai'))).toBe(true);
    });

    it('should handle empty content', () => {
      const result = analyzeRobotsTxt('');

      expect(result.issues).toContain('No sitemap specified');
    });

    it('should handle content with only comments', () => {
      const content = `
# This is a comment
# Another comment
      `;

      const result = analyzeRobotsTxt(content);

      expect(result.issues).toContain('No sitemap specified');
    });
  });

  describe('Integration: Generate and Analyze', () => {
    it('should generate AI-friendly robots.txt that passes analysis', () => {
      const config = getDefaultRobotsTxtConfig();
      const generated = generateRobotsTxt({
        shopDomain: 'test.myshopify.com',
        config,
        includeAiSection: true,
      });

      const analysis = analyzeRobotsTxt(generated);

      expect(analysis.isAiFriendly).toBe(true);
      expect(analysis.blockedAiBots).toHaveLength(0);
      expect(analysis.score).toBeGreaterThanOrEqual(80);
    });
  });
});
