import OpenAI from 'openai';
import { prisma } from '@/lib/db/prisma';
import { PLAN_LIMITS } from '@/lib/constants/plans';
import { logger } from '@/lib/monitoring/logger';
import type { Plan } from '@prisma/client';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type CompetitorVisibility = {
  domain: string;
  name: string | null;
  isMentioned: boolean;
  mentionContext: string | null;
  position: number | null;
};

export type CompetitorComparisonResult = {
  query: string;
  yourBrand: {
    isMentioned: boolean;
    position: number | null;
    context: string | null;
  };
  competitors: CompetitorVisibility[];
  winner: string | null;
  gap: string;
};

export type CompetitorAnalysis = {
  shopDomain: string;
  brandName: string;
  competitors: {
    domain: string;
    name: string | null;
    mentionRate: number;
    averagePosition: number | null;
  }[];
  comparisons: CompetitorComparisonResult[];
  insights: {
    type: 'danger' | 'warning' | 'opportunity';
    title: string;
    description: string;
  }[];
  summary: {
    yourMentionRate: number;
    bestCompetitorMentionRate: number;
    gapPercentage: number;
  };
};

function extractPosition(response: string, brandName: string): number | null {
  const lowerResponse = response.toLowerCase();
  const lowerBrand = brandName.toLowerCase();

  const mentionIndex = lowerResponse.indexOf(lowerBrand);
  if (mentionIndex === -1) return null;

  const beforeMention = response.substring(0, mentionIndex);
  const listMatches = beforeMention.match(/\d+\./g);
  return listMatches ? listMatches.length : 1;
}

function extractContext(response: string, brandName: string): string | null {
  const lowerResponse = response.toLowerCase();
  const lowerBrand = brandName.toLowerCase();

  const mentionIndex = lowerResponse.indexOf(lowerBrand);
  if (mentionIndex === -1) return null;

  const start = Math.max(0, mentionIndex - 50);
  const end = Math.min(response.length, mentionIndex + 150);
  return response.substring(start, end).trim();
}

async function runComparisonQuery(
  query: string,
  brandName: string,
  shopDomain: string,
  competitors: { domain: string; name: string | null }[]
): Promise<CompetitorComparisonResult> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a shopping assistant helping users find the best products and brands. Provide detailed, ranked recommendations with specific brand names. Always try to mention at least 5-10 specific brands or stores when relevant.',
        },
        {
          role: 'user',
          content: query,
        },
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || '';
    const lowerResponse = response.toLowerCase();
    const domainBase = shopDomain.replace('.myshopify.com', '').toLowerCase();

    // Check your brand
    const yourBrandMentioned =
      lowerResponse.includes(brandName.toLowerCase()) ||
      lowerResponse.includes(domainBase);

    const yourBrand = {
      isMentioned: yourBrandMentioned,
      position: yourBrandMentioned
        ? extractPosition(response, brandName) ||
          extractPosition(response, domainBase)
        : null,
      context: yourBrandMentioned
        ? extractContext(response, brandName) ||
          extractContext(response, domainBase)
        : null,
    };

    // Check competitors
    const competitorResults: CompetitorVisibility[] = competitors.map((comp) => {
      const compName = comp.name || comp.domain.replace('.com', '').replace('.myshopify.com', '');
      const isMentioned =
        lowerResponse.includes(compName.toLowerCase()) ||
        lowerResponse.includes(comp.domain.toLowerCase());

      return {
        domain: comp.domain,
        name: comp.name,
        isMentioned,
        mentionContext: isMentioned ? extractContext(response, compName) : null,
        position: isMentioned ? extractPosition(response, compName) : null,
      };
    });

    // Determine winner
    let winner: string | null = null;
    let bestPosition = Infinity;

    if (yourBrand.isMentioned && yourBrand.position && yourBrand.position < bestPosition) {
      bestPosition = yourBrand.position;
      winner = brandName;
    }

    for (const comp of competitorResults) {
      if (comp.isMentioned && comp.position && comp.position < bestPosition) {
        bestPosition = comp.position;
        winner = comp.name || comp.domain;
      }
    }

    // Generate gap analysis
    let gap = '';
    if (!yourBrand.isMentioned && competitorResults.some((c) => c.isMentioned)) {
      const mentionedComps = competitorResults
        .filter((c) => c.isMentioned)
        .map((c) => c.name || c.domain);
      gap = `Your brand is not mentioned but ${mentionedComps.join(', ')} ${mentionedComps.length === 1 ? 'is' : 'are'}.`;
    } else if (yourBrand.isMentioned && yourBrand.position && yourBrand.position > 3) {
      gap = `Your brand is mentioned but ranked #${yourBrand.position}. Improve your content to rank higher.`;
    } else if (yourBrand.isMentioned && yourBrand.position && yourBrand.position <= 3) {
      gap = `Great! Your brand is in the top 3 recommendations.`;
    } else if (!yourBrand.isMentioned && !competitorResults.some((c) => c.isMentioned)) {
      gap = 'Neither you nor your competitors are mentioned for this query.';
    } else {
      gap = 'Analysis complete.';
    }

    return {
      query,
      yourBrand,
      competitors: competitorResults,
      winner,
      gap,
    };
  } catch (error) {
    logger.error({ error, query }, 'Competitor comparison query failed');
    throw error;
  }
}

