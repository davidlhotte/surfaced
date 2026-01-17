'use client';

import { Suspense } from 'react';
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
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ShopProvider } from '@/components/providers/ShopProvider';

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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider i18n={enTranslations}>
      <Frame>
        <ShopProvider>
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              {children}
            </Suspense>
          </ErrorBoundary>
        </ShopProvider>
      </Frame>
    </AppProvider>
  );
}
