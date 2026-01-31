import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { prisma } from '@/lib/db/prisma';
import { PLAN_LIMITS } from '@/lib/constants/plans';
import { logger } from '@/lib/monitoring/logger';
import type { Plan, Platform, ResponseQuality } from '@prisma/client';

// OpenRouter client (unified gateway for all AI providers)
const openrouter = process.env.OPENROUTER_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://surfaced.vercel.app',
        'X-Title': 'Surfaced',
      },
    })
  : null;

// OpenRouter model mapping for each platform
// Paid models provide premium quality, free models offer cost-effective alternatives
const OPENROUTER_MODELS: Record<Platform, { model: string; free: boolean; displayName: string }> = {
  // Core Platforms (Paid)
  chatgpt: { model: 'openai/gpt-4o-mini', free: false, displayName: 'ChatGPT' },
  perplexity: { model: 'perplexity/sonar', free: false, displayName: 'Perplexity' }, // Has web search
  gemini: { model: 'google/gemini-2.0-flash-001', free: false, displayName: 'Gemini' },
  claude: { model: 'anthropic/claude-3.5-haiku', free: false, displayName: 'Claude' },

  // Extended Platforms (PRO+)
  google_ai: { model: 'google/gemini-2.0-flash-001', free: false, displayName: 'Google AI Overviews' },
  copilot: { model: 'google/gemma-3-27b-it:free', free: true, displayName: 'Copilot' }, // Free alternative

  // Premium Platforms (BUSINESS+)
  deepseek: { model: 'tngtech/deepseek-r1t2-chimera:free', free: true, displayName: 'DeepSeek' },
  grok: { model: 'x-ai/grok-3-mini-beta', free: false, displayName: 'Grok' },
  meta_ai: { model: 'meta-llama/llama-3.3-70b-instruct:free', free: true, displayName: 'Meta AI' },

  // Legacy (kept for compatibility)
  llama: { model: 'meta-llama/llama-3.3-70b-instruct:free', free: true, displayName: 'Llama 3.3' },
  mistral: { model: 'mistralai/devstral-2512:free', free: true, displayName: 'Mistral' },
  qwen: { model: 'google/gemma-3-12b-it:free', free: true, displayName: 'Gemma 12B' },
};

// Fallback: Direct API clients (used if OpenRouter not configured)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Perplexity client (OpenAI-compatible API)
const perplexity = new OpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY || '',
  baseURL: 'https://api.perplexity.ai',
});

// Gemini client
const gemini = process.env.GOOGLE_AI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY })
  : null;

// Get all available platforms
export function getAvailablePlatforms(): Platform[] {
  // If OpenRouter is configured, all platforms are available
  if (process.env.OPENROUTER_API_KEY) {
    return Object.keys(OPENROUTER_MODELS) as Platform[];
  }

  // Fallback to direct API keys (limited platforms)
  const platforms: Platform[] = [];

  if (process.env.OPENAI_API_KEY) {
    platforms.push('chatgpt');
  }
  if (process.env.PERPLEXITY_API_KEY) {
    platforms.push('perplexity');
  }
  if (process.env.GOOGLE_AI_API_KEY) {
    platforms.push('gemini');
  }

  return platforms;
}

// Get only free platforms
export function getFreePlatforms(): Platform[] {
  return (Object.entries(OPENROUTER_MODELS) as [Platform, { free: boolean }][])
    .filter(([, config]) => config.free)
    .map(([platform]) => platform);
}

// Get platform display info
export function getPlatformInfo(platform: Platform): { displayName: string; free: boolean } {
  const config = OPENROUTER_MODELS[platform];
  return { displayName: config.displayName, free: config.free };
}

// Get all platform infos
export function getAllPlatformInfos(): Record<Platform, { displayName: string; free: boolean }> {
  return Object.fromEntries(
    Object.entries(OPENROUTER_MODELS).map(([key, val]) => [
      key,
      { displayName: val.displayName, free: val.free },
    ])
  ) as Record<Platform, { displayName: string; free: boolean }>;
}

