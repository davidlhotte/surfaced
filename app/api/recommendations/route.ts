import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils/errors';
import { getShopFromRequest } from '@/lib/shopify/get-shop';
import { generateRecommendations, getQuickWins } from '@/lib/services/recommendations';

/**
 * GET /api/recommendations
 * Get personalized AI training recommendations
 */
export async function GET(request: NextRequest) {
  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: false });
    const { searchParams } = new URL(request.url);
    const quickWinsOnly = searchParams.get('quickWins') === 'true';

    if (quickWinsOnly) {
      const quickWins = await getQuickWins(shopDomain);
      return NextResponse.json({
        success: true,
        data: { quickWins },
      });
    }

    const recommendations = await generateRecommendations(shopDomain);

    return NextResponse.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
