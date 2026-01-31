/**
 * Universal AI Visibility Checker v2
 * Enhanced with:
 * - 9 AI platforms (ChatGPT, Claude, Perplexity, Gemini, Google AI, Copilot, DeepSeek, Grok, Meta AI)
 * - Citation analysis (extract URLs from responses)
 * - Gap analysis (where competitors appear but not you)
 * - Buyer journey tagging (branded/non-branded/transactional)
 * - Multi-region support
 */

import OpenAI from 'openai';
import { logger } from '@/lib/monitoring/logger';

// OpenRouter client
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

// All supported AI platforms
export type AIPlatform =
  | 'chatgpt'
  | 'claude'
  | 'perplexity'
  | 'gemini'
  | 'google-ai'      // Google AI Overviews
  | 'copilot'        // Microsoft Copilot
  | 'deepseek'       // DeepSeek
  | 'grok'           // xAI Grok
  | 'meta-ai';       // Meta AI (Llama)

// Platform tiers for pricing
export type PlatformTier = 'core' | 'extended' | 'premium';

// OpenRouter model mapping with tiers
const MODELS: Record<AIPlatform, { model: string; displayName: string; tier: PlatformTier; icon: string }> = {
  // Core platforms (all plans)
  chatgpt: { model: 'openai/gpt-4o-mini', displayName: 'ChatGPT', tier: 'core', icon: '🤖' },
  claude: { model: 'anthropic/claude-3.5-haiku', displayName: 'Claude', tier: 'core', icon: '🟠' },
  perplexity: { model: 'perplexity/sonar', displayName: 'Perplexity', tier: 'core', icon: '🔮' },
  gemini: { model: 'google/gemini-2.0-flash-001', displayName: 'Gemini', tier: 'core', icon: '💎' },

  // Extended platforms (PRO+)
  'google-ai': { model: 'google/gemini-2.0-flash-001', displayName: 'Google AI Overviews', tier: 'extended', icon: '🔍' },
  copilot: { model: 'openai/gpt-4o-mini', displayName: 'Microsoft Copilot', tier: 'extended', icon: '🪟' },

  // Premium platforms (BUSINESS+)
  deepseek: { model: 'deepseek/deepseek-chat', displayName: 'DeepSeek', tier: 'premium', icon: '🌊' },
  grok: { model: 'x-ai/grok-2-1212', displayName: 'Grok', tier: 'premium', icon: '⚡' },
  'meta-ai': { model: 'meta-llama/llama-3.3-70b-instruct', displayName: 'Meta AI', tier: 'premium', icon: '🦙' },
};

// Regions for multi-region support
export type Region = 'us' | 'eu' | 'uk' | 'ca' | 'au' | 'fr' | 'de' | 'jp' | 'global';

const REGIONS: Record<Region, { name: string; language: string; context: string }> = {
  us: { name: 'United States', language: 'en-US', context: 'American market' },
  eu: { name: 'European Union', language: 'en-EU', context: 'European market' },
  uk: { name: 'United Kingdom', language: 'en-GB', context: 'British market' },
  ca: { name: 'Canada', language: 'en-CA', context: 'Canadian market' },
  au: { name: 'Australia', language: 'en-AU', context: 'Australian market' },
  fr: { name: 'France', language: 'fr-FR', context: 'marché français' },
  de: { name: 'Germany', language: 'de-DE', context: 'deutscher Markt' },
  jp: { name: 'Japan', language: 'ja-JP', context: '日本市場' },
  global: { name: 'Global', language: 'en', context: 'global market' },
};

// Buyer journey stages
export type JourneyStage = 'awareness' | 'consideration' | 'decision' | 'branded';

// Citation extracted from AI response
export interface Citation {
  url: string;
  domain: string;
  isOwnSite: boolean;
  context: string;
}

// Enhanced platform result
export interface PlatformResult {
  platform: AIPlatform;
  displayName: string;
  icon: string;
  tier: PlatformTier;
  mentioned: boolean;
  position: number | null;
  sentiment: 'positive' | 'neutral' | 'negative';
  snippet: string;
  rawResponse: string;
  competitors: string[];
  citations: Citation[];
  journeyStage: JourneyStage;
  region: Region;
  query: string;
}

