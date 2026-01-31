/**
 * AI Traffic Estimation Service
 * Estimates traffic driven by AI assistants vs traditional search
 * Based on industry benchmarks and visibility scores
 */

import { AICheckResult, AIPlatform, JourneyStage } from './ai-checker';

// Platform market share data (2025 estimates)
const PLATFORM_MARKET_SHARE: Record<AIPlatform, number> = {
  chatgpt: 0.35,       // 35% of AI search traffic
  perplexity: 0.15,    // 15% - growing fast
  gemini: 0.18,        // 18% - Google's AI
  'google-ai': 0.12,   // 12% - AI Overviews in search
  claude: 0.08,        // 8% - business focused
  copilot: 0.07,       // 7% - Microsoft ecosystem
  deepseek: 0.02,      // 2% - China/developer focused
  grok: 0.02,          // 2% - X/Twitter users
  'meta-ai': 0.01,     // 1% - Meta ecosystem
};

// Click-through rates by journey stage
const CTR_BY_JOURNEY: Record<JourneyStage, number> = {
  branded: 0.45,       // 45% CTR for branded searches
  decision: 0.25,      // 25% CTR for decision stage
  consideration: 0.12, // 12% CTR for consideration
  awareness: 0.05,     // 5% CTR for awareness content
};

// Position multipliers for CTR
const POSITION_CTR_MULTIPLIER: Record<number, number> = {
  1: 1.0,    // Position 1: full CTR
  2: 0.65,   // Position 2: 65% of base CTR
  3: 0.45,   // Position 3: 45%
  4: 0.30,   // Position 4: 30%
  5: 0.20,   // Position 5: 20%
};

// Sentiment impact on CTR
const SENTIMENT_MULTIPLIER: Record<'positive' | 'neutral' | 'negative', number> = {
  positive: 1.3,   // 30% boost
  neutral: 1.0,    // Baseline
  negative: 0.4,   // 60% reduction
};

// Industry benchmarks for AI traffic share
const INDUSTRY_AI_TRAFFIC_SHARE: Record<string, number> = {
  'technology': 0.25,         // 25% of traffic from AI
  'saas': 0.28,               // 28%
  'ecommerce': 0.18,          // 18%
  'finance': 0.22,            // 22%
  'healthcare': 0.20,         // 20%
  'education': 0.24,          // 24%
  'travel': 0.16,             // 16%
  'real-estate': 0.15,        // 15%
  'legal': 0.19,              // 19%
  'marketing': 0.26,          // 26%
  'default': 0.20,            // 20% default
};

export interface TrafficEstimate {
  // Monthly estimates
  estimatedMonthlyAIVisits: number;
  estimatedMonthlyAIReferrals: number;

  // Breakdown by platform
  platformBreakdown: {
    platform: AIPlatform;
    displayName: string;
    estimatedVisits: number;
    marketShare: number;
    visibilityScore: number;
  }[];

  // Breakdown by journey stage
  journeyBreakdown: {
    stage: JourneyStage;
    estimatedVisits: number;
    conversionPotential: 'high' | 'medium' | 'low';
  }[];

  // Competitive analysis
  competitorComparison: {
    name: string;
    estimatedAIShare: number;
    visibilityGap: number;
  }[];

  // Opportunity analysis
  missedOpportunity: {
    estimatedLostVisits: number;
    topMissedPlatforms: AIPlatform[];
    topMissedJourneyStages: JourneyStage[];
    recommendations: string[];
  };

  // Trends (when historical data available)
  trend: {
    direction: 'up' | 'down' | 'stable';
    changePercent: number;
    period: string;
  } | null;

  // Confidence metrics
  confidence: {
    level: 'high' | 'medium' | 'low';
    factors: string[];
  };

  // Calculation metadata
  calculatedAt: string;
  methodology: string;
}

