/**
 * Stripe Billing Service for Universal SaaS
 */

import Stripe from 'stripe';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/monitoring/logger';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// Plan configuration
export const PLANS = {
  FREE: {
    name: 'Free',
    priceId: null,
    price: 0,
    features: {
      brands: 1,
      checksPerMonth: 10,
      competitors: 0,
      reports: false,
      api: false,
    },
  },
  PRO: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRICE_PRO,
    price: 29,
    features: {
      brands: 5,
      checksPerMonth: 100,
      competitors: 3,
      reports: true,
      api: false,
    },
  },
  BUSINESS: {
    name: 'Business',
    priceId: process.env.STRIPE_PRICE_BUSINESS,
    price: 79,
    features: {
      brands: 20,
      checksPerMonth: 500,
      competitors: 10,
      reports: true,
      api: true,
    },
  },
  ENTERPRISE: {
    name: 'Enterprise',
    priceId: process.env.STRIPE_PRICE_ENTERPRISE,
    price: 199,
    features: {
      brands: -1, // unlimited
      checksPerMonth: -1,
      competitors: -1,
      reports: true,
      api: true,
    },
  },
};

export type PlanType = keyof typeof PLANS;

/**
 * Create a Stripe customer for a user
 */
export async function createCustomer(userId: string, email: string, name?: string): Promise<string | null> {
  if (!stripe) {
    logger.warn('Stripe not configured');
    return null;
  }

  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId,
      },
    });

    // Save customer ID to user
    await prisma.universalUser.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });

    return customer.id;
  } catch (error) {
    logger.error({ error, userId }, 'Failed to create Stripe customer');
    return null;
  }
}

/**
 * Create a checkout session for subscription
 */
export async function createCheckoutSession(
  userId: string,
  plan: PlanType,
  successUrl: string,
  cancelUrl: string
): Promise<string | null> {
  if (!stripe) {
    logger.warn('Stripe not configured');
    return null;
  }

  const planConfig = PLANS[plan];
  if (!planConfig.priceId) {
    logger.error({ plan }, 'No price ID for plan');
    return null;
  }

  try {
    const user = await prisma.universalUser.findUnique({
      where: { id: userId },
      select: { email: true, stripeCustomerId: true },
    });

    if (!user) {
      return null;
    }

    let customerId = user.stripeCustomerId;

    // Create customer if doesn't exist
    if (!customerId) {
      customerId = await createCustomer(userId, user.email);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId || undefined,
      customer_email: customerId ? undefined : user.email,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: planConfig.priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        plan,
      },
      subscription_data: {
        metadata: {
          userId,
          plan,
        },
      },
    });

    return session.url;
  } catch (error) {
    logger.error({ error, userId, plan }, 'Failed to create checkout session');
    return null;
  }
}

/**
 * Create a billing portal session
 */
export async function createPortalSession(
  userId: string,
  returnUrl: string
): Promise<string | null> {
  if (!stripe) {
    return null;
  }

  try {
    const user = await prisma.universalUser.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      return null;
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl,
    });

    return session.url;
  } catch (error) {
    logger.error({ error, userId }, 'Failed to create portal session');
    return null;
  }
}

/**
 * Handle subscription updated webhook
 */
export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  const userId = subscription.metadata.userId;
  const plan = subscription.metadata.plan as PlanType;

  if (!userId || !plan) {
    logger.warn({ subscriptionId: subscription.id }, 'Missing metadata in subscription');
    return;
  }

  try {
    await prisma.universalUser.update({
      where: { id: userId },
      data: {
        plan,
        stripeSubscriptionId: subscription.id,
        stripeSubscriptionStatus: subscription.status,
        subscriptionEndsAt: (() => {
          const periodEnd = (subscription as unknown as Record<string, unknown>).currentPeriodEnd ||
            (subscription as unknown as Record<string, unknown>).current_period_end;
          return typeof periodEnd === 'number' ? new Date(periodEnd * 1000) : null;
        })(),
      },
    });

    logger.info({ userId, plan }, 'Subscription updated');
  } catch (error) {
    logger.error({ error, userId }, 'Failed to update subscription');
  }
}

/**
 * Handle subscription deleted webhook
 */
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  const userId = subscription.metadata.userId;

  if (!userId) {
    return;
  }

  try {
    await prisma.universalUser.update({
      where: { id: userId },
      data: {
        plan: 'FREE',
        stripeSubscriptionId: null,
        stripeSubscriptionStatus: null,
        subscriptionEndsAt: null,
      },
    });

    logger.info({ userId }, 'Subscription cancelled');
  } catch (error) {
    logger.error({ error, userId }, 'Failed to handle subscription deletion');
  }
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event | null {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return null;
  }

  try {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    logger.error({ error }, 'Webhook signature verification failed');
    return null;
  }
}
