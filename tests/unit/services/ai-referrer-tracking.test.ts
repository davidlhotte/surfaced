import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    shop: {
      findUnique: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
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

// Import after mocks
import { prisma } from '@/lib/db/prisma';
import {
  AI_REFERRER_PATTERNS,
  ALL_AI_DOMAINS,
  detectAIPlatform,
  isAIReferrer,
  generateTrackingScript,
  generateConversionScript,
  recordAIVisit,
  recordAIConversion,
  getAITrafficStats,
} from '@/lib/services/ai-referrer-tracking';

describe('AI Referrer Tracking Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AI_REFERRER_PATTERNS', () => {
    it('should have patterns for major AI platforms', () => {
      expect(AI_REFERRER_PATTERNS).toHaveProperty('chatgpt');
      expect(AI_REFERRER_PATTERNS).toHaveProperty('perplexity');
      expect(AI_REFERRER_PATTERNS).toHaveProperty('claude');
      expect(AI_REFERRER_PATTERNS).toHaveProperty('gemini');
      expect(AI_REFERRER_PATTERNS).toHaveProperty('copilot');
      expect(AI_REFERRER_PATTERNS).toHaveProperty('you');
      expect(AI_REFERRER_PATTERNS).toHaveProperty('phind');
      expect(AI_REFERRER_PATTERNS).toHaveProperty('kagi');
    });

    it('should include OpenAI domains for chatgpt', () => {
      expect(AI_REFERRER_PATTERNS.chatgpt).toContain('chat.openai.com');
      expect(AI_REFERRER_PATTERNS.chatgpt).toContain('chatgpt.com');
      expect(AI_REFERRER_PATTERNS.chatgpt).toContain('openai.com');
    });

    it('should include Perplexity domains', () => {
      expect(AI_REFERRER_PATTERNS.perplexity).toContain('perplexity.ai');
      expect(AI_REFERRER_PATTERNS.perplexity).toContain('labs.perplexity.ai');
    });

    it('should include Claude/Anthropic domains', () => {
      expect(AI_REFERRER_PATTERNS.claude).toContain('claude.ai');
      expect(AI_REFERRER_PATTERNS.claude).toContain('anthropic.com');
    });

    it('should include Gemini/Bard domains', () => {
      expect(AI_REFERRER_PATTERNS.gemini).toContain('gemini.google.com');
      expect(AI_REFERRER_PATTERNS.gemini).toContain('bard.google.com');
    });

    it('should include Copilot domains', () => {
      expect(AI_REFERRER_PATTERNS.copilot).toContain('copilot.microsoft.com');
      expect(AI_REFERRER_PATTERNS.copilot).toContain('bing.com/chat');
    });
  });

  describe('ALL_AI_DOMAINS', () => {
    it('should be an array', () => {
      expect(Array.isArray(ALL_AI_DOMAINS)).toBe(true);
    });

    it('should contain all domains from patterns', () => {
      expect(ALL_AI_DOMAINS).toContain('chat.openai.com');
      expect(ALL_AI_DOMAINS).toContain('perplexity.ai');
      expect(ALL_AI_DOMAINS).toContain('claude.ai');
      expect(ALL_AI_DOMAINS).toContain('gemini.google.com');
    });

    it('should have at least 10 domains', () => {
      expect(ALL_AI_DOMAINS.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('detectAIPlatform', () => {
    it('should detect ChatGPT referrer', () => {
      expect(detectAIPlatform('https://chat.openai.com/share/abc123')).toBe('chatgpt');
      expect(detectAIPlatform('https://chatgpt.com/')).toBe('chatgpt');
    });

    it('should detect Perplexity referrer', () => {
      expect(detectAIPlatform('https://perplexity.ai/search/abc')).toBe('perplexity');
      expect(detectAIPlatform('https://labs.perplexity.ai/')).toBe('perplexity');
    });

    it('should detect Claude referrer', () => {
      expect(detectAIPlatform('https://claude.ai/chat/abc')).toBe('claude');
      expect(detectAIPlatform('https://anthropic.com/')).toBe('claude');
    });

    it('should detect Gemini referrer', () => {
      expect(detectAIPlatform('https://gemini.google.com/app')).toBe('gemini');
      expect(detectAIPlatform('https://bard.google.com/')).toBe('gemini');
    });

    it('should detect Copilot referrer', () => {
      expect(detectAIPlatform('https://copilot.microsoft.com/')).toBe('copilot');
      expect(detectAIPlatform('https://bing.com/chat')).toBe('copilot');
    });

    it('should detect You.com referrer', () => {
      expect(detectAIPlatform('https://you.com/search')).toBe('you');
    });

    it('should detect Phind referrer', () => {
      expect(detectAIPlatform('https://phind.com/search')).toBe('phind');
    });

    it('should detect Kagi referrer', () => {
      expect(detectAIPlatform('https://kagi.com/')).toBe('kagi');
    });

    it('should return null for non-AI referrers', () => {
      expect(detectAIPlatform('https://google.com/')).toBeNull();
      expect(detectAIPlatform('https://facebook.com/')).toBeNull();
      expect(detectAIPlatform('')).toBeNull();
    });

    it('should be case insensitive', () => {
      expect(detectAIPlatform('https://CHAT.OPENAI.COM/')).toBe('chatgpt');
      expect(detectAIPlatform('https://Claude.AI/')).toBe('claude');
    });
  });

  describe('isAIReferrer', () => {
    it('should return true for AI referrers', () => {
      expect(isAIReferrer('https://chat.openai.com/')).toBe(true);
      expect(isAIReferrer('https://perplexity.ai/')).toBe(true);
      expect(isAIReferrer('https://claude.ai/')).toBe(true);
    });

    it('should return false for non-AI referrers', () => {
      expect(isAIReferrer('https://google.com/')).toBe(false);
      expect(isAIReferrer('https://amazon.com/')).toBe(false);
      expect(isAIReferrer('')).toBe(false);
    });
  });

  describe('generateTrackingScript', () => {
    it('should generate valid script with shop domain', () => {
      const script = generateTrackingScript('test.myshopify.com', 'https://api.example.com/track');

      expect(script).toContain('Surfaced AI Traffic Tracking');
      expect(script).toContain('test.myshopify.com');
      expect(script).toContain('https://api.example.com/track');
    });

    it('should include AI_DOMAINS array', () => {
      const script = generateTrackingScript('test.myshopify.com', 'https://api.example.com/track');

      expect(script).toContain('AI_DOMAINS');
    });

    it('should include session storage logic', () => {
      const script = generateTrackingScript('test.myshopify.com', 'https://api.example.com/track');

      expect(script).toContain('sessionStorage');
      expect(script).toContain('surfaced_ai_visit');
    });

    it('should sanitize malicious input in shop domain', () => {
      const script = generateTrackingScript('test<script>alert(1)</script>.myshopify.com', 'https://api.example.com/track');

      expect(script).not.toContain('<script>alert(1)</script>');
    });

    it('should throw error for invalid API endpoint', () => {
      expect(() => generateTrackingScript('test.myshopify.com', 'invalid-url')).toThrow('Invalid API endpoint URL');
    });

    it('should use JSON.stringify for safe embedding', () => {
      const script = generateTrackingScript('test.myshopify.com', 'https://api.example.com/track');

      // JSON.stringify outputs quoted strings
      expect(script).toContain('"test.myshopify.com"');
    });
  });

  describe('generateConversionScript', () => {
    it('should generate conversion tracking script', () => {
      const script = generateConversionScript('https://api.example.com/convert');

      expect(script).toContain('Surfaced AI Conversion Tracking');
      expect(script).toContain('https://api.example.com/convert');
    });

    it('should check for AI visit session', () => {
      const script = generateConversionScript('https://api.example.com/convert');

      expect(script).toContain('surfaced_ai_visit');
    });

    it('should include order value and ID', () => {
      const script = generateConversionScript('https://api.example.com/convert');

      expect(script).toContain('orderValue');
      expect(script).toContain('orderId');
    });

    it('should clear session after conversion', () => {
      const script = generateConversionScript('https://api.example.com/convert');

      expect(script).toContain('removeItem');
    });
  });

  describe('recordAIVisit', () => {
    it('should throw error if shop not found', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(recordAIVisit('nonexistent.myshopify.com', {
        referrer: 'https://chat.openai.com/',
        landingPage: '/products/test',
      })).rejects.toThrow('Shop not found');
    });

    it('should not record if referrer is not from AI', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
      });

      await recordAIVisit('test.myshopify.com', {
        referrer: 'https://google.com/',
        landingPage: '/products/test',
      });

      expect(prisma.auditLog.create).not.toHaveBeenCalled();
    });

    it('should record AI visit from ChatGPT', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
      });

      await recordAIVisit('test.myshopify.com', {
        referrer: 'https://chat.openai.com/share/abc',
        landingPage: '/products/test',
        userAgent: 'Mozilla/5.0',
        sessionId: 'session-123',
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          shopId: 'shop-1',
          action: 'ai_traffic_visit',
          details: expect.objectContaining({
            platform: 'chatgpt',
            referrer: 'https://chat.openai.com/share/abc',
            landingPage: '/products/test',
            userAgent: 'Mozilla/5.0',
            sessionId: 'session-123',
          }),
        },
      });
    });

    it('should record AI visit from Perplexity', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
      });

      await recordAIVisit('test.myshopify.com', {
        referrer: 'https://perplexity.ai/search',
        landingPage: '/collections/all',
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'ai_traffic_visit',
          details: expect.objectContaining({
            platform: 'perplexity',
          }),
        }),
      });
    });
  });

  describe('recordAIConversion', () => {
    it('should throw error if shop not found', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(recordAIConversion('nonexistent.myshopify.com', {
        sessionId: 'session-123',
      })).rejects.toThrow('Shop not found');
    });

    it('should record conversion with order details', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
      });

      await recordAIConversion('test.myshopify.com', {
        sessionId: 'session-123',
        orderId: 'order-456',
        orderValue: 99.99,
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          shopId: 'shop-1',
          action: 'ai_traffic_conversion',
          details: expect.objectContaining({
            sessionId: 'session-123',
            orderId: 'order-456',
            orderValue: 99.99,
          }),
        },
      });
    });

    it('should handle conversion without order value', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
      });

      await recordAIConversion('test.myshopify.com', {
        sessionId: 'session-123',
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          details: expect.objectContaining({
            sessionId: 'session-123',
            orderId: null,
            orderValue: null,
          }),
        }),
      });
    });
  });

  describe('getAITrafficStats', () => {
    it('should throw error if shop not found', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(getAITrafficStats('nonexistent.myshopify.com')).rejects.toThrow('Shop not found');
    });

    it('should return empty stats when no visits', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
      });

      (prisma.auditLog.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const stats = await getAITrafficStats('test.myshopify.com');

      expect(stats.totalVisits).toBe(0);
      expect(stats.uniqueSessions).toBe(0);
      expect(stats.platformBreakdown).toEqual({});
      expect(stats.conversionRate).toBe(0);
      expect(stats.totalConversionValue).toBe(0);
    });

    it('should calculate platform breakdown', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
      });

      (prisma.auditLog.findMany as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce([
          { details: { platform: 'chatgpt', sessionId: 's1', landingPage: '/' } },
          { details: { platform: 'chatgpt', sessionId: 's2', landingPage: '/' } },
          { details: { platform: 'perplexity', sessionId: 's3', landingPage: '/products' } },
        ])
        .mockResolvedValueOnce([]);

      const stats = await getAITrafficStats('test.myshopify.com');

      expect(stats.totalVisits).toBe(3);
      expect(stats.platformBreakdown.chatgpt).toBe(2);
      expect(stats.platformBreakdown.perplexity).toBe(1);
    });

    it('should calculate unique sessions', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
      });

      (prisma.auditLog.findMany as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce([
          { details: { platform: 'chatgpt', sessionId: 's1', landingPage: '/' } },
          { details: { platform: 'chatgpt', sessionId: 's1', landingPage: '/products' } },
          { details: { platform: 'chatgpt', sessionId: 's2', landingPage: '/' } },
        ])
        .mockResolvedValueOnce([]);

      const stats = await getAITrafficStats('test.myshopify.com');

      expect(stats.totalVisits).toBe(3);
      expect(stats.uniqueSessions).toBe(2);
    });

    it('should calculate conversion rate', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
      });

      (prisma.auditLog.findMany as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce([
          { details: { platform: 'chatgpt', sessionId: 's1', landingPage: '/' } },
          { details: { platform: 'chatgpt', sessionId: 's2', landingPage: '/' } },
        ])
        .mockResolvedValueOnce([
          { details: { sessionId: 's1', orderValue: 100 } },
        ]);

      const stats = await getAITrafficStats('test.myshopify.com');

      expect(stats.conversionRate).toBe(50); // 1/2 = 50%
    });

    it('should calculate total conversion value', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
      });

      (prisma.auditLog.findMany as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce([
          { details: { platform: 'chatgpt', sessionId: 's1', landingPage: '/' } },
        ])
        .mockResolvedValueOnce([
          { details: { sessionId: 's1', orderValue: 50.50 } },
          { details: { sessionId: 's2', orderValue: 99.99 } },
        ]);

      const stats = await getAITrafficStats('test.myshopify.com');

      expect(stats.totalConversionValue).toBeCloseTo(150.49);
    });

    it('should return top landing pages sorted by visits', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
      });

      (prisma.auditLog.findMany as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce([
          { details: { platform: 'chatgpt', sessionId: 's1', landingPage: '/' } },
          { details: { platform: 'chatgpt', sessionId: 's2', landingPage: '/products' } },
          { details: { platform: 'chatgpt', sessionId: 's3', landingPage: '/products' } },
          { details: { platform: 'chatgpt', sessionId: 's4', landingPage: '/products' } },
        ])
        .mockResolvedValueOnce([]);

      const stats = await getAITrafficStats('test.myshopify.com');

      expect(stats.topLandingPages[0].url).toBe('/products');
      expect(stats.topLandingPages[0].visits).toBe(3);
      expect(stats.topLandingPages[1].url).toBe('/');
      expect(stats.topLandingPages[1].visits).toBe(1);
    });

    it('should use default 30 days period', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
      });

      (prisma.auditLog.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const stats = await getAITrafficStats('test.myshopify.com');

      expect(stats.period.start).toBeDefined();
      expect(stats.period.end).toBeDefined();
    });

    it('should respect custom days parameter', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
      });

      (prisma.auditLog.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await getAITrafficStats('test.myshopify.com', 7);

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          createdAt: expect.objectContaining({
            gte: expect.any(Date),
          }),
        }),
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});
