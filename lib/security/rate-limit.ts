import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
});

// Public API: 100 req/min per shop
export const publicRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  prefix: 'ratelimit:public',
});

// Admin API: 1000 req/min per shop
export const adminRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1000, '1 m'),
  prefix: 'ratelimit:admin',
});

// Geocoding: 10 req/sec (Nominatim limit)
export const geocodingRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 s'),
  prefix: 'ratelimit:geocoding',
});

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

// In-memory fallback for when Redis is unavailable
const inMemoryLimits = new Map<string, { count: number; resetAt: number }>();
const FALLBACK_LIMIT = 50; // Conservative limit when Redis is down
const FALLBACK_WINDOW_MS = 60000; // 1 minute

function checkInMemoryLimit(identifier: string, limit: number = FALLBACK_LIMIT): RateLimitResult {
  const now = Date.now();
  const key = identifier;
  const entry = inMemoryLimits.get(key);

  // Clean up old entry if window has passed
  if (entry && entry.resetAt <= now) {
    inMemoryLimits.delete(key);
  }

  const current = inMemoryLimits.get(key);

  if (!current) {
    // First request in this window
    inMemoryLimits.set(key, { count: 1, resetAt: now + FALLBACK_WINDOW_MS });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: now + FALLBACK_WINDOW_MS,
    };
  }

  if (current.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: current.resetAt,
    };
  }

  current.count++;
  return {
    success: true,
    limit,
    remaining: limit - current.count,
    reset: current.resetAt,
  };
}

export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<RateLimitResult> {
  try {
    const result = await limiter.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    console.error('Rate limit error (using in-memory fallback):', error);
    // Use in-memory fallback instead of allowing all requests
    // This provides protection even when Redis is unavailable
    return checkInMemoryLimit(identifier);
  }
}
