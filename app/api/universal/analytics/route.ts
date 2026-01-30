import { NextRequest, NextResponse } from 'next/server';
import { verifyUniversalSession } from '@/lib/auth/universal-session';
import {
  getAnalyticsSummary,
  getTrendData,
  getPositionHistory,
  calculateShareOfVoice,
  compareWithCompetitors,
} from '@/lib/services/universal/analytics';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/monitoring/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await verifyUniversalSession(request);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');
    const type = searchParams.get('type') || 'summary';
    const days = parseInt(searchParams.get('days') || '30', 10);

    if (!brandId) {
      return NextResponse.json(
        { error: 'Brand ID is required' },
        { status: 400 }
      );
    }

    // Verify brand belongs to user
    const brand = await prisma.brand.findFirst({
      where: {
        id: brandId,
        userId: session.userId,
      },
    });

    if (!brand) {
      return NextResponse.json(
        { error: 'Brand not found' },
        { status: 404 }
      );
    }

    let data;

    switch (type) {
      case 'summary':
        data = await getAnalyticsSummary(brandId);
        break;
      case 'trends':
        data = await getTrendData(brandId, days);
        break;
      case 'positions':
        data = await getPositionHistory(brandId, days);
        break;
      case 'sov': {
        const competitorIds = searchParams.get('competitors')?.split(',') || [];
        data = await calculateShareOfVoice(brandId, competitorIds, days);
        break;
      }
      case 'compare': {
        const competitorIds = searchParams.get('competitors')?.split(',') || [];
        data = await compareWithCompetitors(brandId, competitorIds);
        break;
      }
      default:
        return NextResponse.json(
          { error: 'Invalid analytics type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      type,
      brandId,
      data,
    });
  } catch (error) {
    logger.error({ error }, 'Analytics error');
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