export async function runCompetitorAnalysis(
  shopDomain: string
): Promise<CompetitorAnalysis> {
  logger.info({ shopDomain }, 'Starting competitor analysis');

  // Get shop info and competitors
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: {
      id: true,
      plan: true,
      name: true,
      productsAudit: {
        select: { title: true },
        take: 5,
      },
      competitors: {
        where: { isActive: true },
      },
    },
  });

  if (!shop) {
    throw new Error('Shop not found');
  }

  // Check plan limits
  const planLimits = PLAN_LIMITS[shop.plan as Plan];
  if (shop.competitors.length === 0) {
    throw new Error('No competitors tracked. Add competitors first.');
  }

  const brandName =
    shop.name || shopDomain.replace('.myshopify.com', '').replace(/-/g, ' ');

  // Generate comparison queries based on products
  const productTitles = shop.productsAudit.map((p) => p.title);
  const queries = [
    `What are the best online stores for ${productTitles[0] || 'products'}?`,
    `Recommend top brands for ${productTitles[1] || 'shopping online'}`,
    `Where should I buy ${productTitles[2] || 'quality products'}?`,
  ].slice(0, Math.min(3, planLimits.visibilityChecksPerMonth));

  const competitors = shop.competitors.map((c) => ({
    domain: c.domain,
    name: c.name,
  }));

  // Run comparison queries
  const comparisons: CompetitorComparisonResult[] = [];
  for (const query of queries) {
    try {
      const result = await runComparisonQuery(query, brandName, shopDomain, competitors);
      comparisons.push(result);
      // Rate limiting delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
    } catch (error) {
      logger.error({ error, query }, 'Comparison query failed');
    }
  }

  // Calculate competitor statistics
  const competitorStats = competitors.map((comp) => {
    const mentions = comparisons.filter((c) =>
      c.competitors.find((cc) => cc.domain === comp.domain && cc.isMentioned)
    ).length;
    const positions = comparisons
      .flatMap((c) => c.competitors)
      .filter((cc) => cc.domain === comp.domain && cc.position)
      .map((cc) => cc.position as number);

    return {
      domain: comp.domain,
      name: comp.name,
      mentionRate: comparisons.length > 0 ? Math.round((mentions / comparisons.length) * 100) : 0,
      averagePosition:
        positions.length > 0
          ? Math.round(positions.reduce((a, b) => a + b, 0) / positions.length)
          : null,
    };
  });

  // Calculate your stats
  const yourMentions = comparisons.filter((c) => c.yourBrand.isMentioned).length;
  const yourMentionRate =
    comparisons.length > 0 ? Math.round((yourMentions / comparisons.length) * 100) : 0;
  const bestCompetitorRate = Math.max(...competitorStats.map((c) => c.mentionRate), 0);

  // Generate insights
  const insights: CompetitorAnalysis['insights'] = [];

  if (yourMentionRate === 0 && bestCompetitorRate > 0) {
    insights.push({
      type: 'danger',
      title: 'You are invisible to AI',
      description: `Your competitors are mentioned ${bestCompetitorRate}% of the time, but you are never mentioned. Urgent action needed.`,
    });
  }

  if (yourMentionRate > 0 && yourMentionRate < bestCompetitorRate) {
    const topCompetitor = competitorStats.find((c) => c.mentionRate === bestCompetitorRate);
    insights.push({
      type: 'warning',
      title: 'Competitors outperforming you',
      description: `${topCompetitor?.name || topCompetitor?.domain} has ${bestCompetitorRate}% mention rate vs your ${yourMentionRate}%.`,
    });
  }

  if (yourMentionRate >= bestCompetitorRate && yourMentionRate > 0) {
    insights.push({
      type: 'opportunity',
      title: 'You are leading!',
      description: `You have the best mention rate (${yourMentionRate}%) among tracked competitors.`,
    });
  }

  // Check for specific competitor insights
  for (const comp of competitorStats) {
    if (comp.mentionRate > yourMentionRate + 20) {
      insights.push({
        type: 'warning',
        title: `${comp.name || comp.domain} is beating you`,
        description: `They appear ${comp.mentionRate - yourMentionRate}% more often. Analyze their content strategy.`,
      });
    }
  }

  // Create audit log
  await prisma.auditLog.create({
    data: {
      shopId: shop.id,
      action: 'competitor_analysis',
      details: {
        competitorsAnalyzed: competitors.length,
        queriesRun: comparisons.length,
        yourMentionRate,
        bestCompetitorRate,
      },
    },
  });

  // Save historical analysis results for trend tracking
  // Save your brand's result
  const yourPositions = comparisons
    .filter((c) => c.yourBrand.position)
    .map((c) => c.yourBrand.position as number);

  await prisma.competitorAnalysisResult.create({
    data: {
      shopId: shop.id,
      brandMentionRate: yourMentionRate,
      queriesRun: comparisons.length,
      queriesMentioned: comparisons.filter((c) => c.yourBrand.isMentioned).length,
      avgPosition: yourPositions.length > 0
        ? yourPositions.reduce((a, b) => a + b, 0) / yourPositions.length
        : null,
      bestPosition: yourPositions.length > 0 ? Math.min(...yourPositions) : null,
      worstPosition: yourPositions.length > 0 ? Math.max(...yourPositions) : null,
    },
  });

  // Save each competitor's results
  for (const compStat of competitorStats) {
    const dbCompetitor = shop.competitors.find((c) => c.domain === compStat.domain);

    await prisma.competitorAnalysisResult.create({
      data: {
        shopId: shop.id,
        competitorId: dbCompetitor?.id,
        brandMentionRate: yourMentionRate,
        competitorMentionRate: compStat.mentionRate,
        competitorDomain: compStat.domain,
        competitorName: compStat.name,
        queriesRun: comparisons.length,
        queriesMentioned: comparisons.filter((c) =>
          c.competitors.some((cc) => cc.domain === compStat.domain && cc.isMentioned)
        ).length,
        avgPosition: compStat.averagePosition,
      },
    });
  }

  logger.info(
    { shopDomain, yourMentionRate, bestCompetitorRate },
    'Competitor analysis completed'
  );

  return {
    shopDomain,
    brandName,
    competitors: competitorStats,
    comparisons,
    insights,
    summary: {
      yourMentionRate,
      bestCompetitorMentionRate: bestCompetitorRate,
      gapPercentage: Math.max(0, bestCompetitorRate - yourMentionRate),
    },
  };
}

