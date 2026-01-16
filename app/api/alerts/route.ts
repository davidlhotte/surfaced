import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils/errors';
import { getShopFromRequest } from '@/lib/shopify/get-shop';
import {
  getActiveAlerts,
  getAlertPreferences,
  updateAlertPreferences,
  generateWeeklyReport,
} from '@/lib/services/alerts';

/**
 * GET /api/alerts
 * Get active alerts and preferences for the shop
 */
export async function GET(request: NextRequest) {
  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: false });

    // Get active alerts
    const alerts = await getActiveAlerts(shopDomain);

    // Get preferences
    const preferences = await getAlertPreferences(shopDomain);

    // Get weekly report if requested
    const url = new URL(request.url);
    const includeReport = url.searchParams.get('report') === 'true';

    let report = null;
    if (includeReport) {
      report = await generateWeeklyReport(shopDomain);
    }

    return NextResponse.json({
      success: true,
      data: {
        alerts,
        preferences,
        report,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/alerts
 * Update alert preferences
 */
export async function POST(request: NextRequest) {
  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: true });

    const body = await request.json();

    // Validate and extract preferences
    const updates: { emailAlerts?: boolean; weeklyReport?: boolean } = {};

    if (typeof body.emailAlerts === 'boolean') {
      updates.emailAlerts = body.emailAlerts;
    }

    if (typeof body.weeklyReport === 'boolean') {
      updates.weeklyReport = body.weeklyReport;
    }

    // Update preferences
    const preferences = await updateAlertPreferences(shopDomain, updates);

    return NextResponse.json({
      success: true,
      data: {
        preferences,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