// Gap analysis result
export interface GapAnalysis {
  platform: AIPlatform;
  query: string;
  journeyStage: JourneyStage;
  yourBrand: {
    mentioned: boolean;
    position: number | null;
  };
  competitors: {
    name: string;
    mentioned: boolean;
    position: number | null;
  }[];
  opportunity: 'high' | 'medium' | 'low';
  recommendation: string;
}

// Enhanced AI check result
export interface AICheckResult {
  brand: string;
  domain?: string;
  aeoScore: number;
  platforms: PlatformResult[];
  recommendations: string[];
  citations: {
    total: number;
    ownSite: number;
    topCited: Citation[];
  };
  gapAnalysis: GapAnalysis[];
  journeyBreakdown: Record<JourneyStage, { score: number; platforms: number }>;
  competitorComparison: {
    name: string;
    mentionRate: number;
    avgPosition: number | null;
    sentiment: { positive: number; neutral: number; negative: number };
  }[];
  region: Region;
  checkedAt: string;
}

// Journey-specific prompts
function getJourneyPrompts(brand: string, industry?: string): { stage: JourneyStage; prompts: string[] }[] {
  const industryContext = industry ? ` in ${industry}` : '';

  return [
    {
      stage: 'awareness',
      prompts: [
        `What are the best solutions for ${industry || 'business'} today?`,
        `What tools should I consider${industryContext}?`,
        `Who are the top players${industryContext}?`,
      ],
    },
    {
      stage: 'consideration',
      prompts: [
        `Compare the top ${industry || 'software'} options available`,
        `What should I look for when choosing${industryContext}?`,
        `Pros and cons of different ${industry || 'business'} solutions`,
      ],
    },
    {
      stage: 'decision',
      prompts: [
        `Which ${industry || 'solution'} would you recommend?`,
        `Is ${brand} worth it? Should I buy it?`,
        `${brand} vs alternatives - which is better?`,
      ],
    },
    {
      stage: 'branded',
      prompts: [
        `What do you know about ${brand}?`,
        `Tell me about ${brand} and their products`,
        `Is ${brand} a good company? What are they known for?`,
      ],
    },
  ];
}

// Google AI Overviews specific prompts (simulates search queries)
function getGoogleAIPrompts(brand: string, industry?: string): string[] {
  return [
    `best ${industry || 'software'} 2025`,
    `${brand} review`,
    `${brand} vs competitors`,
    `is ${brand} good`,
    `${industry || 'business'} recommendations`,
  ];
}

// Extract citations/URLs from AI response
function extractCitations(response: string, ownDomain?: string): Citation[] {
  const citations: Citation[] = [];

  // Match URLs in various formats
  const urlPatterns = [
    /https?:\/\/[^\s\)"\]]+/gi,
    /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/gi, // Markdown links
    /(?:source|from|according to|via|at)\s*:?\s*([\w.-]+\.(com|org|io|net|co))/gi,
  ];

  const foundUrls = new Set<string>();

  for (const pattern of urlPatterns) {
    const matches = response.matchAll(pattern);
    for (const match of matches) {
      const url = match[2] || match[1] || match[0];
      if (url && !foundUrls.has(url)) {
        foundUrls.add(url);

        try {
          const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
          const domain = urlObj.hostname.replace('www.', '');
          const isOwnSite = ownDomain ? domain.includes(ownDomain.replace('www.', '')) : false;

          // Extract context around the URL
          const idx = response.indexOf(url);
          const start = Math.max(0, idx - 100);
          const end = Math.min(response.length, idx + url.length + 100);
          const context = response.substring(start, end).trim();

          citations.push({ url, domain, isOwnSite, context });
        } catch {
          // Invalid URL, skip
        }
      }
    }
  }

  return citations;
}

