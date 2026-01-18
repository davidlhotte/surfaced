import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest, logRequest } from '@/lib/api/auth-middleware';
import { prisma } from '@/lib/db/prisma';
import { runAudit } from '@/lib/services/audit-engine';

/**
 * GET /api/v1/audit
 * Get audit results for the shop
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  const auth = await authenticateApiRequest(request, 'read');
  if (!auth.success) {
    return auth.error;
  }

  const { shopDomain, keyId } = auth.data;

  try {
    const shop = await prisma.shop.findUnique({
      where: { shopDomain },
      select: {
        aiScore: true,
        productsCount: true,
        lastAuditAt: true,
        productsAudit: {
          select: {
            shopifyProductId: true,
            title: true,
            handle: true,
            aiScore: true,
            issues: true,
            hasImages: true,
            hasDescription: true,
            descriptionLength: true,
            lastAuditAt: true,
          },
          orderBy: { aiScore: 'asc' },
          take: 100,
        },
      },
    });

    if (!shop) {
      await logRequest(keyId, request, 404, startTime);
      return NextResponse.json(
        { error: 'Shop not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Count issues by severity
    let criticalCount = 0;
    let warningCount = 0;
    let infoCount = 0;

    for (const product of shop.productsAudit) {
      const issues = product.issues as Array<{ severity: string }>;
      for (const issue of issues) {
        if (issue.severity === 'critical' || issue.severity === 'error') {
          criticalCount++;
        } else if (issue.severity === 'warning') {
          warningCount++;
        } else {
          infoCount++;
        }
      }
    }

    const response = {
      success: true,
      data: {
        shop: {
          domain: shopDomain,
          aiScore: shop.aiScore,
          productsCount: shop.productsCount,
          lastAuditAt: shop.lastAuditAt?.toISOString() || null,
        },
        summary: {
          criticalIssues: criticalCount,
          warnings: warningCount,
          info: infoCount,
          productsAudited: shop.productsAudit.length,
        },
        products: shop.productsAudit.map((p) => ({
          id: p.shopifyProductId.toString(),
          title: p.title,
          handle: p.handle,
          aiScore: p.aiScore,
          issues: p.issues,
          hasImages: p.hasImages,
          hasDescription: p.hasDescription,
          descriptionLength: p.descriptionLength,
          lastAuditAt: p.lastAuditAt.toISOString(),
        })),
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

/**
 * POST /api/v1/audit
 * Trigger a new audit
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  const auth = await authenticateApiRequest(request, 'audit');
  if (!auth.success) {
    return auth.error;
  }

  const { shopDomain, keyId } = auth.data;

  try {
    const result = await runAudit(shopDomain);

    const response = {
      success: true,
      data: {
        message: 'Audit completed successfully',
        results: {
          totalProducts: result.totalProducts,
          auditedProducts: result.auditedProducts,
          averageScore: result.averageScore,
          issues: result.issues,
        },
      },
    };

    await logRequest(keyId, request, 200, startTime);
    return NextResponse.json(response);
  } catch (error) {
    await logRequest(keyId, request, 500, startTime);
    return NextResponse.json(
      { error: 'Audit failed', code: 'AUDIT_FAILED' },
      { status: 500 }
    );
  }
}
