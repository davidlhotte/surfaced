import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Upstash modules (must be before other mocks that might import rate-limit)
vi.mock('@upstash/redis', () => ({
  Redis: class MockRedis {
    constructor() {}
  },
}));

vi.mock('@upstash/ratelimit', () => {
  class MockRatelimit {
    limit = vi.fn();
    static slidingWindow = vi.fn(() => ({}));
  }
  return { Ratelimit: MockRatelimit };
});

// Mock all dependencies
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

vi.mock('@/lib/utils/dev', () => ({
  getDevShop: vi.fn(),
}));

vi.mock('@/lib/shopify/billing', () => ({
  createSubscription: vi.fn(),
  getActiveSubscription: vi.fn(),
}));

vi.mock('@/lib/monitoring/logger', () => ({
  auditLog: vi.fn(),
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

import { prisma } from '@/lib/db/prisma';
import { getDevShop } from '@/lib/utils/dev';
import { createSubscription, getActiveSubscription } from '@/lib/shopify/billing';
import { GET, POST } from '@/app/api/billing/route';
import { NextRequest } from 'next/server';

const mockShop = {
  id: 'shop-123',
  shopDomain: 'test.myshopify.com',
  accessToken: 'encrypted_token',
  plan: 'FREE',
  trialEndsAt: new Date('2025-01-01'),
};

describe('GET /api/billing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when shop header is missing', async () => {
    (getDevShop as ReturnType<typeof vi.fn>).mockReturnValue(null);

    const request = new NextRequest('https://example.com/api/billing');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Missing shop domain');
  });

  it('should return billing info for authenticated shop', async () => {
    (getDevShop as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockShop);
    (getActiveSubscription as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'sub-123',
      name: 'LocateUs Basic',
      status: 'ACTIVE',
    });

    const request = new NextRequest('https://example.com/api/billing', {
      headers: {
        'x-shopify-shop-domain': 'test.myshopify.com',
      },
    });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.plan).toBe('FREE');
    expect(data.data.subscription).toBeDefined();
  });

  it('should return null subscription when none active', async () => {
    (getDevShop as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockShop);
    (getActiveSubscription as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const request = new NextRequest('https://example.com/api/billing', {
      headers: {
        'x-shopify-shop-domain': 'test.myshopify.com',
      },
    });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.subscription).toBeNull();
  });
});

describe('POST /api/billing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    (getDevShop as ReturnType<typeof vi.fn>).mockReturnValue(null);

    const request = new NextRequest('https://example.com/api/billing', {
      method: 'POST',
      body: JSON.stringify({ plan: 'BASIC' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Missing shop domain');
  });

  it('should return 400 for invalid plan', async () => {
    (getDevShop as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockShop);

    const request = new NextRequest('https://example.com/api/billing', {
      method: 'POST',
      headers: {
        'x-shopify-shop-domain': 'test.myshopify.com',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ plan: 'INVALID' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid plan');
  });

  it('should return 400 for FREE plan', async () => {
    (getDevShop as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockShop);

    const request = new NextRequest('https://example.com/api/billing', {
      method: 'POST',
      headers: {
        'x-shopify-shop-domain': 'test.myshopify.com',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ plan: 'FREE' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid plan');
  });

  it('should create BASIC subscription successfully', async () => {
    (getDevShop as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockShop);
    (createSubscription as ReturnType<typeof vi.fn>).mockResolvedValue({
      confirmationUrl: 'https://shopify.com/billing/confirm/123',
    });

    const request = new NextRequest('https://example.com/api/billing', {
      method: 'POST',
      headers: {
        'x-shopify-shop-domain': 'test.myshopify.com',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ plan: 'BASIC' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.confirmationUrl).toBe('https://shopify.com/billing/confirm/123');
    expect(createSubscription).toHaveBeenCalledWith('test.myshopify.com', 'BASIC');
  });

  it('should create PLUS subscription successfully', async () => {
    (getDevShop as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockShop);
    (createSubscription as ReturnType<typeof vi.fn>).mockResolvedValue({
      confirmationUrl: 'https://shopify.com/billing/confirm/456',
    });

    const request = new NextRequest('https://example.com/api/billing', {
      method: 'POST',
      headers: {
        'x-shopify-shop-domain': 'test.myshopify.com',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ plan: 'PLUS' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(createSubscription).toHaveBeenCalledWith('test.myshopify.com', 'PLUS');
  });

  it('should create PREMIUM subscription successfully', async () => {
    (getDevShop as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockShop);
    (createSubscription as ReturnType<typeof vi.fn>).mockResolvedValue({
      confirmationUrl: 'https://shopify.com/billing/confirm/789',
    });

    const request = new NextRequest('https://example.com/api/billing', {
      method: 'POST',
      headers: {
        'x-shopify-shop-domain': 'test.myshopify.com',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ plan: 'PREMIUM' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(createSubscription).toHaveBeenCalledWith('test.myshopify.com', 'PREMIUM');
  });

  it('should return 400 when subscription creation fails', async () => {
    (getDevShop as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockShop);
    (createSubscription as ReturnType<typeof vi.fn>).mockResolvedValue({
      confirmationUrl: null,
      error: 'Failed to create subscription',
    });

    const request = new NextRequest('https://example.com/api/billing', {
      method: 'POST',
      headers: {
        'x-shopify-shop-domain': 'test.myshopify.com',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ plan: 'BASIC' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Failed to create subscription');
  });

  it('should return 400 when no confirmation URL returned', async () => {
    (getDevShop as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockShop);
    (createSubscription as ReturnType<typeof vi.fn>).mockResolvedValue({
      confirmationUrl: null,
    });

    const request = new NextRequest('https://example.com/api/billing', {
      method: 'POST',
      headers: {
        'x-shopify-shop-domain': 'test.myshopify.com',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ plan: 'BASIC' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Failed to create subscription');
  });
});