// Enhanced response analysis
function analyzeResponse(
  response: string,
  brand: string,
  domain?: string,
  competitors?: string[]
): {
  mentioned: boolean;
  position: number | null;
  sentiment: 'positive' | 'neutral' | 'negative';
  snippet: string;
  competitors: string[];
  citations: Citation[];
} {
  const lowerResponse = response.toLowerCase();
  const lowerBrand = brand.toLowerCase();

  // Check for brand mention
  const brandVariants = [
    lowerBrand,
    lowerBrand.replace(/\s+/g, ''),
    lowerBrand.replace(/\s+/g, '-'),
    lowerBrand.replace(/\s+/g, '_'),
  ];

  const mentioned = brandVariants.some(
    (v) => v.length > 2 && lowerResponse.includes(v)
  );

  let position: number | null = null;
  let snippet = '';

  if (mentioned) {
    // Find position in list if applicable
    const lines = response.split('\n');
    let listPos = 0;
    for (const line of lines) {
      if (/^\d+[\.\)]\s|^[-*•]\s|^\*\*\d+/.test(line.trim())) {
        listPos++;
        if (brandVariants.some((v) => line.toLowerCase().includes(v))) {
          position = listPos;
          break;
        }
      }
    }

    // Extract snippet
    const idx = lowerResponse.indexOf(lowerBrand);
    if (idx !== -1) {
      const start = Math.max(0, idx - 50);
      const end = Math.min(response.length, idx + 200);
      snippet = response.substring(start, end).trim();
      if (start > 0) snippet = '...' + snippet;
      if (end < response.length) snippet = snippet + '...';
    }
  }

  // Enhanced sentiment analysis
  const positiveWords = [
    'excellent', 'great', 'recommend', 'best', 'quality', 'trusted',
    'popular', 'leading', 'top', 'premium', 'outstanding', 'innovative',
    'reliable', 'impressive', 'powerful', 'effective', 'highly rated',
    'market leader', 'industry standard', 'well-known', 'reputable'
  ];
  const negativeWords = [
    'avoid', 'poor', 'bad', 'issue', 'problem', 'complaint', 'expensive',
    'overpriced', 'disappointing', 'unreliable', 'outdated', 'limited',
    'lacking', 'frustrating', 'difficult', 'complicated', 'not recommended'
  ];

  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
  if (mentioned) {
    const positiveCount = positiveWords.filter((w) => lowerResponse.includes(w)).length;
    const negativeCount = negativeWords.filter((w) => lowerResponse.includes(w)).length;

    if (positiveCount > negativeCount + 1) sentiment = 'positive';
    else if (negativeCount > positiveCount + 1) sentiment = 'negative';
  }

  // Extract competitors mentioned
  const commonBrands = [
    'amazon', 'google', 'apple', 'microsoft', 'meta', 'nike', 'adidas',
    'shopify', 'stripe', 'salesforce', 'hubspot', 'mailchimp', 'canva',
    'semrush', 'ahrefs', 'moz', 'brightedge', 'conductor', 'searchmetrics',
    'profound', 'scrunch', 'otterly', 'peec', 'visby', 'gauge',
    ...(competitors || []).map(c => c.toLowerCase())
  ];

  const foundCompetitors = commonBrands.filter(
    (c) => lowerResponse.includes(c) && c !== lowerBrand && !brandVariants.includes(c)
  );

  // Extract citations
  const citations = extractCitations(response, domain);

  return { mentioned, position, sentiment, snippet, competitors: [...new Set(foundCompetitors)], citations };
}

