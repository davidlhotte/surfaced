import { NextRequest, NextResponse } from 'next/server';
import { runAudit } from '@/lib/services/audit-engine';

// Debug endpoint that runs audit without rate limiting and returns full errors
export async function POST(request: NextRequest) {
  const shopDomain = request.headers.get('x-shopify-shop-domain') || 'locateus-2.myshopify.com';

  try {
    console.log('Debug audit: Starting for', shopDomain);
    const result = await runAudit(shopDomain);
    console.log('Debug audit: Completed', {
      totalProducts: result.totalProducts,
      auditedProducts: result.auditedProducts,
      averageScore: result.averageScore,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Debug audit: Error', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 10) : undefined,
      name: error instanceof Error ? error.name : 'Unknown',
    }, { status: 500 });
  }
}
