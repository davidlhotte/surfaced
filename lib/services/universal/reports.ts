/**
 * Report Generation Service
 * Weekly emails, PDF export, and report scheduling
 */

import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/monitoring/logger';
import { getAnalyticsSummary, getTrendData, compareWithCompetitors } from './analytics';

export interface ReportData {
  brandName: string;
  domain?: string;
  generatedAt: string;
  period: {
    start: string;
    end: string;
  };
  summary: {
    currentScore: number;
    previousScore: number;
    scoreChange: number;
    totalChecks: number;
  };
  platforms: {
    name: string;
    mentionRate: number;
    avgPosition: number | null;
    sentiment: {
      positive: number;
      neutral: number;
      negative: number;
    };
  }[];
  trends: {
    date: string;
    score: number;
    mentionRate: number;
  }[];
  competitors?: {
    name: string;
    score: number;
    difference: number;
  }[];
  recommendations: string[];
  highlights: string[];
}

/**
 * Generate a report for a brand
 */
export async function generateReport(
  brandId: string,
  options: {
    includeCompetitors?: boolean;
    period?: number; // days
  } = {}
): Promise<ReportData | null> {
  try {
    const { includeCompetitors = false, period = 7 } = options;

    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      include: {
        competitors: true,
        user: true,
      },
    });

    if (!brand) {
      return null;
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    // Get analytics
    const [summary, trends] = await Promise.all([
      getAnalyticsSummary(brandId),
      getTrendData(brandId, period),
    ]);

    // Get previous period for comparison
    const previousTrends = await getTrendData(brandId, period * 2);
    const olderTrends = previousTrends.slice(0, period);
    const previousScore = olderTrends.length > 0
      ? Math.round(olderTrends.reduce((a, b) => a + b.aeoScore, 0) / olderTrends.length)
      : 0;

    // Get platform breakdown from latest checks
    const recentChecks = await prisma.brandVisibilityCheck.findMany({
      where: {
        brandId,
        checkedAt: { gte: startDate },
      },
      orderBy: { checkedAt: 'desc' },
      take: 10,
    });

    const platformStats = new Map<string, {
      mentions: number;
      total: number;
      positions: number[];
      sentiment: { positive: number; neutral: number; negative: number };
    }>();

    // Helper to parse platform result
    const parsePlatformResult = (data: unknown): {
      mentioned: boolean;
      position: number | null;
      sentiment: 'positive' | 'neutral' | 'negative';
    } => {
      if (!data) return { mentioned: false, position: null, sentiment: 'neutral' };
      const result = data as { mentioned?: boolean; position?: number; sentiment?: string };
      return {
        mentioned: result.mentioned || false,
        position: result.position || null,
        sentiment: (result.sentiment as 'positive' | 'neutral' | 'negative') || 'neutral',
      };
    };

    for (const check of recentChecks) {
      const platformResults = [
        { key: 'chatgpt', data: check.chatgptResult },
        { key: 'claude', data: check.claudeResult },
        { key: 'perplexity', data: check.perplexityResult },
        { key: 'gemini', data: check.geminiResult },
      ];

      for (const { key, data } of platformResults) {
        if (!platformStats.has(key)) {
          platformStats.set(key, {
            mentions: 0,
            total: 0,
            positions: [],
            sentiment: { positive: 0, neutral: 0, negative: 0 },
          });
        }

        const stats = platformStats.get(key)!;
        stats.total++;
        const result = parsePlatformResult(data);
        if (result.mentioned) {
          stats.mentions++;
          if (result.position) {
            stats.positions.push(result.position);
          }
          stats.sentiment[result.sentiment]++;
        }
      }
    }

    const platforms = Array.from(platformStats.entries()).map(([name, stats]) => ({
      name,
      mentionRate: stats.total > 0 ? Math.round((stats.mentions / stats.total) * 100) : 0,
      avgPosition: stats.positions.length > 0
        ? Math.round(stats.positions.reduce((a, b) => a + b, 0) / stats.positions.length * 10) / 10
        : null,
      sentiment: stats.sentiment,
    }));

    // Get competitor comparison if requested
    let competitors: ReportData['competitors'];
    if (includeCompetitors && brand.competitors.length > 0) {
      const competitorIds = brand.competitors.map((c) => c.id);
      const comparisons = await compareWithCompetitors(brandId, competitorIds);

      competitors = comparisons
        .filter((c) => c.brand !== brand.name)
        .map((c) => ({
          name: c.brand,
          score: c.aeoScore,
          difference: summary.currentScore - c.aeoScore,
        }));
    }

    // Generate recommendations
    const recommendations = generateRecommendations(summary.currentScore, platforms);

    // Generate highlights
    const highlights = generateHighlights(summary, platforms, previousScore);

    return {
      brandName: brand.name,
      domain: brand.domain || undefined,
      generatedAt: new Date().toISOString(),
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      summary: {
        currentScore: summary.currentScore,
        previousScore,
        scoreChange: summary.scoreChange,
        totalChecks: summary.totalChecks,
      },
      platforms,
      trends: trends.map((t) => ({
        date: t.date,
        score: t.aeoScore,
        mentionRate: Math.round(t.mentionRate),
      })),
      competitors,
      recommendations,
      highlights,
    };
  } catch (error) {
    logger.error({ error, brandId }, 'Failed to generate report');
    return null;
  }
}

