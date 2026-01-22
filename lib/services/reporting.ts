import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/monitoring/logger';
import { PLAN_LIMITS } from '@/lib/constants/plans';
import type { Plan } from '@prisma/client';

// Types
export interface AuditReportData {
  shop: {
    name: string;
    domain: string;
    plan: string;
    aiScore: number | null;
    productsCount: number;
    lastAuditAt: string | null;
  };
  summary: {
    totalProducts: number;
    auditedProducts: number;
    averageScore: number;
    criticalIssues: number;
    warningIssues: number;
    infoIssues: number;
  };
  products: Array<{
    id: string;
    shopifyProductId: string;
    title: string;
    handle: string;
    aiScore: number;
    hasImages: boolean;
    hasDescription: boolean;
    hasMetafields: boolean;
    descriptionLength: number;
    issues: Array<{
      type: string;
      code: string;
      message: string;
    }>;
    lastAuditAt: string;
  }>;
  visibility: {
    totalChecks: number;
    mentionedCount: number;
    mentionRate: number;
    platformBreakdown: Array<{
      platform: string;
      checks: number;
      mentions: number;
      rate: number;
    }>;
  };
  generatedAt: string;
}

export interface VisibilityReportData {
  shop: {
    name: string;
    domain: string;
  };
  summary: {
    totalChecks: number;
    mentionedCount: number;
    mentionRate: number;
    averagePosition: number | null;
  };
  checks: Array<{
    id: string;
    platform: string;
    query: string;
    isMentioned: boolean;
    position: number | null;
    responseQuality: string | null;
    competitorsFound: string[];
    checkedAt: string;
  }>;
  generatedAt: string;
}

/**
 * Sanitize a CSV field to prevent CSV injection attacks
 * SECURITY: Prevents formula injection in spreadsheet applications
 */
