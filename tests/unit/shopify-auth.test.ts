import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock environment variables
const originalEnv = process.env;

beforeEach(() => {
  process.env = {
    ...originalEnv,
    SHOPIFY_API_KEY: 'test-api-key',
    SHOPIFY_API_SECRET: 'test-api-secret',
    SHOPIFY_APP_URL: 'https://test-app.example.com',
    SHOPIFY_SCOPES: 'read_content,write_content',
  };
});

afterEach(() => {
  process.env = originalEnv;
  vi.restoreAllMocks();
});

// Mock all external dependencies
vi.mock('@shopify/shopify-api', () => {
  class MockSession {
    id: string;
    shop: string;
    state: string;
    isOnline: boolean;
    accessToken: string;
    constructor(params: { id: string; shop: string; state: string; isOnline: boolean; accessToken: string }) {
      this.id = params.id;
      this.shop = params.shop;
      this.state = params.state;
      this.isOnline = params.isOnline;
      this.accessToken = params.accessToken;
    }
  }
  return {
    shopifyApi: vi.fn(() => ({
      clients: {
        Graphql: vi.fn(),
      },
    })),
    ApiVersion: {
      October24: 'October24',
    },
    Session: MockSession,
  };
});

vi.mock('@shopify/shopify-api/adapters/node', () => ({}));

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    shop: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('@/lib/security/encryption', () => ({
  encryptToken: vi.fn((token: string) => `encrypted_${token}`),
  decryptToken: vi.fn((token: string) => token.replace('encrypted_', '')),
}));

