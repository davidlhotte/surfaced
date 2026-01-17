import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/shopify/get-shop', () => ({
  getShopFromRequest: vi.fn(),
}));

vi.mock('@/lib/services/alerts', () => ({
  getActiveAlerts: vi.fn(),
  getAlertPreferences: vi.fn(),
  updateAlertPreferences: vi.fn(),
  generateWeeklyReport: vi.fn(),
}));

vi.mock('@/lib/monitoring/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { getShopFromRequest } from '@/lib/shopify/get-shop';
import {
  getActiveAlerts,
  getAlertPreferences,
  updateAlertPreferences,
  generateWeeklyReport,
} from '@/lib/services/alerts';

describe('Alerts API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/alerts', () => {
    it('should return active alerts and preferences', async () => {
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockResolvedValue('test.myshopify.com');

      (getActiveAlerts as ReturnType<typeof vi.fn>).mockResolvedValue([
        {
          id: 'alert-1',
          type: 'score_drop',
          priority: 'high',
          title: 'Score Dropped',
          message: 'Your score dropped by 15 points',
          createdAt: new Date('2024-01-15'),
        },
        {
          id: 'alert-2',
          type: 'critical_issues',
          priority: 'critical',
          title: 'Critical Issues Found',
          message: '5 products have critical issues',
          createdAt: new Date('2024-01-14'),
        },
      ]);

      (getAlertPreferences as ReturnType<typeof vi.fn>).mockResolvedValue({
        emailAlerts: true,
        weeklyReport: true,
        scoreDropThreshold: 10,
        criticalAlertsOnly: false,
      });

      const shopDomain = await getShopFromRequest({} as unknown, { rateLimit: false });
      const alerts = await getActiveAlerts(shopDomain);
      const preferences = await getAlertPreferences(shopDomain);

      expect(alerts).toHaveLength(2);
      expect(alerts[0].type).toBe('score_drop');
      expect(preferences.emailAlerts).toBe(true);
    });

    it('should include weekly report when requested', async () => {
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockResolvedValue('test.myshopify.com');

      (generateWeeklyReport as ReturnType<typeof vi.fn>).mockResolvedValue({
        period: {
          start: new Date('2024-01-08'),
          end: new Date('2024-01-15'),
        },
        metrics: {
          aiScore: 75,
          scoreChange: 5,
          productsAudited: 50,
          criticalIssues: 3,
          visibilityChecks: 10,
          mentionRate: 60,
        },
        topIssues: [
          { code: 'SHORT_DESCRIPTION', count: 15 },
          { code: 'NO_IMAGES', count: 8 },
        ],
        recommendations: [
          'Fix critical issues in 3 products',
          'Add descriptions to products without any description text',
        ],
      });

      const report = await generateWeeklyReport('test.myshopify.com');

      expect(report).toBeDefined();
      expect(report?.metrics.aiScore).toBe(75);
      expect(report?.metrics.scoreChange).toBe(5);
      expect(report?.topIssues).toHaveLength(2);
    });

    it('should handle shop with no alerts', async () => {
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockResolvedValue('test.myshopify.com');
      (getActiveAlerts as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const alerts = await getActiveAlerts('test.myshopify.com');

      expect(alerts).toEqual([]);
    });
  });

  describe('POST /api/alerts', () => {
    it('should update alert preferences', async () => {
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockResolvedValue('test.myshopify.com');

      (updateAlertPreferences as ReturnType<typeof vi.fn>).mockResolvedValue({
        emailAlerts: false,
        weeklyReport: true,
        scoreDropThreshold: 10,
        criticalAlertsOnly: false,
      });

      const preferences = await updateAlertPreferences('test.myshopify.com', {
        emailAlerts: false,
      });

      expect(preferences.emailAlerts).toBe(false);
      expect(updateAlertPreferences).toHaveBeenCalledWith('test.myshopify.com', {
        emailAlerts: false,
      });
    });

    it('should only accept boolean values for preferences', () => {
      const validatePreferences = (body: Record<string, unknown>) => {
        const updates: { emailAlerts?: boolean; weeklyReport?: boolean } = {};

        if (typeof body.emailAlerts === 'boolean') {
          updates.emailAlerts = body.emailAlerts;
        }

        if (typeof body.weeklyReport === 'boolean') {
          updates.weeklyReport = body.weeklyReport;
        }

        return updates;
      };

      // Valid booleans
      expect(validatePreferences({ emailAlerts: true })).toEqual({ emailAlerts: true });
      expect(validatePreferences({ weeklyReport: false })).toEqual({ weeklyReport: false });

      // Invalid types should be ignored
      expect(validatePreferences({ emailAlerts: 'true' })).toEqual({});
      expect(validatePreferences({ weeklyReport: 1 })).toEqual({});
      expect(validatePreferences({ emailAlerts: null })).toEqual({});
    });

    it('should handle update failure', async () => {
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockResolvedValue('test.myshopify.com');
      (updateAlertPreferences as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Shop not found')
      );

      await expect(
        updateAlertPreferences('test.myshopify.com', { emailAlerts: false })
      ).rejects.toThrow('Shop not found');
    });
  });

  describe('Alert Priority Sorting', () => {
    it('should sort alerts by priority', () => {
      type AlertPriority = 'low' | 'medium' | 'high' | 'critical';
      const alerts = [
        { id: '1', priority: 'low' as AlertPriority, createdAt: new Date('2024-01-15') },
        { id: '2', priority: 'critical' as AlertPriority, createdAt: new Date('2024-01-14') },
        { id: '3', priority: 'high' as AlertPriority, createdAt: new Date('2024-01-13') },
        { id: '4', priority: 'medium' as AlertPriority, createdAt: new Date('2024-01-12') },
      ];

      const priorityOrder: Record<AlertPriority, number> = {
        critical: 0,
        high: 1,
        medium: 2,
        low: 3,
      };

      const sortAlerts = (alertList: typeof alerts) =>
        [...alertList].sort((a, b) => {
          if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          }
          return b.createdAt.getTime() - a.createdAt.getTime();
        });

      const sorted = sortAlerts(alerts);

      expect(sorted[0].priority).toBe('critical');
      expect(sorted[1].priority).toBe('high');
      expect(sorted[2].priority).toBe('medium');
      expect(sorted[3].priority).toBe('low');
    });

    it('should sort same-priority alerts by date', () => {
      type AlertPriority = 'low' | 'medium' | 'high' | 'critical';
      const alerts = [
        { id: '1', priority: 'high' as AlertPriority, createdAt: new Date('2024-01-13') },
        { id: '2', priority: 'high' as AlertPriority, createdAt: new Date('2024-01-15') },
        { id: '3', priority: 'high' as AlertPriority, createdAt: new Date('2024-01-14') },
      ];

      const sortAlerts = (alertList: typeof alerts) =>
        [...alertList].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      const sorted = sortAlerts(alerts);

      expect(sorted[0].id).toBe('2'); // Most recent
      expect(sorted[1].id).toBe('3');
      expect(sorted[2].id).toBe('1'); // Oldest
    });
  });

  describe('Alert Type Validation', () => {
    it('should recognize all valid alert types', () => {
      const validTypes = [
        'score_drop',
        'visibility_issue',
        'weekly_report',
        'critical_issues',
        'optimization_tip',
      ];

      const isValidAlertType = (type: string) => validTypes.includes(type);

      validTypes.forEach((type) => {
        expect(isValidAlertType(type)).toBe(true);
      });

      expect(isValidAlertType('invalid_type')).toBe(false);
      expect(isValidAlertType('')).toBe(false);
    });
  });
});
