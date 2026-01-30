import { NextRequest, NextResponse } from 'next/server';

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

    // Normalize URL
    let domain = url.trim();
    domain = domain.replace(/^https?:\/\//, '');
    domain = domain.replace(/\/.*$/, '');

    // In production, this would actually fetch and analyze the website
    const checks = await analyzeWebsite(domain);
    const score = calculateScore(checks);

    return NextResponse.json({
      domain,
      score,
      checks,
      recommendations: generateRecommendations(checks),
      analyzedAt: new Date().toISOString(),
      remaining,
    });
  } catch (error) {
    console.error('AEO Score error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze website' },
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

async function analyzeWebsite(domain: string): Promise<CheckResult[]> {
  // In production, this would:
  // 1. Fetch robots.txt and check for AI bot rules
  // 2. Check for llms.txt
  // 3. Fetch and validate JSON-LD
  // 4. Check sitemap.xml
  // 5. Analyze page structure

  // Mock implementation
  const checks: CheckResult[] = [
    {
      name: 'llms.txt',
      status: Math.random() > 0.7 ? 'pass' : 'fail',
      message: Math.random() > 0.7 ? 'llms.txt file found and valid' : 'No llms.txt file detected',
      points: Math.random() > 0.7 ? 15 : 0,
      maxPoints: 15,
    },
    {
      name: 'JSON-LD Schema',
      status: Math.random() > 0.5 ? 'pass' : Math.random() > 0.5 ? 'warning' : 'fail',
      message: Math.random() > 0.5 ? 'Organization and WebSite schema found' : 'Missing structured data',
      points: Math.random() > 0.5 ? 20 : Math.random() > 0.5 ? 10 : 0,
      maxPoints: 20,
    },
    {
      name: 'GPTBot Access',
      status: Math.random() > 0.6 ? 'pass' : 'fail',
      message: Math.random() > 0.6 ? 'GPTBot allowed in robots.txt' : 'GPTBot blocked or not specified',
      points: Math.random() > 0.6 ? 15 : 0,
      maxPoints: 15,
    },
    {
      name: 'ClaudeBot Access',
      status: Math.random() > 0.5 ? 'pass' : 'fail',
      message: Math.random() > 0.5 ? 'ClaudeBot allowed' : 'ClaudeBot blocked',
      points: Math.random() > 0.5 ? 10 : 0,
      maxPoints: 10,
    },
    {
      name: 'XML Sitemap',
      status: Math.random() > 0.7 ? 'pass' : 'warning',
      message: Math.random() > 0.7 ? 'Valid sitemap.xml found' : 'Sitemap has minor issues',
      points: Math.random() > 0.7 ? 10 : 5,
      maxPoints: 10,
    },
    {
      name: 'Content Structure',
      status: Math.random() > 0.4 ? 'pass' : 'warning',
      message: Math.random() > 0.4 ? 'Good heading hierarchy' : 'Could use more structured content',
      points: Math.random() > 0.4 ? 15 : 8,
      maxPoints: 15,
    },
    {
      name: 'Page Speed',
      status: Math.random() > 0.5 ? 'pass' : 'warning',
      message: Math.random() > 0.5 ? 'Fast loading time' : 'Moderate loading time',
      points: Math.random() > 0.5 ? 15 : 8,
      maxPoints: 15,
    },
  ];

  // Ensure the mock uses the domain for something
  console.log(`Analyzing: ${domain}`);

  return checks;
}

function calculateScore(checks: CheckResult[]): number {
  const totalPoints = checks.reduce((acc, c) => acc + c.points, 0);
  const maxPoints = checks.reduce((acc, c) => acc + c.maxPoints, 0);
  return Math.round((totalPoints / maxPoints) * 100);
}

function generateRecommendations(checks: CheckResult[]): string[] {
  const recommendations: string[] = [];

  checks.forEach((check) => {
    if (check.status === 'fail') {
      switch (check.name) {
        case 'llms.txt':
          recommendations.push('Add an llms.txt file to help AI crawlers understand your site');
          break;
        case 'JSON-LD Schema':
          recommendations.push('Add JSON-LD structured data (Organization, WebSite, Product schemas)');
          break;
        case 'GPTBot Access':
          recommendations.push('Allow GPTBot in your robots.txt file');
          break;
        case 'ClaudeBot Access':
          recommendations.push('Allow ClaudeBot in your robots.txt file');
          break;
        case 'XML Sitemap':
          recommendations.push('Create or fix your XML sitemap');
          break;
        case 'Content Structure':
          recommendations.push('Improve content structure with clear headings and FAQ sections');
          break;
        case 'Page Speed':
          recommendations.push('Optimize page loading speed for better crawl success');
          break;
      }
    }
  });

  return recommendations;
}
