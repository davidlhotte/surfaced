'use client';

import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Button,
  Icon,
  Banner,
} from '@shopify/polaris';
import {
  LocationIcon,
  ImportIcon,
  SettingsIcon,
  PaintBrushFlatIcon,
} from '@shopify/polaris-icons';
import Link from 'next/link';

export default function Dashboard() {
  return (
    <Page title="LocateUs">
      <Layout>
        <Layout.Section>
          <Banner title="Welcome to LocateUs!" tone="info">
            <Text as="p">
              Manage your store locations and display them on an interactive map for your customers.
            </Text>
          </Banner>
        </Layout.Section>

        <Layout.Section>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Quick Actions
            </Text>

            <InlineStack gap="400" wrap={false}>
              <Card>
                <BlockStack gap="300">
                  <InlineStack gap="200" align="start">
                    <Icon source={LocationIcon} />
                    <Text as="h3" variant="headingSm">
                      Manage Stores
                    </Text>
                  </InlineStack>
                  <Text as="p" tone="subdued">
                    Add, edit, or remove store locations.
                  </Text>
                  <Link href="/stores">
                    <Button>View Stores</Button>
                  </Link>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="300">
                  <InlineStack gap="200" align="start">
                    <Icon source={ImportIcon} />
                    <Text as="h3" variant="headingSm">
                      Import Stores
                    </Text>
                  </InlineStack>
                  <Text as="p" tone="subdued">
                    Bulk import stores from a CSV file.
                  </Text>
                  <Link href="/import">
                    <Button>Import CSV</Button>
                  </Link>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="300">
                  <InlineStack gap="200" align="start">
                    <Icon source={PaintBrushFlatIcon} />
                    <Text as="h3" variant="headingSm">
                      Customize Map
                    </Text>
                  </InlineStack>
                  <Text as="p" tone="subdued">
                    Change map size, colors, and appearance.
                  </Text>
                  <Link href="/appearance">
                    <Button>Customize</Button>
                  </Link>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="300">
                  <InlineStack gap="200" align="start">
                    <Icon source={SettingsIcon} />
                    <Text as="h3" variant="headingSm">
                      Settings
                    </Text>
                  </InlineStack>
                  <Text as="p" tone="subdued">
                    Configure app settings and billing.
                  </Text>
                  <Link href="/settings">
                    <Button>Settings</Button>
                  </Link>
                </BlockStack>
              </Card>
            </InlineStack>
          </BlockStack>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">
                Getting Started
              </Text>
              <BlockStack gap="200">
                <Text as="p">1. Add your store locations manually or import them from a CSV file.</Text>
                <Text as="p">2. Customize the map appearance to match your brand.</Text>
                <Text as="p">3. Add the Store Locator block to your theme using the Theme Editor.</Text>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
