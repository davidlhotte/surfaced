import { NextResponse } from 'next/server';
import prisma from '@/lib/db/client';
import { getUniversalUser } from '@/lib/auth/universal';

const VALID_PLANS = ['FREE', 'STARTER', 'GROWTH', 'SCALE'];

export async function POST(request: Request) {
  try {
    // Verify user is authenticated
    const currentUser = await getUniversalUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { userId, plan } = await request.json();

    // Verify user is changing their own plan
    if (currentUser.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Cannot change another user\'s plan' },
        { status: 403 }
      );
    }

    // Validate plan
    if (!VALID_PLANS.includes(plan)) {
      return NextResponse.json(
        { success: false, error: `Invalid plan. Must be one of: ${VALID_PLANS.join(', ')}` },
        { status: 400 }
      );
    }

    // Update user plan
    await prisma.universalUser.update({
      where: { id: userId },
      data: {
        plan,
        planStartedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      plan,
    });
  } catch (error) {
    console.error('Error changing plan:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to change plan' },
      { status: 500 }
    );
  }
}
