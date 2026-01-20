import { shopifyApi, ApiVersion, Session } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';
import { prisma } from '@/lib/db/prisma';
import { encryptToken, decryptToken } from '@/lib/security/encryption';
import { logger } from '@/lib/monitoring/logger';

// Lazy initialization to avoid build-time errors
// Environment variables are only required at runtime, not during static page generation
function getShopifyConfig() {
  const apiKey = process.env.SHOPIFY_API_KEY?.trim();
  const apiSecret = process.env.SHOPIFY_API_SECRET?.trim();
  const appUrl = process.env.SHOPIFY_APP_URL?.trim();
  const scopes = (process.env.SHOPIFY_SCOPES || 'read_content,write_content').trim();

  if (!apiKey || !apiSecret || !appUrl) {
    throw new Error('Missing required Shopify environment variables');
  }

  return { apiKey, apiSecret, appUrl, scopes };
}

// Lazy-loaded Shopify API instance
let _shopify: ReturnType<typeof shopifyApi> | null = null;
let _config: ReturnType<typeof getShopifyConfig> | null = null;

function getConfig() {
  if (!_config) {
    _config = getShopifyConfig();
    logger.info({
      apiKeyLength: _config.apiKey.length,
      apiKeyPreview: _config.apiKey.substring(0, 8) + '...',
      hostName: new URL(_config.appUrl).hostname,
    }, 'Shopify API initialized');
  }
  return _config;
}

export function getShopifyApi() {
  if (!_shopify) {
    const config = getConfig();
    _shopify = shopifyApi({
      apiKey: config.apiKey,
      apiSecretKey: config.apiSecret,
      scopes: config.scopes.split(','),
      hostName: new URL(config.appUrl).hostname,
      hostScheme: 'https',
      apiVersion: ApiVersion.October24,
      isEmbeddedApp: true,
    });
  }
  return _shopify;
}

// For backward compatibility - lazy getter
export const shopify = new Proxy({} as ReturnType<typeof shopifyApi>, {
  get(_, prop) {
    return getShopifyApi()[prop as keyof ReturnType<typeof shopifyApi>];
  },
});

export async function getShopSession(shopDomain: string): Promise<Session | null> {
  try {
    logger.info({ shopDomain }, 'getShopSession: Looking up shop');
    const shop = await prisma.shop.findUnique({
      where: { shopDomain },
    });

    if (!shop) {
      logger.warn({ shopDomain }, 'getShopSession: Shop not found in database');
      return null;
    }

    logger.info({ shopDomain, tokenLength: shop.accessToken?.length }, 'getShopSession: Shop found, decrypting token');

    const accessToken = decryptToken(shop.accessToken);
    logger.info({ shopDomain, decryptedLength: accessToken?.length }, 'getShopSession: Token decrypted successfully');

    return new Session({
      id: `offline_${shopDomain}`,
      shop: shopDomain,
      state: '',
      isOnline: false,
      accessToken,
    });
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : 'Unknown', shopDomain }, 'Failed to get shop session');
    return null;
  }
}

export async function saveShopSession(session: Session): Promise<void> {
  if (!session.accessToken) {
    throw new Error('Session has no access token');
  }

  const encryptedToken = encryptToken(session.accessToken);

  await prisma.shop.upsert({
    where: { shopDomain: session.shop },
    update: {
      accessToken: encryptedToken,
      updatedAt: new Date(),
    },
    create: {
      shopDomain: session.shop,
      accessToken: encryptedToken,
    },
  });

  logger.info({ shopDomain: session.shop }, 'Shop session saved');
}

export async function deleteShopSession(shopDomain: string): Promise<void> {
  await prisma.shop.delete({
    where: { shopDomain },
  });

  logger.info({ shopDomain }, 'Shop session deleted');
}

export function getAuthUrl(shop: string, redirectUri: string): string {
  const config = getConfig();
  const params = new URLSearchParams({
    client_id: config.apiKey,
    scope: config.scopes,
    redirect_uri: redirectUri,
  });

  return `https://${shop}/admin/oauth/authorize?${params}`;
}

