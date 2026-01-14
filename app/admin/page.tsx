'use client';

import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Button,
  Box,
} from '@shopify/polaris';
import { SettingsIcon } from '@shopify/polaris-icons';
import Link from 'next/link';

export default function Dashboard() {
  return (
    <Page title="Dashboard">
      <Layout>
        {/* Welcome Section */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <BlockStack gap="100">
                <Text as="h2" variant="headingLg">
                  Welcome to Surfaced
                </Text>
                <Text as="p" tone="subdued">
                  Your Shopify app is ready. Start building your features!
                </Text>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Quick Actions */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Quick Actions
              </Text>
              <InlineStack gap="300" wrap>
                <Link href="/admin/settings">
                  <Button icon={SettingsIcon}>
                    Settings
                  </Button>
                </Link>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Getting Started */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Getting Started
              </Text>
              <BlockStack gap="300">
                <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                  <InlineStack gap="300" blockAlign="start">
                    <Box
                      background="bg-fill-info"
                      padding="200"
                      borderRadius="200"
                      minWidth="32px"
                    >
                      <Text as="span" fontWeight="bold" tone="text-inverse">1</Text>
                    </Box>
                    <BlockStack gap="100">
                      <Text as="p" fontWeight="semibold">Configure your app</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Update shopify.app.toml with your credentials
                      </Text>
                    </BlockStack>
                  </InlineStack>
                </Box>
                <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                  <InlineStack gap="300" blockAlign="start">
                    <Box
                      background="bg-fill-info"
                      padding="200"
                      borderRadius="200"
                      minWidth="32px"
                    >
                      <Text as="span" fontWeight="bold" tone="text-inverse">2</Text>
                    </Box>
                    <BlockStack gap="100">
                      <Text as="p" fontWeight="semibold">Build your features</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Add your app-specific functionality
                      </Text>
                    </BlockStack>
                  </InlineStack>
                </Box>
                <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                  <InlineStack gap="300" blockAlign="start">
                    <Box
                      background="bg-fill-info"
                      padding="200"
                      borderRadius="200"
                      minWidth="32px"
                    >
                      <Text as="span" fontWeight="bold" tone="text-inverse">3</Text>
                    </Box>
                    <BlockStack gap="100">
                      <Text as="p" fontWeight="semibold">Deploy to Vercel</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Connect your repo and deploy
                      </Text>
                    </BlockStack>
                  </InlineStack>
                </Box>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
