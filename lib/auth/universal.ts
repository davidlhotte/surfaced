import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { compare, hash } from 'bcryptjs';
import prisma from '@/lib/db/client';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

const SESSION_COOKIE = 'surfaced_session';
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface UniversalUserSession {
  userId: string;
  email: string;
  name: string | null;
  plan: string;
}

// Hash password using bcrypt
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

// Verify password
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return compare(password, hashedPassword);
}

// Create JWT token
export async function createToken(payload: UniversalUserSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET);
}

// Verify JWT token
export async function verifyToken(token: string): Promise<UniversalUserSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as UniversalUserSession;
  } catch {
    return null;
  }
}

// Get current user from session
export async function getUniversalUser(): Promise<UniversalUserSession | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionToken) {
    return null;
  }

  // Verify JWT
  const session = await verifyToken(sessionToken);
  if (!session) {
    return null;
  }

  // Optionally verify session exists in DB
  const dbSession = await prisma.universalSession.findUnique({
    where: { token: sessionToken },
    include: { user: true },
  });

  if (!dbSession || dbSession.expiresAt < new Date()) {
    return null;
  }

  // Update last active
  await prisma.universalSession.update({
    where: { id: dbSession.id },
    data: { lastActiveAt: new Date() },
  });

  return {
    userId: dbSession.user.id,
    email: dbSession.user.email,
    name: dbSession.user.name,
    plan: dbSession.user.plan,
  };
}

// Create session for user
export async function createSession(userId: string): Promise<string> {
  const user = await prisma.universalUser.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const sessionPayload: UniversalUserSession = {
    userId: user.id,
    email: user.email,
    name: user.name,
    plan: user.plan,
  };

  const token = await createToken(sessionPayload);

  // Store session in DB
  await prisma.universalSession.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + SESSION_DURATION),
    },
  });

  // Update user login stats
  await prisma.universalUser.update({
    where: { id: userId },
    data: {
      lastLoginAt: new Date(),
      loginCount: { increment: 1 },
    },
  });

  return token;
}

// Set session cookie
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000,
    path: '/',
  });
}

// Clear session
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;

  if (sessionToken) {
    // Delete from DB
    await prisma.universalSession.deleteMany({
      where: { token: sessionToken },
    });
  }

  cookieStore.delete(SESSION_COOKIE);
}

// Register new user
export async function registerUser(
  email: string,
  password: string,
  name?: string
): Promise<{ user: { id: string; email: string } } | { error: string }> {
  // Check if user exists
  const existing = await prisma.universalUser.findUnique({
    where: { email },
  });

  if (existing) {
    return { error: 'Email already registered' };
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const user = await prisma.universalUser.create({
    data: {
      email,
      passwordHash,
      name,
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 day trial
    },
  });

  return { user: { id: user.id, email: user.email } };
}

// Login user
export async function loginUser(
  email: string,
  password: string
): Promise<{ token: string } | { error: string }> {
  const user = await prisma.universalUser.findUnique({
    where: { email },
  });

  if (!user || !user.passwordHash) {
    return { error: 'Invalid email or password' };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: 'Invalid email or password' };
  }

  const token = await createSession(user.id);
  return { token };
}
