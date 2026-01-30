import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/monitoring/logger';

interface SchemaValidation {
  type: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  data: Record<string, unknown>;
}

interface SchemaCheckResult {
  domain: string;
  hasSchema: boolean;
  schemas: SchemaValidation[];
  score: number;
  aeoRelevant: {
    hasOrganization: boolean;
    hasProduct: boolean;
    hasWebSite: boolean;
    hasFAQPage: boolean;
    hasBreadcrumb: boolean;
    hasArticle: boolean;
    hasLocalBusiness: boolean;
    hasHowTo: boolean;
  };
  recommendations: string[];
}

const REQUIRED_FIELDS: Record<string, string[]> = {
  Organization: ['name', '@type'],
  LocalBusiness: ['name', '@type', 'address'],
  Product: ['name', '@type'],
  WebSite: ['name', '@type', 'url'],
  FAQPage: ['@type', 'mainEntity'],
  Article: ['@type', 'headline', 'author'],
  BreadcrumbList: ['@type', 'itemListElement'],
  HowTo: ['@type', 'name', 'step'],
};

const RECOMMENDED_FIELDS: Record<string, string[]> = {
  Organization: ['url', 'logo', 'description', 'sameAs', 'contactPoint'],
  LocalBusiness: ['telephone', 'openingHours', 'priceRange', 'geo'],
  Product: ['description', 'image', 'offers', 'aggregateRating', 'brand'],
  WebSite: ['potentialAction', 'description'],
  FAQPage: [],
  Article: ['datePublished', 'image', 'publisher'],
  BreadcrumbList: [],
  HowTo: ['description', 'totalTime', 'estimatedCost'],
};

