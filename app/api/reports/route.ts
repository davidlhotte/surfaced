import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils/errors';
import { getShopFromRequest } from '@/lib/shopify/get-shop';
import {
  getAuditReportData,
  getVisibilityReportData,
  generateAuditCsv,
  generateVisibilityCsv,
  generateAuditReportJson,
  generateSummaryReport,
} from '@/lib/services/reporting';
import { logger } from '@/lib/monitoring/logger';

// GET - Get report data
export async function GET(request: NextRequest) {
  try {
    const shopDomain = await getShopFromRequest(request, { rateLimit: false });
    const { searchParams } = new URL(request.url);

    const type = searchParams.get('type') || 'audit'; // audit | visibility
    const format = searchParams.get('format') || 'json'; // json | csv | txt

    logger.info({ shopDomain, type, format }, 'Report requested');

    let data;
    let content: string;
    let contentType: string;
    let filename: string;

    if (type === 'visibility') {
      data = await getVisibilityReportData(shopDomain);
      filename = `surfaced-visibility-report-${new Date().toISOString().split('T')[0]}`;

      if (format === 'csv') {
        content = generateVisibilityCsv(data);
        contentType = 'text/csv';
        filename += '.csv';
      } else {
        content = JSON.stringify(data, null, 2);
        contentType = 'application/json';
        filename += '.json';
      }
    } else {
      // Default: audit report
      data = await getAuditReportData(shopDomain);
      filename = `surfaced-audit-report-${new Date().toISOString().split('T')[0]}`;

      if (format === 'csv') {
        content = generateAuditCsv(data);
        contentType = 'text/csv';
        filename += '.csv';
      } else if (format === 'txt') {
        content = generateSummaryReport(data);
        contentType = 'text/plain';
        filename += '.txt';
      } else {
        content = generateAuditReportJson(data);
        contentType = 'application/json';
        filename += '.json';
      }
    }

    // If download is requested, return as file
    if (searchParams.get('download') === 'true') {
      return new NextResponse(content, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // Otherwise return as JSON response
    return NextResponse.json({
      success: true,
      data: {
        content,
        contentType,
        filename,
        reportData: data,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Report generation failed');
    return handleApiError(error);
  }
}