export async function addCompetitor(
  shopDomain: string,
  competitorDomain: string,
  competitorName?: string
): Promise<void> {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: {
      id: true,
      plan: true,
      competitors: { select: { id: true } },
    },
  });

  if (!shop) {
    throw new Error('Shop not found');
  }

  const planLimits = PLAN_LIMITS[shop.plan as Plan];
  if (shop.competitors.length >= planLimits.competitorsTracked) {
    throw new Error(
      `Competitor limit reached (${planLimits.competitorsTracked}). Upgrade your plan to track more competitors.`
    );
  }

  // Normalize domain
  const normalizedDomain = competitorDomain
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');

  await prisma.competitor.upsert({
    where: {
      shopId_domain: {
        shopId: shop.id,
        domain: normalizedDomain,
      },
    },
    update: {
      name: competitorName,
      isActive: true,
    },
    create: {
      shopId: shop.id,
      domain: normalizedDomain,
      name: competitorName,
      isActive: true,
    },
  });

  logger.info({ shopDomain, competitorDomain: normalizedDomain }, 'Competitor added');
}

export async function removeCompetitor(
  shopDomain: string,
  competitorId: string
): Promise<void> {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: { id: true },
  });

  if (!shop) {
    throw new Error('Shop not found');
  }

  await prisma.competitor.delete({
    where: {
      id: competitorId,
      shopId: shop.id,
    },
  });

  logger.info({ shopDomain, competitorId }, 'Competitor removed');
}