function validateSchema(schema: Record<string, unknown>): SchemaValidation {
  const type = (schema['@type'] as string) || 'Unknown';
  const normalizedType = Array.isArray(type) ? type[0] : type;
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  const requiredFields = REQUIRED_FIELDS[normalizedType] || ['@type'];
  for (const field of requiredFields) {
    if (!schema[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Check recommended fields
  const recommendedFields = RECOMMENDED_FIELDS[normalizedType] || [];
  for (const field of recommendedFields) {
    if (!schema[field]) {
      warnings.push(`Missing recommended field: ${field}`);
    }
  }

  // Validate specific schema types
  if (normalizedType === 'Product') {
    if (!schema.offers && !schema.aggregateRating) {
      warnings.push('Consider adding offers or aggregateRating for better visibility');
    }
    if (schema.offers) {
      const offers = schema.offers as Record<string, unknown>;
      if (!offers.price && !offers.priceRange) {
        warnings.push('Product offers should include price information');
      }
    }
  }

  if (normalizedType === 'Organization' || normalizedType === 'LocalBusiness') {
    if (!schema.sameAs) {
      warnings.push('Add sameAs links to your social profiles for better brand recognition');
    }
  }

  if (normalizedType === 'FAQPage') {
    const mainEntity = schema.mainEntity;
    if (Array.isArray(mainEntity)) {
      if (mainEntity.length < 3) {
        warnings.push('Consider adding more FAQ items (at least 3-5 recommended)');
      }
    }
  }

  return {
    type: normalizedType,
    isValid: errors.length === 0,
    errors,
    warnings,
    data: schema,
  };
}

async function checkSchemas(domain: string): Promise<SchemaCheckResult> {
  const result: SchemaCheckResult = {
    domain,
    hasSchema: false,
    schemas: [],
    score: 0,
    aeoRelevant: {
      hasOrganization: false,
      hasProduct: false,
      hasWebSite: false,
      hasFAQPage: false,
      hasBreadcrumb: false,
      hasArticle: false,
      hasLocalBusiness: false,
      hasHowTo: false,
    },
    recommendations: [],
  };

  try {
    const url = `https://${domain}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Surfaced Schema Checker/1.0' },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      result.recommendations.push('Could not access website to check schemas');
      return result;
    }

    const html = await response.text();

    // Find all JSON-LD scripts
    const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;

    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const data = JSON.parse(match[1]);
        const items = Array.isArray(data) ? data : [data];

        for (const item of items) {
          if (item['@graph']) {
            // Handle @graph structure
            for (const graphItem of item['@graph']) {
              const validation = validateSchema(graphItem);
              result.schemas.push(validation);
              updateAeoRelevant(result.aeoRelevant, validation.type);
            }
          } else {
            const validation = validateSchema(item);
            result.schemas.push(validation);
            updateAeoRelevant(result.aeoRelevant, validation.type);
          }
        }
      } catch {
        result.schemas.push({
          type: 'Invalid',
          isValid: false,
          errors: ['Invalid JSON in script tag'],
          warnings: [],
          data: {},
        });
      }
    }

    result.hasSchema = result.schemas.length > 0;

    // Calculate score
    let score = 0;
    if (result.aeoRelevant.hasOrganization) score += 20;
    if (result.aeoRelevant.hasWebSite) score += 15;
    if (result.aeoRelevant.hasProduct) score += 15;
    if (result.aeoRelevant.hasFAQPage) score += 20;
    if (result.aeoRelevant.hasBreadcrumb) score += 10;
    if (result.aeoRelevant.hasArticle) score += 10;
    if (result.aeoRelevant.hasLocalBusiness) score += 5;
    if (result.aeoRelevant.hasHowTo) score += 5;

    // Bonus for valid schemas
    const validSchemas = result.schemas.filter((s) => s.isValid).length;
    score += Math.min(validSchemas * 5, 20);

    result.score = Math.min(score, 100);

    // Generate recommendations
    if (!result.hasSchema) {
      result.recommendations.push(
        'Add JSON-LD structured data to your website'
      );
      result.recommendations.push(
        'Start with Organization schema to establish your brand identity'
      );
    } else {
      if (!result.aeoRelevant.hasOrganization && !result.aeoRelevant.hasLocalBusiness) {
        result.recommendations.push(
          'Add Organization or LocalBusiness schema to help AI understand your brand'
        );
      }
      if (!result.aeoRelevant.hasFAQPage) {
        result.recommendations.push(
          'Add FAQPage schema - AI assistants often pull from FAQ content'
        );
      }
      if (!result.aeoRelevant.hasWebSite) {
        result.recommendations.push(
          'Add WebSite schema with SearchAction for better AI search integration'
        );
      }

      const invalidSchemas = result.schemas.filter((s) => !s.isValid);
      if (invalidSchemas.length > 0) {
        result.recommendations.push(
          `Fix ${invalidSchemas.length} invalid schema(s) to improve visibility`
        );
      }
    }

    if (result.recommendations.length === 0) {
      result.recommendations.push(
        'Great job! Your structured data is well-implemented for AI visibility'
      );
    }
  } catch (error) {
    logger.warn({ error, domain }, 'Schema check failed');
    result.recommendations.push('Could not analyze website - check if it is accessible');
  }

  return result;
}

function updateAeoRelevant(
  aeoRelevant: SchemaCheckResult['aeoRelevant'],
  type: string
): void {
  const normalizedType = type.toLowerCase();
  if (normalizedType === 'organization') aeoRelevant.hasOrganization = true;
  if (normalizedType === 'product') aeoRelevant.hasProduct = true;
  if (normalizedType === 'website') aeoRelevant.hasWebSite = true;
  if (normalizedType === 'faqpage') aeoRelevant.hasFAQPage = true;
  if (normalizedType === 'breadcrumblist') aeoRelevant.hasBreadcrumb = true;
  if (normalizedType === 'article' || normalizedType === 'newsarticle' || normalizedType === 'blogposting')
    aeoRelevant.hasArticle = true;
  if (normalizedType === 'localbusiness' || normalizedType.includes('business'))
    aeoRelevant.hasLocalBusiness = true;
  if (normalizedType === 'howto') aeoRelevant.hasHowTo = true;
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

    const result = await checkSchemas(domain);

    return NextResponse.json(result);
  } catch (error) {
    logger.error({ error }, 'Schema check error');
    return NextResponse.json(
      { error: 'Failed to check schemas' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'JSON-LD Schema Checker',
    description: 'Validate JSON-LD structured data for AI visibility',
    aeoRelevantSchemas: [
      'Organization - Establish brand identity',
      'Product - For e-commerce sites',
      'WebSite - Site-wide information and search',
      'FAQPage - Q&A content for AI assistants',
      'Article - Blog and news content',
      'LocalBusiness - Physical locations',
      'HowTo - Step-by-step guides',
      'BreadcrumbList - Navigation structure',
    ],
    usage: {
      method: 'POST',
      body: {
        url: 'string (required) - Website URL to check',
      },
    },
  });
}