export interface TrafficEstimationOptions {
  monthlySearchVolume?: number;       // Known monthly search volume
  monthlyTraffic?: number;            // Current monthly traffic
  industry?: string;                  // Industry for benchmarks
  historicalResults?: AICheckResult[]; // Previous results for trends
  competitors?: string[];             // Known competitors
}

/**
 * Estimate AI-driven traffic based on visibility results
 */
export function estimateAITraffic(
  aiCheckResult: AICheckResult,
  options: TrafficEstimationOptions = {}
): TrafficEstimate {
  const {
    monthlySearchVolume = 10000,   // Default assumption
    monthlyTraffic = 5000,         // Default assumption
    industry = 'default',
    historicalResults = [],
    competitors = [],
  } = options;

  // Get industry-specific AI traffic share
  const aiTrafficShare = INDUSTRY_AI_TRAFFIC_SHARE[industry.toLowerCase()] ||
                         INDUSTRY_AI_TRAFFIC_SHARE['default'];

  // Estimated total AI-influenced searches for the brand
  const estimatedAISearches = monthlySearchVolume * aiTrafficShare;

  // Calculate platform-level estimates
  const platformBreakdown = aiCheckResult.platforms.reduce((acc, result) => {
    // Check if platform already in accumulator
    const existing = acc.find(p => p.platform === result.platform);
    if (existing) {
      // Merge results (take best visibility)
      if (result.mentioned && (!existing.visibilityScore || result.position! < 3)) {
        existing.visibilityScore = Math.max(existing.visibilityScore, calculateVisibilityScore(result));
      }
      return acc;
    }

    const marketShare = PLATFORM_MARKET_SHARE[result.platform];
    const platformSearches = estimatedAISearches * marketShare;

    // Calculate visibility score for this platform
    const visibilityScore = calculateVisibilityScore(result);

    // CTR based on journey stage and position
    const baseCTR = CTR_BY_JOURNEY[result.journeyStage];
    const positionMultiplier = result.position ?
      (POSITION_CTR_MULTIPLIER[result.position] || 0.1) :
      (result.mentioned ? 0.15 : 0);
    const sentimentMultiplier = SENTIMENT_MULTIPLIER[result.sentiment];

    const effectiveCTR = baseCTR * positionMultiplier * sentimentMultiplier;
    const estimatedVisits = Math.round(platformSearches * effectiveCTR);

    acc.push({
      platform: result.platform,
      displayName: result.displayName,
      estimatedVisits,
      marketShare: Math.round(marketShare * 100),
      visibilityScore,
    });

    return acc;
  }, [] as TrafficEstimate['platformBreakdown']);

  // Calculate journey breakdown
  const journeyBreakdown: TrafficEstimate['journeyBreakdown'] = [];
  for (const stage of ['awareness', 'consideration', 'decision', 'branded'] as JourneyStage[]) {
    const stageResults = aiCheckResult.platforms.filter(p => p.journeyStage === stage);
    const mentioned = stageResults.filter(p => p.mentioned).length;
    const visibilityRate = stageResults.length > 0 ? mentioned / stageResults.length : 0;

    // Estimate visits for this stage
    const stageWeight = stage === 'branded' ? 0.15 :
                        stage === 'decision' ? 0.35 :
                        stage === 'consideration' ? 0.30 : 0.20;

    const stageSearches = estimatedAISearches * stageWeight;
    const estimatedVisits = Math.round(stageSearches * visibilityRate * CTR_BY_JOURNEY[stage]);

    journeyBreakdown.push({
      stage,
      estimatedVisits,
      conversionPotential: stage === 'decision' || stage === 'branded' ? 'high' :
                          stage === 'consideration' ? 'medium' : 'low',
    });
  }

  // Calculate total estimates
  const estimatedMonthlyAIVisits = platformBreakdown.reduce((sum, p) => sum + p.estimatedVisits, 0);
  const estimatedMonthlyAIReferrals = Math.round(estimatedMonthlyAIVisits * 0.65); // 65% are trackable referrals

  // Competitor comparison
  const competitorComparison = (competitors.length > 0 ? competitors :
    aiCheckResult.competitorComparison.map(c => c.name)).slice(0, 5).map(name => {
    const compData = aiCheckResult.competitorComparison.find(c => c.name === name);
    const mentionRate = compData?.mentionRate || 0;

    // Estimate competitor AI share
    const yourMentionRate = aiCheckResult.platforms.filter(p => p.mentioned).length /
                           aiCheckResult.platforms.length * 100;

    return {
      name,
      estimatedAIShare: mentionRate,
      visibilityGap: mentionRate - yourMentionRate,
    };
  });

  // Calculate missed opportunity
  const missedOpportunity = calculateMissedOpportunity(
    aiCheckResult,
    estimatedAISearches,
    platformBreakdown
  );

  // Calculate trend if historical data available
  const trend = calculateTrend(aiCheckResult, historicalResults);

  // Determine confidence level
  const confidence = calculateConfidence(aiCheckResult, options);

  return {
    estimatedMonthlyAIVisits,
    estimatedMonthlyAIReferrals,
    platformBreakdown: platformBreakdown.sort((a, b) => b.estimatedVisits - a.estimatedVisits),
    journeyBreakdown,
    competitorComparison,
    missedOpportunity,
    trend,
    confidence,
    calculatedAt: new Date().toISOString(),
    methodology: 'Estimated based on platform market share, visibility scores, journey-stage CTR benchmarks, and position multipliers.',
  };
}

