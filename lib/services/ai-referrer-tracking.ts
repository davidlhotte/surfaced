import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/monitoring/logger';

// Known AI referrer patterns
export const AI_REFERRER_PATTERNS = {
  chatgpt: [
    'chat.openai.com',
    'chatgpt.com',
    'openai.com',
  ],
  perplexity: [
    'perplexity.ai',
    'labs.perplexity.ai',
  ],
  claude: [
    'claude.ai',
    'anthropic.com',
  ],
  gemini: [
    'gemini.google.com',
    'bard.google.com',
  ],
  copilot: [
    'copilot.microsoft.com',
    'bing.com/chat',
  ],
  you: [
    'you.com',
  ],
  phind: [
    'phind.com',
  ],
  kagi: [
    'kagi.com',
  ],
};

// All AI domains flattened
export const ALL_AI_DOMAINS = Object.values(AI_REFERRER_PATTERNS).flat();

export interface AITrafficEntry {
  id: string;
  shopId: string;
  platform: string;
  referrer: string;
  landingPage: string;
  userAgent: string | null;
  timestamp: Date;
  sessionId: string | null;
  converted: boolean;
  conversionValue: number | null;
}

export interface AITrafficStats {
  totalVisits: number;
  uniqueSessions: number;
  platformBreakdown: Record<string, number>;
  topLandingPages: Array<{
    url: string;
    visits: number;
    conversions: number;
  }>;
  conversionRate: number;
  totalConversionValue: number;
  period: {
    start: string;
    end: string;
  };
}

/**
 * Detect which AI platform a referrer is from
 */
export function detectAIPlatform(referrer: string): string | null {
  const lowerReferrer = referrer.toLowerCase();

  for (const [platform, domains] of Object.entries(AI_REFERRER_PATTERNS)) {
    for (const domain of domains) {
      if (lowerReferrer.includes(domain)) {
        return platform;
      }
    }
  }

  return null;
}

/**
 * Check if a referrer is from an AI platform
 */
export function isAIReferrer(referrer: string): boolean {
  return detectAIPlatform(referrer) !== null;
}

/**
 * Generate tracking script for AI referrers
 * SECURITY: Sanitizes inputs to prevent XSS
 */
export function generateTrackingScript(shopDomain: string, apiEndpoint: string): string {
  // Sanitize inputs for JavaScript string context - prevent XSS
  const sanitizedDomain = shopDomain.replace(/[<>"'\\`${}]/g, '');
  const sanitizedEndpoint = apiEndpoint.replace(/[<>"'\\`${}]/g, '');

  // Validate endpoint is a valid URL
  try {
    new URL(sanitizedEndpoint);
  } catch {
    throw new Error('Invalid API endpoint URL');
  }

  // Use JSON.stringify for safe JavaScript string embedding
  return `
<!-- Surfaced AI Traffic Tracking -->
<script>
(function() {
  var AI_DOMAINS = ${JSON.stringify(ALL_AI_DOMAINS)};
  var SHOP_DOMAIN = ${JSON.stringify(sanitizedDomain)};
  var API_ENDPOINT = ${JSON.stringify(sanitizedEndpoint)};
  var referrer = document.referrer;
  var isAI = AI_DOMAINS.some(function(d) { return referrer.toLowerCase().includes(d); });

  if (isAI || sessionStorage.getItem('surfaced_ai_visit')) {
    sessionStorage.setItem('surfaced_ai_visit', 'true');
    sessionStorage.setItem('surfaced_ai_referrer', referrer || sessionStorage.getItem('surfaced_ai_referrer'));

    var data = {
      referrer: sessionStorage.getItem('surfaced_ai_referrer'),
      landingPage: window.location.pathname,
      userAgent: navigator.userAgent,
      sessionId: sessionStorage.getItem('surfaced_session_id') || (sessionStorage.setItem('surfaced_session_id', Date.now() + '-' + Math.random().toString(36).substring(2, 15)), sessionStorage.getItem('surfaced_session_id')),
      timestamp: new Date().toISOString()
    };

    fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shop-Domain': SHOP_DOMAIN },
      body: JSON.stringify(data),
      keepalive: true
    }).catch(function() {});
  }
})();
</script>
<!-- End Surfaced AI Traffic Tracking -->
`;
}

/**
 * Generate conversion tracking script
 */
export function generateConversionScript(apiEndpoint: string): string {
  return `
<!-- Surfaced AI Conversion Tracking -->
<script>
(function() {
  if (sessionStorage.getItem('surfaced_ai_visit')) {
    var orderValue = {{ checkout.total_price | money_without_currency }};
    var orderId = '{{ order.id }}';

    fetch('${apiEndpoint}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionStorage.getItem('surfaced_session_id'),
        orderId: orderId,
        orderValue: parseFloat(orderValue),
        converted: true
      }),
      keepalive: true
    }).catch(function() {});

    sessionStorage.removeItem('surfaced_ai_visit');
  }
})();
</script>
<!-- End Surfaced AI Conversion Tracking -->
`;
}

/**
 * Record an AI traffic visit
 */
export async function recordAIVisit(
  shopDomain: string,
  data: {
    referrer: string;
    landingPage: string;
    userAgent?: string;
    sessionId?: string;
  }
): Promise<void> {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: { id: true },
  });

  if (!shop) {
    throw new Error('Shop not found');
  }

  const platform = detectAIPlatform(data.referrer);

  if (!platform) {
    logger.warn({ referrer: data.referrer }, 'Non-AI referrer recorded');
    return;
  }

  await prisma.auditLog.create({
    data: {
      shopId: shop.id,
      action: 'ai_traffic_visit',
      details: {
        platform,
        referrer: data.referrer,
        landingPage: data.landingPage,
        userAgent: data.userAgent || null,
        sessionId: data.sessionId || null,
        timestamp: new Date().toISOString(),
      },
    },
  });

  logger.info({ shopDomain, platform, landingPage: data.landingPage }, 'AI visit recorded');
}

/**
 * Record an AI traffic conversion
 */
export async function recordAIConversion(
  shopDomain: string,
  data: {
    sessionId: string;
    orderId?: string;
    orderValue?: number;
  }
): Promise<void> {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: { id: true },
  });

  if (!shop) {
    throw new Error('Shop not found');
  }

  await prisma.auditLog.create({
    data: {
      shopId: shop.id,
      action: 'ai_traffic_conversion',
      details: {
        sessionId: data.sessionId,
        orderId: data.orderId || null,
        orderValue: data.orderValue || null,
        timestamp: new Date().toISOString(),
      },
    },
  });

  logger.info({ shopDomain, orderId: data.orderId, orderValue: data.orderValue }, 'AI conversion recorded');
}

