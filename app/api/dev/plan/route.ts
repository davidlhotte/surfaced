import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { Plan } from '@prisma/client';

// DEV/ADMIN: Change plan directly for testing
export async function POST(request: NextRequest) {
  // Allow in development OR with admin secret
  const adminSecret = request.headers.get('x-admin-secret');
  const isAuthorized =
    process.env.NODE_ENV === 'development' ||
    (adminSecret && adminSecret === process.env.CRON_SECRET);

  if (!isAuthorized) {
    return NextResponse.json(
      { success: false, error: 'Not authorized' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { plan, shop } = body;

    // Validate plan
    if (!['FREE', 'BASIC', 'PLUS', 'PREMIUM'].includes(plan)) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan' },
        { status: 400 }
      );
    }

    const targetShop = shop || 'locateus-2.myshopify.com';

    await prisma.shop.update({
      where: { shopDomain: targetShop },
      data: { plan: plan as Plan },
    });

    return NextResponse.json({
      success: true,
      data: { plan },
    });
  } catch (error) {
    console.error('Dev plan change error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to change plan' },
      { status: 500 }
    );
  }
}
