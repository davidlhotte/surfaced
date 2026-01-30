import { NextRequest, NextResponse } from 'next/server';
import { verifyUniversalSession } from '@/lib/auth/universal-session';
import {
  createCheckoutSession,
  createPortalSession,
  PLANS,
  PlanType,
} from '@/lib/services/universal/stripe';
import { logger } from '@/lib/monitoring/logger';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// GET - Get available plans
export async function GET(request: NextRequest) {
  const session = await verifyUniversalSession(request);

  const plans = Object.entries(PLANS).map(([key, value]) => ({
    id: key,
    name: value.name,
    price: value.price,
    features: value.features,
    current: session?.plan === key,
  }));

  return NextResponse.json({
    plans,
    currentPlan: session?.plan || 'FREE',
  });
}

// POST - Create checkout or portal session
export async function POST(request: NextRequest) {
  try {
    const session = await verifyUniversalSession(request);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, plan } = body;

    if (action === 'checkout') {
      if (!plan || !PLANS[plan as PlanType]) {
        return NextResponse.json(
          { error: 'Invalid plan' },
          { status: 400 }
        );
      }

      if (plan === 'FREE') {
        return NextResponse.json(
          { error: 'Cannot checkout for free plan' },
          { status: 400 }
        );
      }

      const checkoutUrl = await createCheckoutSession(
        session.userId,
        plan as PlanType,
        `${APP_URL}/dashboard?checkout=success`,
        `${APP_URL}/pricing?checkout=cancelled`
      );

      if (!checkoutUrl) {
        return NextResponse.json(
          { error: 'Failed to create checkout session' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        url: checkoutUrl,
      });
    }

    if (action === 'portal') {
      const portalUrl = await createPortalSession(
        session.userId,
        `${APP_URL}/dashboard`
      );

      if (!portalUrl) {
        return NextResponse.json(
          { error: 'No active subscription to manage' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        url: portalUrl,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    logger.error({ error }, 'Billing error');
    return NextResponse.json(
      { error: 'Failed to process billing request' },
      { status: 500 }
    );
  }
}
