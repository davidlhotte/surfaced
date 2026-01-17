import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    shop: {
      findUnique: vi.fn(),
    },
    auditLog: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    visibilityCheck: {
      findMany: vi.fn(),
    },
    productAudit: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    settings: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock('@/lib/monitoring/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Import after mocks
import { prisma } from '@/lib/db/prisma';
import {
  checkForScoreDrops,
  checkForVisibilityIssues,
  checkForCriticalIssues,
  getActiveAlerts,
  getAlertPreferences,
  updateAlertPreferences,
  generateWeeklyReport,
  logAlertSent,
} from '@/lib/services/alerts';

describe('Alerts Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkForScoreDrops', () => {
    it('should return empty array if shop not found', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const alerts = await checkForScoreDrops('nonexistent.myshopify.com');

      expect(alerts).toEqual([]);
    });

    it('should return empty array if less than 2 audits', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
        aiScore: 75,
        settings: { emailAlerts: true },
      });

      (prisma.auditLog.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { details: { averageScore: 75 } },
      ]);

      const alerts = await checkForScoreDrops('test.myshopify.com');

      expect(alerts).toEqual([]);
    });

    it('should create alert when score drops by 10+ points', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
        aiScore: 65,
        settings: { emailAlerts: true },
      });

      (prisma.auditLog.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { details: { averageScore: 65 }, createdAt: new Date() },
        { details: { averageScore: 80 }, createdAt: new Date(Date.now() - 86400000) },
      ]);

      const alerts = await checkForScoreDrops('test.myshopify.com');

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('score_drop');
      expect(alerts[0].priority).toBe('high');
      expect(alerts[0].metadata?.drop).toBe(15);
    });

    it('should create critical alert for 20+ point drops', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
        aiScore: 50,
        settings: { emailAlerts: true },
      });

      (prisma.auditLog.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { details: { averageScore: 50 } },
        { details: { averageScore: 75 } },
      ]);

      const alerts = await checkForScoreDrops('test.myshopify.com');

      expect(alerts[0].priority).toBe('critical');
    });

    it('should not alert for small score changes', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
        aiScore: 78,
        settings: { emailAlerts: true },
      });

      (prisma.auditLog.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { details: { averageScore: 78 } },
        { details: { averageScore: 82 } },
      ]);

      const alerts = await checkForScoreDrops('test.myshopify.com');

      expect(alerts).toHaveLength(0);
    });
  });

  describe('checkForVisibilityIssues', () => {
    it('should return empty array if shop not found', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const alerts = await checkForVisibilityIssues('nonexistent.myshopify.com');

      expect(alerts).toEqual([]);
    });

    it('should alert when mention rate below 30%', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
        name: 'Test Store',
      });

      (prisma.visibilityCheck.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { isMentioned: false },
        { isMentioned: false },
        { isMentioned: false },
        { isMentioned: true },
        { isMentioned: false },
      ]);

      const alerts = await checkForVisibilityIssues('test.myshopify.com');

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('visibility_issue');
      expect(alerts[0].priority).toBe('high');
    });

    it('should create critical alert for 0% mention rate', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
        name: 'Test Store',
      });

      (prisma.visibilityCheck.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { isMentioned: false },
        { isMentioned: false },
        { isMentioned: false },
      ]);

      const alerts = await checkForVisibilityIssues('test.myshopify.com');

      expect(alerts[0].priority).toBe('critical');
    });

    it('should not alert for good mention rates', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
        name: 'Test Store',
      });

      (prisma.visibilityCheck.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { isMentioned: true },
        { isMentioned: true },
        { isMentioned: true },
        { isMentioned: false },
      ]);

      const alerts = await checkForVisibilityIssues('test.myshopify.com');

      expect(alerts).toHaveLength(0);
    });
  });

  describe('checkForCriticalIssues', () => {
    it('should return empty array if shop not found', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const alerts = await checkForCriticalIssues('nonexistent.myshopify.com');

      expect(alerts).toEqual([]);
    });

    it('should alert when products have critical scores', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
      });

      (prisma.productAudit.count as ReturnType<typeof vi.fn>).mockResolvedValue(5);

      const alerts = await checkForCriticalIssues('test.myshopify.com');

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('critical_issues');
      expect(alerts[0].metadata?.criticalCount).toBe(5);
    });

    it('should create critical priority for 10+ critical products', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
      });

      (prisma.productAudit.count as ReturnType<typeof vi.fn>).mockResolvedValue(15);

      const alerts = await checkForCriticalIssues('test.myshopify.com');

      expect(alerts[0].priority).toBe('critical');
    });

    it('should not alert when no critical products', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
      });

      (prisma.productAudit.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

      const alerts = await checkForCriticalIssues('test.myshopify.com');

      expect(alerts).toHaveLength(0);
    });
  });

  describe('getActiveAlerts', () => {
    it('should combine and sort all alert types', async () => {
      // Setup mocks for all alert types
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ id: 'shop-1', aiScore: 50, settings: { emailAlerts: true } })
        .mockResolvedValueOnce({ id: 'shop-1', name: 'Test' })
        .mockResolvedValueOnce({ id: 'shop-1' });

      (prisma.auditLog.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { details: { averageScore: 50 } },
        { details: { averageScore: 70 } },
      ]);

      (prisma.visibilityCheck.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { isMentioned: false },
      ]);

      (prisma.productAudit.count as ReturnType<typeof vi.fn>).mockResolvedValue(5);

      const alerts = await getActiveAlerts('test.myshopify.com');

      // Should have alerts from all three checks
      expect(alerts.length).toBeGreaterThan(0);

      // Should be sorted by priority (critical first)
      if (alerts.length > 1) {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        for (let i = 1; i < alerts.length; i++) {
          expect(priorityOrder[alerts[i - 1].priority])
            .toBeLessThanOrEqual(priorityOrder[alerts[i].priority]);
        }
      }
    });
  });

  describe('getAlertPreferences', () => {
    it('should return default preferences if shop not found', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const prefs = await getAlertPreferences('test.myshopify.com');

      expect(prefs.emailAlerts).toBe(true);
      expect(prefs.weeklyReport).toBe(true);
      expect(prefs.scoreDropThreshold).toBe(10);
    });

    it('should return shop preferences', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        settings: {
          emailAlerts: false,
          weeklyReport: true,
        },
      });

      const prefs = await getAlertPreferences('test.myshopify.com');

      expect(prefs.emailAlerts).toBe(false);
      expect(prefs.weeklyReport).toBe(true);
    });
  });

  describe('updateAlertPreferences', () => {
    it('should throw error if shop not found', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(
        updateAlertPreferences('nonexistent.myshopify.com', { emailAlerts: true })
      ).rejects.toThrow('Shop not found');
    });

    it('should update and return new preferences', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ id: 'shop-1' })
        .mockResolvedValueOnce({ settings: { emailAlerts: false, weeklyReport: true } });

      (prisma.settings.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({});

      const prefs = await updateAlertPreferences('test.myshopify.com', {
        emailAlerts: false,
      });

      expect(prisma.settings.upsert).toHaveBeenCalled();
      expect(prefs.emailAlerts).toBe(false);
    });
  });

  describe('generateWeeklyReport', () => {
    it('should return null if shop not found', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const report = await generateWeeklyReport('nonexistent.myshopify.com');

      expect(report).toBeNull();
    });

    it('should generate comprehensive weekly report', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
        aiScore: 72,
        plan: 'FREE',
      });

      (prisma.productAudit.count as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(50)  // productsAudited
        .mockResolvedValueOnce(3);   // criticalProducts

      (prisma.visibilityCheck.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { isMentioned: true },
        { isMentioned: true },
        { isMentioned: false },
      ]);

      (prisma.auditLog.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        details: { averageScore: 68 },
      });

      (prisma.productAudit.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { issues: [{ code: 'NO_DESCRIPTION' }, { code: 'SHORT_DESCRIPTION' }] },
        { issues: [{ code: 'NO_DESCRIPTION' }] },
      ]);

      const report = await generateWeeklyReport('test.myshopify.com');

      expect(report).not.toBeNull();
      expect(report?.metrics.aiScore).toBe(72);
      expect(report?.metrics.scoreChange).toBe(4); // 72 - 68
      expect(report?.metrics.productsAudited).toBe(50);
      expect(report?.metrics.visibilityChecks).toBe(3);
      expect(report?.topIssues.length).toBeGreaterThan(0);
    });

    it('should include upgrade recommendation for free plan', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
        aiScore: 80,
        plan: 'FREE',
      });

      (prisma.productAudit.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
      (prisma.visibilityCheck.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (prisma.auditLog.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (prisma.productAudit.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const report = await generateWeeklyReport('test.myshopify.com');

      expect(report?.recommendations).toContain(
        'Upgrade to a paid plan to audit more products and run more visibility checks.'
      );
    });
  });

  describe('logAlertSent', () => {
    it('should not throw if shop not found', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(
        logAlertSent('nonexistent.myshopify.com', 'score_drop')
      ).resolves.not.toThrow();
    });

    it('should create audit log entry', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
      });

      (prisma.auditLog.create as ReturnType<typeof vi.fn>).mockResolvedValue({});

      await logAlertSent('test.myshopify.com', 'critical_issues', { count: 5 });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          shopId: 'shop-1',
          action: 'alert_critical_issues',
          details: { count: 5 },
        },
      });
    });
  });
});
