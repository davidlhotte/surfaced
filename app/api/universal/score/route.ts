import { NextRequest, NextResponse } from 'next/server';
import { analyzeWebsite } from '@/lib/services/universal/website-analyzer';
import { logger } from '@/lib/monitoring/logger';

// Rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const windowMs = 24 * 60 * 60 * 1000;
  const maxRequests = 5;

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
          message: 'You have reached the daily limit. Sign up for unlimited access.',
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Website URL is required' },
        { status: 400 }
      );
    }

    // Run real website analysis
    const result = await analyzeWebsite(url);

    // Transform to legacy format for backwards compatibility
    const legacyChecks = [
      {
        name: 'llms.txt',
        status: result.checks.llmsTxt.exists && result.checks.llmsTxt.isValid
          ? 'pass'
          : result.checks.llmsTxt.exists
          ? 'warning'
          : 'fail',
        message: result.checks.llmsTxt.exists
          ? result.checks.llmsTxt.isValid
            ? 'llms.txt file found and valid'
            : 'llms.txt found but incomplete'
          : 'No llms.txt file detected',
        points: result.checks.llmsTxt.exists && result.checks.llmsTxt.isValid ? 15 : result.checks.llmsTxt.exists ? 8 : 0,
        maxPoints: 15,
        details: result.checks.llmsTxt,
      },
      {
        name: 'JSON-LD Schema',
        status: result.checks.jsonLd.exists
          ? result.checks.jsonLd.hasOrganization
            ? 'pass'
            : 'warning'
          : 'fail',
        message: result.checks.jsonLd.exists
          ? `Found ${result.checks.jsonLd.schemas.length} schema(s): ${result.checks.jsonLd.schemas.map(s => s.type).join(', ')}`
          : 'No JSON-LD structured data found',
        points: result.checks.jsonLd.exists
          ? (result.checks.jsonLd.hasOrganization ? 5 : 0) +
            (result.checks.jsonLd.hasProduct ? 5 : 0) +
            (result.checks.jsonLd.hasWebSite ? 5 : 0) +
            (result.checks.jsonLd.hasFAQ ? 5 : 0)
          : 0,
        maxPoints: 20,
        details: {
          hasOrganization: result.checks.jsonLd.hasOrganization,
          hasProduct: result.checks.jsonLd.hasProduct,
          hasWebSite: result.checks.jsonLd.hasWebSite,
          hasFAQ: result.checks.jsonLd.hasFAQ,
          schemaCount: result.checks.jsonLd.schemas.length,
        },
      },
      {
        name: 'GPTBot Access',
        status: result.checks.robotsTxt.gptBotAllowed ? 'pass' : 'fail',
        message: result.checks.robotsTxt.gptBotAllowed
          ? 'GPTBot allowed in robots.txt'
          : 'GPTBot blocked or restricted',
        points: result.checks.robotsTxt.gptBotAllowed ? 15 : 0,
        maxPoints: 15,
      },
      {
        name: 'ClaudeBot Access',
        status: result.checks.robotsTxt.claudeBotAllowed ? 'pass' : 'fail',
        message: result.checks.robotsTxt.claudeBotAllowed
          ? 'ClaudeBot allowed'
          : 'ClaudeBot blocked or restricted',
        points: result.checks.robotsTxt.claudeBotAllowed ? 10 : 0,
        maxPoints: 10,
      },
      {
        name: 'PerplexityBot Access',
        status: result.checks.robotsTxt.perplexityBotAllowed ? 'pass' : 'fail',
        message: result.checks.robotsTxt.perplexityBotAllowed
          ? 'PerplexityBot allowed'
          : 'PerplexityBot blocked or restricted',
        points: result.checks.robotsTxt.perplexityBotAllowed ? 10 : 0,
        maxPoints: 10,
      },
      {
        name: 'XML Sitemap',
        status: result.checks.sitemap.exists
          ? result.checks.sitemap.issues.length === 0
            ? 'pass'
            : 'warning'
          : 'fail',
        message: result.checks.sitemap.exists
          ? `Found sitemap with ${result.checks.sitemap.urlCount} URLs`
          : 'No sitemap.xml found',
        points: result.checks.sitemap.exists ? 10 : 0,
        maxPoints: 10,
        details: result.checks.sitemap,
      },
      {
        name: 'Content Structure',
        status: result.checks.content.hasH1 && result.checks.content.hasMeta
          ? 'pass'
          : result.checks.content.hasH1 || result.checks.content.hasMeta
          ? 'warning'
          : 'fail',
        message: result.checks.content.issues.length === 0
          ? 'Good content structure'
          : result.checks.content.issues.join(', '),
        points:
          (result.checks.content.hasH1 ? 3 : 0) +
          (result.checks.content.hasMeta ? 4 : 0) +
          (result.checks.content.hasOpenGraph ? 4 : 0) +
          (result.checks.content.hasTwitterCard ? 4 : 0),
        maxPoints: 15,
        details: result.checks.content,
      },
    ];

    return NextResponse.json({
      domain: result.domain,
      score: result.score,
      checks: legacyChecks,
      detailedChecks: result.checks,
      recommendations: result.recommendations,
      analyzedAt: result.analyzedAt,
      remaining,
    });
  } catch (error) {
    logger.error({ error }, 'AEO Score error');
    return NextResponse.json(
      { error: 'Failed to analyze website' },
      { status: 500 }
    );
  }
}