// Check visibility on a single platform
async function checkPlatform(
  platform: AIPlatform,
  brand: string,
  query: string,
  journeyStage: JourneyStage,
  region: Region,
  domain?: string,
  competitors?: string[]
): Promise<PlatformResult> {
  if (!openrouter) {
    throw new Error('OpenRouter API key not configured');
  }

  const config = MODELS[platform];
  const regionConfig = REGIONS[region];

  // Add region-specific context to the prompt
  const systemPrompt = platform === 'google-ai'
    ? `You are simulating Google AI Overviews. Provide concise, factual summaries with citations when possible. Focus on the ${regionConfig.context}. Include URLs to sources when available.`
    : platform === 'perplexity'
    ? `You are a helpful AI assistant with web search capabilities. Provide detailed answers with sources and citations. Focus on the ${regionConfig.context}. Always include URLs to your sources.`
    : `You are a helpful assistant. Provide detailed, honest information about brands and products when asked. Focus on the ${regionConfig.context}. Include specific details and recommendations when relevant.`;

  try {
    const completion = await openrouter.chat.completions.create({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const rawResponse = completion.choices[0]?.message?.content || '';
    const analysis = analyzeResponse(rawResponse, brand, domain, competitors);

    return {
      platform,
      displayName: config.displayName,
      icon: config.icon,
      tier: config.tier,
      rawResponse,
      journeyStage,
      region,
      query,
      ...analysis,
    };
  } catch (error) {
    logger.error({ error, platform, brand, query }, 'AI check failed');

    return {
      platform,
      displayName: config.displayName,
      icon: config.icon,
      tier: config.tier,
      mentioned: false,
      position: null,
      sentiment: 'neutral',
      snippet: '',
      rawResponse: '',
      competitors: [],
      citations: [],
      journeyStage,
      region,
      query,
    };
  }
}

// Calculate enhanced AEO score
function calculateAEOScore(results: PlatformResult[]): number {
  if (results.length === 0) return 0;

  let score = 0;
  const maxPerPlatform = 25;

  for (const result of results) {
    let platformScore = 0;

    // Base score for being mentioned (15 points)
    if (result.mentioned) {
      platformScore += 15;

      // Position bonus (up to 5 points)
      if (result.position) {
        if (result.position === 1) platformScore += 5;
        else if (result.position === 2) platformScore += 3;
        else if (result.position <= 5) platformScore += 1;
      }

      // Sentiment bonus (up to 5 points)
      if (result.sentiment === 'positive') platformScore += 5;
      else if (result.sentiment === 'neutral') platformScore += 2;

      // Citation bonus (if own site is cited)
      const ownCitations = result.citations.filter(c => c.isOwnSite).length;
      if (ownCitations > 0) platformScore += Math.min(ownCitations * 2, 5);
    }

    score += Math.min(platformScore, maxPerPlatform);
  }

  // Normalize to 100
  const normalizedScore = Math.round((score / (results.length * maxPerPlatform)) * 100);
  return Math.min(normalizedScore, 100);
}

// Generate gap analysis
function generateGapAnalysis(
  results: PlatformResult[],
  brand: string,
  competitors: string[]
): GapAnalysis[] {
  const gaps: GapAnalysis[] = [];

  // Group by query/journey stage
  const byQuery = new Map<string, PlatformResult[]>();
  for (const result of results) {
    const key = `${result.platform}-${result.journeyStage}`;
    if (!byQuery.has(key)) byQuery.set(key, []);
    byQuery.get(key)!.push(result);
  }

  for (const [, platformResults] of byQuery) {
    const result = platformResults[0];
    if (!result) continue;

    // Only create gaps for non-branded queries where we're not mentioned
    if (result.journeyStage !== 'branded' && !result.mentioned && result.competitors.length > 0) {
      const competitorData = competitors.map(comp => {
        const compLower = comp.toLowerCase();
        const mentioned = result.competitors.includes(compLower) ||
                         result.rawResponse.toLowerCase().includes(compLower);

        // Find position
        let position: number | null = null;
        if (mentioned) {
          const lines = result.rawResponse.split('\n');
          let listPos = 0;
          for (const line of lines) {
            if (/^\d+[\.\)]\s|^[-*•]\s/.test(line.trim())) {
              listPos++;
              if (line.toLowerCase().includes(compLower)) {
                position = listPos;
                break;
              }
            }
          }
        }

        return { name: comp, mentioned, position };
      });

      const mentionedCompetitors = competitorData.filter(c => c.mentioned).length;
      const opportunity = mentionedCompetitors >= 2 ? 'high' : mentionedCompetitors === 1 ? 'medium' : 'low';

      let recommendation = '';
      if (opportunity === 'high') {
        recommendation = `Critical gap: ${mentionedCompetitors} competitors appear for "${result.query}" on ${result.displayName}. Create targeted content addressing this query.`;
      } else if (opportunity === 'medium') {
        recommendation = `Opportunity: Competitors are visible for "${result.query}". Consider creating content to compete.`;
      }

      if (recommendation) {
        gaps.push({
          platform: result.platform,
          query: result.query,
          journeyStage: result.journeyStage,
          yourBrand: { mentioned: result.mentioned, position: result.position },
          competitors: competitorData,
          opportunity,
          recommendation,
        });
      }
    }
  }

  // Sort by opportunity (high first)
  return gaps.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.opportunity] - order[b.opportunity];
  });
}

