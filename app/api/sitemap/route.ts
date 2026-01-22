import { NextRequest, NextResponse } from 'next/server';
import {
  generateShopSitemap,
  analyzeSitemap,
  DEFAULT_SITEMAP_CONFIG,
  SitemapConfig,
} from '@/lib/services/sitemap';
import { getShopFromRequest } from '@/lib/shopify/get-shop';
import { handleApiError } from '@/lib/utils/errors';
import { logger } from '@/lib/monitoring/logger';

// GET - Generate or analyze sitemap
export async function GET(request: NextRequest) {
  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: false });

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'analyze') {
      // Analyze existing sitemap
      const sitemapUrl = searchParams.get('url');
      if (!sitemapUrl) {
        // Default to shop's sitemap
        const defaultUrl = `https://${shopDomain}/sitemap.xml`;
        const analysis = await analyzeSitemap(defaultUrl);
        return NextResponse.json(analysis);
      }

      const analysis = await analyzeSitemap(sitemapUrl);
      return NextResponse.json(analysis);
    }

    // Generate new sitemap
    const result = await generateShopSitemap(shopDomain);
    return NextResponse.json(result);
  } catch (error) {
    logger.error({ error }, 'Failed to process sitemap request');
    return handleApiError(error);
  }
}

// POST - Generate sitemap with custom config
export async function POST(request: NextRequest) {
  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: false });

    const body = await request.json();
    const config: SitemapConfig = {
      ...DEFAULT_SITEMAP_CONFIG,
      ...body.config,
    };

    const result = await generateShopSitemap(shopDomain, config);

    // Return as downloadable XML if requested
    if (body.download) {
      return new NextResponse(result.sitemap, {
        headers: {
          'Content-Type': 'application/xml',
          'Content-Disposition': 'attachment; filename="sitemap.xml"',
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    logger.error({ error }, 'Failed to generate sitemap');
    return handleApiError(error);
  }
}
