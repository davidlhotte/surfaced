import { NextRequest, NextResponse } from 'next/server';
import { registerUser, createSession, setSessionCookie } from '@/lib/auth/universal';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password, name } = result.data;

    // Register user
    const registerResult = await registerUser(email, password, name);

    if ('error' in registerResult) {
      return NextResponse.json(
        { error: registerResult.error },
        { status: 400 }
      );
    }

    // Create session and set cookie
    const token = await createSession(registerResult.user.id);
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: registerResult.user,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register' },
      { status: 500 }
    );
  }
}
