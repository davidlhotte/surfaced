/**
 * Website Analyzer Service
 * Analyzes websites for AEO readiness: robots.txt, llms.txt, JSON-LD, sitemap
 */

import { logger } from '@/lib/monitoring/logger';

export interface RobotsTxtCheck {
  exists: boolean;
  gptBotAllowed: boolean;
  claudeBotAllowed: boolean;
  perplexityBotAllowed: boolean;
  googleBotAllowed: boolean;
  bingBotAllowed: boolean;
  content?: string;
}

export interface LlmsTxtCheck {
  exists: boolean;
  content?: string;
  sections: {
    name?: string;
    description?: string;
    contact?: string;
    sitemap?: string;
  };
  isValid: boolean;
}

export interface JsonLdCheck {
  exists: boolean;
  schemas: {
    type: string;
    isValid: boolean;
    data?: Record<string, unknown>;
  }[];
  hasOrganization: boolean;
  hasProduct: boolean;
  hasWebSite: boolean;
  hasBreadcrumb: boolean;
  hasFAQ: boolean;
}

export interface SitemapCheck {
  exists: boolean;
  urlCount: number;
  lastModified?: string;
  issues: string[];
}

export interface ContentCheck {
  hasH1: boolean;
  hasMeta: boolean;
  hasOpenGraph: boolean;
  hasTwitterCard: boolean;
  loadTimeMs: number;
  issues: string[];
}

export interface WebsiteAnalysisResult {
  domain: string;
  score: number;
  checks: {
    robotsTxt: RobotsTxtCheck;
    llmsTxt: LlmsTxtCheck;
    jsonLd: JsonLdCheck;
    sitemap: SitemapCheck;
    content: ContentCheck;
  };
  recommendations: string[];
  analyzedAt: string;
}

// Check robots.txt for AI bot access
async function checkRobotsTxt(domain: string): Promise<RobotsTxtCheck> {
  const url = `https://${domain}/robots.txt`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Surfaced AEO Analyzer/1.0',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return {
        exists: false,
        gptBotAllowed: true, // No robots.txt means allowed
        claudeBotAllowed: true,
        perplexityBotAllowed: true,
        googleBotAllowed: true,
        bingBotAllowed: true,
      };
    }

    const content = await response.text();
    const lines = content.toLowerCase().split('\n');

    // Check for bot-specific rules
    const checkBot = (botName: string): boolean => {
      let isAllowed = true;
      let currentAgent = '*';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('user-agent:')) {
          currentAgent = trimmed.replace('user-agent:', '').trim();
        } else if (trimmed.startsWith('disallow:')) {
          const path = trimmed.replace('disallow:', '').trim();
          if ((currentAgent === '*' || currentAgent === botName.toLowerCase()) && path === '/') {
            isAllowed = false;
          }
        } else if (trimmed.startsWith('allow:')) {
          const path = trimmed.replace('allow:', '').trim();
          if ((currentAgent === '*' || currentAgent === botName.toLowerCase()) && path === '/') {
            isAllowed = true;
          }
        }
      }

      return isAllowed;
    };

    return {
      exists: true,
      gptBotAllowed: checkBot('GPTBot'),
      claudeBotAllowed: checkBot('ClaudeBot') && checkBot('anthropic-ai'),
      perplexityBotAllowed: checkBot('PerplexityBot'),
      googleBotAllowed: checkBot('Googlebot'),
      bingBotAllowed: checkBot('Bingbot'),
      content: content.substring(0, 2000),
    };
  } catch (error) {
    logger.warn({ error, domain }, 'Failed to fetch robots.txt');
    return {
      exists: false,
      gptBotAllowed: true,
      claudeBotAllowed: true,
      perplexityBotAllowed: true,
      googleBotAllowed: true,
      bingBotAllowed: true,
    };
  }
}

// Check llms.txt for AI crawlers
async function checkLlmsTxt(domain: string): Promise<LlmsTxtCheck> {
  const url = `https://${domain}/llms.txt`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Surfaced AEO Analyzer/1.0',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return {
        exists: false,
        sections: {},
        isValid: false,
      };
    }

    const content = await response.text();

    // Parse llms.txt sections
    const sections: LlmsTxtCheck['sections'] = {};
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ')) {
        sections.name = trimmed.substring(2).trim();
      } else if (trimmed.startsWith('> ')) {
        sections.description = trimmed.substring(2).trim();
      } else if (trimmed.toLowerCase().includes('contact:')) {
        sections.contact = trimmed.split(':').slice(1).join(':').trim();
      } else if (trimmed.toLowerCase().includes('sitemap:')) {
        sections.sitemap = trimmed.split(':').slice(1).join(':').trim();
      }
    }

    const isValid = !!(sections.name || sections.description);

    return {
      exists: true,
      content: content.substring(0, 2000),
      sections,
      isValid,
    };
  } catch (error) {
    logger.warn({ error, domain }, 'Failed to fetch llms.txt');
    return {
      exists: false,
      sections: {},
      isValid: false,
    };
  }
}

