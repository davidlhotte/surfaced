import { NextRequest, NextResponse } from 'next/server';
import {
  runUniversalAICheck,
  isAIConfigured,
  AIPlatform,
  JourneyStage,
  Region,
} from '@/lib/services/universal/ai-checker';
import { logger } from '@/lib/monitoring/logger';

// Rate limiting - simple in-memory store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const windowMs = 24 * 60 * 60 * 1000; // 24 hours
  const maxRequests = 3; // 3 free checks per day

  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count };
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const { allowed, remaining } = getRateLimit(ip);

    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'You have reached the daily limit for free checks. Sign up for unlimited access.',
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          },
        }
      );
    }

    const body = await request.json();
    const {
      brand,
      domain,
      platforms,
      competitors,
      region,
      industry,
      journeyStages,
      includeGapAnalysis,
      includeCitations,
    } = body;

    if (!brand || typeof brand !== 'string') {
      return NextResponse.json(
        { error: 'Brand name or URL is required' },
        { status: 400 }
      );
    }

    // Check if OpenRouter is configured
    if (!isAIConfigured()) {
      logger.warn('OpenRouter API key not configured, using mock data');
      const mockResults = await getMockResults(brand);
      return NextResponse.json({
        ...mockResults,
        remaining,
        mock: true,
      }, {
        headers: {
          'X-RateLimit-Remaining': remaining.toString(),
        },
      });
    }

    // Run enhanced AI visibility check with Phase 1-3 features
    const results = await runUniversalAICheck(brand, {
      domain,
      platforms: platforms as AIPlatform[],
      competitors,
      region: region as Region,
      industry,
      includeGapAnalysis: includeGapAnalysis ?? true,
      journeyStages: journeyStages as JourneyStage[],
    });

    // Build response with enhanced data
    const response: Record<string, unknown> = {
      brand: results.brand,
      domain: results.domain,
      aeoScore: results.aeoScore,
      platforms: results.platforms.map(p => ({
        platform: p.platform,
        displayName: p.displayName,
        icon: p.icon,
        tier: p.tier,
        mentioned: p.mentioned,
        position: p.position,
        sentiment: p.sentiment,
        snippet: p.snippet,
        competitors: p.competitors,
        journeyStage: p.journeyStage,
        region: p.region,
        ...(includeCitations && { citations: p.citations }),
      })),
      recommendations: results.recommendations,
      journeyBreakdown: results.journeyBreakdown,
      region: results.region,
      checkedAt: results.checkedAt,
      remaining,
    };

    // Include citations summary if requested
    if (includeCitations) {
      response.citations = results.citations;
    }

    // Include gap analysis if requested
    if (includeGapAnalysis && results.gapAnalysis.length > 0) {
      response.gapAnalysis = results.gapAnalysis;
    }

    // Include competitor comparison if competitors were provided
    if (competitors && competitors.length > 0) {
      response.competitorComparison = results.competitorComparison;
    }

    return NextResponse.json(response, {
      headers: {
        'X-RateLimit-Remaining': remaining.toString(),
      },
    });
  } catch (error) {
    logger.error({ error }, 'AI Check error');
    return NextResponse.json(
      { error: 'Failed to check AI visibility' },
      { status: 500 }
    );
  }
}

// Mock implementation for fallback
async function getMockResults(brand: string) {
  const platforms = [
    { platform: 'chatgpt', displayName: 'ChatGPT' },
    { platform: 'claude', displayName: 'Claude' },
    { platform: 'perplexity', displayName: 'Perplexity' },
    { platform: 'gemini', displayName: 'Gemini' },
  ];

  const results = platforms.map(({ platform, displayName }) => {
    const mentioned = Math.random() > 0.3;
    return {
      platform,
      displayName,
      mentioned,
      position: mentioned ? Math.floor(Math.random() * 5) + 1 : null,
      snippet: mentioned ? `${brand} is a well-known brand that offers...` : '',
      sentiment: mentioned
        ? (['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)] as 'positive' | 'neutral' | 'negative')
        : 'neutral',
      competitors: [],
    };
  });

  const mentionedCount = results.filter((r) => r.mentioned).length;
  const avgPosition = results
    .filter((r) => r.position)
    .reduce((acc, r) => acc + (r.position || 0), 0) /
    Math.max(results.filter((r) => r.position).length, 1);

  const positiveCount = results.filter((r) => r.sentiment === 'positive').length;
  const mentionScore = (mentionedCount / results.length) * 40;
  const positionScore = avgPosition ? ((6 - avgPosition) / 5) * 40 : 0;
  const sentimentScore = (positiveCount / Math.max(mentionedCount, 1)) * 20;
  const aeoScore = Math.round(mentionScore + positionScore + sentimentScore);

  return {
    brand,
    aeoScore,
    platforms: results,
    recommendations: [
      'Add an llms.txt file to your website',
      'Implement JSON-LD structured data',
      'Create content that answers common questions',
    ],
    checkedAt: new Date().toISOString(),
  };
}
