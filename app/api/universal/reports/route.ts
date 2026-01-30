import { NextRequest, NextResponse } from 'next/server';
import { verifyUniversalSession } from '@/lib/auth/universal-session';
import { generateReport, generateEmailHtml } from '@/lib/services/universal/reports';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/monitoring/logger';

// GET - Generate report for a brand
export async function GET(request: NextRequest) {
  try {
    const session = await verifyUniversalSession(request);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');
    const format = searchParams.get('format') || 'json';
    const period = parseInt(searchParams.get('period') || '7', 10);
    const includeCompetitors = searchParams.get('competitors') === 'true';

    if (!brandId) {
      return NextResponse.json(
        { error: 'Brand ID is required' },
        { status: 400 }
      );
    }

    // Verify brand belongs to user
    const brand = await prisma.brand.findFirst({
      where: {
        id: brandId,
        userId: session.userId,
      },
    });

    if (!brand) {
      return NextResponse.json(
        { error: 'Brand not found' },
        { status: 404 }
      );
    }

    // Check plan for competitor reports
    if (includeCompetitors && session.plan === 'FREE') {
      return NextResponse.json(
        { error: 'Competitor reports require a paid plan' },
        { status: 403 }
      );
    }

    const report = await generateReport(brandId, {
      period,
      includeCompetitors,
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Failed to generate report' },
        { status: 500 }
      );
    }

    // Return in requested format
    if (format === 'html') {
      const html = generateEmailHtml(report);
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    logger.error({ error }, 'Report generation error');
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

// POST - Schedule or send report
export async function POST(request: NextRequest) {
  try {
    const session = await verifyUniversalSession(request);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { brandId, action, email, dayOfWeek } = body;

    if (!brandId) {
      return NextResponse.json(
        { error: 'Brand ID is required' },
        { status: 400 }
      );
    }

    // Verify brand belongs to user
    const brand = await prisma.brand.findFirst({
      where: {
        id: brandId,
        userId: session.userId,
      },
    });

    if (!brand) {
      return NextResponse.json(
        { error: 'Brand not found' },
        { status: 404 }
      );
    }

    if (action === 'schedule') {
      // Check plan for scheduled reports
      if (session.plan === 'FREE') {
        return NextResponse.json(
          { error: 'Scheduled reports require a paid plan' },
          { status: 403 }
        );
      }

      // Update report schedule in brand settings
      await prisma.brand.update({
        where: { id: brandId },
        data: {
          reportSchedule: {
            enabled: true,
            email: email || session.email,
            dayOfWeek: dayOfWeek || 1,
            lastSent: null,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Weekly report scheduled successfully',
      });
    }

    if (action === 'unschedule') {
      await prisma.brand.update({
        where: { id: brandId },
        data: {
          reportSchedule: {
            enabled: false,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Weekly report unscheduled',
      });
    }

    if (action === 'send') {
      // Generate and "send" report (in production, would use email service)
      const report = await generateReport(brandId, {
        period: 7,
        includeCompetitors: session.plan !== 'FREE',
      });

      if (!report) {
        return NextResponse.json(
          { error: 'Failed to generate report' },
          { status: 500 }
        );
      }

      // In production, would send email here
      // For now, just return the report
      return NextResponse.json({
        success: true,
        message: 'Report would be sent to ' + (email || session.email),
        report,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    logger.error({ error }, 'Report action error');
    return NextResponse.json(
      { error: 'Failed to process report action' },
      { status: 500 }
    );
  }
}
