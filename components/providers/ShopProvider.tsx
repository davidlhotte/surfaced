'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';

interface ShopContextType {
  shop: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

const ShopContext = createContext<ShopContextType>({
  shop: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
});

// Global shop storage (survives component re-mounts)
let globalShop: string | null = null;
let isTokenExchanged = false;

interface ShopProviderProps {
  children: ReactNode;
}

const DEBUG = true; // Set to true for verbose logging

function debugLog(message: string, data?: unknown) {
  if (DEBUG) {
    console.log(`[Surfaced] ${message}`, data !== undefined ? data : '');
  }
}

export function ShopProvider({ children }: ShopProviderProps) {
  const [shop, setShop] = useState<string | null>(globalShop);
  const [isLoading, setIsLoading] = useState(!globalShop);
  const [isAuthenticated, setIsAuthenticated] = useState(isTokenExchanged);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    debugLog('ShopProvider mounted');
    debugLog('Initial state:', { globalShop, isTokenExchanged });

    // If we already have the shop and token, don't search again
    if (globalShop && isTokenExchanged) {
      debugLog('Using cached shop and token');
      setShop(globalShop);
      setIsLoading(false);
      setIsAuthenticated(true);
      return;
    }

    const detectShop = (): string | null => {
      debugLog('Detecting shop...');

      // Try App Bridge config first (preferred method)
      if (typeof window !== 'undefined' && window.shopify?.config?.shop) {
        debugLog('Found shop via App Bridge:', window.shopify.config.shop);
        return window.shopify.config.shop;
      }

      // Try URL search params
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        debugLog('URL params:', Object.fromEntries(urlParams.entries()));

        const shopParam = urlParams.get('shop');
        if (shopParam) {
          debugLog('Found shop in URL params:', shopParam);
          return shopParam;
        }

        // Try host param (base64 encoded)
        const hostParam = urlParams.get('host');
        if (hostParam) {
          try {
            const decoded = atob(hostParam);
            debugLog('Decoded host param:', decoded);
            const match = decoded.match(/([^/]+\.myshopify\.com)/);
            if (match) {
              debugLog('Extracted shop from host:', match[1]);
              return match[1];
            }
          } catch (e) {
            debugLog('Failed to decode host param:', e);
          }
        }
      }

      // Try sessionStorage
      if (typeof window !== 'undefined') {
        try {
          const stored = sessionStorage.getItem('surfaced_shop_domain');
          if (stored) {
            debugLog('Found shop in sessionStorage:', stored);
            return stored;
          }
        } catch {
          // Storage access denied
        }
      }

      debugLog('No shop detected');
      return null;
    };

    const performTokenExchange = async (shopDomain: string) => {
      debugLog('Starting token exchange for:', shopDomain);
      let sessionToken: string | null = null;

      // Try to get session token from App Bridge first
      if (typeof window !== 'undefined' && window.shopify?.idToken) {
        try {
          debugLog('Requesting session token from App Bridge...');
          sessionToken = await window.shopify.idToken();
          debugLog('Got session token (first 20 chars):', sessionToken?.substring(0, 20) + '...');
        } catch (error) {
          debugLog('App Bridge idToken failed:', error);
        }
      }

      // Fallback: get id_token from URL parameters
      if (!sessionToken && typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const idToken = urlParams.get('id_token');
        if (idToken) {
          sessionToken = idToken;
          debugLog('Using id_token from URL params');
        }
      }

      // If no session token available, we're in dev mode or something is wrong
      if (!sessionToken) {
        debugLog('No session token available - checking if in dev mode');
        // In dev mode, we can skip token exchange
        if (process.env.NODE_ENV === 'development') {
          debugLog('Dev mode - skipping token exchange');
          setIsAuthenticated(true);
          isTokenExchanged = true;
          return;
        }
        setError('Could not get session token from Shopify');
        return;
      }

      try {
        debugLog('Sending token exchange request...');
        const response = await fetch('/api/auth/token', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionToken}`,
            'Content-Type': 'application/json',
          },
        });

        const responseText = await response.text();
        debugLog('Token exchange response:', { status: response.status, body: responseText });

        if (response.ok) {
          debugLog('Token exchange successful!');
          setIsAuthenticated(true);
          isTokenExchanged = true;
          setError(null);
        } else {
          const errorMsg = `Token exchange failed: ${responseText}`;
          debugLog('Token exchange error:', errorMsg);
          setError(errorMsg);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        debugLog('Token exchange exception:', errorMsg);
        setError(errorMsg);
      }
    };

    // Try to detect immediately
    let detected = detectShop();
    if (detected) {
      globalShop = detected;
      setShop(detected);
      // Store in sessionStorage
      try {
        sessionStorage.setItem('surfaced_shop_domain', detected);
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
      debugLog(`Retry attempt ${attemptIndex + 1}/${attempts.length}`);
      detected = detectShop();
      if (detected) {
        globalShop = detected;
        setShop(detected);
        try {
          sessionStorage.setItem('surfaced_shop_domain', detected);
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
        debugLog('All retry attempts exhausted');
        setError('Could not detect shop from Shopify');
        setIsLoading(false);
      }
    };

    setTimeout(tryAgain, attempts[0]);
  }, []);

  const value = useMemo(() => ({ shop, isLoading, isAuthenticated, error }), [shop, isLoading, isAuthenticated, error]);

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
        debugLog(`Authenticated fetch to: ${url} for shop: ${shopDomain}`);
      } else {
        debugLog(`WARNING: No shop domain for authenticated fetch to: ${url}`);
      }

      // Add session token if App Bridge is available
      if (typeof window !== 'undefined' && window.shopify?.idToken) {
        try {
          const sessionToken = await window.shopify.idToken();
          headers.set('Authorization', `Bearer ${sessionToken}`);
        } catch (error) {
          debugLog('Could not get session token for fetch:', error);
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
