import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';

// Mock dependencies
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    store: { deleteMany: vi.fn() },
    settings: { deleteMany: vi.fn() },
    auditLog: { deleteMany: vi.fn() },
    shop: {
      delete: vi.fn(),
      findUnique: vi.fn().mockResolvedValue({ id: 'test-shop-id', shopDomain: 'test.myshopify.com' }),
    },
    productAudit: { deleteMany: vi.fn() },
    visibilityCheck: { deleteMany: vi.fn() },
    competitor: { deleteMany: vi.fn() },
    emailSequenceEvent: { deleteMany: vi.fn() },
    llmsTxtConfig: { deleteMany: vi.fn() },
  },
}));

vi.mock('@/lib/cache/redis', () => ({
  cacheDel: vi.fn().mockResolvedValue(true),
  cacheKeys: {
    stores: (shop: string) => `stores:${shop}`,
    settings: (shop: string) => `settings:${shop}`,
    shop: (shop: string) => `shop:${shop}`,
  },
}));

vi.mock('@/lib/monitoring/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  auditLog: vi.fn(),
}));

import {
  verifyWebhookHmac,
  handleAppUninstalled,
  handleShopUpdate,
  handleCustomersDataRequest,
  handleCustomersRedact,
  handleShopRedact,
} from '@/lib/shopify/webhooks';
import { prisma } from '@/lib/db/prisma';
import { cacheDel } from '@/lib/cache/redis';
import { auditLog } from '@/lib/monitoring/logger';

