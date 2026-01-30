import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/monitoring/logger';

interface CrawlerTestResult {
  domain: string;
  bots: {
    name: string;
    userAgent: string;
    allowed: boolean;
    statusCode: number | null;
    responseTime: number | null;
    issues: string[];
  }[];
  robotsTxt: {
    exists: boolean;
    content?: string;
  };
  summary: {
    allAllowed: boolean;
    blockedBots: string[];
    recommendations: string[];
  };
}

const AI_BOTS = [
  { name: 'GPTBot (OpenAI)', userAgent: 'GPTBot', identifier: 'gptbot' },
  { name: 'ChatGPT-User', userAgent: 'ChatGPT-User', identifier: 'chatgpt-user' },
  { name: 'ClaudeBot (Anthropic)', userAgent: 'ClaudeBot', identifier: 'claudebot' },
  { name: 'anthropic-ai', userAgent: 'anthropic-ai', identifier: 'anthropic-ai' },
  { name: 'PerplexityBot', userAgent: 'PerplexityBot', identifier: 'perplexitybot' },
  { name: 'Google-Extended', userAgent: 'Google-Extended', identifier: 'google-extended' },
  { name: 'Googlebot', userAgent: 'Googlebot', identifier: 'googlebot' },
  { name: 'Bingbot', userAgent: 'bingbot', identifier: 'bingbot' },
];

async function checkRobotsTxtForBot(
  robotsContent: string,
  botIdentifier: string
): Promise<boolean> {
  const lines = robotsContent.toLowerCase().split('\n');
  let currentAgent = '*';
  let globalDisallow = false;
  let specificAllow = false;
  let specificDisallow = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('user-agent:')) {
      currentAgent = trimmed.replace('user-agent:', '').trim();
    } else if (trimmed.startsWith('disallow:')) {
      const path = trimmed.replace('disallow:', '').trim();
      if (path === '/' || path === '/*') {
        if (currentAgent === '*') {
          globalDisallow = true;
        }
        if (currentAgent === botIdentifier.toLowerCase()) {
          specificDisallow = true;
        }
      }
    } else if (trimmed.startsWith('allow:')) {
      const path = trimmed.replace('allow:', '').trim();
      if (path === '/' || path === '/*' || path === '') {
        if (currentAgent === botIdentifier.toLowerCase()) {
          specificAllow = true;
        }
      }
    }
  }

  // Specific rules override global
  if (specificAllow) return true;
  if (specificDisallow) return false;
  if (globalDisallow) return false;

  return true; // Allowed by default
}

async function testCrawlerAccess(domain: string): Promise<CrawlerTestResult> {
  const results: CrawlerTestResult = {
    domain,
    bots: [],
    robotsTxt: { exists: false },
    summary: {
      allAllowed: true,
      blockedBots: [],
      recommendations: [],
    },
  };

  // Fetch robots.txt first
  try {
    const robotsUrl = `https://${domain}/robots.txt`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(robotsUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Surfaced Crawler Test/1.0' },
    });
    clearTimeout(timeout);

    if (response.ok) {
      results.robotsTxt.exists = true;
      results.robotsTxt.content = (await response.text()).substring(0, 3000);
    }
  } catch {
    // robots.txt doesn't exist or couldn't be fetched
  }

  // Test each bot
  for (const bot of AI_BOTS) {
    const botResult = {
      name: bot.name,
      userAgent: bot.userAgent,
      allowed: true,
      statusCode: null as number | null,
      responseTime: null as number | null,
      issues: [] as string[],
    };

    // Check robots.txt rules
    if (results.robotsTxt.exists && results.robotsTxt.content) {
      botResult.allowed = await checkRobotsTxtForBot(
        results.robotsTxt.content,
        bot.identifier
      );

      if (!botResult.allowed) {
        botResult.issues.push('Blocked by robots.txt');
        results.summary.blockedBots.push(bot.name);
        results.summary.allAllowed = false;
      }
    }

    // Test actual page access with bot user agent
    try {
      const pageUrl = `https://${domain}`;
      const startTime = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(pageUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': `${bot.userAgent}/1.0 (+https://surfaced.vercel.app)`,
        },
      });
      clearTimeout(timeout);

      botResult.statusCode = response.status;
      botResult.responseTime = Date.now() - startTime;

      if (response.status === 403) {
        botResult.allowed = false;
        botResult.issues.push('Server returned 403 Forbidden');
        if (!results.summary.blockedBots.includes(bot.name)) {
          results.summary.blockedBots.push(bot.name);
          results.summary.allAllowed = false;
        }
      } else if (response.status === 429) {
        botResult.issues.push('Rate limited (429)');
      } else if (response.status >= 500) {
        botResult.issues.push(`Server error (${response.status})`);
      }
    } catch (error) {
      botResult.issues.push('Connection failed');
      logger.warn({ error, domain, bot: bot.name }, 'Crawler test failed');
    }

    results.bots.push(botResult);
  }

  // Generate recommendations
  if (results.summary.blockedBots.length > 0) {
    results.summary.recommendations.push(
      `Unblock these AI crawlers in robots.txt: ${results.summary.blockedBots.join(', ')}`
    );
  }

  if (!results.robotsTxt.exists) {
    results.summary.recommendations.push(
      'Add a robots.txt file to explicitly control crawler access'
    );
  }

  const slowBots = results.bots.filter(
    (b) => b.responseTime && b.responseTime > 3000
  );
  if (slowBots.length > 0) {
    results.summary.recommendations.push(
      'Improve page load speed - slow responses may cause AI crawlers to skip your site'
    );
  }

  if (results.summary.recommendations.length === 0) {
    results.summary.recommendations.push(
      'Great! Your site is accessible to all major AI crawlers'
    );
  }

  return results;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Website URL is required' },
        { status: 400 }
      );
    }

    // Normalize domain
    let domain = url.trim().toLowerCase();
    domain = domain.replace(/^https?:\/\//, '');
    domain = domain.replace(/\/$/, '');
    domain = domain.split('/')[0];

    const result = await testCrawlerAccess(domain);

    return NextResponse.json(result);
  } catch (error) {
    logger.error({ error }, 'Crawler test error');
    return NextResponse.json(
      { error: 'Failed to test crawler access' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'AI Crawler Test',
    description: 'Test if AI crawlers can access your website',
    bots: AI_BOTS.map((b) => ({ name: b.name, userAgent: b.userAgent })),
    usage: {
      method: 'POST',
      body: {
        url: 'string (required) - Website URL to test',
      },
    },
  });
}