// Check JSON-LD structured data
async function checkJsonLd(domain: string): Promise<JsonLdCheck> {
  const url = `https://${domain}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Surfaced AEO Analyzer/1.0',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return {
        exists: false,
        schemas: [],
        hasOrganization: false,
        hasProduct: false,
        hasWebSite: false,
        hasBreadcrumb: false,
        hasFAQ: false,
      };
    }

    const html = await response.text();

    // Find all JSON-LD scripts
    const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    const schemas: JsonLdCheck['schemas'] = [];
    let match;

    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const data = JSON.parse(match[1]);
        const items = Array.isArray(data) ? data : [data];

        for (const item of items) {
          const type = item['@type'] || 'Unknown';
          schemas.push({
            type: Array.isArray(type) ? type[0] : type,
            isValid: true,
            data: item,
          });
        }
      } catch {
        schemas.push({
          type: 'Invalid',
          isValid: false,
        });
      }
    }

    const types = schemas.map(s => s.type.toLowerCase());

    return {
      exists: schemas.length > 0,
      schemas: schemas.slice(0, 10), // Limit to 10
      hasOrganization: types.some(t => t === 'organization' || t === 'localbusiness'),
      hasProduct: types.some(t => t === 'product'),
      hasWebSite: types.some(t => t === 'website'),
      hasBreadcrumb: types.some(t => t === 'breadcrumblist'),
      hasFAQ: types.some(t => t === 'faqpage'),
    };
  } catch (error) {
    logger.warn({ error, domain }, 'Failed to check JSON-LD');
    return {
      exists: false,
      schemas: [],
      hasOrganization: false,
      hasProduct: false,
      hasWebSite: false,
      hasBreadcrumb: false,
      hasFAQ: false,
    };
  }
}

// Check sitemap
async function checkSitemap(domain: string): Promise<SitemapCheck> {
  const urls = [
    `https://${domain}/sitemap.xml`,
    `https://${domain}/sitemap_index.xml`,
    `https://${domain}/sitemap/sitemap.xml`,
  ];

  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Surfaced AEO Analyzer/1.0',
        },
      });
      clearTimeout(timeout);

      if (!response.ok) continue;

      const content = await response.text();

      // Count URLs in sitemap
      const urlMatches = content.match(/<loc>/gi) || [];
      const urlCount = urlMatches.length;

      // Check for lastmod
      const lastModMatch = content.match(/<lastmod>([^<]+)<\/lastmod>/i);
      const lastModified = lastModMatch ? lastModMatch[1] : undefined;

      const issues: string[] = [];
      if (urlCount === 0) {
        issues.push('Sitemap appears empty');
      }
      if (!lastModified) {
        issues.push('No lastmod dates found - helps search engines know when to re-crawl');
      }

      return {
        exists: true,
        urlCount,
        lastModified,
        issues,
      };
    } catch (error) {
      logger.warn({ error, domain, url }, 'Failed to fetch sitemap');
      continue;
    }
  }

  return {
    exists: false,
    urlCount: 0,
    issues: ['No sitemap found at common locations'],
  };
}

