'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Badge,
  Button,
  Checkbox,
  Banner,
  SkeletonBodyText,
  Box,
  Divider,
  Icon,
  Tooltip,
  Modal,
  Tabs,
} from '@shopify/polaris';
import {
  ClipboardIcon,
  ExternalIcon,
  RefreshIcon,
  InfoIcon,
  CodeIcon,
} from '@shopify/polaris-icons';
import { useAuthenticatedFetch } from '@/components/providers/ShopProvider';

interface JsonLdConfig {
  isEnabled: boolean;
  includeOrganization: boolean;
  includeProducts: boolean;
  includeBreadcrumbs: boolean;
  excludedProductIds: string[];
  lastGeneratedAt: string | null;
}

interface JsonLdPreview {
  organization: object;
  products: object[];
  breadcrumbs: object;
}

export default function JsonLdPage() {
  const { fetch } = useAuthenticatedFetch();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<JsonLdConfig | null>(null);
  const [preview, setPreview] = useState<JsonLdPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);

  // Form state
  const [isEnabled, setIsEnabled] = useState(true);
  const [includeOrganization, setIncludeOrganization] = useState(true);
  const [includeProducts, setIncludeProducts] = useState(true);
  const [includeBreadcrumbs, setIncludeBreadcrumbs] = useState(true);

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/json-ld');
      const data = await response.json();

      if (data.success) {
        setConfig(data.data.config);
        setPreview(data.data.preview);

        // Set form state
        setIsEnabled(data.data.config.isEnabled);
        setIncludeOrganization(data.data.config.includeOrganization);
        setIncludeProducts(data.data.config.includeProducts);
        setIncludeBreadcrumbs(data.data.config.includeBreadcrumbs);

        if (data.data.previewError) {
          setError(data.data.previewError);
        }
      } else {
        setError(data.error || 'Failed to load config');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [fetch]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/json-ld', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isEnabled,
          includeOrganization,
          includeProducts,
          includeBreadcrumbs,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setConfig(data.data.config);
        // Reload to get fresh preview
        await loadConfig();
      } else {
        setError(data.error || 'Failed to save');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const getJsonLdScript = (schema: object) => {
    return `<script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
</script>`;
  };

  const getAllSchemas = () => {
    if (!preview) return '';
    const schemas: string[] = [];

    if (includeOrganization && preview.organization) {
      schemas.push(getJsonLdScript(preview.organization));
    }
    if (includeBreadcrumbs && preview.breadcrumbs) {
      schemas.push(getJsonLdScript(preview.breadcrumbs));
    }
    if (includeProducts && preview.products) {
      preview.products.forEach((product) => {
        schemas.push(getJsonLdScript(product));
      });
    }

    return schemas.join('\n\n');
  };

  const handleCopy = async (content?: string) => {
    try {
      const textToCopy = content || getAllSchemas();
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  };

  const handleDownload = () => {
    const content = getAllSchemas();
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'json-ld-schemas.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const tabs = [
    {
      id: 'organization',
      content: 'Organization',
      panelID: 'organization-panel',
    },
    {
      id: 'products',
      content: 'Products',
      panelID: 'products-panel',
    },
    {
      id: 'breadcrumbs',
      content: 'Breadcrumbs',
      panelID: 'breadcrumbs-panel',
    },
    {
      id: 'all',
      content: 'All Schemas',
      panelID: 'all-panel',
    },
  ];

  const getTabContent = () => {
    if (!preview) return 'Click "Save & Generate" to create your JSON-LD schemas';

    switch (selectedTab) {
      case 0:
        return preview.organization
          ? JSON.stringify(preview.organization, null, 2)
          : 'Organization schema disabled';
      case 1:
        return preview.products && preview.products.length > 0
          ? JSON.stringify(preview.products, null, 2)
          : 'No products or products schema disabled';
      case 2:
        return preview.breadcrumbs
          ? JSON.stringify(preview.breadcrumbs, null, 2)
          : 'Breadcrumbs schema disabled';
      case 3:
        return getAllSchemas() || 'No schemas generated';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <Page title="JSON-LD Schema Generator">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <SkeletonBodyText lines={3} />
                <SkeletonBodyText lines={5} />
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page
      title="JSON-LD Schema Generator"
      subtitle="Structured data for better search visibility"
      primaryAction={{
        content: saving ? 'Saving...' : 'Save & Generate',
        onAction: handleSave,
        loading: saving,
      }}
      secondaryActions={[
        {
          content: 'Refresh',
          icon: RefreshIcon,
          onAction: loadConfig,
        },
      ]}
    >
      <Layout>
        {error && (
          <Layout.Section>
            <Banner tone="warning" onDismiss={() => setError(null)}>
              {error}
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <BlockStack gap="100">
                  <Text as="h2" variant="headingMd">
                    What is JSON-LD?
                  </Text>
                  <Text as="p" tone="subdued">
                    JSON-LD is structured data that helps search engines and AI understand your
                    store&apos;s content. It enables rich snippets in search results and better AI
                    recommendations.
                  </Text>
                </BlockStack>
                <Badge tone={isEnabled ? 'success' : 'attention'}>
                  {isEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </InlineStack>

              <Divider />

              <Checkbox
                label="Enable JSON-LD schema generation"
                helpText="When enabled, structured data schemas will be generated for your store"
                checked={isEnabled}
                onChange={setIsEnabled}
              />
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Schema Types
              </Text>
              <Text as="p" tone="subdued">
                Choose which structured data schemas to include
              </Text>

              <BlockStack gap="200">
                <Checkbox
                  label="Organization Schema"
                  helpText="Business information including name, logo, and contact details"
                  checked={includeOrganization}
                  onChange={setIncludeOrganization}
                  disabled={!isEnabled}
                />
                <Checkbox
                  label="Product Schema"
                  helpText="Product details with prices, availability, and images for rich snippets"
                  checked={includeProducts}
                  onChange={setIncludeProducts}
                  disabled={!isEnabled}
                />
                <Checkbox
                  label="Breadcrumb Schema"
                  helpText="Navigation structure for better search result display"
                  checked={includeBreadcrumbs}
                  onChange={setIncludeBreadcrumbs}
                  disabled={!isEnabled}
                />
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Benefits
              </Text>

              <BlockStack gap="300">
                <InlineStack gap="200" blockAlign="start">
                  <Icon source={CodeIcon} tone="success" />
                  <BlockStack gap="100">
                    <Text as="p" fontWeight="semibold">Rich Search Results</Text>
                    <Text as="p" tone="subdued" variant="bodySm">
                      Display prices, ratings, and availability directly in Google
                    </Text>
                  </BlockStack>
                </InlineStack>

                <InlineStack gap="200" blockAlign="start">
                  <Icon source={CodeIcon} tone="success" />
                  <BlockStack gap="100">
                    <Text as="p" fontWeight="semibold">Better AI Understanding</Text>
                    <Text as="p" tone="subdued" variant="bodySm">
                      Help ChatGPT and other AI tools accurately describe your products
                    </Text>
                  </BlockStack>
                </InlineStack>

                <InlineStack gap="200" blockAlign="start">
                  <Icon source={CodeIcon} tone="success" />
                  <BlockStack gap="100">
                    <Text as="p" fontWeight="semibold">Improved SEO</Text>
                    <Text as="p" tone="subdued" variant="bodySm">
                      Structured data is a key ranking factor for search engines
                    </Text>
                  </BlockStack>
                </InlineStack>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <BlockStack gap="100">
                  <InlineStack gap="200" blockAlign="center">
                    <Text as="h2" variant="headingMd">
                      Preview
                    </Text>
                    <Tooltip content="This is the structured data that will be added to your pages">
                      <Icon source={InfoIcon} tone="subdued" />
                    </Tooltip>
                  </InlineStack>
                  {config?.lastGeneratedAt && (
                    <Text as="p" tone="subdued" variant="bodySm">
                      Last generated: {new Date(config.lastGeneratedAt).toLocaleString()}
                    </Text>
                  )}
                </BlockStack>
                <InlineStack gap="200">
                  <Button
                    icon={ClipboardIcon}
                    onClick={() => handleCopy()}
                    disabled={!preview}
                  >
                    {copied ? 'Copied!' : 'Copy All'}
                  </Button>
                  <Button onClick={handleDownload} disabled={!preview}>
                    Download
                  </Button>
                  <Button
                    icon={ExternalIcon}
                    onClick={() => setShowPreviewModal(true)}
                    disabled={!preview}
                  >
                    Full Preview
                  </Button>
                </InlineStack>
              </InlineStack>

              <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
                <Box paddingBlockStart="400">
                  <Box
                    padding="400"
                    background="bg-surface-secondary"
                    borderRadius="200"
                  >
                    <pre
                      style={{
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        maxHeight: '300px',
                        overflow: 'auto',
                      }}
                    >
                      {getTabContent()}
                    </pre>
                  </Box>
                </Box>
              </Tabs>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                How to Add JSON-LD to Your Theme
              </Text>

              <BlockStack gap="300">
                <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                  <BlockStack gap="200">
                    <Text as="p" fontWeight="semibold">
                      Option 1: Add to theme.liquid (Recommended)
                    </Text>
                    <Text as="p" tone="subdued">
                      1. Go to Online Store → Themes → Edit code
                    </Text>
                    <Text as="p" tone="subdued">
                      2. Open Layout → theme.liquid
                    </Text>
                    <Text as="p" tone="subdued">
                      3. Paste the Organization schema just before &lt;/head&gt;
                    </Text>
                    <Text as="p" tone="subdued">
                      4. For Product schema, add to product.liquid template
                    </Text>
                  </BlockStack>
                </Box>

                <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                  <BlockStack gap="200">
                    <Text as="p" fontWeight="semibold">
                      Option 2: Use a Shopify app
                    </Text>
                    <Text as="p" tone="subdued">
                      Many SEO apps can automatically inject JSON-LD schemas into your theme.
                    </Text>
                  </BlockStack>
                </Box>

                <Banner tone="info">
                  <Text as="p">
                    Tip: Use Google&apos;s Rich Results Test to validate your JSON-LD implementation.
                  </Text>
                </Banner>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      <Modal
        open={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="JSON-LD Full Preview"
        primaryAction={{
          content: 'Copy All',
          onAction: () => handleCopy(),
        }}
        secondaryActions={[
          {
            content: 'Download',
            onAction: handleDownload,
          },
        ]}
      >
        <Modal.Section>
          <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
            <Box paddingBlockStart="400">
              <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    maxHeight: '500px',
                    overflow: 'auto',
                  }}
                >
                  {getTabContent()}
                </pre>
              </Box>
            </Box>
          </Tabs>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
