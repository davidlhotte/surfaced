'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Page, Layout, Card, Box, Spinner, Text, BlockStack } from '@shopify/polaris';

/**
 * Redirect page - AI Content Optimizer has been merged into Products
 * This page redirects users to /admin/products
 */
export default function OptimizeRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/products');
  }, [router]);

  return (
    <Page title="Redirecting...">
      <Layout>
        <Layout.Section>
          <Card>
            <Box padding="1000">
              <BlockStack gap="400" inlineAlign="center">
                <Spinner size="large" />
                <Text as="p" variant="bodyLg">
                  Redirecting to Products...
                </Text>
                <Text as="p" tone="subdued">
                  AI optimization is now integrated into the Products page.
                </Text>
              </BlockStack>
            </Box>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
