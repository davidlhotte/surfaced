import { NextRequest, NextResponse } from 'next/server';
import {
  getActiveSubscription,
  syncShopPlanFromSubscription,
  getSubscriptionManagementUrl,
} from '@/lib/shopify/billing';
import { handleApiError } from '@/lib/utils/errors';
import { getShopFromRequest, getShopData } from '@/lib/shopify/get-shop';

/**
 * GET /api/billing
 *
 * Returns the current billing status for the shop.
 * With Managed Pricing, subscriptions are handled by Shopify.
 * This endpoint syncs the subscription status and returns plan info.
 */
export async function GET(request: NextRequest) {
  try {
    const shop = await getShopFromRequest(request);

    // Sync plan from Shopify subscription
    await syncShopPlanFromSubscription(shop);

    // Get fresh shop data after sync
    const shopData = await getShopData(shop);
    const subscription = await getActiveSubscription(shop);

    return NextResponse.json({
      success: true,
      data: {
        plan: shopData.plan,
        trialEndsAt: shopData.trialEndsAt,
        subscription,
        // URL for users to manage their subscription via Shopify
        managementUrl: getSubscriptionManagementUrl(shop),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/billing
 *
 * With Managed Pricing, we don't create subscriptions via API.
 * Instead, redirect users to Shopify's subscription management page.
 */
export async function POST(request: NextRequest) {
  try {
    const shop = await getShopFromRequest(request);

    // Return the URL where users can manage/upgrade their subscription
    const managementUrl = getSubscriptionManagementUrl(shop);

    return NextResponse.json({
      success: true,
      data: {
        // This URL redirects to Shopify's pricing page for this app
        confirmationUrl: managementUrl,
        message: 'Subscriptions are managed through Shopify. Redirecting to pricing page.',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
