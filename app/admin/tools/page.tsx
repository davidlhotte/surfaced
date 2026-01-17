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
  TextField,
  Banner,
  SkeletonBodyText,
  Box,
  Divider,
  Icon,
  Tabs,
  Modal,
} from '@shopify/polaris';
import {
  ClipboardIcon,
  RefreshIcon,
  CheckCircleIcon,
} from '@shopify/polaris-icons';
import { useAuthenticatedFetch } from '@/components/providers/ShopProvider';

// AI services that can access your store
const AI_SERVICES = [
  { id: 'ChatGPT-User', name: 'ChatGPT', description: 'When people use ChatGPT to find products' },
  { id: 'GPTBot', name: 'OpenAI', description: 'OpenAI\'s search crawler' },
  { id: 'ClaudeBot', name: 'Claude', description: 'Anthropic\'s AI assistant' },
  { id: 'PerplexityBot', name: 'Perplexity', description: 'AI search engine' },
  { id: 'Google-Extended', name: 'Google AI', description: 'Google\'s Gemini and Bard' },
  { id: 'Amazonbot', name: 'Amazon Alexa', description: 'Amazon\'s voice assistant' },
  { id: 'Meta-ExternalAgent', name: 'Meta AI', description: 'Meta\'s AI assistant' },
];

interface AiGuideConfig {
  isEnabled: boolean;
  allowedBots: string[];
  includeProducts: boolean;
  includeCollections: boolean;
  customInstructions: string | null;
  lastGeneratedAt: string | null;
}

interface StructuredDataConfig {
  isEnabled: boolean;
  includeOrganization: boolean;
  includeProducts: boolean;
  includeBreadcrumbs: boolean;
  lastGeneratedAt: string | null;
}

interface StructuredDataPreview {
  organization: object;
  products: object[];
  breadcrumbs: object;
}

