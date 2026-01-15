import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { validateSettings } from '@/lib/utils/validation';
import { handleApiError, ValidationError } from '@/lib/utils/errors';
import { cacheDel, cacheKeys } from '@/lib/cache/redis';
import { getPlanFeatures } from '@/lib/constants/plans';
import { auditLog } from '@/lib/monitoring/logger';
import { getShopFromRequest, getShopWithSettings } from '@/lib/shopify/get-shop';
import type { SettingsInput } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const shop = await getShopFromRequest(request);
    const shopData = await getShopWithSettings(shop);
    const features = getPlanFeatures(shopData.plan);

    return NextResponse.json({
      success: true,
      data: {
        settings: shopData.settings,
        plan: shopData.plan,
        features,
      },
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const shop = await getShopFromRequest(request);
    const shopData = await getShopWithSettings(shop);

    const body = await request.json();
    const validation = validateSettings(body);

    if (!validation.success) {
      throw new ValidationError('Invalid settings data', {
        errors: validation.error.issues,
      });
    }

    const data = validation.data as SettingsInput;

    const settings = await prisma.settings.upsert({
      where: { shopId: shopData.id },
      update: {
        emailAlerts: data.emailAlerts,
        weeklyReport: data.weeklyReport,
        autoAuditEnabled: data.autoAuditEnabled,
        auditFrequency: data.auditFrequency,
      },
      create: {
        shopId: shopData.id,
        emailAlerts: data.emailAlerts ?? true,
        weeklyReport: data.weeklyReport ?? true,
        autoAuditEnabled: data.autoAuditEnabled ?? true,
        auditFrequency: data.auditFrequency ?? 'weekly',
      },
    });

    // Invalidate cache
    await cacheDel(cacheKeys.settings(shop));
    await cacheDel(cacheKeys.stores(shop));

    auditLog('settings_updated', shop, { settingsId: settings.id });

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
