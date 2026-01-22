import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils/errors';
import { getShopFromRequest } from '@/lib/shopify/get-shop';
import {
  generateRobotsTxt,
  getDefaultRobotsTxtConfig,
  analyzeRobotsTxt,
  fetchCurrentRobotsTxt,
  saveRobotsTxtConfig,
  type RobotsTxtConfig,
} from '@/lib/services/robots-txt';
import { logger } from '@/lib/monitoring/logger';

// GET - Get robots.txt analysis and preview
export async function GET(request: NextRequest) {
  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: false });

    logger.info({ shopDomain }, 'Robots.txt analysis requested');

    // Fetch current robots.txt from shop
    const currentContent = await fetchCurrentRobotsTxt(shopDomain);

    // Analyze if exists
    const analysis = currentContent ? analyzeRobotsTxt(currentContent) : null;

    // Generate recommended robots.txt
    const defaultConfig = getDefaultRobotsTxtConfig();
    const recommendedContent = generateRobotsTxt({
      shopDomain,
      config: defaultConfig,
      includeAiSection: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        current: currentContent,
        analysis,
        recommended: recommendedContent,
        config: defaultConfig,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Robots.txt analysis failed');
    return handleApiError(error);
  }
}

// POST - Generate robots.txt with custom config
export async function POST(request: NextRequest) {
  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: true });
    const body = await request.json();

    const config: RobotsTxtConfig = {
      allowAllBots: body.allowAllBots ?? true,
      allowAiBots: body.allowAiBots ?? true,
      aiBots: body.aiBots ?? getDefaultRobotsTxtConfig().aiBots,
      disallowedPaths: body.disallowedPaths ?? getDefaultRobotsTxtConfig().disallowedPaths,
      crawlDelay: body.crawlDelay ?? null,
      sitemapUrl: body.sitemapUrl ?? null,
      customRules: body.customRules ?? null,
    };

    logger.info({ shopDomain, config }, 'Generating custom robots.txt');

    // Generate content
    const content = generateRobotsTxt({
      shopDomain,
      config,
      includeAiSection: config.allowAiBots,
    });

    // Save config
    await saveRobotsTxtConfig(shopDomain, config);

    return NextResponse.json({
      success: true,
      data: {
        content,
        config,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Robots.txt generation failed');
    return handleApiError(error);
  }
}
