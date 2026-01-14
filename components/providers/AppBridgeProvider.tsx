'use client';

import Script from 'next/script';

interface AppBridgeProviderProps {
  children: React.ReactNode;
}

/**
 * App Bridge Provider for Shopify embedded apps
 *
 * In App Bridge 4.x, the Provider component is no longer needed.
 * Instead, initialization is done via the app-bridge.js script.
 *
 * @see https://shopify.dev/docs/api/app-bridge/migration-guide-react
 */
export function AppBridgeProvider({ children }: AppBridgeProviderProps) {
  const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || '';

  return (
    <>
      {/* App Bridge 4.x initialization via script */}
      <Script
        src="https://cdn.shopify.com/shopifycloud/app-bridge.js"
        strategy="afterInteractive"
      />
      <meta name="shopify-api-key" content={apiKey} />
      {children}
    </>
  );
}
