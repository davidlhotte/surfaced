import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  recordAIVisit,
  recordAIConversion,
  getAITrafficStats,
  generateTrackingScript,
  generateConversionScript,
  isAIReferrer,
} from '@/lib/services/ai-referrer-tracking';
import { getShopFromRequest } from '@/lib/shopify/get-shop';
import { handleApiError } from '@/lib/utils/errors';
import { logger } from '@/lib/monitoring/logger';
import { prisma } from '@/lib/db/prisma';

// Schema for tracking data validation
const trackingDataSchema = z.object({
  referrer: z.string().max(2000).optional(),
  landingPage: z.string().max(500),
  userAgent: z.string().max(1000).optional(),
  sessionId: z.string().max(100).optional(),
  converted: z.boolean().optional(),
  orderId: z.string().max(100).optional(),
  orderValue: z.number().min(0).max(1000000).optional(),
});

// Simple in-memory rate limiter for tracking endpoint
const trackingRateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 100; // 100 requests per minute per shop

// GET - Get AI traffic stats or tracking scripts
export async function GET(request: NextRequest) {
  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: false });

    // Check plan access (Premium feature)
    const shop = await prisma.shop.findUnique({
      where: { shopDomain },
      select: { plan: true },
    });

    if (!shop || shop.plan !== 'PREMIUM') {
      return NextResponse.json(
        { error: 'AI traffic tracking is a Premium feature' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const days = parseInt(searchParams.get('days') || '30', 10);

    if (action === 'script') {
      // Return tracking scripts
      const apiEndpoint = `${process.env.NEXT_PUBLIC_APP_URL || 'https://surfaced.vercel.app'}/api/ai-traffic`;
      return NextResponse.json({
        trackingScript: generateTrackingScript(shopDomain, apiEndpoint),
        conversionScript: generateConversionScript(apiEndpoint),
      });
    }

    // Return stats
    const stats = await getAITrafficStats(shopDomain, days);
    return NextResponse.json(stats);
  } catch (error) {
    logger.error({ error }, 'Failed to get AI traffic data');
    return handleApiError(error);
  }
}

// POST - Record AI visit or conversion (public endpoint for tracking script)
// SECURITY: Added input validation, rate limiting, and shop verification
export async function POST(request: NextRequest) {
  try {
    const shopDomain = request.headers.get('x-shop-domain');

    if (!shopDomain) {
      return NextResponse.json({ error: 'Shop domain required' }, { status: 400 });
    }

    // Validate shop domain format (prevent injection)
    if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(shopDomain)) {
      return NextResponse.json({ error: 'Invalid shop domain' }, { status: 400 });
    }

    // Rate limiting per shop
    const now = Date.now();
    const rateKey = shopDomain;
    const rateData = trackingRateLimit.get(rateKey);

    if (rateData) {
      if (now < rateData.resetAt) {
        if (rateData.count >= RATE_LIMIT_MAX) {
          return NextResponse.json({ success: false }, { status: 429 });
        }
        rateData.count++;
      } else {
        trackingRateLimit.set(rateKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
      }
    } else {
      trackingRateLimit.set(rateKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    }

    // Verify shop exists and has Premium plan
    const shop = await prisma.shop.findUnique({
      where: { shopDomain },
      select: { id: true, plan: true },
    });

    if (!shop || shop.plan !== 'PREMIUM') {
      // Silently fail for non-premium shops (script may still be installed)
      return NextResponse.json({ success: false }, { status: 200 });
    }

    // Parse and validate body
    const body = await request.json();
    const validation = trackingDataSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false }, { status: 200 });
    }

    const data = validation.data;

    // Only record if referrer is from a known AI platform (or it's a conversion)
    if (data.converted) {
      // Record conversion
      if (data.sessionId) {
        await recordAIConversion(shopDomain, {
          sessionId: data.sessionId,
          orderId: data.orderId,
          orderValue: data.orderValue,
        });
      }
    } else if (data.referrer && isAIReferrer(data.referrer)) {
      // Record visit only if from AI platform
      await recordAIVisit(shopDomain, {
        referrer: data.referrer,
        landingPage: data.landingPage,
        userAgent: data.userAgent,
        sessionId: data.sessionId,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ error }, 'Failed to record AI traffic');
    // Don't expose errors for tracking requests
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
