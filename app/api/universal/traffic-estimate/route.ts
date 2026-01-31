import { NextRequest, NextResponse } from 'next/server';
import { runUniversalAICheck, isAIConfigured } from '@/lib/services/universal/ai-checker';
import { estimateAITraffic, calculateAEOROI, getIndustryBenchmarks } from '@/lib/services/universal/traffic-estimation';
import { logger } from '@/lib/monitoring/logger';

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, limit: number = 5): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const windowMs = 24 * 60 * 60 * 1000; // 24 hours

  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: limit - record.count };
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const { allowed, remaining } = checkRateLimit(ip);

    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'You have reached the daily limit. Sign up for unlimited access.',
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      brand,
      domain,
      industry,
      monthlySearchVolume,
      monthlyTraffic,
      avgOrderValue,
      conversionRate,
    } = body;

    if (!brand || typeof brand !== 'string') {
      return NextResponse.json(
        { error: 'Brand name is required' },
        { status: 400 }
      );
    }

    // Check if AI is configured
    if (!isAIConfigured()) {
      logger.warn('OpenRouter not configured, using mock traffic estimation');
      return NextResponse.json(getMockTrafficEstimate(brand, industry), {
        headers: { 'X-RateLimit-Remaining': remaining.toString() },
      });
    }

    // First run AI visibility check
    const aiCheckResult = await runUniversalAICheck(brand, {
      domain,
      industry,
      journeyStages: ['awareness', 'consideration', 'decision', 'branded'],
    });

    // Then estimate traffic based on visibility
    const trafficEstimate = estimateAITraffic(aiCheckResult, {
      monthlySearchVolume,
      monthlyTraffic,
      industry,
    });

    // Calculate ROI if order value provided
    let roiAnalysis = null;
    if (avgOrderValue) {
      roiAnalysis = calculateAEOROI(
        trafficEstimate,
        20, // Assume 20% score improvement
        avgOrderValue,
        conversionRate || 0.02
      );
    }

    // Get industry benchmarks
    const benchmarks = getIndustryBenchmarks(industry || 'default');

    return NextResponse.json({
      brand,
      visibility: {
        aeoScore: aiCheckResult.aeoScore,
        platformsCovered: aiCheckResult.platforms.length,
        mentionRate: Math.round(
          (aiCheckResult.platforms.filter(p => p.mentioned).length / aiCheckResult.platforms.length) * 100
        ),
      },
      trafficEstimate: {
        monthlyAIVisits: trafficEstimate.estimatedMonthlyAIVisits,
        monthlyAIReferrals: trafficEstimate.estimatedMonthlyAIReferrals,
        platformBreakdown: trafficEstimate.platformBreakdown,
        journeyBreakdown: trafficEstimate.journeyBreakdown,
        trend: trafficEstimate.trend,
        confidence: trafficEstimate.confidence,
      },
      missedOpportunity: trafficEstimate.missedOpportunity,
      competitorComparison: trafficEstimate.competitorComparison,
      roiAnalysis,
      benchmarks,
      remaining,
    }, {
      headers: { 'X-RateLimit-Remaining': remaining.toString() },
    });
  } catch (error) {
    logger.error({ error }, 'Traffic estimation error');
    return NextResponse.json(
      { error: 'Failed to estimate AI traffic' },
      { status: 500 }
    );
  }
}

function getMockTrafficEstimate(brand: string, industry?: string) {
  const baseVisits = 1500 + Math.floor(Math.random() * 1000);

  return {
    brand,
    visibility: {
      aeoScore: 45 + Math.floor(Math.random() * 30),
      platformsCovered: 4,
      mentionRate: 50 + Math.floor(Math.random() * 30),
    },
    trafficEstimate: {
      monthlyAIVisits: baseVisits,
      monthlyAIReferrals: Math.floor(baseVisits * 0.65),
      platformBreakdown: [
        { platform: 'chatgpt', displayName: 'ChatGPT', estimatedVisits: Math.floor(baseVisits * 0.35), marketShare: 35, visibilityScore: 70 },
        { platform: 'perplexity', displayName: 'Perplexity', estimatedVisits: Math.floor(baseVisits * 0.25), marketShare: 15, visibilityScore: 65 },
        { platform: 'gemini', displayName: 'Gemini', estimatedVisits: Math.floor(baseVisits * 0.20), marketShare: 18, visibilityScore: 55 },
        { platform: 'claude', displayName: 'Claude', estimatedVisits: Math.floor(baseVisits * 0.10), marketShare: 8, visibilityScore: 60 },
      ],
      journeyBreakdown: [
        { stage: 'awareness', estimatedVisits: Math.floor(baseVisits * 0.15), conversionPotential: 'low' },
        { stage: 'consideration', estimatedVisits: Math.floor(baseVisits * 0.30), conversionPotential: 'medium' },
        { stage: 'decision', estimatedVisits: Math.floor(baseVisits * 0.35), conversionPotential: 'high' },
        { stage: 'branded', estimatedVisits: Math.floor(baseVisits * 0.20), conversionPotential: 'high' },
      ],
      trend: null,
      confidence: { level: 'medium', factors: ['Estimated search volume', 'Good platform coverage'] },
    },
    missedOpportunity: {
      estimatedLostVisits: Math.floor(baseVisits * 0.4),
      topMissedPlatforms: ['copilot', 'google-ai'],
      topMissedJourneyStages: ['awareness'],
      recommendations: [
        'Improve visibility on Microsoft Copilot and Google AI Overviews',
        'Create more top-of-funnel content for awareness stage',
      ],
    },
    competitorComparison: [],
    roiAnalysis: null,
    benchmarks: {
      aiTrafficShare: industry === 'saas' ? 0.28 : 0.20,
      avgGrowthRate: 0.15,
      topPlatforms: ['chatgpt', 'perplexity', 'gemini', 'google-ai'],
    },
    mock: true,
  };
}
