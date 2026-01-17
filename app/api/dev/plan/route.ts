import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { Plan } from '@prisma/client';

// DEV/ADMIN: Change plan directly for testing (no billing)
// Access via ?dev=surfaced query param on settings page
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plan } = body;

    // Get shop from header (set by authenticatedFetch)
    const shopDomain = request.headers.get('x-shopify-shop-domain');

    if (!shopDomain) {
      return NextResponse.json(
        { success: false, error: 'Shop not found' },
        { status: 400 }
      );
    }

    // Validate plan
    if (!['FREE', 'BASIC', 'PLUS', 'PREMIUM'].includes(plan)) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan' },
        { status: 400 }
      );
    }

    await prisma.shop.update({
      where: { shopDomain },
      data: { plan: plan as Plan },
    });

    return NextResponse.json({
      success: true,
      data: { plan, shop: shopDomain },
    });
  } catch (error) {
    console.error('Dev plan change error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to change plan' },
      { status: 500 }
    );
  }
}
