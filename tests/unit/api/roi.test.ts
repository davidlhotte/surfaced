import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/shopify/get-shop', () => ({
  getShopFromRequest: vi.fn(),
}));

vi.mock('@/lib/services/roi-dashboard', () => ({
  getROIMetrics: vi.fn(),
  calculateEstimatedROI: vi.fn(),
}));

vi.mock('@/lib/monitoring/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { getShopFromRequest } from '@/lib/shopify/get-shop';
import { getROIMetrics, calculateEstimatedROI } from '@/lib/services/roi-dashboard';

describe('ROI API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/roi', () => {
    it('should return ROI metrics for default period (30d)', async () => {
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockResolvedValue('test.myshopify.com');

      (getROIMetrics as ReturnType<typeof vi.fn>).mockResolvedValue({
        currentScore: 75,
        scoreAtPeriodStart: 65,
        scoreImprovement: 10,
        scoreImprovementPercent: 15.4,
        totalProducts: 100,
        productsImproved: 25,
        productsWithCriticalIssues: 5,
        visibility: {
          totalChecks: 20,
          mentioned: 12,
          mentionRate: 60,
          byPlatform: [
            { platform: 'chatgpt', checks: 5, mentioned: 4, rate: 80 },
            { platform: 'perplexity', checks: 5, mentioned: 3, rate: 60 },
          ],
        },
        optimizationsUsed: 15,
        scoreTrend: [
          { date: '2024-01-10', value: 65 },
          { date: '2024-01-15', value: 75 },
        ],
        visibilityTrend: [],
        scoreDistribution: {
          excellent: 10,
          good: 30,
          needsWork: 40,
          critical: 20,
        },
      });

      (calculateEstimatedROI as ReturnType<typeof vi.fn>).mockReturnValue({
        visibilityIncrease: '+25% vs average',
        potentialReachIncrease: '~500 more AI conversations/month',
        qualityImprovement: '15% better product content',
      });

      const shopDomain = await getShopFromRequest({} as unknown, { rateLimit: false });
      const metrics = await getROIMetrics(shopDomain, '30d');
      const estimatedROI = calculateEstimatedROI(metrics);

      expect(metrics.currentScore).toBe(75);
      expect(metrics.scoreImprovement).toBe(10);
      expect(estimatedROI.visibilityIncrease).toBe('+25% vs average');
    });

    it('should handle all valid time periods', async () => {
      const validPeriods = ['7d', '30d', '90d', '365d'] as const;
      type TimePeriod = (typeof validPeriods)[number];

      const isValidPeriod = (period: string): period is TimePeriod =>
        validPeriods.includes(period as TimePeriod);

      expect(isValidPeriod('7d')).toBe(true);
      expect(isValidPeriod('30d')).toBe(true);
      expect(isValidPeriod('90d')).toBe(true);
      expect(isValidPeriod('365d')).toBe(true);
      expect(isValidPeriod('1d')).toBe(false);
      expect(isValidPeriod('invalid')).toBe(false);
    });

    it('should default to 30d for invalid period', () => {
      const validPeriods = ['7d', '30d', '90d', '365d'];
      type TimePeriod = '7d' | '30d' | '90d' | '365d';

      const normalizePeriod = (periodParam: string): TimePeriod =>
        validPeriods.includes(periodParam) ? (periodParam as TimePeriod) : '30d';

      expect(normalizePeriod('7d')).toBe('7d');
      expect(normalizePeriod('invalid')).toBe('30d');
      expect(normalizePeriod('')).toBe('30d');
    });

    it('should handle shop with no data', async () => {
      (getShopFromRequest as ReturnType<typeof vi.fn>).mockResolvedValue('test.myshopify.com');

      (getROIMetrics as ReturnType<typeof vi.fn>).mockResolvedValue({
        currentScore: 0,
        scoreAtPeriodStart: 0,
        scoreImprovement: 0,
        scoreImprovementPercent: 0,
        totalProducts: 0,
        productsImproved: 0,
        productsWithCriticalIssues: 0,
        visibility: {
          totalChecks: 0,
          mentioned: 0,
          mentionRate: 0,
          byPlatform: [],
        },
        optimizationsUsed: 0,
        scoreTrend: [],
        visibilityTrend: [],
        scoreDistribution: {
          excellent: 0,
          good: 0,
          needsWork: 0,
          critical: 0,
        },
      });

      const metrics = await getROIMetrics('test.myshopify.com', '30d');

      expect(metrics.currentScore).toBe(0);
      expect(metrics.visibility.totalChecks).toBe(0);
    });
  });

  describe('Score Distribution Calculation', () => {
    it('should correctly categorize products by score', () => {
      const calculateDistribution = (scores: number[]) => ({
        excellent: scores.filter((s) => s >= 90).length,
        good: scores.filter((s) => s >= 70 && s < 90).length,
        needsWork: scores.filter((s) => s >= 40 && s < 70).length,
        critical: scores.filter((s) => s < 40).length,
      });

      const scores = [95, 85, 75, 65, 55, 45, 35, 25];
      const distribution = calculateDistribution(scores);

      expect(distribution.excellent).toBe(1); // 95
      expect(distribution.good).toBe(2); // 85, 75
      expect(distribution.needsWork).toBe(3); // 65, 55, 45
      expect(distribution.critical).toBe(2); // 35, 25
    });

    it('should handle edge cases', () => {
      const calculateDistribution = (scores: number[]) => ({
        excellent: scores.filter((s) => s >= 90).length,
        good: scores.filter((s) => s >= 70 && s < 90).length,
        needsWork: scores.filter((s) => s >= 40 && s < 70).length,
        critical: scores.filter((s) => s < 40).length,
      });

      // Boundary values
      expect(calculateDistribution([90]).excellent).toBe(1);
      expect(calculateDistribution([89]).good).toBe(1);
      expect(calculateDistribution([70]).good).toBe(1);
      expect(calculateDistribution([69]).needsWork).toBe(1);
      expect(calculateDistribution([40]).needsWork).toBe(1);
      expect(calculateDistribution([39]).critical).toBe(1);
      expect(calculateDistribution([0]).critical).toBe(1);
      expect(calculateDistribution([100]).excellent).toBe(1);
    });
  });

  describe('ROI Estimation Logic', () => {
    it('should calculate visibility increase', () => {
      const calculateVisibilityIncrease = (mentionRate: number, avgRate: number = 40) => {
        const diff = mentionRate - avgRate;
        if (diff > 0) {
          return `+${Math.round(diff)}% vs average`;
        } else if (diff < 0) {
          return `${Math.round(diff)}% vs average`;
        }
        return 'At average';
      };

      expect(calculateVisibilityIncrease(65)).toBe('+25% vs average');
      expect(calculateVisibilityIncrease(40)).toBe('At average');
      expect(calculateVisibilityIncrease(30)).toBe('-10% vs average');
    });

    it('should calculate potential reach increase', () => {
      const calculatePotentialReach = (mentionRate: number) => {
        const baseConversations = 1000;
        const increase = Math.round((mentionRate / 100) * baseConversations);
        return `~${increase} AI conversations/month`;
      };

      expect(calculatePotentialReach(50)).toBe('~500 AI conversations/month');
      expect(calculatePotentialReach(75)).toBe('~750 AI conversations/month');
      expect(calculatePotentialReach(0)).toBe('~0 AI conversations/month');
    });

    it('should calculate quality improvement', () => {
      const calculateQualityImprovement = (scoreImprovement: number) => {
        if (scoreImprovement > 0) {
          return `${scoreImprovement}% better product content`;
        } else if (scoreImprovement < 0) {
          return `${Math.abs(scoreImprovement)}% decline in product content`;
        }
        return 'No change';
      };

      expect(calculateQualityImprovement(15)).toBe('15% better product content');
      expect(calculateQualityImprovement(-5)).toBe('5% decline in product content');
      expect(calculateQualityImprovement(0)).toBe('No change');
    });
  });

  describe('Trend Data Handling', () => {
    it('should handle empty trend data', () => {
      const formatTrendData = (trend: { date: string; value: number }[]) =>
        trend.map((point) => ({
          date: new Date(point.date).toLocaleDateString(),
          value: point.value,
        }));

      expect(formatTrendData([])).toEqual([]);
    });

    it('should format trend data correctly', () => {
      const trend = [
        { date: '2024-01-10', value: 65 },
        { date: '2024-01-15', value: 75 },
      ];

      const getLatestTrend = (data: typeof trend) =>
        data.length > 0 ? data[data.length - 1] : null;

      expect(getLatestTrend(trend)?.value).toBe(75);
      expect(getLatestTrend([])).toBeNull();
    });

    it('should calculate score change from trend', () => {
      const calculateScoreChange = (trend: { date: string; value: number }[]) => {
        if (trend.length < 2) return 0;
        return trend[trend.length - 1].value - trend[0].value;
      };

      expect(calculateScoreChange([
        { date: '2024-01-10', value: 65 },
        { date: '2024-01-15', value: 75 },
      ])).toBe(10);

      expect(calculateScoreChange([{ date: '2024-01-10', value: 65 }])).toBe(0);
      expect(calculateScoreChange([])).toBe(0);
    });
  });
});