// Generate comprehensive recommendations
function generateRecommendations(
  results: PlatformResult[],
  brand: string,
  gapAnalysis: GapAnalysis[]
): string[] {
  const recommendations: string[] = [];
  const notMentioned = results.filter((r) => !r.mentioned);
  const negativeResults = results.filter((r) => r.sentiment === 'negative');
  const noCitations = results.filter((r) => r.citations.filter(c => c.isOwnSite).length === 0);

  // Platform-specific recommendations
  if (notMentioned.length > 0) {
    const platforms = [...new Set(notMentioned.map((r) => r.displayName))].slice(0, 3);
    recommendations.push(
      `Improve visibility on ${platforms.join(', ')} by creating authoritative content about ${brand}.`
    );
  }

  // Visibility gap recommendations
  if (notMentioned.length >= results.length / 2) {
    recommendations.push(
      'Add an llms.txt file to your website to help AI crawlers understand your brand.'
    );
    recommendations.push(
      'Implement JSON-LD structured data (Organization, Product, FAQ schemas) for better AI indexing.'
    );
  }

  // Citation recommendations
  if (noCitations.length > results.length / 2) {
    recommendations.push(
      'Your website is rarely cited by AI. Improve content quality and add unique research/data that AI models will want to reference.'
    );
  }

  // Sentiment recommendations
  if (negativeResults.length > 0) {
    recommendations.push(
      'Address negative sentiment by improving customer reviews, responding to complaints, and enhancing brand perception.'
    );
  }

  // Gap analysis recommendations
  const highGaps = gapAnalysis.filter(g => g.opportunity === 'high');
  if (highGaps.length > 0) {
    const gap = highGaps[0];
    recommendations.push(
      `Priority: Create content targeting "${gap.query}" - ${gap.competitors.filter(c => c.mentioned).length} competitors are visible but you're not.`
    );
  }

  // Journey stage recommendations
  const journeyMentions: Record<JourneyStage, number> = { awareness: 0, consideration: 0, decision: 0, branded: 0 };
  for (const result of results) {
    if (result.mentioned) journeyMentions[result.journeyStage]++;
  }

  if (journeyMentions.awareness === 0 && journeyMentions.consideration === 0) {
    recommendations.push(
      'You\'re only visible for branded queries. Create top-of-funnel content to appear in awareness/consideration searches.'
    );
  }

  // Competitor insights
  const allCompetitors = [...new Set(results.flatMap((r) => r.competitors))];
  if (allCompetitors.length > 0) {
    recommendations.push(
      `Competitors mentioned: ${allCompetitors.slice(0, 5).join(', ')}. Analyze their content strategy and positioning.`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      'Excellent AI visibility! Continue creating quality content and monitor competitors.'
    );
  }

  return recommendations.slice(0, 8); // Limit to 8 recommendations
}

// Get platforms by tier
export function getPlatformsByTier(tier: PlatformTier): AIPlatform[] {
  return Object.entries(MODELS)
    .filter(([, config]) => config.tier === tier)
    .map(([platform]) => platform as AIPlatform);
}

// Get all platforms up to a tier
export function getPlatformsUpToTier(tier: PlatformTier): AIPlatform[] {
  const tierOrder: PlatformTier[] = ['core', 'extended', 'premium'];
  const maxIndex = tierOrder.indexOf(tier);

  return Object.entries(MODELS)
    .filter(([, config]) => tierOrder.indexOf(config.tier) <= maxIndex)
    .map(([platform]) => platform as AIPlatform);
}

/**
 * Run comprehensive AI visibility check (Phase 1-3 enhanced)
 */