vi.mock('@/lib/monitoring/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Import after mocks
import { prisma } from '@/lib/db/prisma';
import { decryptToken, encryptToken } from '@/lib/security/encryption';
import {
  getShopSession,
  saveShopSession,
  deleteShopSession,
  getAuthUrl,
  validateShop,
  verifySessionToken,
} from '@/lib/shopify/auth';
import { Session } from '@shopify/shopify-api';

describe('Shopify Auth Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getShopSession', () => {
    it('should return session for valid shop', async () => {
      const mockShop = {
        id: 'shop-123',
        shopDomain: 'test.myshopify.com',
        accessToken: 'encrypted_test-token',
      };
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockShop);

      const result = await getShopSession('test.myshopify.com');

      expect(result).toBeDefined();
      expect(result?.shop).toBe('test.myshopify.com');
      expect(prisma.shop.findUnique).toHaveBeenCalledWith({
        where: { shopDomain: 'test.myshopify.com' },
      });
      expect(decryptToken).toHaveBeenCalledWith('encrypted_test-token');
    });

    it('should return null when shop not found', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const result = await getShopSession('nonexistent.myshopify.com');

      expect(result).toBeNull();
    });

    it('should return null and log error on exception', async () => {
      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('DB error'));

      const result = await getShopSession('test.myshopify.com');

      expect(result).toBeNull();
    });
  });

  describe('saveShopSession', () => {
    it('should save session with encrypted token', async () => {
      const mockSession = {
        id: 'offline_test.myshopify.com',
        shop: 'test.myshopify.com',
        accessToken: 'plain-token',
      } as Session;

      (prisma.shop.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({});

      await saveShopSession(mockSession);

      expect(encryptToken).toHaveBeenCalledWith('plain-token');
      expect(prisma.shop.upsert).toHaveBeenCalledWith({
        where: { shopDomain: 'test.myshopify.com' },
        update: {
          accessToken: 'encrypted_plain-token',
          updatedAt: expect.any(Date),
        },
        create: {
          shopDomain: 'test.myshopify.com',
          accessToken: 'encrypted_plain-token',
        },
      });
    });

    it('should throw error when session has no access token', async () => {
      const mockSession = {
        id: 'offline_test.myshopify.com',
        shop: 'test.myshopify.com',
        accessToken: undefined,
      } as unknown as Session;

      await expect(saveShopSession(mockSession)).rejects.toThrow('Session has no access token');
    });
  });

  describe('deleteShopSession', () => {
    it('should delete shop from database', async () => {
      (prisma.shop.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});

      await deleteShopSession('test.myshopify.com');

      expect(prisma.shop.delete).toHaveBeenCalledWith({
        where: { shopDomain: 'test.myshopify.com' },
      });
    });
  });

  describe('getAuthUrl', () => {
    it('should generate valid OAuth URL', () => {
      const url = getAuthUrl('test.myshopify.com', 'https://app.example.com/callback');

      expect(url).toBe('https://test.myshopify.com/admin/oauth/authorize?client_id=test-api-key&scope=read_content%2Cwrite_content&redirect_uri=https%3A%2F%2Fapp.example.com%2Fcallback');
    });

    it('should include scopes in the URL', () => {
      // Note: scopes are now loaded at module initialization time
      // so we just verify they're included in the URL
      const url = getAuthUrl('test.myshopify.com', 'https://app.example.com/callback');

      expect(url).toContain('scope=');
      expect(url).toMatch(/scope=[^&]+/);
    });
  });

  describe('validateShop', () => {
    it('should return true for valid shop domain', async () => {
      const result = await validateShop('test-store.myshopify.com');
      expect(result).toBe(true);
    });

    it('should return true for shop with numbers', async () => {
      const result = await validateShop('store123.myshopify.com');
      expect(result).toBe(true);
    });

    it('should return true for shop with hyphens', async () => {
      const result = await validateShop('my-test-store.myshopify.com');
      expect(result).toBe(true);
    });

    it('should return false for invalid domain', async () => {
      const result = await validateShop('test-store.example.com');
      expect(result).toBe(false);
    });

    it('should return false for domain starting with hyphen', async () => {
      const result = await validateShop('-invalid.myshopify.com');
      expect(result).toBe(false);
    });

    it('should return false for empty string', async () => {
      const result = await validateShop('');
      expect(result).toBe(false);
    });
  });

  describe('verifySessionToken', () => {
    it('should return null for invalid token format', () => {
      const result = verifySessionToken('invalid-token');
      expect(result).toBeNull();
    });

    it('should return null for token with wrong number of parts', () => {
      const result = verifySessionToken('part1.part2');
      expect(result).toBeNull();
    });

    it('should return shop info for valid token', () => {
      // Create a valid JWT with proper HMAC-SHA256 signature
      const { createHmac } = require('crypto');
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({
        iss: 'https://test-store.myshopify.com/admin',
        dest: 'https://test-store.myshopify.com',
        aud: 'test-api-key',
        sub: '1',
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      })).toString('base64url');

      // Create valid HMAC-SHA256 signature using the test API secret
      const signatureInput = `${header}.${payload}`;
      const signature = createHmac('sha256', 'test-api-secret')
        .update(signatureInput)
        .digest('base64url');

      const token = `${header}.${payload}.${signature}`;
      const result = verifySessionToken(token);

      expect(result).not.toBeNull();
      expect(result?.shop).toBe('test-store.myshopify.com');
    });

    it('should return null for expired token', () => {
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
      const payload = Buffer.from(JSON.stringify({
        iss: 'https://test-store.myshopify.com/admin',
        dest: 'https://test-store.myshopify.com',
        aud: 'test-api-key',
        sub: '1',
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago (expired)
      })).toString('base64');
      const signature = 'fake-signature';

      const token = `${header}.${payload}.${signature}`;
      const result = verifySessionToken(token);

      expect(result).toBeNull();
    });

    it('should return null for non-Shopify domain', () => {
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
      const payload = Buffer.from(JSON.stringify({
        iss: 'https://malicious.example.com/admin',
        dest: 'https://malicious.example.com',
        aud: 'test-api-key',
        sub: '1',
        exp: Math.floor(Date.now() / 1000) + 3600,
      })).toString('base64');
      const signature = 'fake-signature';

      const token = `${header}.${payload}.${signature}`;
      const result = verifySessionToken(token);

      expect(result).toBeNull();
    });

    it('should return null for invalid JSON in payload', () => {
      const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64');
      const payload = Buffer.from('not-valid-json').toString('base64');
      const signature = 'fake-signature';

      const token = `${header}.${payload}.${signature}`;
      const result = verifySessionToken(token);

      expect(result).toBeNull();
    });
  });
});
