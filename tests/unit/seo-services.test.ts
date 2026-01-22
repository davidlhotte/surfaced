import { describe, it, expect } from 'vitest';

// Import service functions for testing
import {
  generateSitemapXml,
  generateSitemapIndex,
} from '@/lib/services/sitemap';

import {
  detectAIPlatform,
  isAIReferrer,
  AI_REFERRER_PATTERNS,
} from '@/lib/services/ai-referrer-tracking';

import {
  generateRobotsTxt,
  DEFAULT_AI_BOTS,
} from '@/lib/services/robots-txt';

describe('SEO Services', () => {
  describe('Sitemap Generation', () => {
    it('should generate valid XML sitemap', () => {
      const urls = [
        { loc: 'https://example.com/', priority: 1.0, changefreq: 'daily' as const },
        { loc: 'https://example.com/products/test', priority: 0.8, changefreq: 'weekly' as const },
      ];

      const xml = generateSitemapXml(urls);

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
      expect(xml).toContain('<loc>https://example.com/</loc>');
      expect(xml).toContain('<priority>1.0</priority>');
      expect(xml).toContain('<changefreq>daily</changefreq>');
    });

    it('should escape special XML characters', () => {
      const urls = [
        { loc: 'https://example.com/search?q=test&category=all' },
      ];

      const xml = generateSitemapXml(urls);

      expect(xml).toContain('&amp;');
      expect(xml).not.toContain('&category');
    });

    it('should include image sitemap extension', () => {
      const urls = [
        {
          loc: 'https://example.com/products/test',
          images: [
            { loc: 'https://cdn.example.com/image1.jpg', title: 'Product Image' },
          ],
        },
      ];

      const xml = generateSitemapXml(urls);

      expect(xml).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');
      expect(xml).toContain('<image:image>');
      expect(xml).toContain('<image:loc>https://cdn.example.com/image1.jpg</image:loc>');
    });

    it('should generate valid sitemap index', () => {
      const sitemaps = [
        { loc: 'https://example.com/sitemap-products.xml', lastmod: '2024-01-01' },
        { loc: 'https://example.com/sitemap-pages.xml' },
      ];

      const xml = generateSitemapIndex(sitemaps);

      expect(xml).toContain('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
      expect(xml).toContain('<sitemap>');
      expect(xml).toContain('<lastmod>2024-01-01</lastmod>');
    });
  });

  describe('AI Referrer Detection', () => {
    it('should detect ChatGPT referrers', () => {
      expect(detectAIPlatform('https://chat.openai.com/')).toBe('chatgpt');
      expect(detectAIPlatform('https://chatgpt.com/share/abc')).toBe('chatgpt');
    });

    it('should detect Perplexity referrers', () => {
      expect(detectAIPlatform('https://perplexity.ai/search')).toBe('perplexity');
      expect(detectAIPlatform('https://labs.perplexity.ai/')).toBe('perplexity');
    });

    it('should detect Claude referrers', () => {
      expect(detectAIPlatform('https://claude.ai/chat')).toBe('claude');
    });

    it('should detect Gemini referrers', () => {
      expect(detectAIPlatform('https://gemini.google.com/')).toBe('gemini');
    });

    it('should detect Copilot referrers', () => {
      expect(detectAIPlatform('https://copilot.microsoft.com/')).toBe('copilot');
      expect(detectAIPlatform('https://www.bing.com/chat')).toBe('copilot');
    });

    it('should return null for non-AI referrers', () => {
      expect(detectAIPlatform('https://google.com/')).toBeNull();
      expect(detectAIPlatform('https://facebook.com/')).toBeNull();
      expect(detectAIPlatform('')).toBeNull();
    });

    it('should be case insensitive', () => {
      expect(detectAIPlatform('https://CHAT.OPENAI.COM/')).toBe('chatgpt');
      expect(detectAIPlatform('https://Claude.AI/chat')).toBe('claude');
    });

    it('should correctly identify AI referrers with isAIReferrer', () => {
      expect(isAIReferrer('https://chat.openai.com/')).toBe(true);
      expect(isAIReferrer('https://google.com/')).toBe(false);
    });

    it('should have all expected AI platforms defined', () => {
      expect(AI_REFERRER_PATTERNS).toHaveProperty('chatgpt');
      expect(AI_REFERRER_PATTERNS).toHaveProperty('perplexity');
      expect(AI_REFERRER_PATTERNS).toHaveProperty('claude');
      expect(AI_REFERRER_PATTERNS).toHaveProperty('gemini');
      expect(AI_REFERRER_PATTERNS).toHaveProperty('copilot');
    });
  });

  describe('Robots.txt Generation', () => {
    const baseConfig = {
      allowAllBots: true,
      allowAiBots: true,
      aiBots: [] as string[],
      disallowedPaths: [] as string[],
      crawlDelay: null as number | null,
      sitemapUrl: null as string | null,
      customRules: null as string | null,
    };

    it('should generate basic robots.txt', () => {
      const robotsTxt = generateRobotsTxt({
        shopDomain: 'test.myshopify.com',
        config: baseConfig,
        includeAiSection: false,
      });

      expect(robotsTxt).toContain('User-agent: *');
      expect(robotsTxt).toContain('Allow: /');
    });

    it('should include disallowed paths', () => {
      const robotsTxt = generateRobotsTxt({
        shopDomain: 'test.myshopify.com',
        config: {
          ...baseConfig,
          disallowedPaths: ['/admin', '/checkout', '/cart'],
        },
        includeAiSection: false,
      });

      expect(robotsTxt).toContain('Disallow: /admin');
      expect(robotsTxt).toContain('Disallow: /checkout');
      expect(robotsTxt).toContain('Disallow: /cart');
    });

    it('should include sitemap URL', () => {
      const robotsTxt = generateRobotsTxt({
        shopDomain: 'test.myshopify.com',
        config: {
          ...baseConfig,
          sitemapUrl: 'https://example.com/sitemap.xml',
        },
        includeAiSection: false,
      });

      expect(robotsTxt).toContain('Sitemap: https://example.com/sitemap.xml');
    });

    it('should include crawl delay', () => {
      const robotsTxt = generateRobotsTxt({
        shopDomain: 'test.myshopify.com',
        config: {
          ...baseConfig,
          crawlDelay: 10,
        },
        includeAiSection: false,
      });

      expect(robotsTxt).toContain('Crawl-delay: 10');
    });

    it('should include AI bot section when enabled', () => {
      const robotsTxt = generateRobotsTxt({
        shopDomain: 'test.myshopify.com',
        config: {
          ...baseConfig,
          aiBots: ['GPTBot', 'ChatGPT-User'],
        },
        includeAiSection: true,
      });

      expect(robotsTxt).toContain('GPTBot');
      expect(robotsTxt).toContain('ChatGPT-User');
    });

    it('should have default AI bots defined', () => {
      expect(DEFAULT_AI_BOTS).toContain('GPTBot');
      expect(DEFAULT_AI_BOTS).toContain('anthropic-ai');
      expect(DEFAULT_AI_BOTS).toContain('PerplexityBot');
      expect(DEFAULT_AI_BOTS.length).toBeGreaterThan(5);
    });
  });
});
