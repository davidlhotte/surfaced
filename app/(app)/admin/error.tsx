'use client';

import { useEffect } from 'react';
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  Button,
  Banner,
} from '@shopify/polaris';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error
    console.error('Admin error:', error);
  }, [error]);

  return (
    <Page title="Error">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Banner tone="critical">
                <Text as="p" fontWeight="bold">Something went wrong</Text>
              </Banner>
              <Text as="p" tone="subdued">
                An unexpected error occurred while loading this page.
                Please try again or contact support if the problem persists.
              </Text>
              <Button onClick={reset}>Try Again</Button>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