describe('Webhooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up env var for tests
    process.env.SHOPIFY_API_SECRET = 'test-secret';
  });

  describe('verifyWebhookHmac', () => {
    it('should return true for valid HMAC', () => {
      const body = '{"test":"data"}';
      const secret = process.env.SHOPIFY_API_SECRET!;
      const validHmac = crypto
        .createHmac('sha256', secret)
        .update(body, 'utf8')
        .digest('base64');

      const result = verifyWebhookHmac(body, validHmac);

      expect(result).toBe(true);
    });

    it('should return false for invalid HMAC', () => {
      const body = '{"test":"data"}';
      const invalidHmac = 'invalid-hmac-value';

      const result = verifyWebhookHmac(body, invalidHmac);

      expect(result).toBe(false);
    });

    it('should return false for tampered body', () => {
      const originalBody = '{"test":"data"}';
      const tamperedBody = '{"test":"tampered"}';
      const secret = process.env.SHOPIFY_API_SECRET!;
      const hmacForOriginal = crypto
        .createHmac('sha256', secret)
        .update(originalBody, 'utf8')
        .digest('base64');

      const result = verifyWebhookHmac(tamperedBody, hmacForOriginal);

      expect(result).toBe(false);
    });

    it('should return false when secret is not configured', () => {
      delete process.env.SHOPIFY_API_SECRET;

      const body = '{"test":"data"}';
      const hmac = 'some-hmac';

      const result = verifyWebhookHmac(body, hmac);

      expect(result).toBe(false);
    });

    it('should handle empty body', () => {
      const body = '';
      const secret = process.env.SHOPIFY_API_SECRET!;
      const hmac = crypto
        .createHmac('sha256', secret)
        .update(body, 'utf8')
        .digest('base64');

      const result = verifyWebhookHmac(body, hmac);

      expect(result).toBe(true);
    });

    it('should handle unicode characters in body', () => {
      const body = '{"test":"données françaises"}';
      const secret = process.env.SHOPIFY_API_SECRET!;
      const hmac = crypto
        .createHmac('sha256', secret)
        .update(body, 'utf8')
        .digest('base64');

      const result = verifyWebhookHmac(body, hmac);

      expect(result).toBe(true);
    });
  });

  describe('handleAppUninstalled', () => {
    it('should delete all shop data', async () => {
      const shopDomain = 'test.myshopify.com';

      await handleAppUninstalled(shopDomain);

      expect(prisma.shop.findUnique).toHaveBeenCalledWith({
        where: { shopDomain },
      });
      expect(prisma.productAudit.deleteMany).toHaveBeenCalled();
      expect(prisma.visibilityCheck.deleteMany).toHaveBeenCalled();
      expect(prisma.competitor.deleteMany).toHaveBeenCalled();
      expect(prisma.settings.deleteMany).toHaveBeenCalled();
      expect(prisma.shop.delete).toHaveBeenCalledWith({
        where: { shopDomain },
      });
    });

    it('should clear all cache keys', async () => {
      const shopDomain = 'test.myshopify.com';

      await handleAppUninstalled(shopDomain);

      expect(cacheDel).toHaveBeenCalledWith(`stores:${shopDomain}`);
      expect(cacheDel).toHaveBeenCalledWith(`settings:${shopDomain}`);
      expect(cacheDel).toHaveBeenCalledWith(`shop:${shopDomain}`);
    });

    it('should log audit event', async () => {
      const shopDomain = 'test.myshopify.com';

      await handleAppUninstalled(shopDomain);

      expect(auditLog).toHaveBeenCalledWith('app_uninstalled', shopDomain, {
        dataDeleted: true,
      });
    });

    it('should throw error if deletion fails', async () => {
      const shopDomain = 'test.myshopify.com';
      const error = new Error('Database error');
      (prisma.productAudit.deleteMany as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      await expect(handleAppUninstalled(shopDomain)).rejects.toThrow('Database error');
    });
  });

  describe('handleShopUpdate', () => {
    it('should handle shop update without error', async () => {
      const shopDomain = 'test.myshopify.com';
      const payload = { name: 'Updated Shop' };

      await expect(handleShopUpdate(shopDomain, payload)).resolves.not.toThrow();
    });
  });

  describe('handleCustomersDataRequest', () => {
    it('should log data request without storing data', async () => {
      const shopDomain = 'test.myshopify.com';
      const payload = { customer_id: 123 };

      await handleCustomersDataRequest(shopDomain, payload);

      expect(auditLog).toHaveBeenCalledWith('customers_data_request', shopDomain, {
        hasData: false,
      });
    });
  });

  describe('handleCustomersRedact', () => {
    it('should log redact request', async () => {
      const shopDomain = 'test.myshopify.com';
      const payload = { customer_id: 123 };

      await handleCustomersRedact(shopDomain, payload);

      expect(auditLog).toHaveBeenCalledWith('customers_redact', shopDomain, {
        dataRedacted: false,
      });
    });
  });

  describe('handleShopRedact', () => {
    beforeEach(() => {
      // Reset mocks to default resolved state (previous test might have set them to reject)
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'test-shop-id', shopDomain: 'test.myshopify.com' });
      (prisma.productAudit.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValue({});
      (prisma.visibilityCheck.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValue({});
      (prisma.competitor.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValue({});
      (prisma.settings.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValue({});
      (prisma.emailSequenceEvent.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValue({});
      (prisma.llmsTxtConfig.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValue({});
      (prisma.shop.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});
    });

    it('should delete all shop data like uninstall', async () => {
      const shopDomain = 'test.myshopify.com';

      await handleShopRedact(shopDomain);

      // handleShopRedact calls handleAppUninstalled internally
      expect(prisma.shop.findUnique).toHaveBeenCalledWith({
        where: { shopDomain },
      });
      expect(prisma.productAudit.deleteMany).toHaveBeenCalled();
      expect(prisma.settings.deleteMany).toHaveBeenCalled();
      expect(prisma.shop.delete).toHaveBeenCalledWith({
        where: { shopDomain },
      });
    });

    it('should log shop redact audit event', async () => {
      const shopDomain = 'test.myshopify.com';

      await handleShopRedact(shopDomain);

      // handleShopRedact calls handleAppUninstalled (logs 'app_uninstalled') then logs 'shop_redact'
      expect(auditLog).toHaveBeenCalledWith('app_uninstalled', shopDomain, {
        dataDeleted: true,
      });
      expect(auditLog).toHaveBeenCalledWith('shop_redact', shopDomain, {
        dataRedacted: true,
      });
    });
  });
});