/**
 * Get AI traffic statistics for a shop
 */
export async function getAITrafficStats(
  shopDomain: string,
  days: number = 30
): Promise<AITrafficStats> {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: { id: true },
  });

  if (!shop) {
    throw new Error('Shop not found');
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get all AI visits
  const visits = await prisma.auditLog.findMany({
    where: {
      shopId: shop.id,
      action: 'ai_traffic_visit',
      createdAt: { gte: startDate },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Get all conversions
  const conversions = await prisma.auditLog.findMany({
    where: {
      shopId: shop.id,
      action: 'ai_traffic_conversion',
      createdAt: { gte: startDate },
    },
  });

  // Calculate platform breakdown
  const platformBreakdown: Record<string, number> = {};
  const sessionIds = new Set<string>();
  const landingPageStats = new Map<string, { visits: number; conversions: number }>();

  for (const visit of visits) {
    const details = visit.details as {
      platform?: string;
      sessionId?: string;
      landingPage?: string;
    };

    if (details.platform) {
      platformBreakdown[details.platform] = (platformBreakdown[details.platform] || 0) + 1;
    }

    if (details.sessionId) {
      sessionIds.add(details.sessionId);
    }

    if (details.landingPage) {
      const stats = landingPageStats.get(details.landingPage) || { visits: 0, conversions: 0 };
      stats.visits++;
      landingPageStats.set(details.landingPage, stats);
    }
  }

  // Match conversions to sessions
  const convertedSessions = new Set<string>();
  let totalConversionValue = 0;

  for (const conversion of conversions) {
    const details = conversion.details as {
      sessionId?: string;
      orderValue?: number;
    };

    if (details.sessionId) {
      convertedSessions.add(details.sessionId);
    }

    if (details.orderValue) {
      totalConversionValue += details.orderValue;
    }
  }

  // Calculate conversion rate
  const conversionRate = sessionIds.size > 0
    ? Math.round((convertedSessions.size / sessionIds.size) * 100)
    : 0;

  // Get top landing pages
  const topLandingPages = Array.from(landingPageStats.entries())
    .map(([url, stats]) => ({ url, ...stats }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 10);

  return {
    totalVisits: visits.length,
    uniqueSessions: sessionIds.size,
    platformBreakdown,
    topLandingPages,
    conversionRate,
    totalConversionValue,
    period: {
      start: startDate.toISOString(),
      end: new Date().toISOString(),
    },
  };
}
