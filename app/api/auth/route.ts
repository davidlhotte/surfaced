import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl, validateShop } from '@/lib/shopify/auth';

export async function GET(request: NextRequest) {
  const shop = request.nextUrl.searchParams.get('shop');

  if (!shop) {
    return NextResponse.json(
      { error: 'Missing shop parameter' },
      { status: 400 }
    );
  }

  const isValid = await validateShop(shop);
  if (!isValid) {
    return NextResponse.json(
      { error: 'Invalid shop domain' },
      { status: 400 }
    );
  }

  const redirectUri = `${process.env.SHOPIFY_APP_URL?.trim()}/api/auth/callback`;
  const authUrl = getAuthUrl(shop, redirectUri);

  return NextResponse.redirect(authUrl);
}
