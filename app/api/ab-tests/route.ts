import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils/errors';
import { getShopFromRequest } from '@/lib/shopify/get-shop';
import {
  checkABTestQuota,
  createABTest,
  getABTests,
  getABTest,
  startABTest,
  cancelABTest,
  deleteABTest,
  applyABTestWinner,
} from '@/lib/services/ab-testing';

/**
 * GET /api/ab-tests
 * Get all A/B tests or a specific test
 */
export async function GET(request: NextRequest) {
  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: false });
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('id');

    if (testId) {
      const test = await getABTest(shopDomain, testId);
      if (!test) {
        return NextResponse.json(
          { success: false, error: 'Test not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: test });
    }

    const tests = await getABTests(shopDomain);
    const quota = await checkABTestQuota(shopDomain);

    return NextResponse.json({
      success: true,
      data: {
        tests,
        quota,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/ab-tests
 * Create or manage A/B tests
 */
export async function POST(request: NextRequest) {
  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: true });
    const body = await request.json();
    const { action, testId, ...createData } = body;

    // Handle actions
    if (action === 'start' && testId) {
      const test = await startABTest(shopDomain, testId);
      return NextResponse.json({ success: true, data: test });
    }

    if (action === 'cancel' && testId) {
      await cancelABTest(shopDomain, testId);
      return NextResponse.json({ success: true, data: { cancelled: true } });
    }

    if (action === 'apply' && testId) {
      const result = await applyABTestWinner(shopDomain, testId);
      return NextResponse.json({ success: true, data: result });
    }

    // Create new test
    const { name, productId, field, variantB, testQueries } = createData;

    if (!name || !productId || !field || !variantB) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, productId, field, variantB' },
        { status: 400 }
      );
    }

    const test = await createABTest(shopDomain, {
      name,
      productId,
      field,
      variantB,
      testQueries,
    });

    return NextResponse.json({ success: true, data: test });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/ab-tests
 * Delete an A/B test
 */
export async function DELETE(request: NextRequest) {
  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: true });
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('id');

    if (!testId) {
      return NextResponse.json(
        { success: false, error: 'Test ID is required' },
        { status: 400 }
      );
    }

    await deleteABTest(shopDomain, testId);

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
