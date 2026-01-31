import { NextResponse } from 'next/server';
import prisma from '@/lib/db/client';
import { getUniversalUser } from '@/lib/auth/universal';

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

    const { userId } = await request.json();

    // Verify user is clearing their own data
    if (currentUser.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Cannot modify another user\'s data' },
        { status: 403 }
      );
    }

    // Delete in correct order due to foreign keys
    // 1. Delete all visibility checks for user's brands
    await prisma.brandVisibilityCheck.deleteMany({
      where: {
        brand: { userId },
      },
    });

    // 2. Delete all competitors for user's brands
    await prisma.brandCompetitor.deleteMany({
      where: {
        brand: { userId },
      },
    });

    // 3. Delete all alerts for user's brands
    await prisma.brandAlert.deleteMany({
      where: {
        brand: { userId },
      },
    });

    // 4. Delete all custom prompts for user's brands
    await prisma.brandPrompt.deleteMany({
      where: {
        brand: { userId },
      },
    });

    // 5. Delete all brands
    const deletedBrands = await prisma.brand.deleteMany({
      where: { userId },
    });

    return NextResponse.json({
      success: true,
      deleted: {
        brands: deletedBrands.count,
      },
    });
  } catch (error) {
    console.error('Error clearing data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear data' },
      { status: 500 }
    );
  }
}
