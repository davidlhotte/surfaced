import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';
import { createHash } from 'crypto';

// Verify API key
async function verifyApiKey(apiKey: string | null): Promise<{ userId: string; plan: string } | null> {
  if (!apiKey || !apiKey.startsWith('sk_')) {
    return null;
  }

  const keyHash = createHash('sha256').update(apiKey).digest('hex');

  const key = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: { shop: true },
  });

  if (!key || !key.isActive) {
    return null;
  }

  if (key.expiresAt && key.expiresAt < new Date()) {
    return null;
  }

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
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        {
          error: {
            code: 'bad_request',
            message: 'Website URL is required',
          },
        },
        { status: 400 }
      );
    }

    // Normalize URL
    let domain = url.trim();
    domain = domain.replace(/^https?:\/\//, '');
    domain = domain.replace(/\/.*$/, '');

    const results = await analyzeWebsite(domain);

    return NextResponse.json({
      success: true,
      data: {
        domain,
        score: results.score,
        checks: results.checks,
        recommendations: results.recommendations,
        analyzedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('API v1 score error:', error);
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

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  points: number;
  maxPoints: number;
}

interface AnalysisResult {
  score: number;
  checks: CheckResult[];
  recommendations: string[];
}

async function analyzeWebsite(_domain: string): Promise<AnalysisResult> {
  // In production, this would actually analyze the website
  // Mock implementation for now

  const checks: CheckResult[] = [
    {
      name: 'llms.txt',
      status: Math.random() > 0.7 ? 'pass' : 'fail',
      message: Math.random() > 0.7 ? 'llms.txt found' : 'No llms.txt',
      points: Math.random() > 0.7 ? 15 : 0,
      maxPoints: 15,
    },
    {
      name: 'JSON-LD Schema',
      status: Math.random() > 0.5 ? 'pass' : 'warning',
      message: Math.random() > 0.5 ? 'Valid schema' : 'Partial schema',
      points: Math.random() > 0.5 ? 20 : 10,
      maxPoints: 20,
    },
    {
      name: 'GPTBot Access',
      status: Math.random() > 0.6 ? 'pass' : 'fail',
      message: Math.random() > 0.6 ? 'Allowed' : 'Blocked',
      points: Math.random() > 0.6 ? 15 : 0,
      maxPoints: 15,
    },
    {
      name: 'ClaudeBot Access',
      status: Math.random() > 0.5 ? 'pass' : 'fail',
      message: Math.random() > 0.5 ? 'Allowed' : 'Blocked',
      points: Math.random() > 0.5 ? 10 : 0,
      maxPoints: 10,
    },
    {
      name: 'XML Sitemap',
      status: Math.random() > 0.7 ? 'pass' : 'warning',
      message: Math.random() > 0.7 ? 'Valid' : 'Minor issues',
      points: Math.random() > 0.7 ? 10 : 5,
      maxPoints: 10,
    },
    {
      name: 'Content Structure',
      status: Math.random() > 0.4 ? 'pass' : 'warning',
      message: Math.random() > 0.4 ? 'Good' : 'Needs work',
      points: Math.random() > 0.4 ? 15 : 8,
      maxPoints: 15,
    },
    {
      name: 'Page Speed',
      status: Math.random() > 0.5 ? 'pass' : 'warning',
      message: Math.random() > 0.5 ? 'Fast' : 'Moderate',
      points: Math.random() > 0.5 ? 15 : 8,
      maxPoints: 15,
    },
  ];

  const totalPoints = checks.reduce((acc, c) => acc + c.points, 0);
  const maxPoints = checks.reduce((acc, c) => acc + c.maxPoints, 0);
  const score = Math.round((totalPoints / maxPoints) * 100);

  const recommendations = checks
    .filter((c) => c.status !== 'pass')
    .map((c) => {
      switch (c.name) {
        case 'llms.txt':
          return 'Add an llms.txt file to help AI crawlers understand your site';
        case 'JSON-LD Schema':
          return 'Add complete JSON-LD structured data';
        case 'GPTBot Access':
          return 'Allow GPTBot in your robots.txt';
        case 'ClaudeBot Access':
          return 'Allow ClaudeBot in your robots.txt';
        default:
          return `Improve ${c.name}`;
      }
    });

  return { score, checks, recommendations };
}

export async function GET() {
  return NextResponse.json({
    name: 'Surfaced API v1 - AEO Score',
    version: '1.0.0',
    documentation: 'https://surfaced.vercel.app/docs/api',
    endpoints: {
      'POST /api/v1/score': {
        description: 'Analyze website AEO readiness',
        authentication: 'Bearer token (API key)',
        body: {
          url: 'string (required) - Website URL to analyze',
        },
        response: {
          success: 'boolean',
          data: {
            domain: 'string',
            score: 'number (0-100)',
            checks: 'array of check results',
            recommendations: 'array of strings',
            analyzedAt: 'ISO datetime',
          },
        },
      },
    },
  });
}
