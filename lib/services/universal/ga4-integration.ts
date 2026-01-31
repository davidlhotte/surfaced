/**
 * Google Analytics 4 Integration Service
 * Connects GA4 data to correlate AI visibility with actual traffic
 * Uses the GA4 Data API (Google Analytics Data API v1)
 */

import { AICheckResult, AIPlatform } from './ai-checker';
import { TrafficEstimate } from './traffic-estimation';
import { logger } from '@/lib/monitoring/logger';

// GA4 OAuth scopes needed
export const GA4_SCOPES = [
  'https://www.googleapis.com/auth/analytics.readonly',
];

// AI referrer patterns to identify AI traffic
const AI_REFERRER_PATTERNS: Record<AIPlatform | string, RegExp[]> = {
  chatgpt: [/chat\.openai\.com/i, /openai\.com/i, /chatgpt/i],
  claude: [/claude\.ai/i, /anthropic\.com/i],
  perplexity: [/perplexity\.ai/i],
  gemini: [/gemini\.google\.com/i, /bard\.google\.com/i],
  'google-ai': [/google\.com.*ai/i, /google\.com.*overview/i],
  copilot: [/copilot\.microsoft\.com/i, /bing\.com.*copilot/i],
  deepseek: [/deepseek\.com/i, /chat\.deepseek/i],
  grok: [/grok\.x\.ai/i, /x\.com.*grok/i],
  'meta-ai': [/meta\.ai/i, /facebook\.com.*ai/i],
  // Generic AI patterns
  ai_generic: [/\bai\b/i, /assistant/i, /llm/i],
};

// GA4 Credentials interface
export interface GA4Credentials {
  propertyId: string;
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  accessToken?: string;
  serviceAccountKey?: object;
}

// GA4 Report request
export interface GA4ReportRequest {
  propertyId: string;
  dateRange: {
    startDate: string; // YYYY-MM-DD or relative (e.g., '30daysAgo')
    endDate: string;   // YYYY-MM-DD or 'today'
  };
  metrics: string[];
  dimensions?: string[];
  dimensionFilter?: object;
}

// Traffic source data from GA4
export interface TrafficSourceData {
  source: string;
  medium: string;
  sessions: number;
  users: number;
  pageviews: number;
  avgSessionDuration: number;
  bounceRate: number;
  conversions?: number;
  revenue?: number;
}

// AI Traffic breakdown
export interface AITrafficData {
  platform: AIPlatform | 'unknown';
  displayName: string;
  sessions: number;
  users: number;
  pageviews: number;
  avgSessionDuration: number;
  bounceRate: number;
  conversions: number;
  revenue: number;
  percentOfTotal: number;
}

// Complete GA4 analytics result
export interface GA4AnalyticsResult {
  totalSessions: number;
  totalUsers: number;
  totalPageviews: number;
  totalConversions: number;
  totalRevenue: number;

  aiTraffic: {
    total: {
      sessions: number;
      users: number;
      percentOfTotal: number;
      avgSessionDuration: number;
      bounceRate: number;
    };
    byPlatform: AITrafficData[];
    trend: {
      direction: 'up' | 'down' | 'stable';
      changePercent: number;
      comparedTo: string;
    };
  };

  organicTraffic: {
    sessions: number;
    percentOfTotal: number;
    aiShareOfOrganic: number;
  };

  topLandingPages: {
    page: string;
    aiSessions: number;
    totalSessions: number;
    aiPercent: number;
  }[];

  correlationWithVisibility: {
    platform: AIPlatform;
    visibilityScore: number;
    actualTrafficPercent: number;
    correlation: 'strong' | 'moderate' | 'weak' | 'inverse';
  }[];

  dateRange: { startDate: string; endDate: string };
  fetchedAt: string;
}