function sanitizeCsvField(value: string): string {
  // Escape double quotes
  let escaped = value.replace(/"/g, '""');
  // Prevent formula injection - prefix with single quote if starts with dangerous char
  if (/^[=@+\-\t\r]/.test(escaped)) {
    escaped = "'" + escaped;
  }
  return `"${escaped}"`;
}

/**
 * Generate CSV content from audit report data
 */
export function generateAuditCsv(data: AuditReportData): string {
  const lines: string[] = [];

  // Header
  lines.push('Product ID,Title,Handle,AI Score,Has Images,Has Description,Description Length,Issues Count,Issue Types,Last Audit');

  // Product rows
  for (const product of data.products) {
    const issueTypes = product.issues.map(i => i.code).join('; ');
    const row = [
      product.shopifyProductId,
      sanitizeCsvField(product.title),
      sanitizeCsvField(product.handle),
      product.aiScore.toString(),
      product.hasImages ? 'Yes' : 'No',
      product.hasDescription ? 'Yes' : 'No',
      product.descriptionLength.toString(),
      product.issues.length.toString(),
      sanitizeCsvField(issueTypes),
      product.lastAuditAt,
    ];
    lines.push(row.join(','));
  }

  return lines.join('\n');
}

/**
 * Generate CSV content from visibility report data
 */
export function generateVisibilityCsv(data: VisibilityReportData): string {
  const lines: string[] = [];

  // Header
  lines.push('Check ID,Platform,Query,Mentioned,Position,Response Quality,Competitors Found,Checked At');

  // Check rows
  for (const check of data.checks) {
    const competitors = check.competitorsFound.join('; ');
    const row = [
      check.id,
      check.platform,
      sanitizeCsvField(check.query),
      check.isMentioned ? 'Yes' : 'No',
      check.position?.toString() || 'N/A',
      check.responseQuality || 'N/A',
      sanitizeCsvField(competitors),
      check.checkedAt,
    ];
    lines.push(row.join(','));
  }

  return lines.join('\n');
}

/**
 * Generate full audit report JSON
 */
export function generateAuditReportJson(data: AuditReportData): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Get full audit report data for a shop
 */
export async function getAuditReportData(shopDomain: string): Promise<AuditReportData> {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    include: {
      productsAudit: {
        orderBy: { aiScore: 'asc' },
        take: 1000,
      },
    },
  });

  if (!shop) {
    throw new Error('Shop not found');
  }

  // Check if plan allows export
  const planLimits = PLAN_LIMITS[shop.plan as Plan];
  if (!planLimits.exportCsv) {
    throw new Error('CSV export requires Growth plan or higher. Please upgrade to access this feature.');
  }

  // Get visibility stats (unused variable removed to fix lint warning)
  await prisma.visibilityCheck.groupBy({
    by: ['platform'],
    where: { shopId: shop.id },
    _count: { id: true },
  });

  const totalChecks = await prisma.visibilityCheck.count({
    where: { shopId: shop.id },
  });

  const mentionedCount = await prisma.visibilityCheck.count({
    where: { shopId: shop.id, isMentioned: true },
  });

  // Calculate issue counts
  let criticalIssues = 0;
  let warningIssues = 0;
  let infoIssues = 0;

  for (const product of shop.productsAudit) {
    if (product.aiScore < 40) criticalIssues++;
    else if (product.aiScore < 70) warningIssues++;
    else if (product.aiScore < 90) infoIssues++;
  }

  // Calculate average score
  const totalScore = shop.productsAudit.reduce((sum, p) => sum + p.aiScore, 0);
  const averageScore = shop.productsAudit.length > 0
    ? Math.round(totalScore / shop.productsAudit.length)
    : 0;

  // Platform breakdown for visibility
  const platformBreakdown = await Promise.all(
    ['chatgpt', 'perplexity', 'gemini', 'claude', 'copilot'].map(async (platform) => {
      const checks = await prisma.visibilityCheck.count({
        where: { shopId: shop.id, platform: platform as never },
      });
      const mentions = await prisma.visibilityCheck.count({
        where: { shopId: shop.id, platform: platform as never, isMentioned: true },
      });
      return {
        platform,
        checks,
        mentions,
        rate: checks > 0 ? Math.round((mentions / checks) * 100) : 0,
      };
    })
  );

  logger.info({ shopDomain, productsCount: shop.productsAudit.length }, 'Generated audit report data');

  return {
    shop: {
      name: shop.name || shopDomain,
      domain: shopDomain,
      plan: shop.plan,
      aiScore: shop.aiScore,
      productsCount: shop.productsCount,
      lastAuditAt: shop.lastAuditAt?.toISOString() || null,
    },
    summary: {
      totalProducts: shop.productsCount,
      auditedProducts: shop.productsAudit.length,
      averageScore,
      criticalIssues,
      warningIssues,
      infoIssues,
    },
    products: shop.productsAudit.map((p) => ({
      id: p.id,
      shopifyProductId: p.shopifyProductId.toString(),
      title: p.title,
      handle: p.handle,
      aiScore: p.aiScore,
      hasImages: p.hasImages,
      hasDescription: p.hasDescription,
      hasMetafields: p.hasMetafields,
      descriptionLength: p.descriptionLength,
      issues: (p.issues as Array<{ type: string; code: string; message: string }>) || [],
      lastAuditAt: p.lastAuditAt.toISOString(),
    })),
    visibility: {
      totalChecks,
      mentionedCount,
      mentionRate: totalChecks > 0 ? Math.round((mentionedCount / totalChecks) * 100) : 0,
      platformBreakdown: platformBreakdown.filter(p => p.checks > 0),
    },
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Get visibility report data for a shop
 */
export async function getVisibilityReportData(shopDomain: string): Promise<VisibilityReportData> {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: { id: true, name: true, plan: true },
  });

  if (!shop) {
    throw new Error('Shop not found');
  }

  // Check if plan allows export
  const planLimits = PLAN_LIMITS[shop.plan as Plan];
  if (!planLimits.exportCsv) {
    throw new Error('CSV export requires Growth plan or higher. Please upgrade to access this feature.');
  }

  const checks = await prisma.visibilityCheck.findMany({
    where: { shopId: shop.id },
    orderBy: { checkedAt: 'desc' },
    take: 500,
  });

  const totalChecks = checks.length;
  const mentionedCount = checks.filter(c => c.isMentioned).length;

  // Calculate average position for mentioned checks
  const mentionedWithPosition = checks.filter(c => c.isMentioned && c.position);
  const averagePosition = mentionedWithPosition.length > 0
    ? Math.round(mentionedWithPosition.reduce((sum, c) => sum + (c.position || 0), 0) / mentionedWithPosition.length)
    : null;

  logger.info({ shopDomain, checksCount: checks.length }, 'Generated visibility report data');

  return {
    shop: {
      name: shop.name || shopDomain,
      domain: shopDomain,
    },
    summary: {
      totalChecks,
      mentionedCount,
      mentionRate: totalChecks > 0 ? Math.round((mentionedCount / totalChecks) * 100) : 0,
      averagePosition,
    },
    checks: checks.map((c) => ({
      id: c.id,
      platform: c.platform,
      query: c.query,
      isMentioned: c.isMentioned || false,
      position: c.position,
      responseQuality: c.responseQuality,
      competitorsFound: (c.competitorsFound as Array<{ name: string }> || []).map(comp => comp.name),
      checkedAt: c.checkedAt.toISOString(),
    })),
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generate a summary text report
 */
export function generateSummaryReport(data: AuditReportData): string {
  const lines: string[] = [];

  lines.push('='.repeat(60));
  lines.push(`SURFACED AI VISIBILITY REPORT`);
  lines.push(`Store: ${data.shop.name} (${data.shop.domain})`);
  lines.push(`Generated: ${new Date(data.generatedAt).toLocaleString()}`);
  lines.push('='.repeat(60));
  lines.push('');

  lines.push('SUMMARY');
  lines.push('-'.repeat(40));
  lines.push(`Overall AI Score: ${data.shop.aiScore || 'N/A'}/100`);
  lines.push(`Total Products: ${data.summary.totalProducts}`);
  lines.push(`Audited Products: ${data.summary.auditedProducts}`);
  lines.push(`Average Score: ${data.summary.averageScore}/100`);
  lines.push('');

  lines.push('ISSUES BREAKDOWN');
  lines.push('-'.repeat(40));
  lines.push(`Critical (Score < 40): ${data.summary.criticalIssues} products`);
  lines.push(`Warning (Score 40-69): ${data.summary.warningIssues} products`);
  lines.push(`Info (Score 70-89): ${data.summary.infoIssues} products`);
  lines.push('');

  lines.push('AI VISIBILITY');
  lines.push('-'.repeat(40));
  lines.push(`Total Checks: ${data.visibility.totalChecks}`);
  lines.push(`Times Mentioned: ${data.visibility.mentionedCount}`);
  lines.push(`Mention Rate: ${data.visibility.mentionRate}%`);
  lines.push('');

  if (data.visibility.platformBreakdown.length > 0) {
    lines.push('BY PLATFORM:');
    for (const platform of data.visibility.platformBreakdown) {
      lines.push(`  ${platform.platform}: ${platform.mentions}/${platform.checks} (${platform.rate}%)`);
    }
    lines.push('');
  }

  lines.push('TOP PRODUCTS NEEDING ATTENTION');
  lines.push('-'.repeat(40));
  const criticalProducts = data.products.filter(p => p.aiScore < 40).slice(0, 10);
  if (criticalProducts.length > 0) {
    for (const product of criticalProducts) {
      lines.push(`• ${product.title} (Score: ${product.aiScore})`);
      for (const issue of product.issues.slice(0, 2)) {
        lines.push(`  - ${issue.message}`);
      }
    }
  } else {
    lines.push('No critical products found! Great job!');
  }
  lines.push('');

  lines.push('='.repeat(60));
  lines.push('Report generated by Surfaced - https://surfaced.vercel.app');
  lines.push('='.repeat(60));

  return lines.join('\n');
}
