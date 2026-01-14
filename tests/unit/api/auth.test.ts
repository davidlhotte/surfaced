import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the dependencies
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    shop: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock('@/lib/security/encryption', () => ({
  encryptToken: vi.fn((token: string) => `encrypted_${token}`),
  decryptToken: vi.fn((token: string) => token.replace('encrypted_', '')),
}));

vi.mock('@/lib/security/rate-limit', () => ({
  adminRateLimit: {},
  checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/lib/utils/dev', () => ({
  getDevShop: vi.fn(),
}));

import { prisma } from '@/lib/db/prisma';
import { getDevShop } from '@/lib/utils/dev';
import { NextRequest } from 'next/server';

// Import after mocks
import { getShopFromRequest, getShopData } from '@/lib/shopify/get-shop';

describe('getShopFromRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return dev shop in development mode', async () => {
    (getDevShop as ReturnType<typeof vi.fn>).mockReturnValue('dev-store.myshopify.com');
    (prisma.shop.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'test-id',
      shopDomain: 'dev-store.myshopify.com',
    });

    const request = new NextRequest('https://example.com/api/test');
    const result = await getShopFromRequest(request);

    expect(result).toBe('dev-store.myshopify.com');
    expect(prisma.shop.upsert).toHaveBeenCalled();
  });

  it('should throw UnauthorizedError when shop header is missing in production', async () => {
    (getDevShop as ReturnType<typeof vi.fn>).mockReturnValue(null);

    const request = new NextRequest('https://example.com/api/test');

    await expect(getShopFromRequest(request)).rejects.toThrow('Missing shop domain');
  });

  it('should get shop from x-shopify-shop-domain header', async () => {
    (getDevShop as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'test-id',
      shopDomain: 'prod-store.myshopify.com',
      accessToken: 'encrypted_token',
    });

    const request = new NextRequest('https://example.com/api/test', {
      headers: {
        'x-shopify-shop-domain': 'prod-store.myshopify.com',
      },
    });

    const result = await getShopFromRequest(request);

    expect(result).toBe('prod-store.myshopify.com');
  });

  it('should throw UnauthorizedError when session is invalid', async () => {
    (getDevShop as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const request = new NextRequest('https://example.com/api/test', {
      headers: {
        'x-shopify-shop-domain': 'invalid-store.myshopify.com',
      },
    });

    await expect(getShopFromRequest(request)).rejects.toThrow('Invalid session');
  });
});

describe('getShopData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return shop data when found', async () => {
    const mockShop = {
      id: 'test-id',
      shopDomain: 'test-store.myshopify.com',
      plan: 'FREE',
    };
    (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockShop);

    const result = await getShopData('test-store.myshopify.com');

    expect(result).toEqual(mockShop);
    expect(prisma.shop.findUnique).toHaveBeenCalledWith({
      where: { shopDomain: 'test-store.myshopify.com' },
    });
  });

  it('should throw UnauthorizedError when shop not found', async () => {
    (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await expect(getShopData('nonexistent.myshopify.com')).rejects.toThrow('Shop not found');
  });
});
