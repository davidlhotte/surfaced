import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
});

const DEFAULT_TTL = 60 * 5; // 5 minutes

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    if (!process.env.KV_REST_API_URL) return null;
    const data = await redis.get<T>(key);
    return data;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

export async function cacheSet<T>(key: string, value: T, ttl: number = DEFAULT_TTL): Promise<void> {
  try {
    if (!process.env.KV_REST_API_URL) return;
    await redis.set(key, value, { ex: ttl });
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    if (!process.env.KV_REST_API_URL) return;
    await redis.del(key);
  } catch (error) {
    console.error('Cache delete error:', error);
  }
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  try {
    if (!process.env.KV_REST_API_URL) return;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Cache delete pattern error:', error);
  }
}

// Cache keys helpers
export const cacheKeys = {
  stores: (shopDomain: string) => `stores:${shopDomain}`,
  settings: (shopDomain: string) => `settings:${shopDomain}`,
  shop: (shopDomain: string) => `shop:${shopDomain}`,
  audit: (shopDomain: string) => `audit:${shopDomain}`,
  recommendations: (shopDomain: string) => `recommendations:${shopDomain}`,
  visibilityHistory: (shopDomain: string) => `visibility:history:${shopDomain}`,
  dashboard: (shopDomain: string) => `dashboard:${shopDomain}`,
};

// TTL constants (in seconds)
export const cacheTTL = {
  short: 30,        // 30 seconds for frequently changing data
  medium: 300,      // 5 minutes for audit/recommendations
  long: 3600,       // 1 hour for historical data
};
