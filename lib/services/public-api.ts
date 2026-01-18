import { createHash, randomBytes } from 'crypto';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/monitoring/logger';

export type ApiKeyScope = 'read' | 'write' | 'audit' | 'optimize';

export type ApiKeyInfo = {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: ApiKeyScope[];
  rateLimit: number;
  requestCount: number;
  isActive: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

/**
 * Generate a new API key
 */
export async function generateApiKey(
  shopDomain: string,
  name: string,
  scopes: ApiKeyScope[] = ['read'],
  rateLimit: number = 100,
  expiresInDays?: number
): Promise<{ key: string; keyInfo: ApiKeyInfo }> {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: { id: true },
  });

  if (!shop) {
    throw new Error('Shop not found');
  }

  // Generate a secure random key
  const rawKey = randomBytes(32).toString('hex');
  const keyPrefix = `sk_live_${rawKey.substring(0, 8)}`;
  const fullKey = `sk_live_${rawKey}`;

  // Hash the key for storage
  const keyHash = createHash('sha256').update(fullKey).digest('hex');

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  const apiKey = await prisma.apiKey.create({
    data: {
      shopId: shop.id,
      name,
      keyHash,
      keyPrefix,
      scopes,
      rateLimit,
      expiresAt,
    },
  });

  logger.info({ shopDomain, keyId: apiKey.id }, 'API key generated');

  return {
    key: fullKey, // Only returned once at creation
    keyInfo: formatApiKeyInfo(apiKey),
  };
}

/**
 * Validate an API key and return shop info
 */
export async function validateApiKey(
  key: string
): Promise<{
  valid: boolean;
  shopDomain?: string;
  scopes?: ApiKeyScope[];
  keyId?: string;
  error?: string;
}> {
  if (!key || !key.startsWith('sk_live_')) {
    return { valid: false, error: 'Invalid key format' };
  }

  const keyHash = createHash('sha256').update(key).digest('hex');

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: {
      shop: {
        select: { shopDomain: true },
      },
    },
  });

  if (!apiKey) {
    return { valid: false, error: 'Invalid API key' };
  }

  if (!apiKey.isActive) {
    return { valid: false, error: 'API key is revoked' };
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return { valid: false, error: 'API key has expired' };
  }

  // Update last used
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: {
      lastUsedAt: new Date(),
      requestCount: { increment: 1 },
    },
  });

  return {
    valid: true,
    shopDomain: apiKey.shop.shopDomain,
    scopes: apiKey.scopes as ApiKeyScope[],
    keyId: apiKey.id,
  };
}

/**
 * Check if API key has required scope
 */
export function hasScope(scopes: ApiKeyScope[], required: ApiKeyScope): boolean {
  // 'write' implies 'read'
  if (required === 'read' && scopes.includes('write')) return true;
  return scopes.includes(required);
}

/**
 * Check rate limit for an API key
 */
export async function checkRateLimit(keyId: string): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - 60 * 1000); // 1 minute window

  const apiKey = await prisma.apiKey.findUnique({
    where: { id: keyId },
    select: { rateLimit: true },
  });

  if (!apiKey) {
    return { allowed: false, remaining: 0, resetAt: now };
  }

  // Count requests in the current window
  const recentRequests = await prisma.apiUsageLog.count({
    where: {
      apiKeyId: keyId,
      createdAt: { gte: windowStart },
    },
  });

  const remaining = Math.max(0, apiKey.rateLimit - recentRequests);
  const resetAt = new Date(now.getTime() + 60 * 1000);

  return {
    allowed: remaining > 0,
    remaining,
    resetAt,
  };
}

/**
 * Log API usage
 */
export async function logApiUsage(
  keyId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTimeMs: number,
  ipAddress?: string
): Promise<void> {
  await prisma.apiUsageLog.create({
    data: {
      apiKeyId: keyId,
      endpoint,
      method,
      statusCode,
      responseTimeMs,
      ipAddress,
    },
  });
}

/**
 * Get all API keys for a shop
 */
export async function getApiKeys(shopDomain: string): Promise<ApiKeyInfo[]> {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: {
      apiKeys: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!shop) {
    throw new Error('Shop not found');
  }

  return shop.apiKeys.map(formatApiKeyInfo);
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(
  shopDomain: string,
  keyId: string
): Promise<boolean> {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: { id: true },
  });

  if (!shop) {
    return false;
  }

  await prisma.apiKey.updateMany({
    where: {
      id: keyId,
      shopId: shop.id,
    },
    data: {
      isActive: false,
      revokedAt: new Date(),
    },
  });

  logger.info({ shopDomain, keyId }, 'API key revoked');
  return true;
}

/**
 * Delete an API key
 */
export async function deleteApiKey(
  shopDomain: string,
  keyId: string
): Promise<boolean> {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: { id: true },
  });

  if (!shop) {
    return false;
  }

  await prisma.apiKey.deleteMany({
    where: {
      id: keyId,
      shopId: shop.id,
    },
  });

  logger.info({ shopDomain, keyId }, 'API key deleted');
  return true;
}

/**
 * Get API usage statistics
 */
export async function getApiUsageStats(
  shopDomain: string,
  days: number = 30
): Promise<{
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  requestsByEndpoint: { endpoint: string; count: number }[];
  requestsByDay: { date: string; count: number }[];
}> {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: {
      apiKeys: {
        select: { id: true },
      },
    },
  });

  if (!shop) {
    throw new Error('Shop not found');
  }

  const keyIds = shop.apiKeys.map((k) => k.id);
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const logs = await prisma.apiUsageLog.findMany({
    where: {
      apiKeyId: { in: keyIds },
      createdAt: { gte: startDate },
    },
    select: {
      endpoint: true,
      statusCode: true,
      responseTimeMs: true,
      createdAt: true,
    },
  });

  const totalRequests = logs.length;
  const successfulRequests = logs.filter((l) => l.statusCode < 400).length;
  const failedRequests = logs.filter((l) => l.statusCode >= 400).length;
  const avgResponseTime = logs.length > 0
    ? Math.round(logs.reduce((sum, l) => sum + l.responseTimeMs, 0) / logs.length)
    : 0;

  // Group by endpoint
  const endpointCounts: Record<string, number> = {};
  for (const log of logs) {
    endpointCounts[log.endpoint] = (endpointCounts[log.endpoint] || 0) + 1;
  }
  const requestsByEndpoint = Object.entries(endpointCounts)
    .map(([endpoint, count]) => ({ endpoint, count }))
    .sort((a, b) => b.count - a.count);

  // Group by day
  const dayCounts: Record<string, number> = {};
  for (const log of logs) {
    const date = log.createdAt.toISOString().split('T')[0];
    dayCounts[date] = (dayCounts[date] || 0) + 1;
  }
  const requestsByDay = Object.entries(dayCounts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalRequests,
    successfulRequests,
    failedRequests,
    avgResponseTime,
    requestsByEndpoint,
    requestsByDay,
  };
}

function formatApiKeyInfo(apiKey: {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: unknown;
  rateLimit: number;
  requestCount: number;
  isActive: boolean;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}): ApiKeyInfo {
  return {
    id: apiKey.id,
    name: apiKey.name,
    keyPrefix: apiKey.keyPrefix,
    scopes: apiKey.scopes as ApiKeyScope[],
    rateLimit: apiKey.rateLimit,
    requestCount: apiKey.requestCount,
    isActive: apiKey.isActive,
    lastUsedAt: apiKey.lastUsedAt?.toISOString() || null,
    expiresAt: apiKey.expiresAt?.toISOString() || null,
    createdAt: apiKey.createdAt.toISOString(),
  };
}
