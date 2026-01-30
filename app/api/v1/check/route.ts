import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';
import { createHash } from 'crypto';

// Verify API key and return user info
async function verifyApiKey(apiKey: string | null): Promise<{ userId: string; plan: string } | null> {
  if (!apiKey || !apiKey.startsWith('sk_')) {
    return null;
  }

  const keyHash = createHash('sha256').update(apiKey).digest('hex');

  const key = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: {
      shop: true,
    },
  });

  if (!key || !key.isActive) {
    return null;
  }

  if (key.expiresAt && key.expiresAt < new Date()) {
    return null;
  }

  // Update last used
  await prisma.apiKey.update({
    where: { id: key.id },
    data: {
      lastUsedAt: new Date(),
      requestCount: { increment: 1 },
    },
  });

  return {
    userId: key.shopId,
    plan: key.shop.plan,
  };
}

export async function POST(request: NextRequest) {
  try {
    // Check API key
    const authHeader = request.headers.get('authorization');
    const apiKey = authHeader?.replace('Bearer ', '');

    const auth = await verifyApiKey(apiKey || null);

    if (!auth) {
      return NextResponse.json(
        {
          error: {
            code: 'unauthorized',
            message: 'Invalid or missing API key',
          },
        },
        { status: 401 }
      );
    }

    // Check if plan allows API access
    if (auth.plan !== 'PREMIUM' && auth.plan !== 'SCALE') {
      return NextResponse.json(
        {
          error: {
            code: 'forbidden',
            message: 'API access requires Scale plan or higher',
          },
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { brand, prompts } = body;

    if (!brand) {
      return NextResponse.json(
        {
          error: {
            code: 'bad_request',
            message: 'Brand name or URL is required',
          },
        },
        { status: 400 }
      );
    }

    // Perform AI visibility check
    const results = await performAICheck(brand, prompts);

    return NextResponse.json({
      success: true,
      data: {
        brand,
        aeoScore: results.score,
        platforms: results.platforms,
        checkedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('API v1 check error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'internal_error',
          message: 'An error occurred while processing your request',
        },
      },
      { status: 500 }
    );
  }
}

interface PlatformResult {
  name: string;
  mentioned: boolean;
  position: number | null;
  snippet: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

interface CheckResults {
  score: number;
  platforms: PlatformResult[];
}

async function performAICheck(brand: string, _prompts?: string[]): Promise<CheckResults> {
  // In production, this would call actual AI APIs
  // For now, mock the results

  const platforms: PlatformResult[] = [
    {
      name: 'ChatGPT',
      mentioned: Math.random() > 0.3,
      position: Math.random() > 0.3 ? Math.floor(Math.random() * 5) + 1 : null,
      snippet: `${brand} is known for...`,
      sentiment: 'positive',
    },
    {
      name: 'Claude',
      mentioned: Math.random() > 0.4,
      position: Math.random() > 0.4 ? Math.floor(Math.random() * 5) + 1 : null,
      snippet: `Based on available information, ${brand}...`,
      sentiment: 'neutral',
    },
    {
      name: 'Perplexity',
      mentioned: Math.random() > 0.3,
      position: Math.random() > 0.3 ? Math.floor(Math.random() * 5) + 1 : null,
      snippet: `According to sources, ${brand}...`,
      sentiment: 'positive',
    },
    {
      name: 'Gemini',
      mentioned: Math.random() > 0.5,
      position: Math.random() > 0.5 ? Math.floor(Math.random() * 5) + 1 : null,
      snippet: `${brand} has been recognized for...`,
      sentiment: 'neutral',
    },
  ];

  const mentionedCount = platforms.filter((p) => p.mentioned).length;
  const avgPosition = platforms
    .filter((p) => p.position)
    .reduce((acc, p) => acc + (p.position || 0), 0) /
    Math.max(platforms.filter((p) => p.position).length, 1);

  const score = Math.round(
    (mentionedCount / platforms.length) * 50 +
    (avgPosition ? (6 - avgPosition) / 5 * 50 : 0)
  );

  return { score, platforms };
}

// GET endpoint for documentation
export async function GET() {
  return NextResponse.json({
    name: 'Surfaced API v1 - AI Visibility Check',
    version: '1.0.0',
    documentation: 'https://surfaced.vercel.app/docs/api',
    endpoints: {
      'POST /api/v1/check': {
        description: 'Check AI visibility for a brand',
        authentication: 'Bearer token (API key)',
        body: {
          brand: 'string (required) - Brand name or URL',
          prompts: 'string[] (optional) - Custom prompts to test',
        },
        response: {
          success: 'boolean',
          data: {
            brand: 'string',
            aeoScore: 'number (0-100)',
            platforms: 'array of platform results',
            checkedAt: 'ISO datetime',
          },
        },
      },
    },
  });
}
