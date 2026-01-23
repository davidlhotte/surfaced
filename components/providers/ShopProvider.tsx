'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';

interface ShopContextType {
  shop: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  /** True when shop detection exhausted all retry attempts */
  shopDetectionFailed: boolean;
}

const ShopContext = createContext<ShopContextType>({
  shop: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
  shopDetectionFailed: false,
});

/**
 * Session storage for shop data (survives page refreshes in same tab)
 * Using sessionStorage instead of module variables for better SSR compatibility
 */
const STORAGE_KEY = 'surfaced_shop_domain';
const TOKEN_EXCHANGED_KEY = 'surfaced_token_exchanged';
const SESSION_TOKEN_KEY = 'surfaced_session_token';
const SESSION_TOKEN_EXPIRY_KEY = 'surfaced_session_token_expiry';

// Session token cache duration (4 minutes - tokens are valid for 5 minutes)
const SESSION_TOKEN_CACHE_DURATION = 4 * 60 * 1000;

function getStoredShop(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function setStoredShop(shop: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, shop);
  } catch {
    // Ignore storage errors
  }
}

function isTokenAlreadyExchanged(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(TOKEN_EXCHANGED_KEY) === 'true';
  } catch {
    return false;
  }
}

function markTokenExchanged(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(TOKEN_EXCHANGED_KEY, 'true');
  } catch {
    // Ignore storage errors
  }
}

function getCachedSessionToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const token = sessionStorage.getItem(SESSION_TOKEN_KEY);
    const expiry = sessionStorage.getItem(SESSION_TOKEN_EXPIRY_KEY);
    if (token && expiry && Date.now() < parseInt(expiry, 10)) {
      return token;
    }
    // Clear expired token
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    sessionStorage.removeItem(SESSION_TOKEN_EXPIRY_KEY);
    return null;
  } catch {
    return null;
  }
}

function setCachedSessionToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    sessionStorage.setItem(SESSION_TOKEN_EXPIRY_KEY, String(Date.now() + SESSION_TOKEN_CACHE_DURATION));
  } catch {
    // Ignore storage errors
  }
}

interface ShopProviderProps {
  children: ReactNode;
}

// Only enable debug logging in development
const DEBUG = process.env.NODE_ENV === 'development';

function debugLog(message: string, data?: unknown) {
  if (DEBUG) {
    console.log(`[Surfaced] ${message}`, data !== undefined ? data : '');
  }
}

export function ShopProvider({ children }: ShopProviderProps) {
  // Initialize from sessionStorage to survive refreshes
  const [shop, setShop] = useState<string | null>(() => getStoredShop());
  const [isLoading, setIsLoading] = useState(() => !getStoredShop());
  const [isAuthenticated, setIsAuthenticated] = useState(() => isTokenAlreadyExchanged());
  const [error, setError] = useState<string | null>(null);
  const [shopDetectionFailed, setShopDetectionFailed] = useState(false);

  useEffect(() => {
    const cachedShop = getStoredShop();
    const tokenExchanged = isTokenAlreadyExchanged();

    debugLog('ShopProvider mounted');
    debugLog('Initial state:', { cachedShop, tokenExchanged });

    // If we already have the shop and token, don't search again
    if (cachedShop && tokenExchanged) {
      debugLog('Using cached shop and token');
      setShop(cachedShop);
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

      // Try sessionStorage as fallback
      const stored = getStoredShop();
      if (stored) {
        debugLog('Found shop in sessionStorage:', stored);
        return stored;
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
          markTokenExchanged();
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
          markTokenExchanged();
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
      setStoredShop(detected);
      setShop(detected);
      // Perform token exchange if needed
      if (!isTokenAlreadyExchanged()) {
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
        setStoredShop(detected);
        setShop(detected);
        if (!isTokenAlreadyExchanged()) {
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
        setError('Could not detect shop from Shopify. Please open this app from your Shopify admin panel.');
        setShopDetectionFailed(true);
        setIsLoading(false);
      }
    };

    setTimeout(tryAgain, attempts[0]);
  }, []);

  const value = useMemo(
    () => ({ shop, isLoading, isAuthenticated, error, shopDetectionFailed }),
    [shop, isLoading, isAuthenticated, error, shopDetectionFailed]
  );

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

      // Fallback to sessionStorage
      if (!shopDomain) {
        shopDomain = getStoredShop();
      }

      // Try App Bridge directly
      if (!shopDomain && typeof window !== 'undefined' && window.shopify?.config?.shop) {
        shopDomain = window.shopify.config.shop;
        setStoredShop(shopDomain);
      }

      // Try URL params
      if (!shopDomain && typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const urlShop = urlParams.get('shop');
        if (urlShop) {
          shopDomain = urlShop;
          setStoredShop(urlShop);
        }
      }

      if (shopDomain) {
        headers.set('x-shopify-shop-domain', shopDomain);
        debugLog(`Authenticated fetch to: ${url} for shop: ${shopDomain}`);
      } else {
        debugLog(`WARNING: No shop domain for authenticated fetch to: ${url}`);
      }

      // Add session token if App Bridge is available (with caching for performance)
      if (typeof window !== 'undefined') {
        let sessionToken = getCachedSessionToken();
        if (!sessionToken && window.shopify?.idToken) {
          try {
            sessionToken = await window.shopify.idToken();
            if (sessionToken) {
              setCachedSessionToken(sessionToken);
            }
          } catch (error) {
            debugLog('Could not get session token for fetch:', error);
          }
        }
        if (sessionToken) {
          headers.set('Authorization', `Bearer ${sessionToken}`);
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
