/**
 * Universal Session Management
 * JWT-based authentication for Universal SaaS users
 */

import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/monitoring/logger';

const JWT_SECRET = process.env.JWT_SECRET || process.env.ENCRYPTION_KEY || 'default-secret-change-me';

export interface UniversalSession {
  userId: string;
  email: string;
  plan: string;
}

/**
 * Create a JWT token for a user
 */
export function createSessionToken(user: {
  id: string;
  email: string;
  plan: string;
}): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      plan: user.plan,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Verify a session token from request
 */
export async function verifyUniversalSession(
  request: NextRequest
): Promise<UniversalSession | null> {
  try {
    // Check Authorization header
    const authHeader = request.headers.get('authorization');
    let token: string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Check cookie
      token = request.cookies.get('session')?.value;
    }

    if (!token) {
      return null;
    }

    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      plan: string;
    };

    // Verify user exists
    const user = await prisma.universalUser.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        plan: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      userId: user.id,
      email: user.email,
      plan: user.plan,
    };
  } catch (error) {
    logger.warn({ error }, 'Session verification failed');
    return null;
  }
}

/**
 * Get session from cookie (for server components)
 */
export async function getServerSession(
  cookieValue: string | undefined
): Promise<UniversalSession | null> {
  if (!cookieValue) {
    return null;
  }

  try {
    const decoded = jwt.verify(cookieValue, JWT_SECRET) as {
      userId: string;
      email: string;
      plan: string;
    };

    const user = await prisma.universalUser.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        plan: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      userId: user.id,
      email: user.email,
      plan: user.plan,
    };
  } catch {
    return null;
  }
}

/**
 * Verify session and check plan access
 */
export async function verifyPlanAccess(
  request: NextRequest,
  requiredPlans: string[]
): Promise<{ session: UniversalSession | null; hasAccess: boolean }> {
  const session = await verifyUniversalSession(request);

  if (!session) {
    return { session: null, hasAccess: false };
  }

  const hasAccess = requiredPlans.includes(session.plan);

  return { session, hasAccess };
}
