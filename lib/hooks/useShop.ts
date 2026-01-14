'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo, useState, useEffect, useCallback, useRef } from 'react';

// Storage key for shop domain
const SHOP_STORAGE_KEY = 'locateus_shop_domain';

/**
 * Get shop from sessionStorage (persists across navigation)
 */
function getStoredShop(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(SHOP_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Store shop in sessionStorage
 */
function storeShop(shop: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SHOP_STORAGE_KEY, shop);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Detect shop from various sources
 */
function detectShopFromSources(searchParams: URLSearchParams): string | null {
  // Try App Bridge config first (most reliable in embedded context)
  if (typeof window !== 'undefined' && window.shopify?.config?.shop) {
    return window.shopify.config.shop;
  }

  // Try URL search params
  const shopParam = searchParams.get('shop');
  if (shopParam) {
    return shopParam;
  }

  // Try host param (Shopify sometimes uses base64-encoded host)
  const hostParam = searchParams.get('host');
  if (hostParam) {
    try {
      const decoded = atob(hostParam);
      const match = decoded.match(/([^/]+\.myshopify\.com)/);
      if (match) {
        return match[1];
      }
    } catch {
      // Invalid base64, ignore
    }
  }

  // Try sessionStorage as fallback
  return getStoredShop();
}

/**
 * Hook to get the shop domain
 * Tries multiple sources in order:
 * 1. App Bridge config (window.shopify.config.shop)
 * 2. URL search params (?shop=xxx.myshopify.com)
 * 3. URL host parameter (base64 decoded)
 * 4. SessionStorage (persisted from previous navigation)
 */
export function useShop(): string | null {
  const searchParams = useSearchParams();
  const hasInitialized = useRef(false);

  // Initialize state with detected shop
  const [shop, setShop] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const urlParams = new URLSearchParams(window.location.search);
    return detectShopFromSources(urlParams);
  });

  // Store shop when found
  const updateShop = useCallback((newShop: string) => {
    storeShop(newShop);
    setShop(newShop);
  }, []);

  useEffect(() => {
    // Skip if already initialized with a shop
    if (hasInitialized.current && shop) return;
    hasInitialized.current = true;

    const detectedShop = detectShopFromSources(searchParams);

    // If found, store it (use microtask to avoid sync setState in effect)
    if (detectedShop && detectedShop !== shop) {
      storeShop(detectedShop);
      // Defer to next tick to satisfy lint rule
      queueMicrotask(() => setShop(detectedShop));
      return;
    }

    // If nothing found, try to get from App Bridge after a short delay
    // (App Bridge might not be initialized yet)
    if (!detectedShop) {
      const timer = setTimeout(() => {
        if (typeof window !== 'undefined' && window.shopify?.config?.shop) {
          const appBridgeShop = window.shopify.config.shop;
          updateShop(appBridgeShop);
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [searchParams, shop, updateShop]);

  return shop;
}

/**
 * Hook to create an authenticated fetch function
 * Automatically adds the x-shopify-shop-domain header
 */
export function useAuthenticatedFetch() {
  const shop = useShop();

  const authenticatedFetch = useMemo(() => {
    return async (url: string, options: RequestInit = {}): Promise<Response> => {
      const headers = new Headers(options.headers);

      // Get shop from multiple sources (in order of priority)
      let shopDomain = shop;

      // Try App Bridge directly
      if (!shopDomain && typeof window !== 'undefined' && window.shopify?.config?.shop) {
        shopDomain = window.shopify.config.shop;
      }

      // Try sessionStorage as final fallback
      if (!shopDomain) {
        shopDomain = getStoredShop();
      }

      // Try to extract from current URL params
      if (!shopDomain && typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const urlShop = urlParams.get('shop');
        if (urlShop) {
          shopDomain = urlShop;
          storeShop(urlShop);
        }
      }

      if (shopDomain) {
        headers.set('x-shopify-shop-domain', shopDomain);
      }

      return fetch(url, {
        ...options,
        headers,
      });
    };
  }, [shop]);

  return { fetch: authenticatedFetch, shop };
}