function calculateVisibilityScore(result: { mentioned: boolean; position: number | null; sentiment: string }): number {
  if (!result.mentioned) return 0;

  let score = 50; // Base score for mention

  // Position bonus
  if (result.position === 1) score += 30;
  else if (result.position === 2) score += 20;
  else if (result.position && result.position <= 5) score += 10;

  // Sentiment bonus
  if (result.sentiment === 'positive') score += 20;
  else if (result.sentiment === 'neutral') score += 10;

  return Math.min(score, 100);
}

function calculateMissedOpportunity(
  result: AICheckResult,
  totalAISearches: number,
  currentBreakdown: TrafficEstimate['platformBreakdown']
): TrafficEstimate['missedOpportunity'] {
  const notMentioned = result.platforms.filter(p => !p.mentioned);
  const missedPlatforms = [...new Set(notMentioned.map(p => p.platform))];

  // Calculate potential visits from missed platforms
  let lostVisits = 0;
  for (const platform of missedPlatforms) {
    const marketShare = PLATFORM_MARKET_SHARE[platform];
    const potentialSearches = totalAISearches * marketShare;
    // Assume average CTR if mentioned
    lostVisits += potentialSearches * 0.15;
  }

  // Identify missed journey stages
  const missedStages = (['awareness', 'consideration', 'decision', 'branded'] as JourneyStage[])
    .filter(stage => {
      const stageResults = result.platforms.filter(p => p.journeyStage === stage);
      const mentioned = stageResults.filter(p => p.mentioned).length;
      return stageResults.length > 0 && mentioned / stageResults.length < 0.3;
    });

  // Generate recommendations
  const recommendations: string[] = [];

  if (missedPlatforms.includes('chatgpt')) {
    recommendations.push('Improve ChatGPT visibility - it represents 35% of AI search traffic.');
  }
  if (missedPlatforms.includes('perplexity')) {
    recommendations.push('Optimize for Perplexity - it\'s the fastest growing AI search engine.');
  }
  if (missedPlatforms.includes('google-ai')) {
    recommendations.push('Target Google AI Overviews with structured data and FAQ content.');
  }
  if (missedStages.includes('awareness')) {
    recommendations.push('Create more top-of-funnel content to capture awareness stage searches.');
  }
  if (missedStages.includes('consideration')) {
    recommendations.push('Develop comparison content to appear in consideration stage queries.');
  }

  return {
    estimatedLostVisits: Math.round(lostVisits),
    topMissedPlatforms: missedPlatforms.slice(0, 3),
    topMissedJourneyStages: missedStages.slice(0, 2),
    recommendations: recommendations.slice(0, 4),
  };
}

