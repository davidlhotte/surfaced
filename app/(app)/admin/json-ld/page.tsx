'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Page, Layout, Card, BlockStack, Spinner, Text } from '@shopify/polaris';

export const dynamic = 'force-dynamic';

/**
 * JSON-LD page has been consolidated into Settings > Technical SEO
 * This page redirects users to the Settings page
 */
export default function JsonLdRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to Settings page after a brief delay
    const timer = setTimeout(() => {
      router.replace('/admin/settings');
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <Page title="Redirecting...">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400" inlineAlign="center">
              <Spinner size="large" />
              <Text as="p" alignment="center">
                JSON-LD configuration has moved to Settings &gt; Technical SEO
              </Text>
              <Text as="p" tone="subdued" alignment="center">
                Redirecting you now...
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
