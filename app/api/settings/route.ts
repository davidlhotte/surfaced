import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { validateSettings } from '@/lib/utils/validation';
import { handleApiError, ValidationError, ForbiddenError } from '@/lib/utils/errors';
import { cacheDel, cacheKeys } from '@/lib/cache/redis';
import { hasFeature, getPlanFeatures } from '@/lib/constants/plans';
import { auditLog } from '@/lib/monitoring/logger';
import { isDevMode } from '@/lib/utils/dev';
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
    const currentSettings = shopData.settings;

    // Check plan restrictions (skip in development mode for testing)
    const skipPlanChecks = isDevMode();

    if (!skipPlanChecks) {
      // Only check if value changed from current settings
      const colorChanged = data.markerColor && data.markerColor !== currentSettings?.markerColor;
      if (colorChanged && !hasFeature(shopData.plan, 'customMarkerColor')) {
        throw new ForbiddenError('Custom marker color requires Basic plan or higher');
      }

      const iconChanged = data.markerIcon && data.markerIcon !== currentSettings?.markerIcon;
      if (iconChanged && !hasFeature(shopData.plan, 'customMarkerIcon')) {
        throw new ForbiddenError('Custom marker icon requires Plus plan or higher');
      }

      if (data.hidePoweredBy && !currentSettings?.hidePoweredBy && !hasFeature(shopData.plan, 'hideBranding')) {
        throw new ForbiddenError('Hide branding requires Premium plan');
      }

      // Design customization requires Basic plan or higher
      if (data.designSettings && Object.keys(data.designSettings).length > 0 && !hasFeature(shopData.plan, 'designCustomization')) {
        throw new ForbiddenError('Design customization requires Basic plan or higher');
      }
    }

    const settings = await prisma.settings.upsert({
      where: { shopId: shopData.id },
      update: data,
      create: {
        shopId: shopData.id,
        ...data,
      },
    });

    // Invalidate cache (both settings and storefront cache since it includes settings)
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
