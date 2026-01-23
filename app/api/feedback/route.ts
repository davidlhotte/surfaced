import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/monitoring/logger';

// In-memory feedback storage (in production, use Redis or a separate analytics service)
const feedbackStore: Map<string, { helpful: number; notHelpful: number }> = new Map();

// POST - Store help article feedback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articleId, helpful, locale } = body;

    if (!articleId || typeof helpful !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Invalid feedback data' },
        { status: 400 }
      );
    }

    // Store in memory
    const existing = feedbackStore.get(articleId) || { helpful: 0, notHelpful: 0 };
    if (helpful) {
      existing.helpful++;
    } else {
      existing.notHelpful++;
    }
    feedbackStore.set(articleId, existing);

    // Log for analytics/debugging
    logger.info({
      articleId,
      helpful,
      locale,
      totals: existing,
    }, 'Help article feedback received');

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ error }, 'Failed to store help feedback');
    return NextResponse.json(
      { success: false, error: 'Failed to store feedback' },
      { status: 500 }
    );
  }
}

// GET - Get feedback statistics
export async function GET() {
  try {
    const stats: Record<string, { helpful: number; notHelpful: number }> = {};
    let total = 0;

    feedbackStore.forEach((value, key) => {
      stats[key] = value;
      total += value.helpful + value.notHelpful;
    });

    return NextResponse.json({
      success: true,
      data: {
        totalFeedback: total,
        byArticle: stats,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get feedback stats');
    return NextResponse.json(
      { success: false, error: 'Failed to get feedback stats' },
      { status: 500 }
    );
  }
}
