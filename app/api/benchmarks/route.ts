import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils/errors';
import { getShopFromRequest } from '@/lib/shopify/get-shop';
import {
  getAllBenchmarks,
  compareToIndustry,
  detectIndustry,
  type IndustryCategory,
} from '@/lib/services/benchmarks';

/**
 * GET /api/benchmarks
 * Get industry benchmarks and shop comparison
 */
export async function GET(request: NextRequest) {
  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: false });
    const { searchParams } = new URL(request.url);
    const industry = searchParams.get('industry') as IndustryCategory | null;
    const allBenchmarks = searchParams.get('all') === 'true';

    if (allBenchmarks) {
      // Return all industry benchmarks
      return NextResponse.json({
        success: true,
        data: {
          benchmarks: getAllBenchmarks(),
        },
      });
    }

    // Compare shop to industry
    const comparison = await compareToIndustry(shopDomain, industry || undefined);
    const detectedIndustry = await detectIndustry(shopDomain);

    return NextResponse.json({
      success: true,
      data: {
        detectedIndustry,
        ...comparison,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
