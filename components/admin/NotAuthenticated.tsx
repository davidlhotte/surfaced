'use client';

import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  Banner,
  Button,
  Box,
  InlineStack,
  Divider,
} from '@shopify/polaris';

interface NotAuthenticatedProps {
  error?: string | null;
  isLoading?: boolean;
}

/**
 * Component shown when the app is accessed directly (not from Shopify admin)
 * or when authentication fails.
 */
export function NotAuthenticated({ error, isLoading }: NotAuthenticatedProps) {
  if (isLoading) {
    return null; // Let the page handle loading state
  }

  const handleOpenInShopify = () => {
    // Open Shopify admin in new tab
    window.open('https://admin.shopify.com/store', '_blank');
  };

  return (
    <Page title="Authentication Required">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Banner tone="warning" title="Please open Surfaced from your Shopify admin">
                <BlockStack gap="200">
                  <Text as="p">
                    This app needs to be accessed through your Shopify admin panel to work properly.
                  </Text>
                  {error && (
                    <Text as="p" tone="subdued" variant="bodySm">
                      Technical details: {error}
                    </Text>
                  )}
                </BlockStack>
              </Banner>

              <Divider />

              <BlockStack gap="300">
                <Text as="h3" variant="headingMd">How to access Surfaced:</Text>

                <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                  <InlineStack gap="300" blockAlign="start">
                    <Box background="bg-fill-info" padding="200" borderRadius="200">
                      <Text as="span" variant="bodyLg" fontWeight="bold">1</Text>
                    </Box>
                    <BlockStack gap="100">
                      <Text as="p" fontWeight="semibold">Go to your Shopify Admin</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Visit admin.shopify.com and log in to your store
                      </Text>
                    </BlockStack>
                  </InlineStack>
                </Box>

                <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                  <InlineStack gap="300" blockAlign="start">
                    <Box background="bg-fill-info" padding="200" borderRadius="200">
                      <Text as="span" variant="bodyLg" fontWeight="bold">2</Text>
                    </Box>
                    <BlockStack gap="100">
                      <Text as="p" fontWeight="semibold">Open Apps section</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Click on &quot;Apps&quot; in the left sidebar
                      </Text>
                    </BlockStack>
                  </InlineStack>
                </Box>

                <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                  <InlineStack gap="300" blockAlign="start">
                    <Box background="bg-fill-info" padding="200" borderRadius="200">
                      <Text as="span" variant="bodyLg" fontWeight="bold">3</Text>
                    </Box>
                    <BlockStack gap="100">
                      <Text as="p" fontWeight="semibold">Click on Surfaced</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Find Surfaced in your installed apps and click to open it
                      </Text>
                    </BlockStack>
                  </InlineStack>
                </Box>
              </BlockStack>

              <Divider />

              <InlineStack gap="300">
                <Button variant="primary" onClick={handleOpenInShopify}>
                  Open Shopify Admin
                </Button>
                <Button url="/">Back to Homepage</Button>
              </InlineStack>

              <Text as="p" variant="bodySm" tone="subdued">
                Need help? Contact support at support@surfaced.app
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
