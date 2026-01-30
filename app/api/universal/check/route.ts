import { NextRequest, NextResponse } from 'next/server';

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
    const { brand } = body;

    if (!brand || typeof brand !== 'string') {
      return NextResponse.json(
        { error: 'Brand name or URL is required' },
        { status: 400 }
      );
    }

    // In production, this would call actual AI APIs
    // For now, return mock data
    const results = await checkAIVisibility(brand);

    return NextResponse.json({
      brand,
      results,
      aeoScore: calculateAEOScore(results),
      checkedAt: new Date().toISOString(),
      remaining,
    }, {
      headers: {
        'X-RateLimit-Remaining': remaining.toString(),
      },
    });
  } catch (error) {
    console.error('AI Check error:', error);
    return NextResponse.json(
      { error: 'Failed to check AI visibility' },
      { status: 500 }
    );
  }
}

interface AIResult {
  platform: string;
  mentioned: boolean;
  position: number | null;
  snippet: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

async function checkAIVisibility(brand: string): Promise<AIResult[]> {
  // In production, this would:
  // 1. Call OpenAI API with prompts like "What can you tell me about {brand}?"
  // 2. Call Anthropic API
  // 3. Call Perplexity API
  // 4. Call Google AI API

  // Mock implementation
  const platforms = ['ChatGPT', 'Claude', 'Perplexity', 'Gemini'];

  return platforms.map((platform) => {
    const mentioned = Math.random() > 0.3;
    return {
      platform,
      mentioned,
      position: mentioned ? Math.floor(Math.random() * 5) + 1 : null,
      snippet: mentioned
        ? `${brand} is a well-known brand that offers...`
        : '',
      sentiment: mentioned
        ? (['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)] as 'positive' | 'neutral' | 'negative')
        : 'neutral',
    };
  });
}

function calculateAEOScore(results: AIResult[]): number {
  const mentionedCount = results.filter((r) => r.mentioned).length;
  const avgPosition = results
    .filter((r) => r.position)
    .reduce((acc, r) => acc + (r.position || 0), 0) /
    Math.max(results.filter((r) => r.position).length, 1);

  const positiveCount = results.filter((r) => r.sentiment === 'positive').length;

  // Score calculation:
  // - 40% for being mentioned
  // - 40% for position (lower = better)
  // - 20% for positive sentiment
  const mentionScore = (mentionedCount / results.length) * 40;
  const positionScore = avgPosition ? ((6 - avgPosition) / 5) * 40 : 0;
  const sentimentScore = (positiveCount / Math.max(mentionedCount, 1)) * 20;

  return Math.round(mentionScore + positionScore + sentimentScore);
}
