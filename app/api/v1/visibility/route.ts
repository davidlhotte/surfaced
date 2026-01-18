import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest, logRequest } from '@/lib/api/auth-middleware';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/v1/visibility
 * Get visibility check results
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  const auth = await authenticateApiRequest(request, 'read');
  if (!auth.success) {
    return auth.error;
  }

  const { shopDomain, keyId } = auth.data;
  const { searchParams } = new URL(request.url);

  // Pagination
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
  const skip = (page - 1) * limit;

  // Filters
  const platform = searchParams.get('platform');
  const days = parseInt(searchParams.get('days') || '30', 10);

  try {
    const shop = await prisma.shop.findUnique({
      where: { shopDomain },
      select: { id: true, name: true },
    });

    if (!shop) {
      await logRequest(keyId, request, 404, startTime);
      return NextResponse.json(
        { error: 'Shop not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Build where clause
    const where: {
      shopId: string;
      checkedAt: { gte: Date };
      platform?: 'chatgpt' | 'perplexity' | 'gemini' | 'copilot';
    } = {
      shopId: shop.id,
      checkedAt: { gte: startDate },
    };

    if (platform && ['chatgpt', 'perplexity', 'gemini', 'copilot'].includes(platform)) {
      where.platform = platform as 'chatgpt' | 'perplexity' | 'gemini' | 'copilot';
    }

    // Get total count
    const totalCount = await prisma.visibilityCheck.count({ where });

    // Get checks
    const checks = await prisma.visibilityCheck.findMany({
      where,
      orderBy: { checkedAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        platform: true,
        query: true,
        isMentioned: true,
        mentionContext: true,
        position: true,
        competitorsFound: true,
        responseQuality: true,
        checkedAt: true,
      },
    });

    // Calculate summary stats
    const allChecks = await prisma.visibilityCheck.findMany({
      where,
      select: {
        isMentioned: true,
        platform: true,
        position: true,
      },
    });

    const mentionedCount = allChecks.filter((c) => c.isMentioned).length;
    const mentionRate = allChecks.length > 0
      ? Math.round((mentionedCount / allChecks.length) * 100)
      : 0;

    // Stats by platform
    const platformStats: Record<string, { total: number; mentioned: number; rate: number }> = {};
    for (const check of allChecks) {
      if (!platformStats[check.platform]) {
        platformStats[check.platform] = { total: 0, mentioned: 0, rate: 0 };
      }
      platformStats[check.platform].total++;
      if (check.isMentioned) {
        platformStats[check.platform].mentioned++;
      }
    }
    for (const [p, stats] of Object.entries(platformStats)) {
      platformStats[p].rate = Math.round((stats.mentioned / stats.total) * 100);
    }

    // Average position when mentioned
    const positions = allChecks
      .filter((c) => c.isMentioned && c.position)
      .map((c) => c.position!);
    const avgPosition = positions.length > 0
      ? Math.round(positions.reduce((a, b) => a + b, 0) / positions.length * 10) / 10
      : null;

    const response = {
      success: true,
      data: {
        summary: {
          totalChecks: allChecks.length,
          mentionedCount,
          mentionRate,
          avgPosition,
          platformStats,
        },
        checks: checks.map((c) => ({
          id: c.id,
          platform: c.platform,
          query: c.query,
          isMentioned: c.isMentioned,
          mentionContext: c.mentionContext,
          position: c.position,
          competitorsFound: c.competitorsFound,
          responseQuality: c.responseQuality,
          checkedAt: c.checkedAt.toISOString(),
        })),
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page * limit < totalCount,
          hasPrev: page > 1,
        },
      },
    };

    await logRequest(keyId, request, 200, startTime);
    return NextResponse.json(response);
  } catch (error) {
    await logRequest(keyId, request, 500, startTime);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