function generateRecommendations(
  score: number,
  platforms: ReportData['platforms']
): string[] {
  const recommendations: string[] = [];

  if (score < 50) {
    recommendations.push('Your AEO score is below average. Focus on creating more AI-friendly content.');
  }

  const lowMentionPlatforms = platforms.filter((p) => p.mentionRate < 50);
  if (lowMentionPlatforms.length > 0) {
    recommendations.push(
      `Improve visibility on ${lowMentionPlatforms.map((p) => p.name).join(', ')} with more authoritative content.`
    );
  }

  const lowPositionPlatforms = platforms.filter((p) => p.avgPosition && p.avgPosition > 3);
  if (lowPositionPlatforms.length > 0) {
    recommendations.push(
      'Improve ranking position by adding structured data and FAQ content.'
    );
  }

  const negativeSentiment = platforms.filter(
    (p) => p.sentiment.negative > p.sentiment.positive
  );
  if (negativeSentiment.length > 0) {
    recommendations.push('Address negative sentiment by improving customer reviews and brand perception.');
  }

  if (recommendations.length === 0) {
    recommendations.push('Keep up the good work! Continue monitoring and creating quality content.');
  }

  return recommendations;
}

function generateHighlights(
  summary: { currentScore: number; scoreChange: number },
  platforms: ReportData['platforms'],
  previousScore: number
): string[] {
  const highlights: string[] = [];

  if (summary.scoreChange > 10) {
    highlights.push(`AEO Score improved by ${summary.scoreChange}% this period`);
  } else if (summary.scoreChange < -10) {
    highlights.push(`AEO Score decreased by ${Math.abs(summary.scoreChange)}% - action needed`);
  }

  const bestPlatform = platforms.reduce(
    (best, p) => (p.mentionRate > best.mentionRate ? p : best),
    platforms[0]
  );

  if (bestPlatform && bestPlatform.mentionRate > 70) {
    highlights.push(`Strong visibility on ${bestPlatform.name} (${bestPlatform.mentionRate}% mention rate)`);
  }

  const topPosition = platforms.find((p) => p.avgPosition && p.avgPosition <= 2);
  if (topPosition) {
    highlights.push(`Top position on ${topPosition.name} (avg position: ${topPosition.avgPosition})`);
  }

  if (summary.currentScore >= 80) {
    highlights.push('Excellent AEO score - your brand is well-optimized for AI');
  }

  return highlights;
}

/**
 * Generate HTML email content for weekly report
 */
export function generateEmailHtml(report: ReportData): string {
  const scoreColor = report.summary.currentScore >= 70 ? '#22c55e' :
    report.summary.currentScore >= 40 ? '#f59e0b' : '#ef4444';

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #334155; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #e2e8f0; }
    .score-box { background: ${scoreColor}; color: white; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
    .score { font-size: 48px; font-weight: bold; }
    .platform { background: #f1f5f9; border-radius: 8px; padding: 15px; margin: 10px 0; }
    .recommendation { border-left: 3px solid #0ea5e9; padding-left: 15px; margin: 10px 0; }
    .footer { text-align: center; padding: 20px 0; color: #64748b; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Weekly AEO Report</h1>
      <p>${report.brandName}</p>
    </div>

    <div class="score-box">
      <div class="score">${report.summary.currentScore}</div>
      <p>AEO Score ${report.summary.scoreChange >= 0 ? '+' : ''}${report.summary.scoreChange}%</p>
    </div>

    <h2>Platform Visibility</h2>
    ${report.platforms.map(p => `
      <div class="platform">
        <strong>${p.name}</strong>
        <p>Mention Rate: ${p.mentionRate}% | Avg Position: ${p.avgPosition || 'N/A'}</p>
      </div>
    `).join('')}

    ${report.highlights.length > 0 ? `
      <h2>Highlights</h2>
      <ul>
        ${report.highlights.map(h => `<li>${h}</li>`).join('')}
      </ul>
    ` : ''}

    <h2>Recommendations</h2>
    ${report.recommendations.map(r => `
      <div class="recommendation">${r}</div>
    `).join('')}

    <div class="footer">
      <p>Surfaced - AI Visibility Platform</p>
      <p>View full report at surfaced.vercel.app</p>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Schedule weekly reports for a brand
 */
export async function scheduleWeeklyReport(
  brandId: string,
  email: string,
  dayOfWeek: number = 1 // Monday
): Promise<boolean> {
  try {
    await prisma.brand.update({
      where: { id: brandId },
      data: {
        reportSchedule: {
          enabled: true,
          email,
          dayOfWeek,
          lastSent: null,
        },
      },
    });

    return true;
  } catch (error) {
    logger.error({ error, brandId }, 'Failed to schedule weekly report');
    return false;
  }
}
