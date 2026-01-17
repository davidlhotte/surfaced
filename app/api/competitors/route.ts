import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils/errors';
import { getShopFromRequest } from '@/lib/shopify/get-shop';
import {
  getCompetitors,
  addCompetitor,
  removeCompetitor,
  runCompetitorAnalysis,
  getCompetitorTrends,
  getLastAnalysisResult,
} from '@/lib/services/competitor-intelligence';

export async function GET(request: NextRequest) {
  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: false });
    const { searchParams } = new URL(request.url);
    const includeTrends = searchParams.get('trends') === 'true';
    const days = parseInt(searchParams.get('days') || '30', 10);

    const result = await getCompetitors(shopDomain);
    const lastAnalysis = await getLastAnalysisResult(shopDomain);

    let trends = null;
    if (includeTrends) {
      trends = await getCompetitorTrends(shopDomain, days);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        lastAnalysis,
        trends,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: true });

    const body = await request.json();

    if (body.action === 'analyze') {
      // Run competitor analysis
      const result = await runCompetitorAnalysis(shopDomain);
      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    // Add competitor
    const { domain, name } = body;

    if (!domain) {
      return NextResponse.json(
        { success: false, error: 'Competitor domain is required' },
        { status: 400 }
      );
    }

    await addCompetitor(shopDomain, domain, name);

    const result = await getCompetitors(shopDomain);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: true });

    const { searchParams } = new URL(request.url);
    const competitorId = searchParams.get('id');

    if (!competitorId) {
      return NextResponse.json(
        { success: false, error: 'Competitor ID is required' },
        { status: 400 }
      );
    }

    await removeCompetitor(shopDomain, competitorId);

    const result = await getCompetitors(shopDomain);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