export async function runUniversalAICheck(
  brand: string,
  options: {
    domain?: string;
    platforms?: AIPlatform[];
    competitors?: string[];
    region?: Region;
    industry?: string;
    includeGapAnalysis?: boolean;
    journeyStages?: JourneyStage[];
  } = {}
): Promise<AICheckResult> {
  const {
    domain,
    platforms = ['chatgpt', 'claude', 'perplexity', 'gemini'],
    competitors = [],
    region = 'global',
    industry,
    includeGapAnalysis = true,
    journeyStages = ['branded', 'decision'],
  } = options;

  logger.info({ brand, domain, platforms, region }, 'Starting Universal AI check v2');

  const journeyPrompts = getJourneyPrompts(brand, industry);
  const allChecks: Promise<PlatformResult>[] = [];

  // Run checks for each platform and journey stage
  for (const platform of platforms) {
    for (const stage of journeyStages) {
      const stageConfig = journeyPrompts.find(j => j.stage === stage);
      if (!stageConfig) continue;

      // Use first prompt of each stage
      const query = stageConfig.prompts[0];
      allChecks.push(checkPlatform(platform, brand, query, stage, region, domain, competitors));
    }

    // Additional Google AI specific prompts
    if (platform === 'google-ai') {
      const googlePrompts = getGoogleAIPrompts(brand, industry);
      for (const query of googlePrompts.slice(0, 2)) {
        allChecks.push(checkPlatform(platform, brand, query, 'decision', region, domain, competitors));
      }
    }
  }

  // Run all checks in parallel
  const results = await Promise.all(allChecks);

  // Calculate scores and analysis
  const aeoScore = calculateAEOScore(results);

  // Aggregate citations
  const allCitations = results.flatMap(r => r.citations);
  const ownSiteCitations = allCitations.filter(c => c.isOwnSite);
  const citationsByDomain = new Map<string, number>();
  for (const citation of allCitations) {
    citationsByDomain.set(citation.domain, (citationsByDomain.get(citation.domain) || 0) + 1);
  }
  const topCited = [...citationsByDomain.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([domain]) => allCitations.find(c => c.domain === domain)!);

  // Gap analysis
  const gapAnalysis = includeGapAnalysis ? generateGapAnalysis(results, brand, competitors) : [];

  // Journey breakdown
  const journeyBreakdown: Record<JourneyStage, { score: number; platforms: number }> = {
    awareness: { score: 0, platforms: 0 },
    consideration: { score: 0, platforms: 0 },
    decision: { score: 0, platforms: 0 },
    branded: { score: 0, platforms: 0 },
  };

  for (const stage of ['awareness', 'consideration', 'decision', 'branded'] as JourneyStage[]) {
    const stageResults = results.filter(r => r.journeyStage === stage);
    if (stageResults.length > 0) {
      const mentioned = stageResults.filter(r => r.mentioned).length;
      journeyBreakdown[stage] = {
        score: Math.round((mentioned / stageResults.length) * 100),
        platforms: mentioned,
      };
    }
  }

  // Competitor comparison
  const competitorComparison = competitors.map(comp => {
    const compLower = comp.toLowerCase();
    let mentions = 0;
    let totalPositions = 0;
    let positionCount = 0;
    const sentiment = { positive: 0, neutral: 0, negative: 0 };

    for (const result of results) {
      if (result.competitors.includes(compLower) || result.rawResponse.toLowerCase().includes(compLower)) {
        mentions++;

        // Find position
        const lines = result.rawResponse.split('\n');
        let listPos = 0;
        for (const line of lines) {
          if (/^\d+[\.\)]\s|^[-*•]\s/.test(line.trim())) {
            listPos++;
            if (line.toLowerCase().includes(compLower)) {
              totalPositions += listPos;
              positionCount++;
              break;
            }
          }
        }

        // Assume neutral sentiment for competitors (simplified)
        sentiment.neutral++;
      }
    }

    return {
      name: comp,
      mentionRate: results.length > 0 ? Math.round((mentions / results.length) * 100) : 0,
      avgPosition: positionCount > 0 ? Math.round(totalPositions / positionCount * 10) / 10 : null,
      sentiment,
    };
  });

  // Generate recommendations
  const recommendations = generateRecommendations(results, brand, gapAnalysis);

  return {
    brand,
    domain,
    aeoScore,
    platforms: results,
    recommendations,
    citations: {
      total: allCitations.length,
      ownSite: ownSiteCitations.length,
      topCited,
    },
    gapAnalysis,
    journeyBreakdown,
    competitorComparison,
    region,
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Quick check for a single platform (for free tools)
 */
export async function quickCheck(
  brand: string,
  platform: AIPlatform = 'chatgpt',
  domain?: string
): Promise<PlatformResult> {
  const query = `What do you know about ${brand}? Is it a good brand?`;
  return checkPlatform(platform, brand, query, 'branded', 'global', domain);
}

/**
 * Check if OpenRouter is configured
 */
export function isAIConfigured(): boolean {
  return !!process.env.OPENROUTER_API_KEY;
}

/**
 * Get model info for a platform
 */
export function getPlatformInfo(platform: AIPlatform) {
  return MODELS[platform];
}

/**
 * Get all available platforms
 */
export function getAllPlatforms(): AIPlatform[] {
  return Object.keys(MODELS) as AIPlatform[];
}

/**
 * Get region info
 */
export function getRegionInfo(region: Region) {
  return REGIONS[region];
}

/**
 * Get all available regions
 */
export function getAllRegions(): Region[] {
  return Object.keys(REGIONS) as Region[];
}