// Check content and meta tags
async function checkContent(domain: string): Promise<ContentCheck> {
  const url = `https://${domain}`;
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Surfaced AEO Analyzer/1.0',
      },
    });
    clearTimeout(timeout);

    const loadTimeMs = Date.now() - startTime;

    if (!response.ok) {
      return {
        hasH1: false,
        hasMeta: false,
        hasOpenGraph: false,
        hasTwitterCard: false,
        loadTimeMs,
        issues: ['Could not load page'],
      };
    }

    const html = await response.text();
    const issues: string[] = [];

    // Check for H1
    const hasH1 = /<h1[^>]*>/i.test(html);
    if (!hasH1) issues.push('Missing H1 heading');

    // Check for meta description
    const hasMeta = /<meta[^>]*name=["']description["'][^>]*>/i.test(html);
    if (!hasMeta) issues.push('Missing meta description');

    // Check for Open Graph
    const hasOpenGraph = /<meta[^>]*property=["']og:/i.test(html);
    if (!hasOpenGraph) issues.push('Missing Open Graph meta tags');

    // Check for Twitter Card
    const hasTwitterCard = /<meta[^>]*name=["']twitter:/i.test(html);
    if (!hasTwitterCard) issues.push('Missing Twitter Card meta tags');

    // Check load time
    if (loadTimeMs > 3000) {
      issues.push(`Slow page load time (${(loadTimeMs / 1000).toFixed(1)}s) - affects AI crawling`);
    }

    return {
      hasH1,
      hasMeta,
      hasOpenGraph,
      hasTwitterCard,
      loadTimeMs,
      issues,
    };
  } catch (error) {
    logger.warn({ error, domain }, 'Failed to check content');
    return {
      hasH1: false,
      hasMeta: false,
      hasOpenGraph: false,
      hasTwitterCard: false,
      loadTimeMs: Date.now() - startTime,
      issues: ['Failed to load page'],
    };
  }
}

// Calculate AEO score from checks
function calculateScore(checks: WebsiteAnalysisResult['checks']): number {
  let score = 0;
  const maxScore = 100;

  // robots.txt (15 points)
  if (checks.robotsTxt.exists) score += 3;
  if (checks.robotsTxt.gptBotAllowed) score += 3;
  if (checks.robotsTxt.claudeBotAllowed) score += 3;
  if (checks.robotsTxt.perplexityBotAllowed) score += 3;
  if (checks.robotsTxt.googleBotAllowed) score += 3;

  // llms.txt (20 points)
  if (checks.llmsTxt.exists) score += 10;
  if (checks.llmsTxt.isValid) score += 10;

  // JSON-LD (25 points)
  if (checks.jsonLd.exists) score += 5;
  if (checks.jsonLd.hasOrganization) score += 5;
  if (checks.jsonLd.hasProduct) score += 5;
  if (checks.jsonLd.hasWebSite) score += 5;
  if (checks.jsonLd.hasFAQ) score += 5;

  // Sitemap (15 points)
  if (checks.sitemap.exists) score += 10;
  if (checks.sitemap.urlCount > 0) score += 5;

  // Content (25 points)
  if (checks.content.hasH1) score += 5;
  if (checks.content.hasMeta) score += 5;
  if (checks.content.hasOpenGraph) score += 5;
  if (checks.content.hasTwitterCard) score += 5;
  if (checks.content.loadTimeMs < 3000) score += 5;

  return Math.min(score, maxScore);
}

// Generate recommendations
function generateRecommendations(checks: WebsiteAnalysisResult['checks']): string[] {
  const recommendations: string[] = [];

  // robots.txt recommendations
  if (!checks.robotsTxt.gptBotAllowed) {
    recommendations.push('Allow GPTBot in robots.txt to enable ChatGPT to access your content');
  }
  if (!checks.robotsTxt.claudeBotAllowed) {
    recommendations.push('Allow ClaudeBot/anthropic-ai in robots.txt for Claude access');
  }
  if (!checks.robotsTxt.perplexityBotAllowed) {
    recommendations.push('Allow PerplexityBot in robots.txt for Perplexity access');
  }

  // llms.txt recommendations
  if (!checks.llmsTxt.exists) {
    recommendations.push('Add an llms.txt file to help AI crawlers understand your brand and content');
  } else if (!checks.llmsTxt.isValid) {
    recommendations.push('Improve your llms.txt with a clear name, description, and contact info');
  }

  // JSON-LD recommendations
  if (!checks.jsonLd.exists) {
    recommendations.push('Add JSON-LD structured data to help AI understand your content');
  } else {
    if (!checks.jsonLd.hasOrganization) {
      recommendations.push('Add Organization schema to establish brand identity for AI');
    }
    if (!checks.jsonLd.hasFAQ) {
      recommendations.push('Add FAQPage schema - AI assistants love structured Q&A content');
    }
  }

  // Sitemap recommendations
  if (!checks.sitemap.exists) {
    recommendations.push('Add an XML sitemap to help AI crawlers discover all your content');
  }

  // Content recommendations
  if (!checks.content.hasH1) {
    recommendations.push('Add a clear H1 heading that describes your page content');
  }
  if (!checks.content.hasMeta) {
    recommendations.push('Add a compelling meta description for better AI understanding');
  }
  if (checks.content.loadTimeMs > 3000) {
    recommendations.push('Improve page load speed - slow sites may be skipped by AI crawlers');
  }

  if (recommendations.length === 0) {
    recommendations.push('Great job! Your website is well-optimized for AI visibility.');
  }

  return recommendations;
}

/**
 * Analyze a website for AEO readiness
 */
export async function analyzeWebsite(domain: string): Promise<WebsiteAnalysisResult> {
  logger.info({ domain }, 'Starting website analysis');

  // Normalize domain
  let cleanDomain = domain.trim().toLowerCase();
  cleanDomain = cleanDomain.replace(/^https?:\/\//, '');
  cleanDomain = cleanDomain.replace(/\/$/, '');
  cleanDomain = cleanDomain.split('/')[0]; // Only keep domain part

  // Run all checks in parallel
  const [robotsTxt, llmsTxt, jsonLd, sitemap, content] = await Promise.all([
    checkRobotsTxt(cleanDomain),
    checkLlmsTxt(cleanDomain),
    checkJsonLd(cleanDomain),
    checkSitemap(cleanDomain),
    checkContent(cleanDomain),
  ]);

  const checks = { robotsTxt, llmsTxt, jsonLd, sitemap, content };
  const score = calculateScore(checks);
  const recommendations = generateRecommendations(checks);

  return {
    domain: cleanDomain,
    score,
    checks,
    recommendations,
    analyzedAt: new Date().toISOString(),
  };
}
