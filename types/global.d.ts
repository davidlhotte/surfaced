/**
 * Global type declarations for Shopify App Bridge and related APIs
 */

interface WebVitalsMetric {
  id: string;
  name: string;
  value: number;
}

interface WebVitalsMetrics {
  appId: string;
  shopId: string;
  userId: string;
  appLoadId: string;
  metrics: WebVitalsMetric[];
}

interface ShopifyAppBridge {
  config?: {
    shop?: string;
    apiKey?: string;
    host?: string;
  };
  /**
   * Get a session token (ID token) for authentication
   * @see https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens
   */
  idToken?: () => Promise<string>;
  environment?: {
    embedded?: boolean;
    mobile?: boolean;
  };
  /**
   * Web Vitals monitoring API
   * @see https://shopify.dev/docs/apps/build/performance/admin-installation-oauth
   */
  webVitals?: {
    onReport?: (callback: (metrics: WebVitalsMetrics) => void) => void;
  };
  /**
   * Toast notifications
   */
  toast?: {
    show: (message: string, options?: { duration?: number; isError?: boolean }) => void;
  };
  /**
   * Navigation
   */
  navigate?: (path: string) => void;
}

declare global {
  interface Window {
    shopify?: ShopifyAppBridge;
  }
}

export {};
