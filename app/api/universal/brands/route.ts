import { NextRequest, NextResponse } from 'next/server';
import { getUniversalUser } from '@/lib/auth/universal';
import prisma from '@/lib/db/client';
import { z } from 'zod';

const createBrandSchema = z.object({
  name: z.string().min(1, 'Brand name is required'),
  domain: z.string().optional(),
  industry: z.string().optional(),
  description: z.string().optional(),
});

export async function GET() {
  try {
    const user = await getUniversalUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const brands = await prisma.brand.findMany({
      where: { userId: user.userId },
      include: {
        _count: {
          select: {
            visibilityChecks: true,
            competitors: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ brands });
  } catch (error) {
    console.error('Get brands error:', error);
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUniversalUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = createBrandSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, domain, industry, description } = result.data;

    // Check brand limit based on plan
    const existingCount = await prisma.brand.count({
      where: { userId: user.userId },
    });

    const planLimits: Record<string, number> = {
      FREE: 1,
      STARTER: 1,
      GROWTH: 3,
      SCALE: 10,
    };

    const limit = planLimits[user.plan] || 1;

    if (existingCount >= limit) {
      return NextResponse.json(
        { error: `Your plan allows ${limit} brand(s). Upgrade to add more.` },
        { status: 403 }
      );
    }

    // Create brand
    const brand = await prisma.brand.create({
      data: {
        userId: user.userId,
        name,
        domain: domain || null,
        industry: industry || null,
        description: description || null,
      },
    });

    return NextResponse.json({ brand });
  } catch (error) {
    console.error('Create brand error:', error);
    return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 });
  }
}
