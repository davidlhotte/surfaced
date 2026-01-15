import OpenAI from 'openai';
import { prisma } from '@/lib/db/prisma';
import { PLAN_LIMITS } from '@/lib/constants/plans';
import { logger } from '@/lib/monitoring/logger';
import type { Plan, Platform, ResponseQuality } from '@prisma/client';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type VisibilityResult = {
  platform: Platform;
  query: string;
  isMentioned: boolean;
  mentionContext: string | null;
  position: number | null;
  competitorsFound: { name: string; url?: string }[];
  responseQuality: ResponseQuality;
  rawResponse: string;
};

export type VisibilityCheckResult = {
  shopDomain: string;
  brandName: string;
  results: VisibilityResult[];
  summary: {
    totalChecks: number;
    mentioned: number;
    notMentioned: number;
    competitorsFound: string[];
  };
};

function buildSearchQuery(brandName: string, productType?: string): string[] {
  const queries: string[] = [];

  // Generic product discovery queries
  if (productType) {
    queries.push(`What are the best ${productType} brands?`);
    queries.push(`Recommend some good ${productType} online stores`);
    queries.push(`Where can I buy quality ${productType}?`);
  }

  // Brand-specific queries
  queries.push(`What do you know about ${brandName}?`);
  queries.push(`Is ${brandName} a good brand? What do they sell?`);
  queries.push(`Tell me about ${brandName} products`);

  return queries;
}

function analyzeResponse(
  response: string,
  brandName: string,
  shopDomain: string
): {
  isMentioned: boolean;
  mentionContext: string | null;
  position: number | null;
  competitorsFound: { name: string; url?: string }[];
  responseQuality: ResponseQuality;
} {
  const lowerResponse = response.toLowerCase();
  const lowerBrand = brandName.toLowerCase();
  const domainBase = shopDomain.replace('.myshopify.com', '').toLowerCase();

  // Check for brand mentions
  const isMentioned =
    lowerResponse.includes(lowerBrand) ||
    lowerResponse.includes(domainBase) ||
    lowerResponse.includes(shopDomain.toLowerCase());

  let mentionContext: string | null = null;
  let position: number | null = null;
  let responseQuality: ResponseQuality = 'none';

  if (isMentioned) {
    // Extract context around the mention
    const mentionIndex = Math.max(
      lowerResponse.indexOf(lowerBrand),
      lowerResponse.indexOf(domainBase),
      lowerResponse.indexOf(shopDomain.toLowerCase())
    );

    if (mentionIndex !== -1) {
      const start = Math.max(0, mentionIndex - 100);
      const end = Math.min(response.length, mentionIndex + 200);
      mentionContext = response.substring(start, end).trim();

      // Try to determine position if in a list
      const beforeMention = response.substring(0, mentionIndex);
      const listMatches = beforeMention.match(/\d+\./g);
      if (listMatches) {
        position = listMatches.length;
      }
    }

    // Determine quality of mention
    if (
      lowerResponse.includes('recommend') ||
      lowerResponse.includes('great option') ||
      lowerResponse.includes('excellent') ||
      lowerResponse.includes('top choice')
    ) {
      responseQuality = 'good';
    } else {
      responseQuality = 'partial';
    }
  }

  // Extract competitor mentions (common e-commerce brands)
  const commonCompetitors = [
    'amazon',
    'ebay',
    'walmart',
    'target',
    'etsy',
    'alibaba',
    'aliexpress',
    'shopify',
    'wayfair',
    'overstock',
    'zappos',
    'asos',
    'nordstrom',
    'macys',
    'best buy',
    'nike',
    'adidas',
    'zara',
  ];

  const competitorsFound: { name: string; url?: string }[] = [];
  for (const competitor of commonCompetitors) {
    if (
      lowerResponse.includes(competitor) &&
      competitor !== lowerBrand &&
      competitor !== domainBase
    ) {
      competitorsFound.push({ name: competitor });
    }
  }

  return {
    isMentioned,
    mentionContext,
    position,
    competitorsFound,
    responseQuality,
  };
}

