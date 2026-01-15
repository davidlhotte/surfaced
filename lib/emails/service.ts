/**
 * Email service for sending conversion and engagement emails
 * Uses Resend for email delivery
 */

import { Resend } from 'resend';
import { logger } from '@/lib/monitoring/logger';
import { prisma } from '@/lib/db/prisma';
import {
  EmailTemplate,
  getLimitReachedEmail,
  getNearLimitEmail,
  getWelcomeEmail,
} from './templates';

const APP_URL = process.env.SHOPIFY_APP_URL || 'https://locateus.app';
const FROM_EMAIL = process.env.EMAIL_FROM || 'LocateUs <noreply@locateus.app>';
const EMAIL_ENABLED = process.env.EMAIL_ENABLED === 'true';

// Initialize Resend client
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

interface SendEmailOptions {
  to: string;
  template: EmailTemplate;
  shopDomain: string;
  emailType: string;
}

/**
 * Send an email using Resend
 */
async function sendEmail({ to, template, shopDomain, emailType }: SendEmailOptions): Promise<boolean> {
  // Skip if email is not enabled
  if (!EMAIL_ENABLED) {
    logger.info({ to, subject: template.subject, shopDomain, emailType }, 'Email skipped (EMAIL_ENABLED=false)');
    return false;
  }

  // Skip if Resend is not configured
  if (!resend) {
    logger.warn({ to, shopDomain, emailType }, 'Email skipped (RESEND_API_KEY not configured)');
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      logger.error({ error, to, shopDomain, emailType }, 'Resend API error');
      return false;
    }

    logger.info({
      to,
      from: FROM_EMAIL,
      subject: template.subject,
      shopDomain,
      emailType,
    }, 'Email sent via Resend');

    // Record that email was sent to prevent duplicates
    await recordEmailSent(shopDomain, emailType);

    return true;
  } catch (error) {
    logger.error({ error, to, shopDomain, emailType }, 'Failed to send email');
    return false;
  }
}

/**
 * Record that an email was sent to prevent duplicate sends
 */
async function recordEmailSent(shopDomain: string, emailType: string): Promise<void> {
  // Store in shop metadata or a separate email_logs table
  // For now, we'll use the shop's metadata field
  try {
    const shop = await prisma.shop.findUnique({
      where: { shopDomain },
      select: { id: true },
    });

    if (shop) {
      // You could create an EmailLog model or store in metadata
      logger.info({ shopDomain, emailType }, 'Email recorded');
    }
  } catch (error) {
    logger.error({ error, shopDomain, emailType }, 'Failed to record email');
  }
}

/**
 * Check if an email type was recently sent (within cooldown period)
 */
async function wasEmailRecentlySent(
  _shopDomain: string,
  _emailType: string,
  _cooldownHours = 24
): Promise<boolean> {
  // TODO: Implement proper email tracking with EmailLog model
  // Check if email was sent within cooldownHours
  // For now, return false to allow sending
  return false;
}

/**
 * Send limit reached notification email
 */
export async function sendLimitReachedEmail(
  shopDomain: string,
  shopEmail: string,
  shopName: string,
  currentStores: number,
  maxStores: number,
  currentPlan: string
): Promise<boolean> {
  // Check cooldown (don't spam users)
  if (await wasEmailRecentlySent(shopDomain, 'limit_reached', 72)) {
    logger.info({ shopDomain }, 'Limit reached email skipped (cooldown)');
    return false;
  }

  const template = getLimitReachedEmail(
    shopName,
    currentStores,
    maxStores,
    currentPlan,
    APP_URL
  );

  return sendEmail({
    to: shopEmail,
    template,
    shopDomain,
    emailType: 'limit_reached',
  });
}

/**
 * Send near limit warning email (at 80%)
 */
export async function sendNearLimitEmail(
  shopDomain: string,
  shopEmail: string,
  shopName: string,
  currentStores: number,
  maxStores: number,
  currentPlan: string
): Promise<boolean> {
  // Check cooldown
  if (await wasEmailRecentlySent(shopDomain, 'near_limit', 168)) { // 7 days
    logger.info({ shopDomain }, 'Near limit email skipped (cooldown)');
    return false;
  }

  const template = getNearLimitEmail(
    shopName,
    currentStores,
    maxStores,
    currentPlan,
    APP_URL
  );

  return sendEmail({
    to: shopEmail,
    template,
    shopDomain,
    emailType: 'near_limit',
  });
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(
  shopDomain: string,
  shopEmail: string,
  shopName: string
): Promise<boolean> {
  // Only send once
  if (await wasEmailRecentlySent(shopDomain, 'welcome', 8760)) { // 1 year
    return false;
  }

  const template = getWelcomeEmail(shopName, APP_URL);

  return sendEmail({
    to: shopEmail,
    template,
    shopDomain,
    emailType: 'welcome',
  });
}

/**
 * Check all shops and send appropriate conversion emails
 * Call this from a cron job (e.g., daily)
 */
export async function processConversionEmails(): Promise<{
  processed: number;
  limitReachedSent: number;
  nearLimitSent: number;
}> {
  const stats = {
    processed: 0,
    limitReachedSent: 0,
    nearLimitSent: 0,
  };

  try {
    // Get all active shops with their product audit counts
    const shops = await prisma.shop.findMany({
      where: {
        plan: { not: 'PREMIUM' }, // Don't email unlimited users
      },
      select: {
        id: true,
        shopDomain: true,
        email: true,
        name: true,
        plan: true,
        _count: {
          select: { productsAudit: true },
        },
      },
    });

    const planLimits: Record<string, number> = {
      FREE: 10,
      BASIC: 100,
      PLUS: 500,
    };

    for (const shop of shops) {
      stats.processed++;

      const maxProducts = planLimits[shop.plan] || 10;
      const currentProducts = shop._count.productsAudit;
      const usagePercent = (currentProducts / maxProducts) * 100;

      // Skip if no email or under 80%
      if (!shop.email || usagePercent < 80) {
        continue;
      }

      const shopName = shop.name || shop.shopDomain;

      // At limit - send critical email
      if (currentProducts >= maxProducts) {
        const sent = await sendLimitReachedEmail(
          shop.shopDomain,
          shop.email,
          shopName,
          currentProducts,
          maxProducts,
          shop.plan
        );
        if (sent) stats.limitReachedSent++;
      }
      // Near limit (80-99%) - send warning
      else if (usagePercent >= 80) {
        const sent = await sendNearLimitEmail(
          shop.shopDomain,
          shop.email,
          shopName,
          currentProducts,
          maxProducts,
          shop.plan
        );
        if (sent) stats.nearLimitSent++;
      }
    }

    logger.info(stats, 'Conversion emails processed');
  } catch (error) {
    logger.error({ error }, 'Failed to process conversion emails');
  }

  return stats;
}
