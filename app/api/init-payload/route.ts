import { NextResponse } from 'next/server';
import { getPayload } from '@/lib/payload';

// One-time initialization endpoint - call this once after deployment
// to create the Payload CMS database tables
export async function GET() {
  try {
    console.log('Initializing Payload database...');
    const payload = await getPayload();

    // Try to count users to verify tables exist
    const users = await payload.count({
      collection: 'users',
    });

    return NextResponse.json({
      success: true,
      message: 'Payload database initialized successfully',
      usersCount: users.totalDocs,
    });
  } catch (error) {
    console.error('Error initializing Payload:', error);
    return NextResponse.json(
      {
        error: 'Failed to initialize database',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
