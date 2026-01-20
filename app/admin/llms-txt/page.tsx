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
  Tooltip,
  Modal,
} from '@shopify/polaris';
import {
  ClipboardIcon,
  ExternalIcon,
  RefreshIcon,
  InfoIcon,
} from '@shopify/polaris-icons';
import { useAuthenticatedFetch } from '@/components/providers/ShopProvider';

// Available AI bots - only those we can verify visibility for
const AI_BOTS = [
  { id: 'ChatGPT-User', name: 'ChatGPT', description: 'OpenAI ChatGPT users' },
  { id: 'GPTBot', name: 'GPT Crawler', description: 'OpenAI web crawler' },
  { id: 'ClaudeBot', name: 'Claude', description: 'Anthropic Claude crawler' },
  { id: 'PerplexityBot', name: 'Perplexity', description: 'Perplexity AI crawler' },
  { id: 'Google-Extended', name: 'Gemini', description: 'Google Gemini crawler' },
  { id: 'cohere-ai', name: 'Cohere', description: 'Cohere AI crawler' },
];

interface LlmsTxtConfig {
  isEnabled: boolean;
  allowedBots: string[];
  includeProducts: boolean;
  includeCollections: boolean;
  includeBlog: boolean;
  excludedProductIds: string[];
  customInstructions: string | null;
  lastGeneratedAt: string | null;
}

export default function LlmsTxtPage() {
  const { fetch } = useAuthenticatedFetch();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<LlmsTxtConfig | null>(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Form state
  const [isEnabled, setIsEnabled] = useState(true);
  const [allowedBots, setAllowedBots] = useState<string[]>([]);
  const [includeProducts, setIncludeProducts] = useState(true);
  const [includeCollections, setIncludeCollections] = useState(true);
  const [customInstructions, setCustomInstructions] = useState('');

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/llms-txt');
      const data = await response.json();

      if (data.success) {
        setConfig(data.data.config);
        setPreview(data.data.preview || '');

        // Set form state
        setIsEnabled(data.data.config.isEnabled);
        setAllowedBots(data.data.config.allowedBots || []);
        setIncludeProducts(data.data.config.includeProducts);
        setIncludeCollections(data.data.config.includeCollections);
        setCustomInstructions(data.data.config.customInstructions || '');

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

      const response = await fetch('/api/llms-txt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isEnabled,
          allowedBots,
          includeProducts,
          includeCollections,
          customInstructions: customInstructions || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setConfig(data.data.config);
        setPreview(data.data.content || '');
      } else {
        setError(data.error || 'Failed to save');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(preview);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([preview], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'llms.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleBot = (botId: string) => {
    setAllowedBots((prev) =>
      prev.includes(botId)
        ? prev.filter((b) => b !== botId)
        : [...prev, botId]
    );
  };

  if (loading) {
    return (
      <Page title="llms.txt Generator">
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
      title="llms.txt Generator"
      subtitle="Help AI assistants understand your store"
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
                    What is llms.txt?
                  </Text>
                  <Text as="p" tone="subdued">
                    llms.txt is a standard file that helps AI assistants like ChatGPT,
                    Claude, and Perplexity understand your store&apos;s content.
                  </Text>
                </BlockStack>
                <Badge tone={isEnabled ? 'success' : 'attention'}>
                  {isEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </InlineStack>

              <Divider />

              <Checkbox
                label="Enable llms.txt generation"
                helpText="When enabled, a llms.txt file will be available for AI crawlers"
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
                AI Crawlers
              </Text>
              <Text as="p" tone="subdued">
                Select which AI services can access your content
              </Text>

              <BlockStack gap="200">
                {AI_BOTS.map((bot) => (
                  <Checkbox
                    key={bot.id}
                    label={bot.name}
                    helpText={bot.description}
                    checked={allowedBots.includes(bot.id)}
                    onChange={() => toggleBot(bot.id)}
                    disabled={!isEnabled}
                  />
                ))}
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Content Settings
              </Text>
              <Text as="p" tone="subdued">
                Choose what content to include in your llms.txt
              </Text>

              <BlockStack gap="200">
                <Checkbox
                  label="Include Products"
                  helpText="List your products with titles, descriptions, and prices"
                  checked={includeProducts}
                  onChange={setIncludeProducts}
                  disabled={!isEnabled}
                />
                <Checkbox
                  label="Include Collections"
                  helpText="List your product collections"
                  checked={includeCollections}
                  onChange={setIncludeCollections}
                  disabled={!isEnabled}
                />
              </BlockStack>

              <Divider />

              <TextField
                label="Custom Instructions"
                helpText="Add any additional information for AI assistants (e.g., shipping policies, unique selling points)"
                value={customInstructions}
                onChange={setCustomInstructions}
                multiline={4}
                autoComplete="off"
                disabled={!isEnabled}
                placeholder="Example: We offer free shipping on orders over $50. Our products are eco-friendly and made in the USA."
              />
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
                    <Tooltip content="This is what AI assistants will see">
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
                    onClick={handleCopy}
                    disabled={!preview}
                  >
                    {copied ? 'Copied!' : 'Copy'}
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
                  {preview || 'Click "Save & Generate" to create your llms.txt'}
                </pre>
              </Box>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                How to Use
              </Text>

              <BlockStack gap="300">
                <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                  <BlockStack gap="200">
                    <Text as="p" fontWeight="semibold">
                      Option 1: Add to your theme (Recommended)
                    </Text>
                    <Text as="p" tone="subdued">
                      1. Download the llms.txt file above
                    </Text>
                    <Text as="p" tone="subdued">
                      2. Go to Online Store → Themes → Edit code
                    </Text>
                    <Text as="p" tone="subdued">
                      3. Create a new template called &quot;llms.txt&quot; in Assets
                    </Text>
                    <Text as="p" tone="subdued">
                      4. Paste the content and save
                    </Text>
                  </BlockStack>
                </Box>

                <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                  <BlockStack gap="200">
                    <Text as="p" fontWeight="semibold">
                      Option 2: Host externally
                    </Text>
                    <Text as="p" tone="subdued">
                      Host the file at yourstore.com/llms.txt using a CDN or your own server.
                    </Text>
                  </BlockStack>
                </Box>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      <Modal
        open={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="llms.txt Full Preview"
        primaryAction={{
          content: 'Copy',
          onAction: handleCopy,
        }}
        secondaryActions={[
          {
            content: 'Download',
            onAction: handleDownload,
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
                fontSize: '13px',
              }}
            >
              {preview}
            </pre>
          </Box>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
