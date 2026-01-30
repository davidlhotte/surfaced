/**
 * Analytics Service for AEO
 * Share of Voice, Position Tracking, and Trend Analysis
 */

import { logger } from '@/lib/monitoring/logger';
import { prisma } from '@/lib/db/prisma';

export interface PositionData {
  platform: string;
  position: number | null;
  mentioned: boolean;
  sentiment: 'positive' | 'neutral' | 'negative';
  date: Date;
}

export interface ShareOfVoiceData {
  brand: string;
  platform: string;
  mentions: number;
  totalQueries: number;
  sharePercent: number;
  avgPosition: number | null;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export interface TrendData {
  date: string;
  aeoScore: number;
  mentionRate: number;
  avgPosition: number | null;
}

export interface CompetitorComparison {
  brand: string;
  aeoScore: number;
  mentionRate: number;
  avgPosition: number | null;
  platforms: {
    platform: string;
    mentioned: boolean;
    position: number | null;
  }[];
}

// Helper to parse platform result from stored JSON
function parsePlatformResult(data: unknown): {
  mentioned: boolean;
  position: number | null;
  sentiment: 'positive' | 'neutral' | 'negative';
} {
  if (!data) return { mentioned: false, position: null, sentiment: 'neutral' };
  const result = data as { mentioned?: boolean; position?: number; sentiment?: string };
  return {
    mentioned: result.mentioned || false,
    position: result.position || null,
    sentiment: (result.sentiment as 'positive' | 'neutral' | 'negative') || 'neutral',
  };
}

/**
 * Get position tracking history for a brand
 */
export async function getPositionHistory(
  brandId: string,
  days: number = 30
): Promise<PositionData[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const checks = await prisma.brandVisibilityCheck.findMany({
      where: {
        brandId,
        checkedAt: {
          gte: startDate,
        },
      },
      orderBy: {
        checkedAt: 'asc',
      },
    });

    const positionData: PositionData[] = [];

    for (const check of checks) {
      const platformResults = [
        { key: 'chatgpt', data: check.chatgptResult },
        { key: 'claude', data: check.claudeResult },
        { key: 'perplexity', data: check.perplexityResult },
        { key: 'gemini', data: check.geminiResult },
      ];

      for (const { key, data } of platformResults) {
        const result = parsePlatformResult(data);
        positionData.push({
          platform: key,
          position: result.position,
          mentioned: result.mentioned,
          sentiment: result.sentiment,
          date: check.checkedAt,
        });
      }
    }

    return positionData;
  } catch (error) {
    logger.error({ error, brandId }, 'Failed to get position history');
    return [];
  }
}

/**
 * Calculate Share of Voice for a brand
 */
export async function calculateShareOfVoice(
  brandId: string,
  competitorIds: string[] = [],
  days: number = 30
): Promise<ShareOfVoiceData[]> {
  try {
    const allBrandIds = [brandId, ...competitorIds];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const results: ShareOfVoiceData[] = [];
    const platforms = ['chatgpt', 'claude', 'perplexity', 'gemini'];

    for (const id of allBrandIds) {
      const brand = await prisma.brand.findUnique({
        where: { id },
        select: { name: true },
      });

      if (!brand) continue;

      const checks = await prisma.brandVisibilityCheck.findMany({
        where: {
          brandId: id,
          checkedAt: { gte: startDate },
        },
      });

      for (const platform of platforms) {
        let mentions = 0;
        let totalPositions = 0;
        let positionCount = 0;
        const sentiment = { positive: 0, neutral: 0, negative: 0 };

        for (const check of checks) {
          const platformData = platform === 'chatgpt' ? check.chatgptResult :
            platform === 'claude' ? check.claudeResult :
            platform === 'perplexity' ? check.perplexityResult :
            check.geminiResult;

          const result = parsePlatformResult(platformData);

          if (result.mentioned) {
            mentions++;
            if (result.position) {
              totalPositions += result.position;
              positionCount++;
            }
            sentiment[result.sentiment]++;
          }
        }

        results.push({
          brand: brand.name,
          platform,
          mentions,
          totalQueries: checks.length,
          sharePercent: checks.length > 0 ? (mentions / checks.length) * 100 : 0,
          avgPosition: positionCount > 0 ? totalPositions / positionCount : null,
          sentiment,
        });
      }
    }

    return results;
  } catch (error) {
    logger.error({ error, brandId }, 'Failed to calculate Share of Voice');
    return [];
  }
}

/**
 * Get trend data for a brand
 */
