import { shopify, getShopSession } from './auth';
import { prisma } from '@/lib/db/prisma';
import { Plan } from '@prisma/client';
import { PLAN_PRICES } from '@/lib/constants/plans';
import { logger } from '@/lib/monitoring/logger';

export type BillingPlan = {
  name: string;
  price: number;
  trialDays: number;
  test: boolean;
};

// Allow test mode in production for development stores via env var
const isTestMode = process.env.NODE_ENV !== 'production' || process.env.SHOPIFY_BILLING_TEST === 'true';

const BILLING_PLANS: Record<Exclude<Plan, 'FREE'>, BillingPlan> = {
  [Plan.BASIC]: {
    name: 'LocateUs Basic',
    price: PLAN_PRICES[Plan.BASIC],
    trialDays: 7,
    test: isTestMode,
  },
  [Plan.PLUS]: {
    name: 'LocateUs Plus',
    price: PLAN_PRICES[Plan.PLUS],
    trialDays: 7,
    test: isTestMode,
  },
  [Plan.PREMIUM]: {
    name: 'LocateUs Premium',
    price: PLAN_PRICES[Plan.PREMIUM],
    trialDays: 7,
    test: isTestMode,
  },
};

export type SubscriptionResult = {
  confirmationUrl: string | null;
  error?: string;
};

export async function createSubscription(
  shopDomain: string,
  plan: Exclude<Plan, 'FREE'>
): Promise<SubscriptionResult> {
  console.log('[createSubscription] Starting for shop:', shopDomain, 'plan:', plan);

  const session = await getShopSession(shopDomain);
  if (!session) {
    console.log('[createSubscription] No session found');
    logger.error({ shopDomain }, 'No session found for shop');
    return { confirmationUrl: null, error: 'No session found for shop. Please reinstall the app.' };
  }

  console.log('[createSubscription] Session found, accessToken starts with:', session.accessToken?.substring(0, 20));

  // Check if we have a real access token (not a dev token)
  if (!session.accessToken || session.accessToken.startsWith('dev-token')) {
    console.log('[createSubscription] Invalid token - starts with dev-token or empty');
    logger.error({ shopDomain }, 'Invalid or dev access token - app needs to be reinstalled');
    return { confirmationUrl: null, error: 'Invalid access token. Please reinstall the app.' };
  }

  console.log('[createSubscription] Token looks valid, proceeding with billing');

  const billingPlan = BILLING_PLANS[plan];
  // Clean URL: remove whitespace, newlines, and ensure no trailing slash
  const appUrl = (process.env.SHOPIFY_APP_URL || '').trim().replace(/[\n\r]/g, '').replace(/\/$/, '');
  const returnUrl = `${appUrl}/api/billing/callback?shop=${shopDomain}`;

  try {
    const client = new shopify.clients.Graphql({ session });

    const response = await client.request(
      `mutation CreateSubscription($name: String!, $returnUrl: URL!, $trialDays: Int!, $test: Boolean!, $lineItems: [AppSubscriptionLineItemInput!]!) {
        appSubscriptionCreate(
          name: $name
          returnUrl: $returnUrl
          trialDays: $trialDays
          test: $test
          lineItems: $lineItems
        ) {
          appSubscription {
            id
          }
          confirmationUrl
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          name: billingPlan.name,
          returnUrl,
          trialDays: billingPlan.trialDays,
          test: billingPlan.test,
          lineItems: [
            {
              plan: {
                appRecurringPricingDetails: {
                  price: { amount: billingPlan.price, currencyCode: 'USD' },
                  interval: 'EVERY_30_DAYS',
                },
              },
            },
          ],
        },
      }
    );

    const data = response.data as {
      appSubscriptionCreate: {
        confirmationUrl: string | null;
        userErrors: Array<{ field: string; message: string }>;
      };
    };

    if (data.appSubscriptionCreate.userErrors.length > 0) {
      const errorMessages = data.appSubscriptionCreate.userErrors.map(e => e.message).join(', ');
      logger.error({
        errors: data.appSubscriptionCreate.userErrors,
        shopDomain,
      }, 'Billing errors');
      return { confirmationUrl: null, error: `Shopify billing error: ${errorMessages}` };
    }

    return { confirmationUrl: data.appSubscriptionCreate.confirmationUrl };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ error, shopDomain, plan }, 'Failed to create subscription');
    return { confirmationUrl: null, error: `Failed to create subscription: ${errorMessage}` };
  }
}

export async function getActiveSubscription(
  shopDomain: string
): Promise<{ id: string; name: string; status: string } | null> {
  const session = await getShopSession(shopDomain);
  if (!session) {
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
          }
        }
      }`
    );

    const data = response.data as {
      currentAppInstallation: {
        activeSubscriptions: Array<{ id: string; name: string; status: string }>;
      };
    };

    const subscriptions = data.currentAppInstallation.activeSubscriptions;
    return subscriptions.length > 0 ? subscriptions[0] : null;
  } catch (error) {
    logger.error({ error, shopDomain }, 'Failed to get active subscription');
    return null;
  }
}

export async function updateShopPlan(shopDomain: string, plan: Plan): Promise<void> {
  await prisma.shop.update({
    where: { shopDomain },
    data: { plan },
  });

  logger.info({ shopDomain, plan }, 'Shop plan updated');
}

export function getPlanFromSubscriptionName(name: string): Plan {
  if (name.includes('Premium')) return Plan.PREMIUM;
  if (name.includes('Plus')) return Plan.PLUS;
  if (name.includes('Basic')) return Plan.BASIC;
  return Plan.FREE;
}
