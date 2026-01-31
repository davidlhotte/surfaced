import { NextRequest, NextResponse } from 'next/server';
import {
  fetchGA4Analytics,
  compareEstimatedVsActual,
  calculateVisibilityCorrelation,
  validateGA4Access,
  generateAITrackingParams,
  getAIEventDefinitions,
  GA4Credentials,
} from '@/lib/services/universal/ga4-integration';
import { runUniversalAICheck, isAIConfigured } from '@/lib/services/universal/ai-checker';
import { estimateAITraffic } from '@/lib/services/universal/traffic-estimation';
import { logger } from '@/lib/monitoring/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, credentials, brand, domain, industry } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'validate': {
        if (!credentials?.propertyId) {
          return NextResponse.json(
            { error: 'GA4 property ID is required' },
            { status: 400 }
          );
        }

        const validation = await validateGA4Access(credentials as GA4Credentials);

        return NextResponse.json({
          success: validation.valid,
          propertyName: validation.propertyName,
          error: validation.error,
        });
      }

      case 'fetch': {
        if (!credentials?.propertyId) {
          return NextResponse.json(
            { error: 'GA4 credentials are required' },
            { status: 400 }
          );
        }

        const dateRange = body.dateRange || {
          startDate: '30daysAgo',
          endDate: 'today',
        };

        const analytics = await fetchGA4Analytics(
          credentials as GA4Credentials,
          dateRange
        );

        return NextResponse.json({
          success: true,
          data: analytics,
        });
      }

      case 'compare': {
        // Compare estimated vs actual traffic
        if (!credentials?.propertyId || !brand) {
          return NextResponse.json(
            { error: 'GA4 credentials and brand name are required' },
            { status: 400 }
          );
        }

        // Fetch GA4 data
        const ga4Data = await fetchGA4Analytics(credentials as GA4Credentials);

        // Run AI visibility check if configured
        let aiCheckResult;
        if (isAIConfigured()) {
          aiCheckResult = await runUniversalAICheck(brand, {
            domain,
            industry,
            journeyStages: ['awareness', 'consideration', 'decision', 'branded'],
          });
        } else {
          // Use mock data
          aiCheckResult = getMockAICheckResult(brand);
        }

        // Estimate traffic
        const trafficEstimate = estimateAITraffic(aiCheckResult, {
          monthlySearchVolume: body.monthlySearchVolume,
          industry,
        });

        // Compare
        const comparison = compareEstimatedVsActual(trafficEstimate, ga4Data, aiCheckResult);

        // Add visibility correlation
        ga4Data.correlationWithVisibility = calculateVisibilityCorrelation(aiCheckResult, ga4Data);

        return NextResponse.json({
          success: true,
          estimated: trafficEstimate,
          actual: ga4Data,
          accuracy: comparison.accuracy,
          insights: comparison.insights,
          recommendations: comparison.recommendations,
        });
      }

      case 'tracking-params': {
        const { platform, campaign } = body;

        if (!platform) {
          return NextResponse.json(
            { error: 'Platform is required' },
            { status: 400 }
          );
        }

        const params = generateAITrackingParams(platform, campaign);

        return NextResponse.json({
          success: true,
          params,
          fullUrl: domain ? `${domain}?${params}` : params,
        });
      }

      case 'event-definitions': {
        const events = getAIEventDefinitions();

        return NextResponse.json({
          success: true,
          events,
          gtmTemplate: generateGTMTemplate(events),
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error({ error }, 'GA4 integration error');
    return NextResponse.json(
      { error: 'Failed to process GA4 request' },
      { status: 500 }
    );
  }
}

// GET route for documentation
export async function GET() {
  return NextResponse.json({
    name: 'GA4 Integration API',
    description: 'Connect Google Analytics 4 to correlate AI visibility with actual traffic',
    endpoints: {
      'POST /api/universal/ga4': {
        actions: {
          validate: {
            description: 'Validate GA4 property access',
            body: {
              action: 'validate',
              credentials: {
                propertyId: 'string (required)',
                accessToken: 'string (optional)',
              },
            },
          },
          fetch: {
            description: 'Fetch GA4 analytics data',
            body: {
              action: 'fetch',
              credentials: {
                propertyId: 'string (required)',
                accessToken: 'string (optional)',
              },
              dateRange: {
                startDate: 'string (YYYY-MM-DD or "30daysAgo")',
                endDate: 'string (YYYY-MM-DD or "today")',
              },
            },
          },
          compare: {
            description: 'Compare estimated vs actual AI traffic',
            body: {
              action: 'compare',
              credentials: 'object (required)',
              brand: 'string (required)',
              domain: 'string (optional)',
              industry: 'string (optional)',
            },
          },
          'tracking-params': {
            description: 'Generate UTM tracking parameters for AI campaigns',
            body: {
              action: 'tracking-params',
              platform: 'string (required) - chatgpt, claude, perplexity, etc.',
              campaign: 'string (optional)',
            },
          },
          'event-definitions': {
            description: 'Get custom GA4 event definitions for AI tracking',
            body: {
              action: 'event-definitions',
            },
          },
        },
      },
    },
    features: [
      'AI traffic identification from referrers',
      'Platform-by-platform traffic breakdown',
      'Estimated vs actual traffic comparison',
      'Visibility-to-traffic correlation analysis',
      'Custom event tracking for AI referrals',
    ],
  });
}

// Mock AI check result for when OpenRouter is not configured
function getMockAICheckResult(brand: string) {
  return {
    brand,
    aeoScore: 55,
    platforms: [
      { platform: 'chatgpt' as const, mentioned: true, position: 2, sentiment: 'positive' as const, displayName: 'ChatGPT', icon: '🤖', tier: 'core' as const, snippet: '', rawResponse: '', competitors: [], citations: [], journeyStage: 'branded' as const, region: 'global' as const, query: '' },
      { platform: 'perplexity' as const, mentioned: true, position: 1, sentiment: 'positive' as const, displayName: 'Perplexity', icon: '🔮', tier: 'core' as const, snippet: '', rawResponse: '', competitors: [], citations: [], journeyStage: 'branded' as const, region: 'global' as const, query: '' },
      { platform: 'gemini' as const, mentioned: true, position: 3, sentiment: 'neutral' as const, displayName: 'Gemini', icon: '💎', tier: 'core' as const, snippet: '', rawResponse: '', competitors: [], citations: [], journeyStage: 'branded' as const, region: 'global' as const, query: '' },
      { platform: 'claude' as const, mentioned: false, position: null, sentiment: 'neutral' as const, displayName: 'Claude', icon: '🟠', tier: 'core' as const, snippet: '', rawResponse: '', competitors: [], citations: [], journeyStage: 'branded' as const, region: 'global' as const, query: '' },
    ],
    recommendations: [],
    citations: { total: 0, ownSite: 0, topCited: [] },
    gapAnalysis: [],
    journeyBreakdown: {
      awareness: { score: 40, platforms: 1 },
      consideration: { score: 50, platforms: 2 },
      decision: { score: 60, platforms: 2 },
      branded: { score: 75, platforms: 3 },
    },
    competitorComparison: [],
    region: 'global' as const,
    checkedAt: new Date().toISOString(),
  };
}

// Generate GTM template for AI tracking events
function generateGTMTemplate(events: { name: string; parameters: string[]; description: string }[]) {
  return {
    containerVersion: {
      tag: events.map((event, index) => ({
        accountId: 'YOUR_ACCOUNT_ID',
        containerId: 'YOUR_CONTAINER_ID',
        tagId: `ai_tracking_${index + 1}`,
        name: `AI Event - ${event.name}`,
        type: 'gaawe',
        parameter: [
          { type: 'template', key: 'eventName', value: event.name },
          ...event.parameters.map(param => ({
            type: 'template',
            key: param,
            value: `{{${param}}}`,
          })),
        ],
        firingTriggerId: [`trigger_${event.name}`],
      })),
      trigger: events.map((event, index) => ({
        accountId: 'YOUR_ACCOUNT_ID',
        containerId: 'YOUR_CONTAINER_ID',
        triggerId: `trigger_${event.name}`,
        name: `Trigger - ${event.name}`,
        type: 'customEvent',
        customEventFilter: [
          {
            type: 'equals',
            parameter: [
              { type: 'template', key: 'arg0', value: '{{_event}}' },
              { type: 'template', key: 'arg1', value: event.name },
            ],
          },
        ],
      })),
    },
    instructions: [
      '1. Import this template into Google Tag Manager',
      '2. Replace YOUR_ACCOUNT_ID and YOUR_CONTAINER_ID with your values',
      '3. Create variables for each parameter',
      '4. Add the dataLayer push calls to your website for each event',
    ],
    dataLayerExamples: events.map(event => ({
      event: event.name,
      parameters: Object.fromEntries(event.parameters.map(p => [p, `<${p}_value>`])),
      code: `dataLayer.push({
  event: '${event.name}',
  ${event.parameters.map(p => `${p}: '<${p}_value>'`).join(',\n  ')}
});`,
    })),
  };
}
