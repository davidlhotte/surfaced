import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Handle Supabase auth session refresh for dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard') ||
      request.nextUrl.pathname === '/login' ||
      request.nextUrl.pathname === '/signup') {
    return updateSession(request);
  }

  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Allow framing by Shopify admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    response.headers.set(
      'Content-Security-Policy',
      "frame-ancestors https://*.myshopify.com https://admin.shopify.com;"
    );
  } else {
    response.headers.set('X-Frame-Options', 'DENY');
  }

  // CSP for the app
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.shopify.com",
      "style-src 'self' 'unsafe-inline' https://unpkg.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.shopify.com https://*.openstreetmap.org https://nominatim.openstreetmap.org https://*.tile.openstreetmap.org https://*.supabase.co",
      "frame-ancestors https://*.myshopify.com https://admin.shopify.com",
    ].join('; ')
  );

  // CORS for storefront API
  if (request.nextUrl.pathname.startsWith('/api/storefront/') ||
      request.nextUrl.pathname.startsWith('/storefront/')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: response.headers });
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
