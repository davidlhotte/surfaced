'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';

interface ShopContextType {
  shop: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const ShopContext = createContext<ShopContextType>({
  shop: null,
  isLoading: true,
  isAuthenticated: false,
});

// Global shop storage (survives component re-mounts)
let globalShop: string | null = null;
let isTokenExchanged = false;

interface ShopProviderProps {
  children: ReactNode;
}

export function ShopProvider({ children }: ShopProviderProps) {
  const [shop, setShop] = useState<string | null>(globalShop);
  const [isLoading, setIsLoading] = useState(!globalShop);
  const [isAuthenticated, setIsAuthenticated] = useState(isTokenExchanged);

  useEffect(() => {
    // Set up Web Vitals monitoring if available
    if (typeof window !== 'undefined' && window.shopify?.webVitals?.onReport) {
      window.shopify.webVitals.onReport((metrics) => {
        // Log Web Vitals for monitoring
        console.log('[LocateUs] Web Vitals:', metrics);
        // In production, you could send this to your analytics service
      });
    }
  }, []);

  useEffect(() => {
    // If we already have the shop and token, don't search again
    if (globalShop && isTokenExchanged) {
      setShop(globalShop);
      setIsLoading(false);
      setIsAuthenticated(true);
      return;
    }

    const detectShop = (): string | null => {
      // Try App Bridge config first (preferred method)
      if (typeof window !== 'undefined' && window.shopify?.config?.shop) {
        return window.shopify.config.shop;
      }

      // Try URL search params
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);

        const shopParam = urlParams.get('shop');
        if (shopParam) {
          return shopParam;
        }

        // Try host param (base64 encoded)
        const hostParam = urlParams.get('host');
        if (hostParam) {
          try {
            const decoded = atob(hostParam);
            const match = decoded.match(/([^/]+\.myshopify\.com)/);
            if (match) {
              return match[1];
            }
          } catch {
            // Invalid base64
          }
        }
      }

      // Try sessionStorage
      if (typeof window !== 'undefined') {
        try {
          const stored = sessionStorage.getItem('locateus_shop_domain');
          if (stored) return stored;
        } catch {
          // Storage access denied
        }
      }

      return null;
    };

    const performTokenExchange = async (_shopDomain: string) => {
      let sessionToken: string | null = null;

      // Try to get session token from App Bridge first
      if (typeof window !== 'undefined' && window.shopify?.idToken) {
        try {
          sessionToken = await window.shopify.idToken();
        } catch (error) {
          console.warn('[LocateUs] App Bridge idToken failed:', error);
        }
      }

      // Fallback: get id_token from URL parameters (when App Bridge fails)
      if (!sessionToken && typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const idToken = urlParams.get('id_token');
        if (idToken) {
          sessionToken = idToken;
          console.log('[LocateUs] Using id_token from URL params');
        }
      }

      // If no session token available, skip token exchange
      if (!sessionToken) {
        console.warn('[LocateUs] No session token available for token exchange');
        setIsAuthenticated(true);
        isTokenExchanged = true;
        return;
      }

      try {
        const response = await fetch('/api/auth/token', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          setIsAuthenticated(true);
          isTokenExchanged = true;
        } else {
          console.error('[LocateUs] Token exchange failed:', await response.text());
        }
      } catch (error) {
        console.error('[LocateUs] Token exchange error:', error);
      }
    };

    // Try to detect immediately
    let detected = detectShop();
    if (detected) {
      globalShop = detected;
      setShop(detected);
      // Store in sessionStorage
      try {
        sessionStorage.setItem('locateus_shop_domain', detected);
      } catch {
        // Ignore storage errors
      }
      // Perform token exchange if needed
      if (!isTokenExchanged) {
        performTokenExchange(detected).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
      return;
    }

    // If not found immediately, wait for App Bridge to initialize
    const attempts = [100, 300, 500, 1000, 2000];
    let attemptIndex = 0;

    const tryAgain = () => {
      detected = detectShop();
      if (detected) {
        globalShop = detected;
        setShop(detected);
        try {
          sessionStorage.setItem('locateus_shop_domain', detected);
        } catch {
          // Ignore
        }
        if (!isTokenExchanged) {
          performTokenExchange(detected).finally(() => setIsLoading(false));
        } else {
          setIsLoading(false);
        }
        return;
      }

      attemptIndex++;
      if (attemptIndex < attempts.length) {
        setTimeout(tryAgain, attempts[attemptIndex]);
      } else {
        // Give up after all attempts
        setIsLoading(false);
      }
    };

    setTimeout(tryAgain, attempts[0]);
  }, []);

  const value = useMemo(() => ({ shop, isLoading, isAuthenticated }), [shop, isLoading, isAuthenticated]);

  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShopContext(): ShopContextType {
  return useContext(ShopContext);
}

/**
 * Hook to create an authenticated fetch function using shop from context
 * Uses App Bridge session tokens when available (recommended by Shopify)
 */
export function useAuthenticatedFetch() {
  const { shop, isAuthenticated } = useShopContext();

  const authenticatedFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      const headers = new Headers(options.headers);

      // Get shop from multiple sources
      let shopDomain = shop;

      // Fallback to global
      if (!shopDomain && globalShop) {
        shopDomain = globalShop;
      }

      // Try App Bridge directly
      if (!shopDomain && typeof window !== 'undefined' && window.shopify?.config?.shop) {
        shopDomain = window.shopify.config.shop;
        globalShop = shopDomain;
      }

      // Try URL params
      if (!shopDomain && typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const urlShop = urlParams.get('shop');
        if (urlShop) {
          shopDomain = urlShop;
          globalShop = urlShop;
        }
      }

      if (shopDomain) {
        headers.set('x-shopify-shop-domain', shopDomain);
      }

      // Add session token if App Bridge is available (for token exchange)
      if (typeof window !== 'undefined' && window.shopify?.idToken) {
        try {
          const sessionToken = await window.shopify.idToken();
          headers.set('Authorization', `Bearer ${sessionToken}`);
        } catch (error) {
          console.warn('[LocateUs] Could not get session token:', error);
        }
      }

      return fetch(url, {
        ...options,
        headers,
      });
    },
    [shop]
  );

  return { fetch: authenticatedFetch, shop, isAuthenticated };
}