export default function ToolsPage() {
  const { fetch } = useAuthenticatedFetch();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // AI Guide (llms.txt) state
  const [, setAiGuideConfig] = useState<AiGuideConfig | null>(null);
  const [aiGuidePreview, setAiGuidePreview] = useState('');
  const [aiGuideEnabled, setAiGuideEnabled] = useState(true);
  const [allowedServices, setAllowedServices] = useState<string[]>([]);
  const [includeProducts, setIncludeProducts] = useState(true);
  const [includeCollections, setIncludeCollections] = useState(true);
  const [customInstructions, setCustomInstructions] = useState('');

  // Structured Data (JSON-LD) state
  const [, setStructuredDataConfig] = useState<StructuredDataConfig | null>(null);
  const [structuredDataPreview, setStructuredDataPreview] = useState<StructuredDataPreview | null>(null);
  const [structuredDataEnabled, setStructuredDataEnabled] = useState(true);
  const [includeOrganization, setIncludeOrganization] = useState(true);
  const [includeProductSchema, setIncludeProductSchema] = useState(true);
  const [includeBreadcrumbs, setIncludeBreadcrumbs] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [aiGuideRes, structuredDataRes] = await Promise.all([
        fetch('/api/llms-txt'),
        fetch('/api/json-ld'),
      ]);

      // Load AI Guide config
      const aiGuideData = await aiGuideRes.json();
      if (aiGuideData.success) {
        setAiGuideConfig(aiGuideData.data.config);
        setAiGuidePreview(aiGuideData.data.preview || '');
        setAiGuideEnabled(aiGuideData.data.config.isEnabled);
        setAllowedServices(aiGuideData.data.config.allowedBots || []);
        setIncludeProducts(aiGuideData.data.config.includeProducts);
        setIncludeCollections(aiGuideData.data.config.includeCollections);
        setCustomInstructions(aiGuideData.data.config.customInstructions || '');
      }

      // Load Structured Data config
      const structuredDataData = await structuredDataRes.json();
      if (structuredDataData.success) {
        setStructuredDataConfig(structuredDataData.data.config);
        setStructuredDataPreview(structuredDataData.data.preview);
        setStructuredDataEnabled(structuredDataData.data.config.isEnabled);
        setIncludeOrganization(structuredDataData.data.config.includeOrganization);
        setIncludeProductSchema(structuredDataData.data.config.includeProducts);
        setIncludeBreadcrumbs(structuredDataData.data.config.includeBreadcrumbs);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [fetch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveAiGuide = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/llms-txt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isEnabled: aiGuideEnabled,
          allowedBots: allowedServices,
          includeProducts,
          includeCollections,
          customInstructions: customInstructions || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAiGuideConfig(data.data.config);
        setAiGuidePreview(data.data.content || '');
        setSuccess('AI Guide saved successfully');
      } else {
        setError(data.error || 'Failed to save');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStructuredData = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/json-ld', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isEnabled: structuredDataEnabled,
          includeOrganization,
          includeProducts: includeProductSchema,
          includeBreadcrumbs,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStructuredDataConfig(data.data.config);
        await loadData(); // Reload to get fresh preview
        setSuccess('Structured data saved successfully');
      } else {
        setError(data.error || 'Failed to save');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy');
    }
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleService = (serviceId: string) => {
    setAllowedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((s) => s !== serviceId)
        : [...prev, serviceId]
    );
  };

  const getStructuredDataContent = () => {
    if (!structuredDataPreview) return '';
    const schemas: string[] = [];

    if (includeOrganization && structuredDataPreview.organization) {
      schemas.push(`<script type="application/ld+json">\n${JSON.stringify(structuredDataPreview.organization, null, 2)}\n</script>`);
    }
    if (includeBreadcrumbs && structuredDataPreview.breadcrumbs) {
      schemas.push(`<script type="application/ld+json">\n${JSON.stringify(structuredDataPreview.breadcrumbs, null, 2)}\n</script>`);
    }
    if (includeProductSchema && structuredDataPreview.products) {
      structuredDataPreview.products.forEach((product) => {
        schemas.push(`<script type="application/ld+json">\n${JSON.stringify(product, null, 2)}\n</script>`);
      });
    }

    return schemas.join('\n\n');
  };

  if (loading) {
    return (
      <Page title="AI Tools" backAction={{ content: 'Home', url: '/admin' }}>
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

  const tabs = [
    { id: 'ai-guide', content: 'AI Guide' },
    { id: 'structured-data', content: 'Structured Data' },
  ];

  return (
    <Page
      title="AI Tools"
      subtitle="Help AI understand and recommend your store"
      backAction={{ content: 'Home', url: '/admin' }}
      secondaryActions={[
        {
          content: 'Refresh',
          icon: RefreshIcon,
          onAction: loadData,
        },
      ]}
    >
      <Layout>
        {error && (
          <Layout.Section>
            <Banner tone="critical" onDismiss={() => setError(null)}>
              {error}
            </Banner>
          </Layout.Section>
        )}

        {success && (
          <Layout.Section>
            <Banner tone="success" onDismiss={() => setSuccess(null)}>
              {success}
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
              <Box paddingBlockStart="400">
                {/* AI Guide Tab */}
                {selectedTab === 0 && (
                  <BlockStack gap="600">
                    {/* Explanation */}
                    <BlockStack gap="300">
                      <InlineStack align="space-between" blockAlign="center">
                        <Text as="h2" variant="headingMd">
                          AI Guide for Your Store
                        </Text>
                        <Badge tone={aiGuideEnabled ? 'success' : 'attention'}>
                          {aiGuideEnabled ? 'Active' : 'Inactive'}
                        </Badge>
                      </InlineStack>
                      <Text as="p" tone="subdued">
                        This creates a special file that tells AI assistants about your store, products, and what makes you unique.
                        When someone asks ChatGPT or Claude for product recommendations, they can read this file to give better answers.
                      </Text>
                    </BlockStack>

                    <Divider />

                    {/* Enable toggle */}
                    <Checkbox
                      label="Enable AI Guide"
                      helpText="When enabled, AI assistants can learn about your store"
                      checked={aiGuideEnabled}
                      onChange={setAiGuideEnabled}
                    />

                    {/* AI Services */}
                    <BlockStack gap="300">
                      <Text as="h3" variant="headingSm">Which AI services can access your store?</Text>
                      <BlockStack gap="200">
                        {AI_SERVICES.map((service) => (
                          <Checkbox
                            key={service.id}
                            label={service.name}
                            helpText={service.description}
                            checked={allowedServices.includes(service.id)}
                            onChange={() => toggleService(service.id)}
                            disabled={!aiGuideEnabled}
                          />
                        ))}
                      </BlockStack>
                    </BlockStack>

                    <Divider />

                    {/* Content Settings */}
                    <BlockStack gap="300">
                      <Text as="h3" variant="headingSm">What should AI know about?</Text>
                      <BlockStack gap="200">
                        <Checkbox
                          label="Your products"
                          helpText="Include product names, descriptions, and prices"
                          checked={includeProducts}
                          onChange={setIncludeProducts}
                          disabled={!aiGuideEnabled}
                        />
                        <Checkbox
                          label="Your collections"
                          helpText="Include your product categories"
                          checked={includeCollections}
                          onChange={setIncludeCollections}
                          disabled={!aiGuideEnabled}
                        />
                      </BlockStack>
                    </BlockStack>

                    {/* Custom Instructions */}
                    <TextField
                      label="Special instructions for AI"
                      helpText="Add anything else AI should know (e.g., free shipping over $50, eco-friendly products, made in USA)"
                      value={customInstructions}
                      onChange={setCustomInstructions}
                      multiline={3}
                      autoComplete="off"
                      disabled={!aiGuideEnabled}
                      placeholder="Example: We specialize in handmade jewelry. All orders ship free over $50."
                    />

                    <Divider />

                    {/* Preview */}
                    <BlockStack gap="300">
                      <InlineStack align="space-between" blockAlign="center">
                        <Text as="h3" variant="headingSm">Preview</Text>
                        <InlineStack gap="200">
                          <Button
                            icon={ClipboardIcon}
                            onClick={() => handleCopy(aiGuidePreview)}
                            disabled={!aiGuidePreview}
                            size="slim"
                          >
                            {copied ? 'Copied!' : 'Copy'}
                          </Button>
                          <Button
                            onClick={() => handleDownload(aiGuidePreview, 'llms.txt')}
                            disabled={!aiGuidePreview}
                            size="slim"
                          >
                            Download
                          </Button>
                        </InlineStack>
                      </InlineStack>
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
                            maxHeight: '200px',
                            overflow: 'auto',
                          }}
                        >
                          {aiGuidePreview || 'Click "Save" to generate your AI Guide'}
                        </pre>
                      </Box>
                    </BlockStack>

                    {/* Save Button */}
                    <Button
                      variant="primary"
                      onClick={handleSaveAiGuide}
                      loading={saving}
                    >
                      Save AI Guide
                    </Button>

                    {/* How to use */}
                    <Card>
                      <BlockStack gap="300">
                        <Text as="h3" variant="headingSm">How to add this to your store</Text>
                        <BlockStack gap="200">
                          <InlineStack gap="200" blockAlign="start">
                            <Badge tone="info">1</Badge>
                            <Text as="p" variant="bodySm">Download the file above</Text>
                          </InlineStack>
                          <InlineStack gap="200" blockAlign="start">
                            <Badge tone="info">2</Badge>
                            <Text as="p" variant="bodySm">Go to Shopify → Online Store → Themes → Edit code</Text>
                          </InlineStack>
                          <InlineStack gap="200" blockAlign="start">
                            <Badge tone="info">3</Badge>
                            <Text as="p" variant="bodySm">Upload to Assets folder as &quot;llms.txt&quot;</Text>
                          </InlineStack>
                        </BlockStack>
                      </BlockStack>
                    </Card>
                  </BlockStack>
                )}

                {/* Structured Data Tab */}
                {selectedTab === 1 && (
                  <BlockStack gap="600">
                    {/* Explanation */}
                    <BlockStack gap="300">
                      <InlineStack align="space-between" blockAlign="center">
                        <Text as="h2" variant="headingMd">
                          Structured Data for Search Engines
                        </Text>
                        <Badge tone={structuredDataEnabled ? 'success' : 'attention'}>
                          {structuredDataEnabled ? 'Active' : 'Inactive'}
                        </Badge>
                      </InlineStack>
                      <Text as="p" tone="subdued">
                        Structured data helps Google and AI understand your store. It enables rich results in search
                        (showing prices, ratings, and stock status) and helps AI give accurate product information.
                      </Text>
                    </BlockStack>

                    <Divider />

                    {/* Enable toggle */}
                    <Checkbox
                      label="Enable structured data"
                      helpText="Generate code that helps search engines understand your store"
                      checked={structuredDataEnabled}
                      onChange={setStructuredDataEnabled}
                    />

                    {/* Schema Types */}
                    <BlockStack gap="300">
                      <Text as="h3" variant="headingSm">What to include</Text>
                      <BlockStack gap="200">
                        <Checkbox
                          label="Your business info"
                          helpText="Name, logo, contact details, social links"
                          checked={includeOrganization}
                          onChange={setIncludeOrganization}
                          disabled={!structuredDataEnabled}
                        />
                        <Checkbox
                          label="Product details"
                          helpText="Names, prices, availability, images (shows in Google search)"
                          checked={includeProductSchema}
                          onChange={setIncludeProductSchema}
                          disabled={!structuredDataEnabled}
                        />
                        <Checkbox
                          label="Navigation structure"
                          helpText="Helps Google show breadcrumbs in search results"
                          checked={includeBreadcrumbs}
                          onChange={setIncludeBreadcrumbs}
                          disabled={!structuredDataEnabled}
                        />
                      </BlockStack>
                    </BlockStack>

                    {/* Benefits */}
                    <Card>
                      <BlockStack gap="200">
                        <Text as="h3" variant="headingSm">Why this matters</Text>
                        <InlineStack gap="200" blockAlign="center">
                          <Icon source={CheckCircleIcon} tone="success" />
                          <Text as="p" variant="bodySm">Show prices and stock in Google search results</Text>
                        </InlineStack>
                        <InlineStack gap="200" blockAlign="center">
                          <Icon source={CheckCircleIcon} tone="success" />
                          <Text as="p" variant="bodySm">Help AI accurately describe your products</Text>
                        </InlineStack>
                        <InlineStack gap="200" blockAlign="center">
                          <Icon source={CheckCircleIcon} tone="success" />
                          <Text as="p" variant="bodySm">Improve your SEO ranking</Text>
                        </InlineStack>
                      </BlockStack>
                    </Card>

                    <Divider />

                    {/* Preview */}
                    <BlockStack gap="300">
                      <InlineStack align="space-between" blockAlign="center">
                        <Text as="h3" variant="headingSm">Preview</Text>
                        <InlineStack gap="200">
                          <Button
                            icon={ClipboardIcon}
                            onClick={() => handleCopy(getStructuredDataContent())}
                            disabled={!structuredDataPreview}
                            size="slim"
                          >
                            {copied ? 'Copied!' : 'Copy'}
                          </Button>
                          <Button
                            onClick={() => setShowPreviewModal(true)}
                            disabled={!structuredDataPreview}
                            size="slim"
                          >
                            Full Preview
                          </Button>
                        </InlineStack>
                      </InlineStack>
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
                            maxHeight: '200px',
                            overflow: 'auto',
                          }}
                        >
                          {structuredDataPreview
                            ? JSON.stringify(structuredDataPreview.organization, null, 2).substring(0, 500) + '...'
                            : 'Click "Save" to generate structured data'}
                        </pre>
                      </Box>
                    </BlockStack>

                    {/* Save Button */}
                    <Button
                      variant="primary"
                      onClick={handleSaveStructuredData}
                      loading={saving}
                    >
                      Save Structured Data
                    </Button>

                    {/* How to use */}
                    <Card>
                      <BlockStack gap="300">
                        <Text as="h3" variant="headingSm">How to add this to your store</Text>
                        <BlockStack gap="200">
                          <InlineStack gap="200" blockAlign="start">
                            <Badge tone="info">1</Badge>
                            <Text as="p" variant="bodySm">Copy the code above</Text>
                          </InlineStack>
                          <InlineStack gap="200" blockAlign="start">
                            <Badge tone="info">2</Badge>
                            <Text as="p" variant="bodySm">Go to Shopify → Themes → Edit code → theme.liquid</Text>
                          </InlineStack>
                          <InlineStack gap="200" blockAlign="start">
                            <Badge tone="info">3</Badge>
                            <Text as="p" variant="bodySm">Paste before &lt;/head&gt; tag</Text>
                          </InlineStack>
                        </BlockStack>
                        <Banner tone="info">
                          Test your structured data at Google&apos;s Rich Results Test tool.
                        </Banner>
                      </BlockStack>
                    </Card>
                  </BlockStack>
                )}
              </Box>
            </Tabs>
          </Card>
        </Layout.Section>
      </Layout>

      {/* Full Preview Modal */}
      <Modal
        open={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="Structured Data Preview"
        primaryAction={{
          content: 'Copy All',
          onAction: () => handleCopy(getStructuredDataContent()),
        }}
        secondaryActions={[
          {
            content: 'Download',
            onAction: () => handleDownload(getStructuredDataContent(), 'structured-data.html'),
          },
        ]}
      >
        <Modal.Section>
          <Box padding="400" background="bg-surface-secondary" borderRadius="200">
            <pre
              style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: 'monospace',
                fontSize: '12px',
                maxHeight: '500px',
                overflow: 'auto',
              }}
            >
              {getStructuredDataContent()}
            </pre>
          </Box>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
