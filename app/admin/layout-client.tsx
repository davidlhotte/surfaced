'use client';

import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AppProvider,
  Frame,
  SkeletonPage,
  SkeletonBodyText,
  SkeletonDisplayText,
  Card,
  BlockStack,
} from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';
import './admin.css';
import enTranslations from '@shopify/polaris/locales/en.json';
import frTranslations from '@shopify/polaris/locales/fr.json';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ShopProvider } from '@/components/providers/ShopProvider';
import { AdminLanguageProvider } from '@/lib/i18n/AdminLanguageContext';
import { AppBridgeNav } from '@/components/admin/AppBridgeNav';

/**
 * Simple loading fallback that doesn't require Polaris context
 * Used for the outer Suspense boundary before AppProvider is ready
 */
function SimpleLoadingFallback() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #e1e3e5',
          borderTopColor: '#5c6ac4',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px',
        }} />
        <p style={{ color: '#6d7175', margin: 0 }}>Loading...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

/**
 * Skeleton loading state that matches the page structure
 * This requires Polaris context and is used inside AppProvider
 */
function PolarisLoadingFallback() {
  return (
    <SkeletonPage primaryAction>
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="400">
            <SkeletonDisplayText size="small" />
            <SkeletonBodyText lines={2} />
          </BlockStack>
        </Card>
        <Card>
          <BlockStack gap="400">
            <SkeletonDisplayText size="small" />
            <SkeletonBodyText lines={4} />
          </BlockStack>
        </Card>
      </BlockStack>
    </SkeletonPage>
  );
}

// Inner component that uses hooks for locale detection
function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();

  const polarisI18n = useMemo(() => {
    const shopifyLocale = searchParams.get('locale');
    if (shopifyLocale) {
      const langCode = shopifyLocale.split('-')[0].toLowerCase();
      if (langCode === 'fr') {
        return frTranslations;
      }
    } else if (typeof window !== 'undefined') {
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('fr')) {
        return frTranslations;
      }
    }
    return enTranslations;
  }, [searchParams]);

  return (
    <AppProvider i18n={polarisI18n}>
      <AppBridgeNav />
      <Frame>
        <ShopProvider>
          <AdminLanguageProvider>
            <ErrorBoundary>
              <Suspense fallback={<PolarisLoadingFallback />}>
                {children}
              </Suspense>
            </ErrorBoundary>
          </AdminLanguageProvider>
        </ShopProvider>
      </Frame>
    </AppProvider>
  );
}

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<SimpleLoadingFallback />}>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </Suspense>
  );
}
