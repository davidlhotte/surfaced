import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Upstash modules before any imports - must use class-like constructors
vi.mock('@upstash/redis', () => {
  return {
    Redis: class MockRedis {
      constructor() {}
    },
  };
});

vi.mock('@upstash/ratelimit', () => {
  class MockRatelimit {
    limit = vi.fn();
    static slidingWindow = vi.fn(() => ({ type: 'slidingWindow' }));
  }
  return { Ratelimit: MockRatelimit };
});

// Import checkRateLimit function directly to test it with custom limiters
import { checkRateLimit } from '@/lib/security/rate-limit';

describe('Rate Limit Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkRateLimit', () => {
    it('should return success result from limiter', async () => {
      const mockLimiter = {
        limit: vi.fn().mockResolvedValue({
          success: true,
          limit: 100,
          remaining: 99,
          reset: Date.now() + 60000,
        }),
      };

      const result = await checkRateLimit(mockLimiter as never, 'test-id');

      expect(result.success).toBe(true);
      expect(result.limit).toBe(100);
      expect(result.remaining).toBe(99);
    });

    it('should return failure result when rate limited', async () => {
      const mockLimiter = {
        limit: vi.fn().mockResolvedValue({
          success: false,
          limit: 100,
          remaining: 0,
          reset: Date.now() + 60000,
        }),
      };

      const result = await checkRateLimit(mockLimiter as never, 'test-id');

      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should use in-memory fallback on Redis error', async () => {
      const mockLimiter = {
        limit: vi.fn().mockRejectedValue(new Error('Redis unavailable')),
      };

      const result = await checkRateLimit(mockLimiter as never, 'test-id');

      // Fallback should allow the request
      expect(result.success).toBe(true);
      expect(result.limit).toBe(50); // FALLBACK_LIMIT
    });

    it('should respect in-memory limit on multiple requests', async () => {
      const mockLimiter = {
        limit: vi.fn().mockRejectedValue(new Error('Redis unavailable')),
      };

      // Make many requests to exceed fallback limit
      const results = [];
      for (let i = 0; i < 55; i++) {
        results.push(await checkRateLimit(mockLimiter as never, 'same-identifier'));
      }

      // First 50 should succeed
      expect(results.slice(0, 50).every(r => r.success)).toBe(true);
      // After 50, should fail
      expect(results[50].success).toBe(false);
    });

    it('should handle different identifiers separately', async () => {
      const mockLimiter = {
        limit: vi.fn().mockRejectedValue(new Error('Redis unavailable')),
      };

      const result1 = await checkRateLimit(mockLimiter as never, 'id-1');
      const result2 = await checkRateLimit(mockLimiter as never, 'id-2');

      // Both should succeed as they're different identifiers
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      // Both should have same remaining (limit - 1 for first request)
      expect(result1.remaining).toBe(49);
      expect(result2.remaining).toBe(49);
    });
  });
});
