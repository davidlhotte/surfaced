import { NextRequest, NextResponse } from 'next/server';

// Rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const windowMs = 24 * 60 * 60 * 1000;
  const maxRequests = 3;

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
    const { brand, competitor } = body;

    if (!brand || !competitor) {
      return NextResponse.json(
        { error: 'Both brand and competitor names are required' },
        { status: 400 }
      );
    }

    const comparison = await compareVisibility(brand, competitor);

    return NextResponse.json({
      brand,
      competitor,
      comparison,
      comparedAt: new Date().toISOString(),
      remaining,
    });
  } catch (error) {
    console.error('Compare error:', error);
    return NextResponse.json(
      { error: 'Failed to compare brands' },
      { status: 500 }
    );
  }
}

interface QueryResult {
  query: string;
  platform: string;
  brandResult: { mentioned: boolean; position: number | null };
  competitorResult: { mentioned: boolean; position: number | null };
}

interface ComparisonResult {
  queries: QueryResult[];
  brandScore: number;
  competitorScore: number;
  winner: 'brand' | 'competitor' | 'tie';
  insights: string[];
}

async function compareVisibility(
  brand: string,
  competitor: string
): Promise<ComparisonResult> {
  // In production, this would query actual AI platforms
  // For now, mock the data

  const queries = [
    `Best ${brand.toLowerCase()} alternatives`,
    `${brand} vs ${competitor}`,
    `Top brands like ${brand}`,
    `Which is better ${brand} or ${competitor}`,
  ];

  const platforms = ['ChatGPT', 'Claude', 'Perplexity', 'Gemini'];

  const results: QueryResult[] = [];
  let brandTotal = 0;
  let competitorTotal = 0;

  queries.forEach((query) => {
    platforms.forEach((platform) => {
      const brandMentioned = Math.random() > 0.3;
      const competitorMentioned = Math.random() > 0.3;
      const brandPos = brandMentioned ? Math.floor(Math.random() * 5) + 1 : null;
      const compPos = competitorMentioned
        ? Math.floor(Math.random() * 5) + 1
        : null;

      results.push({
        query,
        platform,
        brandResult: { mentioned: brandMentioned, position: brandPos },
        competitorResult: {
          mentioned: competitorMentioned,
          position: compPos,
        },
      });

      if (brandMentioned) brandTotal += 6 - (brandPos || 5);
      if (competitorMentioned) competitorTotal += 6 - (compPos || 5);
    });
  });

  const maxScore = queries.length * platforms.length * 5;
  const brandScore = Math.round((brandTotal / maxScore) * 100);
  const competitorScore = Math.round((competitorTotal / maxScore) * 100);

  let winner: 'brand' | 'competitor' | 'tie';
  if (brandScore > competitorScore) {
    winner = 'brand';
  } else if (competitorScore > brandScore) {
    winner = 'competitor';
  } else {
    winner = 'tie';
  }

  const insights: string[] = [];

  if (winner === 'brand') {
    insights.push(
      `${brand} has stronger AI visibility than ${competitor}. Focus on maintaining your lead.`
    );
  } else if (winner === 'competitor') {
    insights.push(
      `${competitor} currently outranks ${brand}. Consider improving your AEO strategy.`
    );
  } else {
    insights.push(
      `Both brands have similar AI visibility. Small improvements could give you the edge.`
    );
  }

  insights.push(
    'Track these comparisons weekly to monitor competitive shifts in AI recommendations.'
  );

  return {
    queries: results,
    brandScore,
    competitorScore,
    winner,
    insights,
  };
}
