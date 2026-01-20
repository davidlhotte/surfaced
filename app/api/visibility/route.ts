import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils/errors';
import { getShopFromRequest } from '@/lib/shopify/get-shop';
import {
  runVisibilityCheck,
  getVisibilityHistory,
  getAvailablePlatforms,
} from '@/lib/services/visibility-check';
import type { Platform } from '@prisma/client';

const VALID_PLATFORMS: Platform[] = [
  // Paid platforms
  'chatgpt', 'perplexity', 'gemini', 'copilot', 'claude',
  // Free platforms
  'llama', 'deepseek', 'mistral', 'qwen',
];

export async function POST(request: NextRequest) {
  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: true });

    // Parse request body for queries and platforms
    let queries: string[] | undefined;
    let platforms: Platform[] | undefined;

    try {
      const body = await request.json();

      if (body.queries && Array.isArray(body.queries)) {
        queries = body.queries.filter((q: unknown) => typeof q === 'string');
      }

      if (body.platforms && Array.isArray(body.platforms)) {
        platforms = body.platforms.filter(
          (p: unknown) => typeof p === 'string' && VALID_PLATFORMS.includes(p as Platform)
        ) as Platform[];
      }
    } catch {
      // No body or invalid JSON - use defaults
    }

    const result = await runVisibilityCheck(shopDomain, queries, platforms);

    return NextResponse.json({
      success: true,
      data: result,
      availablePlatforms: getAvailablePlatforms(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: false });

    const history = await getVisibilityHistory(shopDomain);
    const availablePlatforms = getAvailablePlatforms();

    return NextResponse.json({
      success: true,
      data: history,
      availablePlatforms,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
