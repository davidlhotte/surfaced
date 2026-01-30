/**
 * Universal AI Visibility Checker
 * Uses OpenRouter to check brand visibility across AI platforms
 * Works without Shopify - for Universal SaaS users
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

export type AIPlatform = 'chatgpt' | 'claude' | 'perplexity' | 'gemini';

// OpenRouter model mapping
const MODELS: Record<AIPlatform, { model: string; displayName: string }> = {
  chatgpt: { model: 'openai/gpt-4o-mini', displayName: 'ChatGPT' },
  claude: { model: 'anthropic/claude-3.5-haiku', displayName: 'Claude' },
  perplexity: { model: 'perplexity/sonar', displayName: 'Perplexity' },
  gemini: { model: 'google/gemini-2.0-flash-001', displayName: 'Gemini' },
};

export interface PlatformResult {
  platform: AIPlatform;
  displayName: string;
  mentioned: boolean;
  position: number | null;
  sentiment: 'positive' | 'neutral' | 'negative';
  snippet: string;
  rawResponse: string;
  competitors: string[];
}

export interface AICheckResult {
  brand: string;
  domain?: string;
  aeoScore: number;
  platforms: PlatformResult[];
  recommendations: string[];
  checkedAt: string;
}

// Prompts to test brand visibility
function getTestPrompts(brand: string): string[] {
  return [
    `What do you know about ${brand}?`,
    `Is ${brand} a good brand? What are they known for?`,
    `Can you recommend ${brand}? Tell me about their products or services.`,
  ];
}

// Analyze AI response for brand mention
function analyzeResponse(
  response: string,
  brand: string
): {
  mentioned: boolean;
  position: number | null;
  sentiment: 'positive' | 'neutral' | 'negative';
  snippet: string;
  competitors: string[];
} {
  const lowerResponse = response.toLowerCase();
  const lowerBrand = brand.toLowerCase();

  // Check for brand mention
  const brandVariants = [
    lowerBrand,
    lowerBrand.replace(/\s+/g, ''),
    lowerBrand.replace(/\s+/g, '-'),
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
      if (/^\d+[\.\)]\s|^[-*•]\s/.test(line.trim())) {
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
      const end = Math.min(response.length, idx + 150);
      snippet = response.substring(start, end).trim();
      if (start > 0) snippet = '...' + snippet;
      if (end < response.length) snippet = snippet + '...';
    }
  }

  // Analyze sentiment
  const positiveWords = [
    'excellent', 'great', 'recommend', 'best', 'quality', 'trusted',
    'popular', 'leading', 'top', 'premium', 'outstanding', 'innovative'
  ];
  const negativeWords = [
    'avoid', 'poor', 'bad', 'issue', 'problem', 'complaint', 'expensive',
    'overpriced', 'disappointing', 'unreliable'
  ];

  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
  if (mentioned) {
    const hasPositive = positiveWords.some((w) => lowerResponse.includes(w));
    const hasNegative = negativeWords.some((w) => lowerResponse.includes(w));
    if (hasPositive && !hasNegative) sentiment = 'positive';
    else if (hasNegative && !hasPositive) sentiment = 'negative';
  }

  // Extract competitors mentioned
  const commonBrands = [
    'amazon', 'google', 'apple', 'microsoft', 'meta', 'nike', 'adidas',
    'shopify', 'stripe', 'salesforce', 'hubspot', 'mailchimp', 'canva'
  ];
  const competitors = commonBrands.filter(
    (c) => lowerResponse.includes(c) && c !== lowerBrand
  );

  return { mentioned, position, sentiment, snippet, competitors };
}

// Check visibility on a single platform
async function checkPlatform(
  platform: AIPlatform,
  brand: string
): Promise<PlatformResult> {
  if (!openrouter) {
    throw new Error('OpenRouter API key not configured');
  }

  const config = MODELS[platform];
  const prompts = getTestPrompts(brand);
  const query = prompts[0]; // Use first prompt

  try {
    const completion = await openrouter.chat.completions.create({
      model: config.model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. Provide detailed, honest information about brands and products when asked. Include specific details and recommendations when relevant.',
        },
        {
          role: 'user',
          content: query,
        },
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    const rawResponse = completion.choices[0]?.message?.content || '';
    const analysis = analyzeResponse(rawResponse, brand);

    return {
      platform,
      displayName: config.displayName,
      rawResponse,
      ...analysis,
    };
  } catch (error) {
    logger.error({ error, platform, brand }, 'AI check failed');

    // Return a "no response" result on error
    return {
      platform,
      displayName: config.displayName,
      mentioned: false,
      position: null,
      sentiment: 'neutral',
      snippet: '',
      rawResponse: '',
      competitors: [],
    };
  }
}

// Calculate AEO score from platform results
function calculateAEOScore(results: PlatformResult[]): number {
  let score = 0;
  const maxScore = 100;

  for (const result of results) {
    // 15 points for being mentioned
    if (result.mentioned) {
      score += 15;

      // Bonus for position (top 3)
      if (result.position && result.position <= 3) {
        score += 5;
      }

      // Bonus for positive sentiment
      if (result.sentiment === 'positive') {
        score += 5;
      }
    }
  }

  // Normalize to 100
  const normalizedScore = Math.min(Math.round((score / (results.length * 25)) * 100), maxScore);
  return normalizedScore;
}

// Generate recommendations based on results
function generateRecommendations(results: PlatformResult[], brand: string): string[] {
  const recommendations: string[] = [];
  const notMentioned = results.filter((r) => !r.mentioned);
  const negativeResults = results.filter((r) => r.sentiment === 'negative');

  if (notMentioned.length > 0) {
    const platforms = notMentioned.map((r) => r.displayName).join(', ');
    recommendations.push(
      `Improve visibility on ${platforms} by creating more authoritative content about ${brand}.`
    );
  }

  if (notMentioned.length >= results.length / 2) {
    recommendations.push(
      'Add an llms.txt file to your website to help AI crawlers understand your brand.'
    );
    recommendations.push(
      'Implement JSON-LD structured data (Organization, Product schemas) for better AI indexing.'
    );
  }

  if (negativeResults.length > 0) {
    recommendations.push(
      'Address negative sentiment by improving customer reviews and public perception.'
    );
  }

  const allCompetitors = [...new Set(results.flatMap((r) => r.competitors))];
  if (allCompetitors.length > 0) {
    recommendations.push(
      `Competitors mentioned alongside your brand: ${allCompetitors.slice(0, 5).join(', ')}. Consider competitive positioning.`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      'Your brand has good AI visibility! Continue creating quality content to maintain your position.'
    );
  }

  return recommendations;
}

/**
 * Run AI visibility check for a brand (Universal - no Shopify required)
 */
export async function runUniversalAICheck(
  brand: string,
  domain?: string,
  platforms?: AIPlatform[]
): Promise<AICheckResult> {
  logger.info({ brand, domain, platforms }, 'Starting Universal AI check');

  const platformsToCheck = platforms || (['chatgpt', 'claude', 'perplexity', 'gemini'] as AIPlatform[]);

  // Run all platform checks in parallel
  const results = await Promise.all(
    platformsToCheck.map((platform) => checkPlatform(platform, brand))
  );

  const aeoScore = calculateAEOScore(results);
  const recommendations = generateRecommendations(results, brand);

  return {
    brand,
    domain,
    aeoScore,
    platforms: results,
    recommendations,
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Check if OpenRouter is configured
 */
export function isAIConfigured(): boolean {
  return !!process.env.OPENROUTER_API_KEY;
}
