import { describe, it, expect, vi, beforeEach } from 'vitest';

// Set up env before any imports
process.env.SHOPIFY_API_KEY = 'test-api-key';
process.env.SHOPIFY_API_SECRET = 'test-api-secret';
process.env.SHOPIFY_APP_URL = 'https://test-app.example.com';

// Mock dependencies
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    shop: {
      update: vi.fn(),
      findUnique: vi.fn(),
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

vi.mock('@/lib/constants/plans', () => ({
  PLAN_PRICES: {
    FREE: 0,
    BASIC: 4.99,
    PLUS: 9.99,
    PREMIUM: 19.99,
  },
}));

vi.mock('@/lib/shopify/auth', () => ({
  shopify: {
    clients: {
      Graphql: vi.fn(),
    },
  },
  getShopSession: vi.fn(),
}));

import {
  getPlanFromSubscriptionName,
  updateShopPlan,
  createSubscription,
  getActiveSubscription,
} from '@/lib/shopify/billing';
import { getShopSession } from '@/lib/shopify/auth';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/monitoring/logger';

describe('Billing Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPlanFromSubscriptionName', () => {
    it('should return PREMIUM for Premium subscription', () => {
      expect(getPlanFromSubscriptionName('LocateUs Premium')).toBe('PREMIUM');
      expect(getPlanFromSubscriptionName('Premium Plan')).toBe('PREMIUM');
      expect(getPlanFromSubscriptionName('Some Premium Thing')).toBe('PREMIUM');
    });

    it('should return PLUS for Plus subscription', () => {
      expect(getPlanFromSubscriptionName('LocateUs Plus')).toBe('PLUS');
      expect(getPlanFromSubscriptionName('Plus Plan')).toBe('PLUS');
      expect(getPlanFromSubscriptionName('Some Plus Thing')).toBe('PLUS');
    });

    it('should return BASIC for Basic subscription', () => {
      expect(getPlanFromSubscriptionName('LocateUs Basic')).toBe('BASIC');
      expect(getPlanFromSubscriptionName('Basic Plan')).toBe('BASIC');
      expect(getPlanFromSubscriptionName('Some Basic Thing')).toBe('BASIC');
    });

    it('should return FREE for unknown subscription', () => {
      expect(getPlanFromSubscriptionName('Unknown')).toBe('FREE');
      expect(getPlanFromSubscriptionName('')).toBe('FREE');
      expect(getPlanFromSubscriptionName('Trial')).toBe('FREE');
    });

    it('should prioritize Premium over Plus and Basic', () => {
      expect(getPlanFromSubscriptionName('Premium Plus Basic')).toBe('PREMIUM');
    });

    it('should prioritize Plus over Basic', () => {
      expect(getPlanFromSubscriptionName('Plus Basic')).toBe('PLUS');
    });
  });

  describe('updateShopPlan', () => {
    it('should update shop plan in database', async () => {
      const shopDomain = 'test.myshopify.com';
      const plan = 'BASIC';

      await updateShopPlan(shopDomain, plan as never);

      expect(prisma.shop.update).toHaveBeenCalledWith({
        where: { shopDomain },
        data: { plan },
      });
    });

    it('should log plan update', async () => {
      const shopDomain = 'test.myshopify.com';
      const plan = 'PLUS';

      await updateShopPlan(shopDomain, plan as never);

      expect(logger.info).toHaveBeenCalledWith(
        { shopDomain, plan },
        'Shop plan updated'
      );
    });

    it('should update to FREE plan', async () => {
      const shopDomain = 'test.myshopify.com';

      await updateShopPlan(shopDomain, 'FREE' as never);

      expect(prisma.shop.update).toHaveBeenCalledWith({
        where: { shopDomain },
        data: { plan: 'FREE' },
      });
    });

    it('should update to PREMIUM plan', async () => {
      const shopDomain = 'test.myshopify.com';

      await updateShopPlan(shopDomain, 'PREMIUM' as never);

      expect(prisma.shop.update).toHaveBeenCalledWith({
        where: { shopDomain },
        data: { plan: 'PREMIUM' },
      });
    });
  });

  describe('createSubscription', () => {
    it('should return error when no session found', async () => {
      (getShopSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const result = await createSubscription('test.myshopify.com', 'BASIC');

      expect(result.confirmationUrl).toBeNull();
      expect(result.error).toContain('No session found');
    });

    it('should return error for dev token', async () => {
      (getShopSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        shop: 'test.myshopify.com',
        accessToken: 'dev-token-123',
      });

      const result = await createSubscription('test.myshopify.com', 'BASIC');

      expect(result.confirmationUrl).toBeNull();
      expect(result.error).toContain('Invalid access token');
    });

    it('should return error for empty access token', async () => {
      (getShopSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        shop: 'test.myshopify.com',
        accessToken: '',
      });

      const result = await createSubscription('test.myshopify.com', 'BASIC');

      expect(result.confirmationUrl).toBeNull();
      expect(result.error).toContain('Invalid access token');
    });
  });

  describe('getActiveSubscription', () => {
    it('should return null when no session found', async () => {
      (getShopSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const result = await getActiveSubscription('test.myshopify.com');

      expect(result).toBeNull();
    });
  });
});
