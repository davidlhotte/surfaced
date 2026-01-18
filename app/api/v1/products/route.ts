import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest, logRequest } from '@/lib/api/auth-middleware';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/v1/products
 * Get products with AI readiness data
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  const auth = await authenticateApiRequest(request, 'read');
  if (!auth.success) {
    return auth.error;
  }

  const { shopDomain, keyId } = auth.data;
  const { searchParams } = new URL(request.url);

  // Pagination
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
  const skip = (page - 1) * limit;

  // Filters
  const minScore = searchParams.get('minScore')
    ? parseInt(searchParams.get('minScore')!, 10)
    : undefined;
  const maxScore = searchParams.get('maxScore')
    ? parseInt(searchParams.get('maxScore')!, 10)
    : undefined;
  const hasIssues = searchParams.get('hasIssues') === 'true' ? true : undefined;

  try {
    const shop = await prisma.shop.findUnique({
      where: { shopDomain },
      select: { id: true },
    });

    if (!shop) {
      await logRequest(keyId, request, 404, startTime);
      return NextResponse.json(
        { error: 'Shop not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Build where clause
    const where: {
      shopId: string;
      aiScore?: { gte?: number; lte?: number };
    } = { shopId: shop.id };

    if (minScore !== undefined || maxScore !== undefined) {
      where.aiScore = {};
      if (minScore !== undefined) where.aiScore.gte = minScore;
      if (maxScore !== undefined) where.aiScore.lte = maxScore;
    }

    // Get total count
    const totalCount = await prisma.productAudit.count({ where });

    // Get products
    const products = await prisma.productAudit.findMany({
      where,
      orderBy: { aiScore: 'asc' },
      skip,
      take: limit,
      select: {
        shopifyProductId: true,
        title: true,
        handle: true,
        aiScore: true,
        issues: true,
        hasImages: true,
        hasDescription: true,
        hasMetafields: true,
        descriptionLength: true,
        lastAuditAt: true,
      },
    });

    // Filter by hasIssues if specified
    let filteredProducts = products;
    if (hasIssues !== undefined) {
      filteredProducts = products.filter((p) => {
        const issues = p.issues as Array<unknown>;
        return hasIssues ? issues.length > 0 : issues.length === 0;
      });
    }

    const response = {
      success: true,
      data: {
        products: filteredProducts.map((p) => ({
          id: p.shopifyProductId.toString(),
          title: p.title,
          handle: p.handle,
          aiScore: p.aiScore,
          issueCount: (p.issues as Array<unknown>).length,
          issues: p.issues,
          hasImages: p.hasImages,
          hasDescription: p.hasDescription,
          hasMetafields: p.hasMetafields,
          descriptionLength: p.descriptionLength,
          lastAuditAt: p.lastAuditAt.toISOString(),
        })),
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page * limit < totalCount,
          hasPrev: page > 1,
        },
      },
    };

    await logRequest(keyId, request, 200, startTime);
    return NextResponse.json(response);
  } catch (error) {
    await logRequest(keyId, request, 500, startTime);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
