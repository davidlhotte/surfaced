import { NextRequest, NextResponse } from 'next/server';
import {
  createBulkEditJob,
  getBulkEditJob,
  getShopBulkEditJobs,
  processBulkEditJob,
  getBulkEditStats,
  cancelBulkEditJob,
  BulkEditOperation,
} from '@/lib/services/bulk-editing';
import { getShopFromRequest } from '@/lib/shopify/get-shop';
import { handleApiError } from '@/lib/utils/errors';
import { PLAN_LIMITS } from '@/lib/constants/plans';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/monitoring/logger';

// GET - Get job status or list jobs
export async function GET(request: NextRequest) {
  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: false });

    // Check plan access
    const shop = await prisma.shop.findUnique({
      where: { shopDomain },
      select: { plan: true },
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    if (shop.plan === 'FREE') {
      return NextResponse.json(
        { error: 'Upgrade required to access bulk editing' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const action = searchParams.get('action');

    if (action === 'stats') {
      const stats = await getBulkEditStats(shopDomain);
      return NextResponse.json(stats);
    }

    if (jobId) {
      const job = getBulkEditJob(jobId);
      if (!job || job.shopDomain !== shopDomain) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }
      return NextResponse.json(job);
    }

    // List all jobs for shop
    const jobs = getShopBulkEditJobs(shopDomain);
    return NextResponse.json({ jobs });
  } catch (error) {
    logger.error({ error }, 'Failed to get bulk edit data');
    return handleApiError(error);
  }
}

// POST - Create and start a new bulk edit job
export async function POST(request: NextRequest) {
  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: false });

    // Check plan access
    const shop = await prisma.shop.findUnique({
      where: { shopDomain },
      select: { plan: true },
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    if (shop.plan === 'FREE') {
      return NextResponse.json(
        { error: 'Upgrade required to access bulk editing' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate operation
    if (!body.operation?.type || !body.operation?.productIds?.length) {
      return NextResponse.json(
        { error: 'Invalid operation: type and productIds are required' },
        { status: 400 }
      );
    }

    const validTypes = ['alt_text', 'meta_tags', 'description', 'title'];
    if (!validTypes.includes(body.operation.type)) {
      return NextResponse.json(
        { error: `Invalid operation type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Check product limit based on plan
    const planLimits = PLAN_LIMITS[shop.plan];
    const maxProducts = planLimits.productsAudited === Infinity ? 250 : Math.min(planLimits.productsAudited, 250);
    if (body.operation.productIds.length > maxProducts) {
      return NextResponse.json(
        { error: `Your plan allows bulk editing up to ${maxProducts} products at once` },
        { status: 403 }
      );
    }

    const operation: BulkEditOperation = {
      type: body.operation.type,
      productIds: body.operation.productIds,
      options: body.operation.options,
    };

    // Create the job
    const job = createBulkEditJob(shopDomain, operation);

    // Start processing in background
    processBulkEditJob(job.id).catch(error => {
      logger.error({ error, jobId: job.id }, 'Background job processing failed');
    });

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      message: 'Bulk edit job started',
    });
  } catch (error) {
    logger.error({ error }, 'Failed to create bulk edit job');
    return handleApiError(error);
  }
}

// DELETE - Cancel a pending job
export async function DELETE(request: NextRequest) {
  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: false });

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
    }

    const job = getBulkEditJob(jobId);
    if (!job || job.shopDomain !== shopDomain) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const cancelled = cancelBulkEditJob(jobId);
    if (!cancelled) {
      return NextResponse.json(
        { error: 'Cannot cancel job that is already processing or completed' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: 'Job cancelled' });
  } catch (error) {
    logger.error({ error }, 'Failed to cancel bulk edit job');
    return handleApiError(error);
  }
}
