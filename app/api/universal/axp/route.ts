import { NextRequest, NextResponse } from 'next/server';
import {
  generateAXPContent,
  generateLlmsTxt,
  generateJsonLd,
  validateLlmsTxt,
  LlmsTxtConfig,
} from '@/lib/services/universal/axp-generator';
import { logger } from '@/lib/monitoring/logger';

// Rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, limit: number = 10): boolean {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour

  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { action, config } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required (generate, validate, preview)' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'generate': {
        if (!config || !config.brand || !config.url) {
          return NextResponse.json(
            { error: 'Brand and URL are required in config' },
            { status: 400 }
          );
        }

        const axpContent = generateAXPContent(config as LlmsTxtConfig);

        return NextResponse.json({
          success: true,
          content: axpContent,
          validation: validateLlmsTxt(axpContent.llmsTxt),
        });
      }

      case 'validate': {
        const { content } = body;

        if (!content) {
          return NextResponse.json(
            { error: 'Content to validate is required' },
            { status: 400 }
          );
        }

        const validation = validateLlmsTxt(content);

        return NextResponse.json({
          success: true,
          validation,
        });
      }

      case 'preview-llms': {
        if (!config || !config.brand) {
          return NextResponse.json(
            { error: 'Config with brand is required' },
            { status: 400 }
          );
        }

        const llmsTxt = generateLlmsTxt(config as LlmsTxtConfig);

        return NextResponse.json({
          success: true,
          llmsTxt,
          validation: validateLlmsTxt(llmsTxt),
        });
      }

      case 'preview-jsonld': {
        if (!config || !config.brand) {
          return NextResponse.json(
            { error: 'Config with brand is required' },
            { status: 400 }
          );
        }

        const jsonLd = generateJsonLd(config as LlmsTxtConfig);

        return NextResponse.json({
          success: true,
          jsonLd,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error({ error }, 'AXP generation error');
    return NextResponse.json(
      { error: 'Failed to generate AXP content' },
      { status: 500 }
    );
  }
}

// GET route for documentation
export async function GET() {
  return NextResponse.json({
    name: 'AXP Generator API',
    description: 'Generate AI-optimized content for better visibility',
    endpoints: {
      'POST /api/universal/axp': {
        description: 'Generate AXP content',
        actions: {
          generate: {
            description: 'Generate complete AXP content package',
            body: {
              action: 'generate',
              config: {
                brand: 'string (required)',
                description: 'string (required)',
                url: 'string (required)',
                products: 'array (optional)',
                services: 'array (optional)',
                faqs: 'array (optional)',
                targetAudience: 'array (optional)',
                useCases: 'array (optional)',
                differentiators: 'array (optional)',
                pricingModel: 'string (optional)',
                contact: 'object (optional)',
                social: 'object (optional)',
              },
            },
            response: {
              llmsTxt: 'string - llms.txt content',
              llmsFullTxt: 'string - Extended llms-full.txt',
              jsonLd: 'object - JSON-LD schemas',
              metaDescriptions: 'object - AI-optimized meta descriptions',
              aiSnippets: 'array - Short AI-friendly summaries',
              contentRecommendations: 'array - Content suggestions',
            },
          },
          validate: {
            description: 'Validate existing llms.txt content',
            body: {
              action: 'validate',
              content: 'string - llms.txt content to validate',
            },
          },
          'preview-llms': {
            description: 'Preview llms.txt generation',
            body: {
              action: 'preview-llms',
              config: '(same as generate)',
            },
          },
          'preview-jsonld': {
            description: 'Preview JSON-LD generation',
            body: {
              action: 'preview-jsonld',
              config: '(same as generate)',
            },
          },
        },
      },
    },
    example: {
      action: 'generate',
      config: {
        brand: 'Surfaced',
        description: 'AI visibility and Answer Engine Optimization platform',
        url: 'https://surfaced.io',
        targetAudience: ['ecommerce brands', 'SaaS companies', 'marketing teams'],
        useCases: ['Track AI visibility', 'Optimize for AI search', 'Monitor competitors'],
        differentiators: [
          'Multi-platform AI tracking',
          'Real-time visibility monitoring',
          'Actionable optimization recommendations',
        ],
        products: [
          {
            name: 'AI Visibility Checker',
            description: 'Check how AI assistants see your brand',
            price: 'Free',
          },
          {
            name: 'AEO Dashboard',
            description: 'Full visibility analytics and tracking',
            price: 'Starting at $29/month',
          },
        ],
        faqs: [
          {
            question: 'What is AEO?',
            answer: 'Answer Engine Optimization is the practice of optimizing content for AI assistants.',
          },
        ],
      },
    },
  });
}
