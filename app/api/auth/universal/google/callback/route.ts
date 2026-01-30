import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createSessionToken } from '@/lib/auth/universal-session';
import { logger } from '@/lib/monitoring/logger';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/universal/google/callback`
  : 'http://localhost:3000/api/auth/universal/google/callback';

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  expires_in: number;
  refresh_token?: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for OAuth errors
    if (error) {
      logger.warn({ error }, 'Google OAuth error');
      return NextResponse.redirect(
        new URL('/login?error=oauth_denied', request.url)
      );
    }

    // Verify state (CSRF protection)
    const savedState = request.cookies.get('oauth_state')?.value;
    if (!state || state !== savedState) {
      return NextResponse.redirect(
        new URL('/login?error=invalid_state', request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/login?error=no_code', request.url)
      );
    }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return NextResponse.redirect(
        new URL('/login?error=oauth_not_configured', request.url)
      );
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      logger.error({ status: tokenResponse.status }, 'Google token exchange failed');
      return NextResponse.redirect(
        new URL('/login?error=token_exchange_failed', request.url)
      );
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json();

    // Get user info
    const userInfoResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    if (!userInfoResponse.ok) {
      return NextResponse.redirect(
        new URL('/login?error=userinfo_failed', request.url)
      );
    }

    const userInfo: GoogleUserInfo = await userInfoResponse.json();

    // Find or create user
    let user = await prisma.universalUser.findUnique({
      where: { email: userInfo.email },
    });

    if (!user) {
      // Create new user
      user = await prisma.universalUser.create({
        data: {
          email: userInfo.email,
          name: userInfo.name,
          authProvider: 'google',
          providerId: userInfo.id,
          emailVerified: userInfo.verified_email,
          avatarUrl: userInfo.picture,
          plan: 'FREE',
        },
      });

      logger.info({ userId: user.id, email: user.email }, 'New user registered via Google');
    } else if (user.authProvider !== 'google') {
      // User exists with different provider - link accounts
      await prisma.universalUser.update({
        where: { id: user.id },
        data: {
          authProvider: 'google',
          providerId: userInfo.id,
          emailVerified: true,
          avatarUrl: userInfo.picture || user.avatarUrl,
        },
      });
    }

    // Create session token
    const sessionToken = createSessionToken({
      id: user.id,
      email: user.email,
      plan: user.plan,
    });

    // Redirect to dashboard with session
    const response = NextResponse.redirect(
      new URL('/dashboard', request.url)
    );

    // Set session cookie
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Clear OAuth state cookie
    response.cookies.delete('oauth_state');

    return response;
  } catch (error) {
    logger.error({ error }, 'Google OAuth callback error');
    return NextResponse.redirect(
      new URL('/login?error=oauth_failed', request.url)
    );
  }
}