// Check if using OpenRouter
export function isUsingOpenRouter(): boolean {
  return !!process.env.OPENROUTER_API_KEY;
}

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
  searchTerm: string; // What we actually searched for in responses
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

  // Check for brand mentions (also check without spaces for compound names)
  const brandVariants = [
    lowerBrand,
    domainBase,
    shopDomain.toLowerCase(),
    lowerBrand.replace(/\s+/g, ''), // "Eco Soap" -> "ecosoap"
    lowerBrand.replace(/\s+/g, '-'), // "Eco Soap" -> "eco-soap"
  ];

  const isMentioned = brandVariants.some(variant =>
    variant.length > 2 && lowerResponse.includes(variant)
  );

  let mentionContext: string | null = null;
  let position: number | null = null;
  let responseQuality: ResponseQuality = 'none';

  if (isMentioned) {
    // Find where the brand is mentioned
    let mentionIndex = -1;
    for (const variant of brandVariants) {
      const idx = lowerResponse.indexOf(variant);
      if (idx !== -1 && (mentionIndex === -1 || idx < mentionIndex)) {
        mentionIndex = idx;
      }
    }

    if (mentionIndex !== -1) {
      // Extract context around the mention
      const start = Math.max(0, mentionIndex - 100);
      const end = Math.min(response.length, mentionIndex + 200);
      mentionContext = response.substring(start, end).trim();

      // Detect position in a list - improved algorithm
      // Split response into lines and find which "list item" contains the brand
      const lines = response.split('\n');
      let currentListPosition = 0;
      let foundPosition = false;

      for (const line of lines) {
        const trimmedLine = line.trim();

        // Check if this line is a list item (numbered or bulleted)
        const isNumberedItem = /^\d+[\.\)]\s/.test(trimmedLine); // "1. " or "1) "
        const isBulletItem = /^[-*•]\s/.test(trimmedLine); // "- " or "* " or "• "
        const isStarItem = /^\*\*\d+[\.\)]/.test(trimmedLine); // "**1." markdown bold number

        if (isNumberedItem || isBulletItem || isStarItem) {
          currentListPosition++;

          // Check if this list item contains the brand
          const lowerLine = trimmedLine.toLowerCase();
          if (brandVariants.some(v => v.length > 2 && lowerLine.includes(v))) {
            position = currentListPosition;
            foundPosition = true;
            break;
          }
        }
      }

      // If not found in line-by-line, try regex for inline numbered lists
      if (!foundPosition) {
        // Match patterns like "1) Brand" or "1. Brand" even inline
        const numberedPattern = /(\d+)[\.\)]\s*[^,\n]*?/gi;
        let match;
        let itemNum = 0;

        while ((match = numberedPattern.exec(response)) !== null) {
          itemNum++;
          const itemText = match[0].toLowerCase();
          if (brandVariants.some(v => v.length > 2 && itemText.includes(v))) {
            position = parseInt(match[1], 10);
            break;
          }
        }
      }
    }

    // Determine quality of mention - expanded keywords
    const positiveKeywords = [
      'recommend', 'recommande', 'great option', 'excellent', 'top choice',
      'highly rated', 'popular', 'best', 'meilleur', 'quality', 'qualité',
      'trusted', 'reliable', 'leading', 'favorite', 'préféré', 'top pick',
      'outstanding', 'exceptional', 'premium', 'renowned', 'well-known'
    ];

    if (positiveKeywords.some(kw => lowerResponse.includes(kw))) {
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

/**
 * Check visibility via OpenRouter (unified gateway)
 * Works for all platforms: ChatGPT, Perplexity, Gemini, Copilot
 */
async function checkViaOpenRouter(
  platform: Platform,
  query: string,
  brandName: string,
  shopDomain: string
): Promise<VisibilityResult> {
  if (!openrouter) {
    throw new Error('OpenRouter API key not configured');
  }

  const modelConfig = OPENROUTER_MODELS[platform];
  const model = modelConfig.model;

  try {
    logger.info({ platform, model, query }, 'Checking visibility via OpenRouter');

    const completion = await openrouter.chat.completions.create({
      model,
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

    logger.info({ platform, isMentioned: analysis.isMentioned }, 'OpenRouter check completed');

    return {
      platform,
      query,
      rawResponse,
      ...analysis,
    };
  } catch (error) {
    logger.error({ error, platform, model, query }, 'OpenRouter visibility check failed');
    throw error;
  }
}

async function checkChatGPT(
  query: string,
  brandName: string,
  shopDomain: string
): Promise<VisibilityResult> {
  // Use OpenRouter if available
  if (openrouter) {
    return checkViaOpenRouter('chatgpt', query, brandName, shopDomain);
  }

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

/**
 * Check visibility on Perplexity AI
 * Uses OpenAI-compatible API with sonar model
 */
async function checkPerplexity(
  query: string,
  brandName: string,
  shopDomain: string
): Promise<VisibilityResult> {
  // Use OpenRouter if available
  if (openrouter) {
    return checkViaOpenRouter('perplexity', query, brandName, shopDomain);
  }

  if (!process.env.PERPLEXITY_API_KEY) {
    throw new Error('Perplexity API key not configured');
  }

  try {
    const completion = await perplexity.chat.completions.create({
      model: 'sonar', // Perplexity's search model
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful shopping assistant with access to current web information. Provide detailed recommendations including specific brand names and stores.',
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
      platform: 'perplexity',
      query,
      rawResponse,
      ...analysis,
    };
  } catch (error) {
    logger.error({ error, query }, 'Perplexity visibility check failed');
    throw error;
  }
}

/**
 * Check visibility on Google Gemini
 */
async function checkGemini(
  query: string,
  brandName: string,
  shopDomain: string
): Promise<VisibilityResult> {
  // Use OpenRouter if available
  if (openrouter) {
    return checkViaOpenRouter('gemini', query, brandName, shopDomain);
  }

  if (!gemini) {
    throw new Error('Gemini API key not configured');
  }

  try {
    const response = await gemini.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: query,
      config: {
        systemInstruction:
          'You are a helpful shopping assistant. Provide detailed, honest recommendations based on your knowledge. Include specific brand names and stores when relevant.',
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });

    const rawResponse = response.text || '';

    const analysis = analyzeResponse(rawResponse, brandName, shopDomain);

    return {
      platform: 'gemini',
      query,
      rawResponse,
      ...analysis,
    };
  } catch (error) {
    logger.error({ error, query }, 'Gemini visibility check failed');
    throw error;
  }
}

/**
 * Check visibility on Microsoft Copilot (via OpenRouter)
 */
async function checkCopilot(
  query: string,
  brandName: string,
  shopDomain: string
): Promise<VisibilityResult> {
  // Copilot only available via OpenRouter
  if (openrouter) {
    return checkViaOpenRouter('copilot', query, brandName, shopDomain);
  }

  throw new Error('Copilot requires OpenRouter API key');
}

/**
 * Check visibility on a specific platform
 */
async function checkPlatform(
  platform: Platform,
  query: string,
  brandName: string,
  shopDomain: string
): Promise<VisibilityResult> {
  // All platforms can use OpenRouter if configured
  if (openrouter) {
    return checkViaOpenRouter(platform, query, brandName, shopDomain);
  }

  // Fallback to direct API for specific platforms
  switch (platform) {
    case 'chatgpt':
      return checkChatGPT(query, brandName, shopDomain);
    case 'perplexity':
      return checkPerplexity(query, brandName, shopDomain);
    case 'gemini':
      return checkGemini(query, brandName, shopDomain);
    case 'copilot':
    case 'claude':
    case 'llama':
    case 'deepseek':
    case 'mistral':
    case 'qwen':
      throw new Error(`Platform ${platform} requires OpenRouter API key`);
    default:
      throw new Error(`Unknown platform: ${platform}`);
  }
}

export async function runVisibilityCheck(
  shopDomain: string,
  queries?: string[],
  platforms?: Platform[],
  searchTerm?: string // Custom term to search for (brand, product, etc.)
): Promise<VisibilityCheckResult> {
  logger.info({ shopDomain, platforms, searchTerm }, 'Starting visibility check');

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

  // Determine what to search for in AI responses
  // Use provided searchTerm, or fall back to shop name/domain
  const brandName =
    shop.name || shopDomain.replace('.myshopify.com', '').replace(/-/g, ' ');
  const termToSearchFor = searchTerm || brandName;

  // Determine product type from audit data
  const productTitle = shop.productsAudit[0]?.title;
  const productType = productTitle
    ? productTitle.split(' ').slice(-1)[0]
    : undefined;

  // Generate queries if not provided
  const searchQueries = queries || buildSearchQuery(brandName, productType);

  // Determine which platforms to check - ALL platforms by default
  const availablePlatforms = getAvailablePlatforms();
  const platformsToCheck = platforms
    ? platforms.filter((p) => availablePlatforms.includes(p))
    : availablePlatforms; // Check ALL available platforms by default

  if (platformsToCheck.length === 0) {
    throw new Error('No AI platforms configured. Please add API keys in your environment.');
  }

  // Calculate remaining checks
  const remainingChecks = planLimits.visibilityChecksPerMonth - currentMonthChecks;

  // For visibility checks: 1 query across ALL platforms counts as 1 "session"
  // Each platform call is 1 check towards the limit
  const checksNeeded = platformsToCheck.length;

  if (remainingChecks < checksNeeded) {
    throw new Error(
      `Not enough checks remaining. Need ${checksNeeded} for all platforms, but only ${remainingChecks} left this month. Upgrade your plan for more checks.`
    );
  }

  // Use ONE query for all platforms (the first one provided or generated)
  const queryToRun = searchQueries[0];

  // Build check tasks: same query across all platforms
  const checkTasks: { platform: Platform; query: string }[] = platformsToCheck.map(platform => ({
    platform,
    query: queryToRun,
  }));

  // Run all checks in parallel (different AI providers, no rate limit issue)
  // Use termToSearchFor (custom term or brandName) to analyze responses
  const checkPromises = checkTasks.map(async ({ platform, query }) => {
    try {
      return await checkPlatform(platform, query, termToSearchFor, shopDomain);
    } catch (error) {
      logger.error({ error, query, platform }, 'Visibility check query failed');
      return null; // Return null for failed checks
    }
  });

  // Wait for all checks to complete in parallel
  const checkResults = await Promise.all(checkPromises);
  const results: VisibilityResult[] = checkResults.filter((r): r is VisibilityResult => r !== null);

  // Generate a session ID to group all checks from this run
  const sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date();

  // Batch save all results to database in a single transaction
  if (results.length > 0) {
    await prisma.visibilityCheck.createMany({
      data: results.map((result) => ({
        shopId: shop.id,
        platform: result.platform,
        query: result.query,
        isMentioned: result.isMentioned,
        mentionContext: result.mentionContext,
        position: result.position,
        competitorsFound: result.competitorsFound,
        rawResponse: result.rawResponse,
        responseQuality: result.responseQuality,
        checkedAt: now,
        sessionId, // Group checks by session
      })),
    });
  }

  // Create audit log
  await prisma.auditLog.create({
    data: {
      shopId: shop.id,
      action: 'visibility_check',
      details: {
        sessionId,
        query: queryToRun,
        platformsChecked: platformsToCheck,
        mentioned: results.filter((r) => r.isMentioned).length,
        total: results.length,
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

  logger.info({ shopDomain, summary, platformsToCheck }, 'Visibility check completed');

  return {
    shopDomain,
    brandName,
    searchTerm: termToSearchFor, // What we actually searched for
    results,
    summary,
  };
}

export type HistoryCheck = {
  id: string;
  platform: Platform;
  query: string;
  sessionId: string | null;
  isMentioned: boolean | null;
  mentionContext: string | null;
  position: number | null;
  competitorsFound: { name: string; url?: string }[];
  responseQuality: string | null;
  rawResponse: string | null;
  checkedAt: string;
};

export type HistorySession = {
  sessionId: string;
  query: string;
  checkedAt: string;
  checks: HistoryCheck[];
  summary: {
    total: number;
    mentioned: number;
    percentage: number;
  };
};

export async function getVisibilityHistory(shopDomain: string): Promise<{
  checks: HistoryCheck[];
  sessions: HistorySession[];
  brandName: string;
}> {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: { id: true, name: true },
  });

  if (!shop) {
    throw new Error('Shop not found');
  }

  const brandName = shop.name || shopDomain.replace('.myshopify.com', '').replace(/-/g, ' ');

  const checks = await prisma.visibilityCheck.findMany({
    where: { shopId: shop.id },
    orderBy: { checkedAt: 'desc' },
    take: 100, // Get more to group into sessions
  });

  const mappedChecks: HistoryCheck[] = checks.map((c) => ({
    id: c.id,
    platform: c.platform as Platform,
    query: c.query,
    sessionId: c.sessionId,
    isMentioned: c.isMentioned,
    mentionContext: c.mentionContext,
    position: c.position,
    competitorsFound: c.competitorsFound as { name: string; url?: string }[],
    responseQuality: c.responseQuality,
    rawResponse: c.rawResponse,
    checkedAt: c.checkedAt.toISOString(),
  }));

  // Group by sessionId (or by checkedAt timestamp for legacy data)
  const sessionMap = new Map<string, HistoryCheck[]>();

  for (const check of mappedChecks) {
    // Use sessionId if available, otherwise group by timestamp (within 1 minute)
    const key = check.sessionId || `legacy-${check.checkedAt.substring(0, 16)}`;

    if (!sessionMap.has(key)) {
      sessionMap.set(key, []);
    }
    sessionMap.get(key)!.push(check);
  }

  // Convert to session array
  const sessions: HistorySession[] = Array.from(sessionMap.entries())
    .map(([sessionId, sessionChecks]) => {
      const mentioned = sessionChecks.filter(c => c.isMentioned).length;
      const total = sessionChecks.length;

      return {
        sessionId,
        query: sessionChecks[0]?.query || '',
        checkedAt: sessionChecks[0]?.checkedAt || '',
        checks: sessionChecks,
        summary: {
          total,
          mentioned,
          percentage: total > 0 ? Math.round((mentioned / total) * 100) : 0,
        },
      };
    })
    .slice(0, 10); // Keep last 10 sessions

  return {
    checks: mappedChecks,
    sessions,
    brandName,
  };
}