async function checkChatGPT(
  query: string,
  brandName: string,
  shopDomain: string
): Promise<VisibilityResult> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful shopping assistant. Provide detailed, honest recommendations based on your knowledge. Include specific brand names and stores when relevant.',
        },
        {
          role: 'user',
          content: query,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const rawResponse = completion.choices[0]?.message?.content || '';

    const analysis = analyzeResponse(rawResponse, brandName, shopDomain);

    return {
      platform: 'chatgpt',
      query,
      rawResponse,
      ...analysis,
    };
  } catch (error) {
    logger.error({ error, query }, 'ChatGPT visibility check failed');
    throw error;
  }
}

export async function runVisibilityCheck(
  shopDomain: string,
  queries?: string[]
): Promise<VisibilityCheckResult> {
  logger.info({ shopDomain }, 'Starting visibility check');

  // Get shop info
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: {
      id: true,
      plan: true,
      name: true,
      productsAudit: {
        select: { title: true },
        take: 1,
      },
    },
  });

  if (!shop) {
    throw new Error('Shop not found');
  }

  // Check plan limits
  const planLimits = PLAN_LIMITS[shop.plan as Plan];
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const currentMonthChecks = await prisma.visibilityCheck.count({
    where: {
      shopId: shop.id,
      checkedAt: { gte: startOfMonth },
    },
  });

  if (currentMonthChecks >= planLimits.visibilityChecksPerMonth) {
    throw new Error(
      `Visibility check limit reached (${planLimits.visibilityChecksPerMonth}/month). Upgrade your plan for more checks.`
    );
  }

  // Determine brand name (use shop name or domain)
  const brandName =
    shop.name || shopDomain.replace('.myshopify.com', '').replace(/-/g, ' ');

  // Determine product type from audit data
  const productTitle = shop.productsAudit[0]?.title;
  const productType = productTitle
    ? productTitle.split(' ').slice(-1)[0]
    : undefined;

  // Generate queries if not provided
  const searchQueries = queries || buildSearchQuery(brandName, productType);

  // Run visibility checks (limit based on plan)
  const remainingChecks = planLimits.visibilityChecksPerMonth - currentMonthChecks;
  const queriesToRun = searchQueries.slice(0, Math.min(remainingChecks, 3));

  const results: VisibilityResult[] = [];

  for (const query of queriesToRun) {
    try {
      const result = await checkChatGPT(query, brandName, shopDomain);
      results.push(result);

      // Save to database
      await prisma.visibilityCheck.create({
        data: {
          shopId: shop.id,
          platform: result.platform,
          query: result.query,
          isMentioned: result.isMentioned,
          mentionContext: result.mentionContext,
          position: result.position,
          competitorsFound: result.competitorsFound,
          rawResponse: result.rawResponse,
          responseQuality: result.responseQuality,
          checkedAt: new Date(),
        },
      });

      // Small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      logger.error({ error, query }, 'Visibility check query failed');
    }
  }

  // Create audit log
  await prisma.auditLog.create({
    data: {
      shopId: shop.id,
      action: 'visibility_check',
      details: {
        queriesRun: queriesToRun.length,
        mentioned: results.filter((r) => r.isMentioned).length,
      },
    },
  });

  // Build summary
  const allCompetitors = results.flatMap((r) =>
    r.competitorsFound.map((c) => c.name)
  );
  const uniqueCompetitors = [...new Set(allCompetitors)];

  const summary = {
    totalChecks: results.length,
    mentioned: results.filter((r) => r.isMentioned).length,
    notMentioned: results.filter((r) => !r.isMentioned).length,
    competitorsFound: uniqueCompetitors,
  };

  logger.info({ shopDomain, summary }, 'Visibility check completed');

  return {
    shopDomain,
    brandName,
    results,
    summary,
  };
}

export async function getVisibilityHistory(shopDomain: string) {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: { id: true },
  });

  if (!shop) {
    throw new Error('Shop not found');
  }

  const checks = await prisma.visibilityCheck.findMany({
    where: { shopId: shop.id },
    orderBy: { checkedAt: 'desc' },
    take: 50,
  });

  return checks.map((c) => ({
    id: c.id,
    platform: c.platform,
    query: c.query,
    isMentioned: c.isMentioned,
    mentionContext: c.mentionContext,
    position: c.position,
    competitorsFound: c.competitorsFound,
    responseQuality: c.responseQuality,
    checkedAt: c.checkedAt.toISOString(),
  }));
}
