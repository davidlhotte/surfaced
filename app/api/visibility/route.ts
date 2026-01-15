import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils/errors';
import { getShopFromRequest } from '@/lib/shopify/get-shop';
import {
  runVisibilityCheck,
  getVisibilityHistory,
} from '@/lib/services/visibility-check';

export async function POST(request: NextRequest) {
  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: true });

    // Optional: custom queries from request body
    let queries: string[] | undefined;
    try {
      const body = await request.json();
      if (body.queries && Array.isArray(body.queries)) {
        queries = body.queries;
      }
    } catch {
      // No body or invalid JSON - use default queries
    }

    const result = await runVisibilityCheck(shopDomain, queries);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: false });

    const history = await getVisibilityHistory(shopDomain);

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