export async function getTrendData(
  brandId: string,
  days: number = 30
): Promise<TrendData[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const checks = await prisma.brandVisibilityCheck.findMany({
      where: {
        brandId,
        checkedAt: { gte: startDate },
      },
      orderBy: {
        checkedAt: 'asc',
      },
    });

    // Group by date
    const groupedByDate = new Map<string, typeof checks>();

    for (const check of checks) {
      const dateKey = check.checkedAt.toISOString().split('T')[0];
      if (!groupedByDate.has(dateKey)) {
        groupedByDate.set(dateKey, []);
      }
      groupedByDate.get(dateKey)!.push(check);
    }

    const trends: TrendData[] = [];

    for (const [date, dayChecks] of groupedByDate) {
      let totalScore = 0;
      let totalMentions = 0;
      let totalPlatforms = 0;
      let totalPositions = 0;
      let positionCount = 0;

      for (const check of dayChecks) {
        totalScore += check.aeoScore;

        const platformResults = [
          check.chatgptResult,
          check.claudeResult,
          check.perplexityResult,
          check.geminiResult,
        ];

        for (const data of platformResults) {
          totalPlatforms++;
          const result = parsePlatformResult(data);
          if (result.mentioned) {
            totalMentions++;
            if (result.position) {
              totalPositions += result.position;
              positionCount++;
            }
          }
        }
      }

      trends.push({
        date,
        aeoScore: Math.round(totalScore / dayChecks.length),
        mentionRate: totalPlatforms > 0 ? (totalMentions / totalPlatforms) * 100 : 0,
        avgPosition: positionCount > 0 ? totalPositions / positionCount : null,
      });
    }

    return trends;
  } catch (error) {
    logger.error({ error, brandId }, 'Failed to get trend data');
    return [];
  }
}

/**
 * Compare brand with competitors
 */
export async function compareWithCompetitors(
  brandId: string,
  competitorIds: string[]
): Promise<CompetitorComparison[]> {
  try {
    const allIds = [brandId, ...competitorIds];
    const comparisons: CompetitorComparison[] = [];

    for (const id of allIds) {
      const brand = await prisma.brand.findUnique({
        where: { id },
        select: { name: true },
      });

      if (!brand) continue;

      // Get latest check
      const latestCheck = await prisma.brandVisibilityCheck.findFirst({
        where: { brandId: id },
        orderBy: { checkedAt: 'desc' },
      });

      if (!latestCheck) {
        comparisons.push({
          brand: brand.name,
          aeoScore: 0,
          mentionRate: 0,
          avgPosition: null,
          platforms: [],
        });
        continue;
      }

      const platformResults = [
        { key: 'chatgpt', data: latestCheck.chatgptResult },
        { key: 'claude', data: latestCheck.claudeResult },
        { key: 'perplexity', data: latestCheck.perplexityResult },
        { key: 'gemini', data: latestCheck.geminiResult },
      ];

      const platforms = platformResults.map(({ key, data }) => {
        const result = parsePlatformResult(data);
        return {
          platform: key,
          mentioned: result.mentioned,
          position: result.position,
        };
      });

      const mentionedPlatforms = platforms.filter((p) => p.mentioned);
      const positions = mentionedPlatforms
        .filter((p) => p.position)
        .map((p) => p.position!);

      comparisons.push({
        brand: brand.name,
        aeoScore: latestCheck.aeoScore,
        mentionRate: platforms.length > 0
          ? (mentionedPlatforms.length / platforms.length) * 100
          : 0,
        avgPosition: positions.length > 0
          ? positions.reduce((a, b) => a + b, 0) / positions.length
          : null,
        platforms,
      });
    }

    return comparisons;
  } catch (error) {
    logger.error({ error, brandId }, 'Failed to compare with competitors');
    return [];
  }
}

/**
 * Get analytics summary for a brand
 */
export async function getAnalyticsSummary(brandId: string) {
  try {
    const [positionHistory, trends, latestCheck] = await Promise.all([
      getPositionHistory(brandId, 7),
      getTrendData(brandId, 30),
      prisma.brandVisibilityCheck.findFirst({
        where: { brandId },
        orderBy: { checkedAt: 'desc' },
      }),
    ]);

    // Calculate changes
    const recentTrends = trends.slice(-7);
    const olderTrends = trends.slice(-14, -7);

    const currentAvgScore = recentTrends.length > 0
      ? recentTrends.reduce((a, b) => a + b.aeoScore, 0) / recentTrends.length
      : 0;
    const previousAvgScore = olderTrends.length > 0
      ? olderTrends.reduce((a, b) => a + b.aeoScore, 0) / olderTrends.length
      : 0;

    const scoreChange = previousAvgScore > 0
      ? ((currentAvgScore - previousAvgScore) / previousAvgScore) * 100
      : 0;

    return {
      currentScore: latestCheck?.aeoScore || 0,
      scoreChange: Math.round(scoreChange),
      totalChecks: trends.length,
      positionHistory,
      trends,
      lastCheckedAt: latestCheck?.checkedAt || null,
    };
  } catch (error) {
    logger.error({ error, brandId }, 'Failed to get analytics summary');
    return {
      currentScore: 0,
      scoreChange: 0,
      totalChecks: 0,
      positionHistory: [],
      trends: [],
      lastCheckedAt: null,
    };
  }
}
