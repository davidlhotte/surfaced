'use client';

export const dynamic = 'force-dynamic';

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
} from '@shopify/polaris';
import {
  ClipboardIcon,
  RefreshIcon,
  CheckCircleIcon,
  StarFilledIcon,
} from '@shopify/polaris-icons';
import { useAuthenticatedFetch } from '@/components/providers/ShopProvider';
import { AdminNav } from '@/components/admin/AdminNav';
import { PageBanner } from '@/components/admin/PageBanner';
import { useAdminLanguage } from '@/lib/i18n/AdminLanguageContext';

// AI crawlers that can access your store via llms.txt
const AI_SERVICES = [
  { id: 'ChatGPT-User', name: 'ChatGPT', icon: '🤖' },
  { id: 'GPTBot', name: 'GPT Crawler', icon: '🧠' },
  { id: 'ClaudeBot', name: 'Claude', icon: '🎭' },
  { id: 'PerplexityBot', name: 'Perplexity', icon: '🔍' },
  { id: 'Google-Extended', name: 'Google Gemini', icon: '✨' },
  { id: 'cohere-ai', name: 'Cohere', icon: '🔮' },
];

interface AiGuideConfig {
  isEnabled: boolean;
  allowedBots: string[];
  includeProducts: boolean;
  includeCollections: boolean;
  customInstructions: string | null;
  lastGeneratedAt: string | null;
}

