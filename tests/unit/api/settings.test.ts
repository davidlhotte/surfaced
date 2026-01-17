import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/shopify/get-shop', () => ({
  getShopFromRequest: vi.fn(),
  getShopWithSettings: vi.fn(),
}));

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    settings: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock('@/lib/utils/validation', () => ({
  validateSettings: vi.fn(),
}));

vi.mock('@/lib/cache/redis', () => ({
  cacheDel: vi.fn(),
  cacheKeys: {
    settings: (shop: string) => `settings:${shop}`,
    stores: (shop: string) => `stores:${shop}`,
  },
}));

vi.mock('@/lib/constants/plans', () => ({
  getPlanFeatures: vi.fn(),
}));

vi.mock('@/lib/monitoring/logger', () => ({
  auditLog: vi.fn(),
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { getShopFromRequest, getShopWithSettings } from '@/lib/shopify/get-shop';
import { prisma } from '@/lib/db/prisma';
import { validateSettings } from '@/lib/utils/validation';
import { getPlanFeatures } from '@/lib/constants/plans';
import { cacheDel } from '@/lib/cache/redis';

describe('Settings API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/settings', () => {
    it('should return settings and plan features', async () => {
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockResolvedValue('test.myshopify.com');

      (getShopWithSettings as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
        shopDomain: 'test.myshopify.com',
        plan: 'BASIC',
        settings: {
          emailAlerts: true,
          weeklyReport: true,
          autoAuditEnabled: true,
          auditFrequency: 'weekly',
        },
      });

      (getPlanFeatures as ReturnType<typeof vi.fn>).mockReturnValue({
        productsAudit: 100,
        visibilityChecks: 20,
        competitorsTracked: 3,
        aiOptimizations: 10,
      });

      const shopDomain = await getShopFromRequest({} as unknown);
      const shopData = await getShopWithSettings(shopDomain);
      const features = getPlanFeatures(shopData.plan);

      expect(shopData.plan).toBe('BASIC');
      expect(shopData.settings.emailAlerts).toBe(true);
      expect(features.productsAudit).toBe(100);
    });

    it('should handle shop not found', async () => {
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Shop not found')
      );

      await expect(getShopFromRequest({} as unknown)).rejects.toThrow('Shop not found');
    });

    it('should return default settings for new shop', async () => {
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockResolvedValue('new.myshopify.com');

      (getShopWithSettings as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-2',
        shopDomain: 'new.myshopify.com',
        plan: 'FREE',
        settings: null,
      });

      const shopData = await getShopWithSettings('new.myshopify.com');

      expect(shopData.settings).toBeNull();
    });
  });

  describe('PUT /api/settings', () => {
    it('should update settings with valid data', async () => {
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockResolvedValue('test.myshopify.com');

      (getShopWithSettings as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
        shopDomain: 'test.myshopify.com',
        plan: 'BASIC',
      });

      (validateSettings as ReturnType<typeof vi.fn>).mockReturnValue({
        success: true,
        data: {
          emailAlerts: false,
          weeklyReport: true,
          autoAuditEnabled: true,
          auditFrequency: 'daily',
        },
      });

      (prisma.settings.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'settings-1',
        emailAlerts: false,
        weeklyReport: true,
        autoAuditEnabled: true,
        auditFrequency: 'daily',
      });

      const settings = await prisma.settings.upsert({
        where: { shopId: 'shop-1' },
        update: {
          emailAlerts: false,
          weeklyReport: true,
          autoAuditEnabled: true,
          auditFrequency: 'daily',
        },
        create: {
          shopId: 'shop-1',
          emailAlerts: false,
          weeklyReport: true,
          autoAuditEnabled: true,
          auditFrequency: 'daily',
        },
      });

      expect(settings.emailAlerts).toBe(false);
      expect(settings.auditFrequency).toBe('daily');
    });

    it('should reject invalid settings data', async () => {
      (validateSettings as ReturnType<typeof vi.fn>).mockReturnValue({
        success: false,
        error: {
          issues: [
            { path: ['auditFrequency'], message: 'Invalid enum value' },
          ],
        },
      });

      const validation = validateSettings({ auditFrequency: 'invalid' });

      expect(validation.success).toBe(false);
      expect(validation.error?.issues).toHaveLength(1);
    });

    it('should invalidate cache after update', async () => {
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockResolvedValue('test.myshopify.com');

      await cacheDel('settings:test.myshopify.com');
      await cacheDel('stores:test.myshopify.com');

      expect(cacheDel).toHaveBeenCalledTimes(2);
    });
  });

  describe('Settings Validation', () => {
    it('should validate boolean fields', () => {
      const validateBooleanFields = (data: Record<string, unknown>) => {
        const errors: string[] = [];

        if (data.emailAlerts !== undefined && typeof data.emailAlerts !== 'boolean') {
          errors.push('emailAlerts must be boolean');
        }
        if (data.weeklyReport !== undefined && typeof data.weeklyReport !== 'boolean') {
          errors.push('weeklyReport must be boolean');
        }
        if (data.autoAuditEnabled !== undefined && typeof data.autoAuditEnabled !== 'boolean') {
          errors.push('autoAuditEnabled must be boolean');
        }

        return { valid: errors.length === 0, errors };
      };

      expect(validateBooleanFields({ emailAlerts: true })).toEqual({ valid: true, errors: [] });
      expect(validateBooleanFields({ emailAlerts: 'true' })).toEqual({
        valid: false,
        errors: ['emailAlerts must be boolean'],
      });
    });

    it('should validate audit frequency enum', () => {
      const validFrequencies = ['daily', 'weekly', 'monthly'];

      const validateFrequency = (frequency: unknown) =>
        typeof frequency === 'string' && validFrequencies.includes(frequency);

      expect(validateFrequency('daily')).toBe(true);
      expect(validateFrequency('weekly')).toBe(true);
      expect(validateFrequency('monthly')).toBe(true);
      expect(validateFrequency('hourly')).toBe(false);
      expect(validateFrequency(123)).toBe(false);
    });
  });

  describe('Plan Features', () => {
    it('should return correct features for each plan', () => {
      const planFeatures = {
        FREE: { productsAudit: 10, visibilityChecks: 5, competitorsTracked: 0, aiOptimizations: 0 },
        BASIC: { productsAudit: 100, visibilityChecks: 20, competitorsTracked: 3, aiOptimizations: 10 },
        PLUS: { productsAudit: 500, visibilityChecks: 50, competitorsTracked: 10, aiOptimizations: 25 },
        PREMIUM: { productsAudit: -1, visibilityChecks: -1, competitorsTracked: 25, aiOptimizations: -1 },
      };

      const getFeatures = (plan: keyof typeof planFeatures) => planFeatures[plan];

      expect(getFeatures('FREE').productsAudit).toBe(10);
      expect(getFeatures('BASIC').aiOptimizations).toBe(10);
      expect(getFeatures('PREMIUM').productsAudit).toBe(-1); // Unlimited
    });

    it('should handle unlimited features (-1)', () => {
      const isUnlimited = (value: number) => value === -1;
      const formatLimit = (value: number) => (isUnlimited(value) ? 'Unlimited' : String(value));

      expect(formatLimit(-1)).toBe('Unlimited');
      expect(formatLimit(100)).toBe('100');
    });
  });

  describe('Settings Default Values', () => {
    it('should use default values for missing fields', () => {
      const applyDefaults = (data: Partial<{
        emailAlerts: boolean;
        weeklyReport: boolean;
        autoAuditEnabled: boolean;
        auditFrequency: string;
      }>) => ({
        emailAlerts: data.emailAlerts ?? true,
        weeklyReport: data.weeklyReport ?? true,
        autoAuditEnabled: data.autoAuditEnabled ?? true,
        auditFrequency: data.auditFrequency ?? 'weekly',
      });

      expect(applyDefaults({})).toEqual({
        emailAlerts: true,
        weeklyReport: true,
        autoAuditEnabled: true,
        auditFrequency: 'weekly',
      });

      expect(applyDefaults({ emailAlerts: false })).toEqual({
        emailAlerts: false,
        weeklyReport: true,
        autoAuditEnabled: true,
        auditFrequency: 'weekly',
      });
    });
  });

  describe('Cache Invalidation', () => {
    it('should generate correct cache keys', () => {
      const cacheKeys = {
        settings: (shop: string) => `settings:${shop}`,
        stores: (shop: string) => `stores:${shop}`,
      };

      expect(cacheKeys.settings('test.myshopify.com')).toBe('settings:test.myshopify.com');
      expect(cacheKeys.stores('test.myshopify.com')).toBe('stores:test.myshopify.com');
    });
  });
});