function calculateTrend(
  current: AICheckResult,
  historical: AICheckResult[]
): TrafficEstimate['trend'] | null {
  if (historical.length < 2) return null;

  // Get most recent historical result
  const previous = historical[historical.length - 1];
  const periodStart = new Date(previous.checkedAt);
  const periodEnd = new Date(current.checkedAt);
  const days = Math.round((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));

  // Compare AEO scores
  const scoreDiff = current.aeoScore - previous.aeoScore;
  const changePercent = previous.aeoScore > 0 ?
    Math.round((scoreDiff / previous.aeoScore) * 100) :
    (current.aeoScore > 0 ? 100 : 0);

  return {
    direction: changePercent > 5 ? 'up' : changePercent < -5 ? 'down' : 'stable',
    changePercent: Math.abs(changePercent),
    period: `${days} days`,
  };
}

function calculateConfidence(
  result: AICheckResult,
  options: TrafficEstimationOptions
): TrafficEstimate['confidence'] {
  const factors: string[] = [];
  let score = 0;

  // More platforms = higher confidence
  if (result.platforms.length >= 8) {
    score += 30;
    factors.push('Comprehensive platform coverage');
  } else if (result.platforms.length >= 4) {
    score += 20;
    factors.push('Good platform coverage');
  } else {
    factors.push('Limited platform data');
  }

  // Known search volume improves confidence
  if (options.monthlySearchVolume && options.monthlySearchVolume !== 10000) {
    score += 25;
    factors.push('Actual search volume data');
  } else {
    factors.push('Estimated search volume');
  }

  // Historical data improves confidence
  if (options.historicalResults && options.historicalResults.length > 0) {
    score += 20;
    factors.push('Historical trend data');
  }

  // Industry benchmark available
  if (options.industry && INDUSTRY_AI_TRAFFIC_SHARE[options.industry.toLowerCase()]) {
    score += 15;
    factors.push('Industry-specific benchmarks');
  }

  // Citation data adds confidence
  if (result.citations.total > 0) {
    score += 10;
    factors.push('Citation data available');
  }

  return {
    level: score >= 60 ? 'high' : score >= 35 ? 'medium' : 'low',
    factors,
  };
}

/**
 * Get industry benchmark data
 */
export function getIndustryBenchmarks(industry: string): {
  aiTrafficShare: number;
  avgGrowthRate: number;
  topPlatforms: AIPlatform[];
} {
  const share = INDUSTRY_AI_TRAFFIC_SHARE[industry.toLowerCase()] ||
                INDUSTRY_AI_TRAFFIC_SHARE['default'];

  return {
    aiTrafficShare: share,
    avgGrowthRate: 0.15, // 15% YoY growth in AI traffic
    topPlatforms: ['chatgpt', 'perplexity', 'gemini', 'google-ai'],
  };
}

/**
 * Calculate ROI of AEO improvements
 */
export function calculateAEOROI(
  currentEstimate: TrafficEstimate,
  projectedScoreIncrease: number,
  avgOrderValue: number = 100,
  conversionRate: number = 0.02
): {
  additionalVisits: number;
  additionalRevenue: number;
  monthlyImpact: number;
  annualImpact: number;
} {
  // Score increase translates to visibility improvement
  const visibilityMultiplier = 1 + (projectedScoreIncrease / 100);
  const additionalVisits = Math.round(
    currentEstimate.estimatedMonthlyAIVisits * (visibilityMultiplier - 1)
  );

  const additionalOrders = additionalVisits * conversionRate;
  const additionalRevenue = additionalOrders * avgOrderValue;

  return {
    additionalVisits,
    additionalRevenue: Math.round(additionalRevenue),
    monthlyImpact: Math.round(additionalRevenue),
    annualImpact: Math.round(additionalRevenue * 12),
  };
}
