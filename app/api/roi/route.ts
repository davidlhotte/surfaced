import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils/errors';
import { getShopFromRequest } from '@/lib/shopify/get-shop';
import {
  getROIMetrics,
  calculateEstimatedROI,
  type TimePeriod,
} from '@/lib/services/roi-dashboard';

const VALID_PERIODS: TimePeriod[] = ['7d', '30d', '90d', '365d'];

/**
 * GET /api/roi
 * Get ROI dashboard metrics
 */
export async function GET(request: NextRequest) {
  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: false });

    // Get period from query params
    const url = new URL(request.url);
    const periodParam = url.searchParams.get('period') || '30d';
    const period: TimePeriod = VALID_PERIODS.includes(periodParam as TimePeriod)
      ? (periodParam as TimePeriod)
      : '30d';

    // Get metrics
    const metrics = await getROIMetrics(shopDomain, period);

    // Calculate estimated ROI
    const estimatedROI = calculateEstimatedROI(metrics);

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        estimatedROI,
        period,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