export default function ToolsPage() {
  const { fetch } = useAuthenticatedFetch();
  const { t, locale } = useAdminLanguage();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // AI Guide (llms.txt) state
  const [, setAiGuideConfig] = useState<AiGuideConfig | null>(null);
  const [aiGuidePreview, setAiGuidePreview] = useState('');
  const [aiGuideEnabled, setAiGuideEnabled] = useState(true);
  const [allowedServices, setAllowedServices] = useState<string[]>([]);
  const [includeProducts, setIncludeProducts] = useState(true);
  const [includeCollections, setIncludeCollections] = useState(true);
  const [customInstructions, setCustomInstructions] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const aiGuideRes = await fetch('/api/llms-txt');
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
        setSuccess(t.tools.llmsTxtSuccess);
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

  if (loading) {
    return (
      <Page title={t.tools.title} backAction={{ content: t.tools.home, url: '/admin' }}>
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
      title={t.tools.title}
      backAction={{ content: t.tools.home, url: '/admin' }}
      secondaryActions={[
        {
          content: t.tools.refresh,
          icon: RefreshIcon,
          onAction: loadData,
        },
      ]}
    >
      <AdminNav locale={locale} />
      <PageBanner pageKey="llmsTxt" />
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

        {/* AI Guide (llms.txt) Tool */}
        <Layout.Section>
          <Card>
            <BlockStack gap="600">
              {/* Header with value proposition */}
              <BlockStack gap="300">
                <InlineStack align="space-between" blockAlign="center">
                  <InlineStack gap="300" blockAlign="center">
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                      }}
                    >
                      📄
                    </div>
                    <BlockStack gap="100">
                      <Text as="h2" variant="headingLg">{t.tools.llmsTxtGenerator}</Text>
                      <Text as="p" tone="subdued">
                        {t.tools.llmsTxtGeneratorDesc}
                      </Text>
                    </BlockStack>
                  </InlineStack>
                  <Badge tone={aiGuideEnabled ? 'success' : 'attention'}>
                    {aiGuideEnabled ? t.tools.active : t.tools.inactive}
                  </Badge>
                </InlineStack>
              </BlockStack>

              {/* What is it - Simple explanation */}
              <Box
                padding="400"
                background="bg-surface-secondary"
                borderRadius="300"
              >
                <BlockStack gap="300">
                  <Text as="h3" variant="headingSm">
                    💡 {t.tools.howItWorks}
                  </Text>
                  <Text as="p" variant="bodyMd">
                    {t.tools.llmsHowItWorks}
                  </Text>
                  <InlineStack gap="400" wrap>
                    <InlineStack gap="100" blockAlign="center">
                      <Icon source={CheckCircleIcon} tone="success" />
                      <Text as="span" variant="bodySm">{t.tools.moreAiRecommendations}</Text>
                    </InlineStack>
                    <InlineStack gap="100" blockAlign="center">
                      <Icon source={CheckCircleIcon} tone="success" />
                      <Text as="span" variant="bodySm">{t.tools.freeQualifiedTraffic}</Text>
                    </InlineStack>
                    <InlineStack gap="100" blockAlign="center">
                      <Icon source={CheckCircleIcon} tone="success" />
                      <Text as="span" variant="bodySm">{t.tools.controlYourImage}</Text>
                    </InlineStack>
                  </InlineStack>
                </BlockStack>
              </Box>

              <Divider />

              {/* Enable toggle */}
              <Checkbox
                label={t.tools.enableLlmsTxt}
                helpText={t.tools.enableLlmsTxtHelp}
                checked={aiGuideEnabled}
                onChange={setAiGuideEnabled}
              />

              {/* AI Services */}
              <BlockStack gap="300">
                <Text as="h3" variant="headingSm">
                  {t.tools.whichAiCanRecommend}
                </Text>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: '8px'
                }}>
                  {AI_SERVICES.map((service) => (
                    <div
                      key={service.id}
                      onClick={() => aiGuideEnabled && toggleService(service.id)}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        border: allowedServices.includes(service.id)
                          ? '2px solid #5c6ac4'
                          : '2px solid #e1e3e5',
                        background: allowedServices.includes(service.id)
                          ? '#f4f5fa'
                          : 'white',
                        cursor: aiGuideEnabled ? 'pointer' : 'not-allowed',
                        opacity: aiGuideEnabled ? 1 : 0.5,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <InlineStack gap="200" blockAlign="center">
                        <span style={{ fontSize: '18px' }}>{service.icon}</span>
                        <Text as="span" variant="bodySm" fontWeight={allowedServices.includes(service.id) ? 'semibold' : 'regular'}>
                          {service.name}
                        </Text>
                      </InlineStack>
                    </div>
                  ))}
                </div>
              </BlockStack>

              <Divider />

              {/* Content Settings */}
              <BlockStack gap="300">
                <Text as="h3" variant="headingSm">{t.tools.whatToShareWithAi}</Text>
                <InlineStack gap="400" wrap>
                  <Checkbox
                    label={t.tools.yourProducts}
                    checked={includeProducts}
                    onChange={setIncludeProducts}
                    disabled={!aiGuideEnabled}
                  />
                  <Checkbox
                    label={t.tools.yourCollections}
                    checked={includeCollections}
                    onChange={setIncludeCollections}
                    disabled={!aiGuideEnabled}
                  />
                </InlineStack>
              </BlockStack>

              {/* Custom Instructions */}
              <TextField
                label={t.tools.customMessage}
                helpText={t.tools.customMessageHelp}
                value={customInstructions}
                onChange={setCustomInstructions}
                multiline={2}
                autoComplete="off"
                disabled={!aiGuideEnabled}
                placeholder={t.tools.customMessagePlaceholder}
              />

              <Divider />

              {/* Preview */}
              <BlockStack gap="300">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h3" variant="headingSm">{t.tools.filePreview}</Text>
                  <InlineStack gap="200">
                    <Button
                      icon={ClipboardIcon}
                      onClick={() => handleCopy(aiGuidePreview)}
                      disabled={!aiGuidePreview}
                      size="slim"
                    >
                      {copied ? t.tools.copied : t.tools.copy}
                    </Button>
                    <Button
                      onClick={() => handleDownload(aiGuidePreview, 'llms.txt')}
                      disabled={!aiGuidePreview}
                      size="slim"
                      variant="primary"
                    >
                      {t.tools.download}
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
                      color: '#374151',
                    }}
                  >
                    {aiGuidePreview || t.tools.clickGenerateToCreate}
                  </pre>
                </Box>
              </BlockStack>

              {/* Generate Button */}
              <Button
                variant="primary"
                onClick={handleSaveAiGuide}
                loading={saving}
                size="large"
              >
                {t.tools.generateLlmsTxt}
              </Button>

              {/* Installation Steps */}
              <Box
                padding="400"
                background="bg-surface-info"
                borderRadius="300"
              >
                <BlockStack gap="300">
                  <Text as="h3" variant="headingSm">
                    📥 {t.tools.installationSteps}
                  </Text>
                  <BlockStack gap="200">
                    <InlineStack gap="300" blockAlign="start">
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#5c6ac4',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        flexShrink: 0,
                      }}>1</div>
                      <Text as="p" variant="bodyMd">{t.tools.step1Download}</Text>
                    </InlineStack>
                    <InlineStack gap="300" blockAlign="start">
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#5c6ac4',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        flexShrink: 0,
                      }}>2</div>
                      <Text as="p" variant="bodyMd">
                        {t.tools.step2Navigate}
                      </Text>
                    </InlineStack>
                    <InlineStack gap="300" blockAlign="start">
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#5c6ac4',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        flexShrink: 0,
                      }}>3</div>
                      <Text as="p" variant="bodyMd">
                        {t.tools.step3Upload}
                      </Text>
                    </InlineStack>
                  </BlockStack>
                </BlockStack>
              </Box>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
