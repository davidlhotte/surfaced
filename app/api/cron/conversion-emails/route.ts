import { NextRequest, NextResponse } from 'next/server';
import { processConversionEmails } from '@/lib/emails/service';
import { logger } from '@/lib/monitoring/logger';

/**
 * Cron endpoint for processing conversion emails
 *
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/conversion-emails",
 *     "schedule": "0 9 * * *"
 *   }]
 * }
 *
 * Or call manually/from external cron with CRON_SECRET header
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // In production, require authentication
    if (process.env.NODE_ENV === 'production') {
      if (!cronSecret) {
        logger.warn('CRON_SECRET not configured');
        return NextResponse.json(
          { error: 'Cron not configured' },
          { status: 500 }
        );
      }

      if (authHeader !== `Bearer ${cronSecret}`) {
        logger.warn('Invalid cron secret');
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    // Process conversion emails
    const stats = await processConversionEmails();

    logger.info(stats, 'Cron: conversion emails completed');

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error({ error }, 'Cron: conversion emails failed');

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