// Comparison of estimated vs actual
export interface TrafficComparison {
  estimated: TrafficEstimate;
  actual: GA4AnalyticsResult;
  accuracy: {
    overall: number; // Percentage accuracy
    byPlatform: { platform: AIPlatform; estimated: number; actual: number; accuracy: number }[];
  };
  insights: string[];
  recommendations: string[];
}

/**
 * Mock GA4 data for development/demo
 * In production, this would call the actual GA4 Data API
 */
function generateMockGA4Data(propertyId: string): GA4AnalyticsResult {
  const totalSessions = Math.floor(Math.random() * 50000) + 10000;
  const aiPercentage = 0.15 + Math.random() * 0.10; // 15-25% AI traffic

  return {
    totalSessions,
    totalUsers: Math.floor(totalSessions * 0.7),
    totalPageviews: Math.floor(totalSessions * 2.5),
    totalConversions: Math.floor(totalSessions * 0.02),
    totalRevenue: Math.floor(totalSessions * 0.02 * 85),

    aiTraffic: {
      total: {
        sessions: Math.floor(totalSessions * aiPercentage),
        users: Math.floor(totalSessions * aiPercentage * 0.75),
        percentOfTotal: Math.round(aiPercentage * 100),
        avgSessionDuration: 180 + Math.random() * 120,
        bounceRate: 35 + Math.random() * 15,
      },
      byPlatform: [
        {
          platform: 'chatgpt',
          displayName: 'ChatGPT',
          sessions: Math.floor(totalSessions * aiPercentage * 0.40),
          users: Math.floor(totalSessions * aiPercentage * 0.35),
          pageviews: Math.floor(totalSessions * aiPercentage * 0.40 * 2.8),
          avgSessionDuration: 195,
          bounceRate: 32,
          conversions: Math.floor(totalSessions * aiPercentage * 0.40 * 0.025),
          revenue: Math.floor(totalSessions * aiPercentage * 0.40 * 0.025 * 90),
          percentOfTotal: 40,
        },
        {
          platform: 'perplexity',
          displayName: 'Perplexity',
          sessions: Math.floor(totalSessions * aiPercentage * 0.25),
          users: Math.floor(totalSessions * aiPercentage * 0.22),
          pageviews: Math.floor(totalSessions * aiPercentage * 0.25 * 3.2),
          avgSessionDuration: 210,
          bounceRate: 28,
          conversions: Math.floor(totalSessions * aiPercentage * 0.25 * 0.03),
          revenue: Math.floor(totalSessions * aiPercentage * 0.25 * 0.03 * 95),
          percentOfTotal: 25,
        },
        {
          platform: 'gemini',
          displayName: 'Gemini',
          sessions: Math.floor(totalSessions * aiPercentage * 0.15),
          users: Math.floor(totalSessions * aiPercentage * 0.13),
          pageviews: Math.floor(totalSessions * aiPercentage * 0.15 * 2.5),
          avgSessionDuration: 175,
          bounceRate: 38,
          conversions: Math.floor(totalSessions * aiPercentage * 0.15 * 0.02),
          revenue: Math.floor(totalSessions * aiPercentage * 0.15 * 0.02 * 80),
          percentOfTotal: 15,
        },
        {
          platform: 'claude',
          displayName: 'Claude',
          sessions: Math.floor(totalSessions * aiPercentage * 0.10),
          users: Math.floor(totalSessions * aiPercentage * 0.09),
          pageviews: Math.floor(totalSessions * aiPercentage * 0.10 * 3.5),
          avgSessionDuration: 240,
          bounceRate: 25,
          conversions: Math.floor(totalSessions * aiPercentage * 0.10 * 0.035),
          revenue: Math.floor(totalSessions * aiPercentage * 0.10 * 0.035 * 105),
          percentOfTotal: 10,
        },
        {
          platform: 'unknown',
          displayName: 'Other AI',
          sessions: Math.floor(totalSessions * aiPercentage * 0.10),
          users: Math.floor(totalSessions * aiPercentage * 0.08),
          pageviews: Math.floor(totalSessions * aiPercentage * 0.10 * 2.2),
          avgSessionDuration: 160,
          bounceRate: 42,
          conversions: Math.floor(totalSessions * aiPercentage * 0.10 * 0.015),
          revenue: Math.floor(totalSessions * aiPercentage * 0.10 * 0.015 * 75),
          percentOfTotal: 10,
        },
      ],
      trend: {
        direction: 'up',
        changePercent: Math.floor(12 + Math.random() * 8),
        comparedTo: 'previous month',
      },
    },

    organicTraffic: {
      sessions: Math.floor(totalSessions * 0.45),
      percentOfTotal: 45,
      aiShareOfOrganic: Math.round(aiPercentage / 0.45 * 100),
    },

    topLandingPages: [
      { page: '/', aiSessions: Math.floor(totalSessions * aiPercentage * 0.30), totalSessions: Math.floor(totalSessions * 0.25), aiPercent: Math.round(aiPercentage * 1.2 * 100) },
      { page: '/products', aiSessions: Math.floor(totalSessions * aiPercentage * 0.25), totalSessions: Math.floor(totalSessions * 0.18), aiPercent: Math.round(aiPercentage * 1.4 * 100) },
      { page: '/pricing', aiSessions: Math.floor(totalSessions * aiPercentage * 0.20), totalSessions: Math.floor(totalSessions * 0.12), aiPercent: Math.round(aiPercentage * 1.7 * 100) },
      { page: '/blog', aiSessions: Math.floor(totalSessions * aiPercentage * 0.15), totalSessions: Math.floor(totalSessions * 0.20), aiPercent: Math.round(aiPercentage * 0.75 * 100) },
      { page: '/about', aiSessions: Math.floor(totalSessions * aiPercentage * 0.10), totalSessions: Math.floor(totalSessions * 0.08), aiPercent: Math.round(aiPercentage * 1.25 * 100) },
    ],

    correlationWithVisibility: [],

    dateRange: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    },
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Fetch GA4 analytics data
 * In production, this would use the Google Analytics Data API
 */
export async function fetchGA4Analytics(
  credentials: GA4Credentials,
  dateRange?: { startDate: string; endDate: string }
): Promise<GA4AnalyticsResult> {
  logger.info({ propertyId: credentials.propertyId }, 'Fetching GA4 analytics');

  // For development, return mock data
  // In production, this would call the GA4 Data API
  if (!credentials.accessToken && !credentials.serviceAccountKey) {
    logger.warn('No GA4 credentials provided, using mock data');
    return generateMockGA4Data(credentials.propertyId);
  }

  // Production implementation would use:
  // const { BetaAnalyticsDataClient } = require('@google-analytics/data');
  // const analyticsDataClient = new BetaAnalyticsDataClient();
  // const [response] = await analyticsDataClient.runReport({...});

  // For now, return mock data
  return generateMockGA4Data(credentials.propertyId);
}

/**
 * Identify AI traffic sources from referrer data
 */
export function identifyAIPlatform(referrer: string, source: string): AIPlatform | 'unknown' {
  const combined = `${referrer} ${source}`.toLowerCase();

  for (const [platform, patterns] of Object.entries(AI_REFERRER_PATTERNS)) {
    if (platform === 'ai_generic') continue;

    for (const pattern of patterns) {
      if (pattern.test(combined)) {
        return platform as AIPlatform;
      }
    }
  }

  // Check for generic AI patterns
  for (const pattern of AI_REFERRER_PATTERNS.ai_generic) {
    if (pattern.test(combined)) {
      return 'unknown';
    }
  }

  return 'unknown';
}

/**
 * Compare estimated traffic with actual GA4 data
 */
export function compareEstimatedVsActual(
  estimated: TrafficEstimate,
  actual: GA4AnalyticsResult,
  aiCheckResult: AICheckResult
): TrafficComparison {
  const insights: string[] = [];
  const recommendations: string[] = [];

  // Calculate overall accuracy
  const estimatedTotal = estimated.estimatedMonthlyAIVisits;
  const actualTotal = actual.aiTraffic.total.sessions;
  const overallAccuracy = estimatedTotal > 0
    ? Math.round((1 - Math.abs(estimatedTotal - actualTotal) / estimatedTotal) * 100)
    : 0;

  // Platform-level accuracy
  const byPlatform = estimated.platformBreakdown.map(est => {
    const actualPlatform = actual.aiTraffic.byPlatform.find(a => a.platform === est.platform);
    const actualVisits = actualPlatform?.sessions || 0;
    const accuracy = est.estimatedVisits > 0
      ? Math.round((1 - Math.abs(est.estimatedVisits - actualVisits) / est.estimatedVisits) * 100)
      : (actualVisits === 0 ? 100 : 0);

    return {
      platform: est.platform,
      estimated: est.estimatedVisits,
      actual: actualVisits,
      accuracy: Math.max(0, accuracy),
    };
  });

  // Generate insights
  if (actualTotal > estimatedTotal * 1.2) {
    insights.push(`Your AI traffic is ${Math.round((actualTotal / estimatedTotal - 1) * 100)}% higher than estimated. Your content resonates well with AI platforms.`);
  } else if (actualTotal < estimatedTotal * 0.8) {
    insights.push(`Your AI traffic is ${Math.round((1 - actualTotal / estimatedTotal) * 100)}% lower than expected. There may be conversion opportunities being missed.`);
    recommendations.push('Review your landing pages for AI referral traffic - optimize for the questions AI users are asking.');
  }

  // Platform-specific insights
  const underperforming = byPlatform.filter(p => p.actual < p.estimated * 0.5 && p.estimated > 100);
  if (underperforming.length > 0) {
    insights.push(`Underperforming platforms: ${underperforming.map(p => p.platform).join(', ')} - getting less traffic than visibility suggests.`);
    recommendations.push('Create more compelling call-to-actions in your AI-visible content for these platforms.');
  }

  const overperforming = byPlatform.filter(p => p.actual > p.estimated * 1.5 && p.actual > 100);
  if (overperforming.length > 0) {
    insights.push(`Outperforming platforms: ${overperforming.map(p => p.platform).join(', ')} - convert visibility to traffic better than average.`);
    recommendations.push('Study what makes your content effective on these platforms and apply to others.');
  }

  // AI traffic trend insight
  if (actual.aiTraffic.trend.direction === 'up') {
    insights.push(`AI traffic is growing ${actual.aiTraffic.trend.changePercent}% ${actual.aiTraffic.trend.comparedTo}. Continue your current AEO strategy.`);
  } else if (actual.aiTraffic.trend.direction === 'down') {
    insights.push(`AI traffic decreased ${actual.aiTraffic.trend.changePercent}% ${actual.aiTraffic.trend.comparedTo}. Review recent content changes.`);
    recommendations.push('Check if any recent website changes affected AI crawlability (robots.txt, page structure, content quality).');
  }

  // Conversion insight
  const aiConversionRate = actual.aiTraffic.total.sessions > 0
    ? actual.totalConversions / actual.aiTraffic.total.sessions * 100
    : 0;
  const overallConversionRate = actual.totalSessions > 0
    ? actual.totalConversions / actual.totalSessions * 100
    : 0;

  if (aiConversionRate > overallConversionRate * 1.2) {
    insights.push(`AI traffic converts ${Math.round((aiConversionRate / overallConversionRate - 1) * 100)}% better than average. Invest more in AEO.`);
  } else if (aiConversionRate < overallConversionRate * 0.8) {
    recommendations.push('AI traffic has lower conversion rates. Optimize landing pages for AI-referred visitors.');
  }

  return {
    estimated,
    actual,
    accuracy: {
      overall: Math.max(0, overallAccuracy),
      byPlatform,
    },
    insights,
    recommendations,
  };
}

/**
 * Calculate correlation between visibility and traffic
 */
export function calculateVisibilityCorrelation(
  aiCheckResult: AICheckResult,
  ga4Data: GA4AnalyticsResult
): GA4AnalyticsResult['correlationWithVisibility'] {
  const correlations: GA4AnalyticsResult['correlationWithVisibility'] = [];

  // Get unique platforms from AI check
  const platforms = [...new Set(aiCheckResult.platforms.map(p => p.platform))];

  for (const platform of platforms) {
    const platformResults = aiCheckResult.platforms.filter(p => p.platform === platform);
    const mentioned = platformResults.filter(p => p.mentioned).length;
    const visibilityScore = platformResults.length > 0
      ? Math.round((mentioned / platformResults.length) * 100)
      : 0;

    const actualData = ga4Data.aiTraffic.byPlatform.find(p => p.platform === platform);
    const actualTrafficPercent = actualData?.percentOfTotal || 0;

    // Calculate correlation strength
    let correlation: 'strong' | 'moderate' | 'weak' | 'inverse';
    const scoreDiff = Math.abs(visibilityScore - actualTrafficPercent);

    if (visibilityScore > 50 && actualTrafficPercent > 10) {
      correlation = scoreDiff < 20 ? 'strong' : 'moderate';
    } else if (visibilityScore > 50 && actualTrafficPercent < 5) {
      correlation = 'weak';
    } else if (visibilityScore < 20 && actualTrafficPercent > 15) {
      correlation = 'inverse';
    } else {
      correlation = scoreDiff < 30 ? 'moderate' : 'weak';
    }

    correlations.push({
      platform,
      visibilityScore,
      actualTrafficPercent,
      correlation,
    });
  }

  return correlations;
}

/**
 * Generate GA4 UTM tracking parameters for AI campaigns
 */
export function generateAITrackingParams(platform: AIPlatform, campaign?: string): string {
  const params = new URLSearchParams({
    utm_source: `ai_${platform}`,
    utm_medium: 'ai_referral',
    utm_campaign: campaign || 'aeo_optimization',
  });

  return params.toString();
}

/**
 * Create custom GA4 events for AI interactions
 */
export function getAIEventDefinitions(): { name: string; parameters: string[]; description: string }[] {
  return [
    {
      name: 'ai_referral_landing',
      parameters: ['ai_platform', 'landing_page', 'query_type'],
      description: 'User landed on site from AI platform',
    },
    {
      name: 'ai_mentioned_brand',
      parameters: ['ai_platform', 'sentiment', 'position'],
      description: 'Brand was mentioned in AI response',
    },
    {
      name: 'ai_citation_click',
      parameters: ['ai_platform', 'cited_url', 'citation_position'],
      description: 'User clicked citation link from AI',
    },
    {
      name: 'ai_conversion',
      parameters: ['ai_platform', 'conversion_type', 'conversion_value'],
      description: 'Conversion from AI-referred user',
    },
  ];
}

/**
 * Validate GA4 property access
 */
export async function validateGA4Access(credentials: GA4Credentials): Promise<{
  valid: boolean;
  propertyName?: string;
  error?: string;
}> {
  try {
    // In production, this would make an API call to verify access
    // For now, validate the property ID format
    if (!credentials.propertyId.match(/^\d+$/)) {
      return { valid: false, error: 'Invalid property ID format. Should be a numeric string.' };
    }

    if (!credentials.accessToken && !credentials.serviceAccountKey) {
      return { valid: false, error: 'No authentication credentials provided.' };
    }

    // Mock successful validation
    return {
      valid: true,
      propertyName: `Property ${credentials.propertyId}`,
    };
  } catch (error) {
    logger.error({ error }, 'GA4 access validation failed');
    return { valid: false, error: 'Failed to validate GA4 access' };
  }
}
