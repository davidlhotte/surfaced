import { NextRequest, NextResponse } from 'next/server';
import {
  validateApiKey,
  checkRateLimit,
  logApiUsage,
  hasScope,
  type ApiKeyScope,
} from '@/lib/services/public-api';

export type AuthenticatedRequest = {
  shopDomain: string;
  scopes: ApiKeyScope[];
  keyId: string;
};

/**
 * Authenticate a public API request
 */
export async function authenticateApiRequest(
  request: NextRequest,
  requiredScope: ApiKeyScope = 'read'
): Promise<{ success: true; data: AuthenticatedRequest } | { success: false; error: NextResponse }> {
  const startTime = Date.now();

  // Get API key from header
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      success: false,
      error: NextResponse.json(
        {
          error: 'Missing or invalid Authorization header',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      ),
    };
  }

  const apiKey = authHeader.substring(7); // Remove "Bearer "

  // Validate the key
  const validation = await validateApiKey(apiKey);
  if (!validation.valid) {
    return {
      success: false,
      error: NextResponse.json(
        {
          error: validation.error || 'Invalid API key',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      ),
    };
  }

  // Check scope
  if (!hasScope(validation.scopes!, requiredScope)) {
    return {
      success: false,
      error: NextResponse.json(
        {
          error: `Insufficient permissions. Required scope: ${requiredScope}`,
          code: 'FORBIDDEN',
        },
        { status: 403 }
      ),
    };
  }

  // Check rate limit
  const rateLimit = await checkRateLimit(validation.keyId!);
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: NextResponse.json(
        {
          error: 'Rate limit exceeded',
          code: 'RATE_LIMITED',
          retryAfter: Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetAt.toISOString(),
            'Retry-After': String(Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)),
          },
        }
      ),
    };
  }

  return {
    success: true,
    data: {
      shopDomain: validation.shopDomain!,
      scopes: validation.scopes!,
      keyId: validation.keyId!,
    },
  };
}

/**
 * Create a response with rate limit headers
 */
export function createApiResponse(
  data: unknown,
  keyId: string,
  remaining: number,
  status: number = 200
): NextResponse {
  const response = NextResponse.json(data, { status });
  response.headers.set('X-RateLimit-Remaining', String(remaining));
  return response;
}

/**
 * Log API request (call after response is sent)
 */
export async function logRequest(
  keyId: string,
  request: NextRequest,
  statusCode: number,
  startTime: number
): Promise<void> {
  const responseTimeMs = Date.now() - startTime;
  const endpoint = new URL(request.url).pathname;
  const method = request.method;
  const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');

  await logApiUsage(keyId, endpoint, method, statusCode, responseTimeMs, ipAddress || undefined);
}
