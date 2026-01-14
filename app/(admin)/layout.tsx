'use client';

import { AppProvider } from '@shopify/polaris';
import { AppBridgeProvider } from '@/components/providers/AppBridgeProvider';
import '@shopify/polaris/build/esm/styles.css';
import enTranslations from '@shopify/polaris/locales/en.json';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppBridgeProvider>
      <AppProvider i18n={enTranslations}>
        <ErrorBoundary>{children}</ErrorBoundary>
      </AppProvider>
    </AppBridgeProvider>
  );
}
