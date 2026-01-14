'use client';

import { useState } from 'react';
import {
  Page,
  Layout,
  Card,
  ResourceList,
  ResourceItem,
  Text,
  Badge,
  TextField,
  EmptyState,
  BlockStack,
  InlineStack,
  Pagination,
} from '@shopify/polaris';
import { SearchIcon } from '@shopify/polaris-icons';

// Placeholder data - will be replaced with API call
const mockStores = [
  {
    id: '1',
    name: 'Main Store',
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    country: 'US',
    featured: true,
  },
  {
    id: '2',
    name: 'Branch Store',
    address: '456 Oak Ave',
    city: 'Los Angeles',
    state: 'CA',
    country: 'US',
    featured: false,
  },
];

export default function StoresPage() {
  const [searchValue, setSearchValue] = useState('');
  const [stores] = useState(mockStores);

  const filteredStores = stores.filter(
    (store) =>
      store.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      store.city.toLowerCase().includes(searchValue.toLowerCase())
  );

  const emptyStateMarkup = (
    <EmptyState
      heading="Add your first store location"
      action={{
        content: 'Add store',
        url: '/stores/new',
      }}
      secondaryAction={{
        content: 'Import from CSV',
        url: '/import',
      }}
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <Text as="p">
        Start by adding your store locations. You can add them one by one or import from a CSV
        file.
      </Text>
    </EmptyState>
  );

  return (
    <Page
      title="Store Locations"
      primaryAction={{
        content: 'Add store',
        url: '/stores/new',
      }}
      secondaryActions={[
        {
          content: 'Import CSV',
          url: '/import',
        },
      ]}
    >
      <Layout>
        <Layout.Section>
          <Card padding="0">
            <BlockStack gap="0">
              <div style={{ padding: '16px' }}>
                <TextField
                  label=""
                  labelHidden
                  placeholder="Search stores..."
                  value={searchValue}
                  onChange={setSearchValue}
                  prefix={<SearchIcon />}
                  autoComplete="off"
                />
              </div>

              {filteredStores.length === 0 ? (
                emptyStateMarkup
              ) : (
                <ResourceList
                  resourceName={{ singular: 'store', plural: 'stores' }}
                  items={filteredStores}
                  renderItem={(item) => {
                    const { id, name, address, city, state, country, featured } = item;

                    return (
                      <ResourceItem
                        id={id}
                        url={`/stores/${id}`}
                        accessibilityLabel={`View details for ${name}`}
                      >
                        <InlineStack align="space-between" blockAlign="center">
                          <BlockStack gap="100">
                            <InlineStack gap="200" align="start">
                              <Text as="span" variant="bodyMd" fontWeight="bold">
                                {name}
                              </Text>
                              {featured && <Badge tone="info">Featured</Badge>}
                            </InlineStack>
                            <Text as="span" variant="bodySm" tone="subdued">
                              {address}, {city}, {state} {country}
                            </Text>
                          </BlockStack>
                        </InlineStack>
                      </ResourceItem>
                    );
                  }}
                />
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <InlineStack align="center">
            <Pagination
              hasPrevious={false}
              hasNext={true}
              onPrevious={() => {}}
              onNext={() => {}}
            />
          </InlineStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