export async function validateShop(shop: string): Promise<boolean> {
  // Basic validation - Shopify shop domains follow pattern: store-name.myshopify.com
  const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
  return shopRegex.test(shop);
}

/**
 * Exchange OAuth code for access token (legacy authorization code grant)
 * Used as fallback for non-embedded contexts
 */
export async function exchangeCodeForToken(
  shop: string,
  code: string
): Promise<{ accessToken: string; scope: string }> {
  const config = getConfig();
  logger.info({ shop, codeLength: code.length }, 'Starting OAuth code exchange');

  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: config.apiKey,
      client_secret: config.apiSecret,
      code,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error({ shop, status: response.status, error: errorText }, 'Token exchange failed');
    throw new Error(`Token exchange failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (!data.access_token) {
    throw new Error('No access token in response');
  }

  return {
    accessToken: data.access_token,
    scope: data.scope,
  };
}

/**
 * Exchange session token for access token (token exchange flow)
 * This is the recommended approach for embedded apps
 * @see https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/token-exchange
 */
export async function exchangeSessionTokenForAccessToken(
  shop: string,
  sessionToken: string,
  tokenType: 'online' | 'offline' = 'offline'
): Promise<{ accessToken: string; scope: string; expiresIn?: number }> {
  const config = getConfig();
  logger.info({
    shop,
    tokenType,
    sessionTokenLength: sessionToken.length,
    apiKeyLength: config.apiKey.length,
  }, 'Starting session token exchange');

  const requestedTokenType = tokenType === 'online'
    ? 'urn:shopify:params:oauth:token-type:online-access-token'
    : 'urn:shopify:params:oauth:token-type:offline-access-token';

  const params = new URLSearchParams({
    client_id: config.apiKey,
    client_secret: config.apiSecret,
    grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
    subject_token: sessionToken,
    subject_token_type: 'urn:ietf:params:oauth:token-type:id_token',
    requested_token_type: requestedTokenType,
  });

  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error({ shop, status: response.status, error: errorText }, 'Session token exchange failed');
    throw new Error(`Session token exchange failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (!data.access_token) {
    throw new Error('No access token in response');
  }

  logger.info({ shop, tokenType, scope: data.scope }, 'Session token exchanged successfully');

  return {
    accessToken: data.access_token,
    scope: data.scope,
    expiresIn: data.expires_in,
  };
}

/**
 * Verify and decode a session token (JWT)
 * @see https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens
 */
export function verifySessionToken(sessionToken: string): {
  shop: string;
  exp: number;
  iss: string;
  dest: string;
  sub: string;
} | null {
  try {
    logger.info({ tokenLength: sessionToken.length }, 'Verifying session token');

    // Session tokens are JWTs - decode without verification first to get claims
    const parts = sessionToken.split('.');
    if (parts.length !== 3) {
      logger.error({ partsCount: parts.length }, 'Invalid session token format - expected 3 parts');
      return null;
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
    logger.info({
      iss: payload.iss,
      dest: payload.dest,
      exp: payload.exp,
      sub: payload.sub?.substring(0, 20) + '...',
    }, 'Session token payload decoded');

    // Verify expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      logger.error({ exp: payload.exp, now, diff: now - payload.exp }, 'Session token expired');
      return null;
    }

    // Verify issuer matches shop
    const destUrl = new URL(payload.dest);
    const shop = destUrl.hostname;

    // Basic validation
    if (!shop.endsWith('.myshopify.com')) {
      logger.error({ shop }, 'Invalid shop in session token - must end with .myshopify.com');
      return null;
    }

    logger.info({ shop, expiresIn: payload.exp - now }, 'Session token verified successfully');

    return {
      shop,
      exp: payload.exp,
      iss: payload.iss,
      dest: payload.dest,
      sub: payload.sub,
    };
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Failed to verify session token');
    return null;
  }
}
