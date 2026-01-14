import { NextRequest, NextResponse } from 'next/server';
import {
  createSubscription,
  getActiveSubscription,
} from '@/lib/shopify/billing';
import { handleApiError, ValidationError } from '@/lib/utils/errors';
import { Plan } from '@prisma/client';
import { z } from 'zod';
import { getShopFromRequest, getShopData } from '@/lib/shopify/get-shop';

const billingSchema = z.object({
  plan: z.enum(['BASIC', 'PLUS', 'PREMIUM']),
});

export async function GET(request: NextRequest) {
  try {
    const shop = await getShopFromRequest(request);
    const shopData = await getShopData(shop);

    const subscription = await getActiveSubscription(shop);

    return NextResponse.json({
      success: true,
      data: {
        plan: shopData.plan,
        trialEndsAt: shopData.trialEndsAt,
        subscription,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Billing] POST request received');

    const shop = await getShopFromRequest(request);
    console.log('[Billing] Shop from request:', shop);

    // We don't need shopData for POST, just verify the shop exists
    const shopData = await getShopData(shop);
    console.log('[Billing] Shop data found, current plan:', shopData.plan);

    const body = await request.json();
    console.log('[Billing] Request body:', body);

    const validation = billingSchema.safeParse(body);

    if (!validation.success) {
      console.log('[Billing] Validation failed:', validation.error);
      throw new ValidationError('Invalid plan');
    }

    const { plan } = validation.data;
    console.log('[Billing] Creating subscription for plan:', plan);

    const result = await createSubscription(shop, plan as Exclude<Plan, 'FREE'>);
    console.log('[Billing] Subscription result:', result);

    if (!result.confirmationUrl) {
      console.log('[Billing] No confirmation URL, error:', result.error);
      throw new ValidationError(result.error || 'Failed to create subscription');
    }

    console.log('[Billing] Success, redirecting to:', result.confirmationUrl);
    return NextResponse.json({
      success: true,
      data: { confirmationUrl: result.confirmationUrl },
    });
  } catch (error) {
    console.error('[Billing] Error:', error);
    return handleApiError(error);
  }
}
