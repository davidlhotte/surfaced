/**
 * Development mode utilities
 *
 * SECURITY: This file controls development mode behavior.
 * In production, all dev features are DISABLED by default.
 */

const DEV_SHOP = 'locateus-2.myshopify.com';

/**
 * Check if development mode is enabled.
 *
 * IMPORTANT: In production (NODE_ENV=production), this ALWAYS returns false
 * regardless of USE_DEV_MODE setting. This is a safety measure.
 */
export function isDevMode(): boolean {
  // NEVER allow dev mode in production
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  // In development, check explicit flag (defaults to true for convenience)
  return process.env.USE_DEV_MODE !== 'false';
}

/**
 * Get the development shop domain.
 * Only returns a value if dev mode is enabled.
 */
export function getDevShop(): string | null {
  if (!isDevMode()) {
    return null;
  }
  return DEV_SHOP;
}

/**
 * Validate that a shop domain is properly formatted.
 * This prevents injection attacks via shop parameter.
 */
export function isValidShopDomain(shop: string): boolean {
  // Must be a valid Shopify domain format
  const shopifyDomainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
  return shopifyDomainRegex.test(shop);
}
