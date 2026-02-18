import { shopify, getShopSession } from './auth';
import { prisma } from '@/lib/db/prisma';
import { Plan } from '@prisma/client';
import { logger } from '@/lib/monitoring/logger';

/**
 * Billing module for Surfaced app
 *
 * IMPORTANT: This app uses Shopify's Managed Pricing feature.
 * Plans are configured in the Shopify Partner Dashboard, not via the Billing API.
 *
 * This module only handles:
 * - Querying the current subscription status
 * - Syncing the plan to our database
 * - Mapping subscription names to our Plan enum
 */

export async function getActiveSubscription(
  shopDomain: string
): Promise<{ id: string; name: string; status: string; currentPeriodEnd?: string } | null> {
  const session = await getShopSession(shopDomain);
  if (!session) {
    logger.warn({ shopDomain }, 'No session found when checking subscription');
    return null;
  }

  try {
    const client = new shopify.clients.Graphql({ session });

    const response = await client.request(
      `query {
        currentAppInstallation {
          activeSubscriptions {
            id
            name
            status
            currentPeriodEnd
          }
        }
      }`
    );

    const data = response.data as {
      currentAppInstallation: {
        activeSubscriptions: Array<{
          id: string;
          name: string;
          status: string;
          currentPeriodEnd?: string;
        }>;
      };
    };

    const subscriptions = data.currentAppInstallation.activeSubscriptions;

    if (subscriptions.length > 0) {
      logger.info({ shopDomain, subscription: subscriptions[0] }, 'Active subscription found');
      return subscriptions[0];
    }

    logger.info({ shopDomain }, 'No active subscription found');
    return null;
  } catch (error) {
    logger.error({ error, shopDomain }, 'Failed to get active subscription');
    return null;
  }
}

/**
 * Sync the shop's plan based on their active Shopify subscription
 * This should be called periodically or after subscription webhooks
 *
 * Note: If planOverride is set, it takes priority over the Shopify subscription
 */
export async function syncShopPlanFromSubscription(shopDomain: string): Promise<Plan> {
  // Check if shop has a manual override
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: { planOverride: true },
  });

  // If planOverride is set, use it and update plan field
  if (shop?.planOverride) {
    logger.info({ shopDomain, planOverride: shop.planOverride }, 'Using plan override');
    await updateShopPlan(shopDomain, shop.planOverride);
    return shop.planOverride;
  }

  const subscription = await getActiveSubscription(shopDomain);

  let plan: Plan = Plan.FREE;

  if (subscription && subscription.status === 'ACTIVE') {
    plan = getPlanFromSubscriptionName(subscription.name);
  }

  // Update the shop's plan in our database
  await updateShopPlan(shopDomain, plan);

  return plan;
}

export async function updateShopPlan(shopDomain: string, plan: Plan): Promise<void> {
  await prisma.shop.update({
    where: { shopDomain },
    data: { plan },
  });

  logger.info({ shopDomain, plan }, 'Shop plan updated');
}

/**
 * Map Shopify subscription name to our Plan enum
 * These names should match what's configured in Shopify Partner Dashboard
 */
export function getPlanFromSubscriptionName(name: string): Plan {
  const nameLower = name.toLowerCase();

  // Match based on plan names configured in Shopify Partner Dashboard
  if (nameLower.includes('premium') || nameLower.includes('scale')) {
    return Plan.PREMIUM;
  }
  if (nameLower.includes('plus') || nameLower.includes('growth')) {
    return Plan.PLUS;
  }
  if (nameLower.includes('basic') || nameLower.includes('starter')) {
    return Plan.BASIC;
  }

  return Plan.FREE;
}

/**
 * Get the URL to manage subscription (for redirecting users)
 * With Managed Pricing, users manage their subscription through Shopify
 */
export function getSubscriptionManagementUrl(shopDomain: string): string {
  // This redirects to the Shopify admin page where users can manage their app subscription
  const shopName = shopDomain.replace('.myshopify.com', '');
  return `https://admin.shopify.com/store/${shopName}/charges/surfaced/pricing_plans`;
}
