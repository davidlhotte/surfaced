# Security Documentation - LocateUs

## 🔐 Data Protection

### Token Encryption (AES-256-GCM)

All Shopify access tokens are encrypted at rest using AES-256-GCM.

```typescript
// lib/security/encryption.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

export function encryptToken(plaintext: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decryptToken(ciphertext: string): string {
  const [ivHex, authTagHex, encrypted] = ciphertext.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, KEY, iv);
  
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### Environment Variables

```env
# NEVER commit - use Vercel environment variables
SHOPIFY_API_KEY=           # Shopify Partner Dashboard
SHOPIFY_API_SECRET=        # Shopify Partner Dashboard
ENCRYPTION_KEY=            # openssl rand -hex 32
DATABASE_URL=              # Vercel Postgres
KV_REST_API_URL=           # Vercel KV
KV_REST_API_TOKEN=         # Vercel KV
SENTRY_DSN=                # Sentry
```

---

## 🛡️ API Security

### Rate Limiting

```typescript
// lib/security/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';

// Public API: 100 req/min per shop
export const publicRateLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  prefix: 'ratelimit:public',
});

// Admin API: 1000 req/min per shop
export const adminRateLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(1000, '1 m'),
  prefix: 'ratelimit:admin',
});

// Geocoding: 10 req/sec (Nominatim limit)
export const geocodingRateLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, '1 s'),
  prefix: 'ratelimit:geocoding',
});
```

### Webhook HMAC Validation

```typescript
// lib/shopify/webhooks.ts
import crypto from 'crypto';

export function verifyWebhookHMAC(body: string, hmacHeader: string): boolean {
  const generatedHash = crypto
    .createHmac('sha256', process.env.SHOPIFY_API_SECRET!)
    .update(body, 'utf8')
    .digest('base64');
  
  return crypto.timingSafeEqual(
    Buffer.from(generatedHash),
    Buffer.from(hmacHeader)
  );
}
```

### Security Headers (Middleware)

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.shopify.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.shopify.com https://*.openstreetmap.org"
  );
  
  // CORS for storefront API
  if (request.nextUrl.pathname.startsWith('/api/storefront/')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  }
  
  return response;
}
```

---

## 🧹 Input Validation & Sanitization

### CSV Sanitization (XSS/Formula Injection Prevention)

```typescript
// lib/security/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeString(input: string): string {
  // Prevent CSV formula injection
  if (/^[=+\-@\t\r]/.test(input)) {
    input = `'${input}`;
  }
  
  // Remove HTML/XSS
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
}

export function sanitizeCSVRow(row: Record<string, string>): Record<string, string> {
  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    sanitized[key] = sanitizeString(value);
  }
  return sanitized;
}
```

---

## 📋 GDPR Compliance

### Data Deletion on Uninstall

```typescript
async function handleAppUninstalled(shopDomain: string) {
  // Delete all shop data
  await prisma.store.deleteMany({ where: { shop: { shopDomain } } });
  await prisma.settings.deleteMany({ where: { shop: { shopDomain } } });
  await prisma.auditLog.deleteMany({ where: { shop: { shopDomain } } });
  await prisma.shop.delete({ where: { shopDomain } });
  
  // Clear cache
  await kv.del(`stores:${shopDomain}`);
  await kv.del(`settings:${shopDomain}`);
  
  // Audit log (external)
  logger.info('Shop data deleted', { shopDomain, reason: 'app_uninstalled' });
}
```

### Audit Logging

```typescript
// lib/monitoring/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

export function auditLog(action: string, shopDomain: string, details: object) {
  logger.info({
    type: 'audit',
    action,
    shopDomain,
    timestamp: new Date().toISOString(),
    ...details,
  });
}
```

---

## 🔍 Security Checklist

### Pre-Launch
- [ ] All tokens encrypted with AES-256-GCM
- [ ] Rate limiting configured
- [ ] Webhook HMAC validation implemented
- [ ] Security headers in middleware
- [ ] CSV input sanitized
- [ ] Zod validation on all endpoints
- [ ] GDPR data deletion on uninstall
- [ ] Audit logging enabled
- [ ] Sentry error tracking configured

### Environment
- [ ] `ENCRYPTION_KEY` generated securely
- [ ] No secrets in code
- [ ] `.env` in `.gitignore`
- [ ] Vercel environment variables set
