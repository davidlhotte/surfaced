import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
  verifyWebhookSignature,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
} from '@/lib/services/universal/stripe';
import { logger } from '@/lib/monitoring/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    const event = verifyWebhookSignature(body, signature);

    if (!event) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    logger.info({ type: event.type }, 'Stripe webhook received');

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        logger.info({ sessionId: session.id }, 'Checkout completed');
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        logger.info({ invoiceId: invoice.id }, 'Payment succeeded');
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        logger.warn({ invoiceId: invoice.id }, 'Payment failed');
        // Could send email notification here
        break;
      }

      default:
        logger.debug({ type: event.type }, 'Unhandled webhook event');
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error({ error }, 'Stripe webhook error');
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