export async function getCompetitors(shopDomain: string) {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: {
      id: true,
      plan: true,
      competitors: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!shop) {
    throw new Error('Shop not found');
  }

  const planLimits = PLAN_LIMITS[shop.plan as Plan];

  return {
    competitors: shop.competitors.map((c) => ({
      id: c.id,
      domain: c.domain,
      name: c.name,
      isActive: c.isActive,
      createdAt: c.createdAt.toISOString(),
    })),
    limit: planLimits.competitorsTracked,
    remaining: Math.max(0, planLimits.competitorsTracked - shop.competitors.length),
  };
}

export type CompetitorTrendData = {
  dates: string[];
  yourBrand: {
    mentionRates: number[];
    avgPositions: (number | null)[];
  };
  competitors: {
    domain: string;
    name: string | null;
    mentionRates: number[];
    avgPositions: (number | null)[];
  }[];
};

/**
 * Get historical trend data for competitor analysis
 */
export async function getCompetitorTrends(
  shopDomain: string,
  days: number = 30
): Promise<CompetitorTrendData> {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: { id: true },
  });

  if (!shop) {
    throw new Error('Shop not found');
  }

  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Get all analysis results for the time period
  const results = await prisma.competitorAnalysisResult.findMany({
    where: {
      shopId: shop.id,
      analyzedAt: { gte: startDate },
    },
    orderBy: { analyzedAt: 'asc' },
    select: {
      brandMentionRate: true,
      competitorMentionRate: true,
      competitorDomain: true,
      competitorName: true,
      avgPosition: true,
      analyzedAt: true,
    },
  });

  // Group by date
  const dateGroups: Record<string, typeof results> = {};
  for (const result of results) {
    const dateKey = result.analyzedAt.toISOString().split('T')[0];
    if (!dateGroups[dateKey]) {
      dateGroups[dateKey] = [];
    }
    dateGroups[dateKey].push(result);
  }

  const dates = Object.keys(dateGroups).sort();
  const yourBrand: CompetitorTrendData['yourBrand'] = {
    mentionRates: [],
    avgPositions: [],
  };

  const competitorData: Record<string, {
    domain: string;
    name: string | null;
    mentionRates: number[];
    avgPositions: (number | null)[];
  }> = {};

  for (const date of dates) {
    const dayResults = dateGroups[date];

    // Get your brand's data (entries without competitorId)
    const brandResult = dayResults.find((r) => !r.competitorDomain);
    if (brandResult) {
      yourBrand.mentionRates.push(brandResult.brandMentionRate);
      yourBrand.avgPositions.push(brandResult.avgPosition);
    } else if (yourBrand.mentionRates.length > 0) {
      // Use previous value if no data for this day
      yourBrand.mentionRates.push(yourBrand.mentionRates[yourBrand.mentionRates.length - 1]);
      yourBrand.avgPositions.push(yourBrand.avgPositions[yourBrand.avgPositions.length - 1]);
    }

    // Get competitor data
    const competitorResults = dayResults.filter((r) => r.competitorDomain);
    for (const compResult of competitorResults) {
      const key = compResult.competitorDomain!;
      if (!competitorData[key]) {
        competitorData[key] = {
          domain: key,
          name: compResult.competitorName,
          mentionRates: [],
          avgPositions: [],
        };
      }
      competitorData[key].mentionRates.push(compResult.competitorMentionRate ?? 0);
      competitorData[key].avgPositions.push(compResult.avgPosition);
    }
  }

  return {
    dates,
    yourBrand,
    competitors: Object.values(competitorData),
  };
}

/**
 * Get the last analysis result for a shop
 */
export async function getLastAnalysisResult(shopDomain: string) {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: { id: true },
  });

  if (!shop) {
    return null;
  }

  const lastResult = await prisma.competitorAnalysisResult.findFirst({
    where: {
      shopId: shop.id,
      competitorDomain: null, // Get the brand's own result
    },
    orderBy: { analyzedAt: 'desc' },
  });

  if (!lastResult) {
    return null;
  }

  // Get competitor results from the same analysis
  const competitorResults = await prisma.competitorAnalysisResult.findMany({
    where: {
      shopId: shop.id,
      analyzedAt: lastResult.analyzedAt,
      competitorDomain: { not: null },
    },
  });

  return {
    analyzedAt: lastResult.analyzedAt.toISOString(),
    yourMentionRate: lastResult.brandMentionRate,
    queriesRun: lastResult.queriesRun,
    avgPosition: lastResult.avgPosition,
    competitors: competitorResults.map((c) => ({
      domain: c.competitorDomain,
      name: c.competitorName,
      mentionRate: c.competitorMentionRate,
      avgPosition: c.avgPosition,
    })),
  };
}
