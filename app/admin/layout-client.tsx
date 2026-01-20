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

/**
 * Skeleton loading state that matches the page structure
 * This prevents CLS by reserving the correct space
 */
function LoadingFallback() {
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
      <Frame>
        <ShopProvider>
          <AdminLanguageProvider>
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
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
    <Suspense fallback={<LoadingFallback />}>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </Suspense>
  );
}
