'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Button,
  Box,
  Badge,
  Spinner,
  Banner,
  Divider,
  TextField,
  DataTable,
  Modal,
  Scrollable,
} from '@shopify/polaris';
import Link from 'next/link';
import { useAuthenticatedFetch, useShopContext } from '@/components/providers/ShopProvider';
import { NotAuthenticated } from '@/components/admin/NotAuthenticated';
import { useAdminLanguage } from '@/lib/i18n/AdminLanguageContext';

type VisibilityCheck = {
  id: string;
  platform: string;
  query: string;
  isMentioned: boolean;
  mentionContext: string | null;
  position: number | null;
  competitorsFound: { name: string; url?: string }[];
  responseQuality: string | null;
  rawResponse: string | null;
  checkedAt: string;
};

type VisibilityResult = {
  shopDomain: string;
  brandName: string;
  results: VisibilityCheck[];
  summary: {
    totalChecks: number;
    mentioned: number;
    notMentioned: number;
    competitorsFound: string[];
  };
};

export default function VisibilityPage() {
  const { fetch: authenticatedFetch } = useAuthenticatedFetch();
  const { isLoading: shopLoading, shopDetectionFailed, error: shopError } = useShopContext();
  const { t, locale } = useAdminLanguage();
  const [history, setHistory] = useState<VisibilityCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<VisibilityResult | null>(null);
  const [customQuery, setCustomQuery] = useState('');
  const [selectedCheck, setSelectedCheck] = useState<VisibilityCheck | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('/api/visibility');
      if (!response.ok) throw new Error(t.common.error);
      const result = await response.json();
      if (result.success) {
        setHistory(result.data);
      } else {
        setError(result.error || t.common.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch, t.common.error]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const runCheck = async (queries?: string[]) => {
    try {
      setChecking(true);
      setError(null);
      const response = await authenticatedFetch('/api/visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queries }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t.common.error);
      }
      const result = await response.json();
      if (result.success) {
        setLastResult(result.data);
        await fetchHistory();
      } else {
        setError(result.error || t.common.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setChecking(false);
    }
  };

  const handleCustomCheck = () => {
    if (customQuery.trim()) {
      runCheck([customQuery.trim()]);
      setCustomQuery('');
    }
  };

  const getPlatformBadge = (platform: string) => {
    const colors: Record<string, 'info' | 'success' | 'warning' | 'attention'> = {
      // Paid platforms
      chatgpt: 'success',
      perplexity: 'info',
      gemini: 'warning',
      copilot: 'attention',
      claude: 'success',
      // Free platforms
      llama: 'info',
      deepseek: 'warning',
      mistral: 'attention',
      qwen: 'info',
    };
    const names: Record<string, string> = {
      chatgpt: 'ChatGPT',
      perplexity: 'Perplexity',
      gemini: 'Gemini',
      copilot: 'Copilot',
      claude: 'Claude',
      llama: 'Llama 3.3',
      deepseek: 'DeepSeek',
      mistral: 'Mistral',
      qwen: 'Gemma 12B',
    };
    const isFree = ['copilot', 'llama', 'deepseek', 'mistral', 'qwen'].includes(platform);
    return (
      <InlineStack gap="100">
        <Badge tone={colors[platform] || 'info'}>{names[platform] || platform}</Badge>
        {isFree && <Badge tone="success">Free</Badge>}
      </InlineStack>
    );
  };

  const getQualityBadge = (quality: string | null, isMentioned: boolean) => {
    if (!isMentioned) {
      return <Badge tone="critical">{t.visibility.notFound}</Badge>;
    }
    if (quality === 'good') {
      return <Badge tone="success">{t.visibility.recommended}</Badge>;
    }
    if (quality === 'partial') {
      return <Badge tone="warning">{t.visibility.mentioned}</Badge>;
    }
    return <Badge tone="info">{t.visibility.found}</Badge>;
  };

  const openResponseModal = (check: VisibilityCheck) => {
    setSelectedCheck(check);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedCheck(null);
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      chatgpt: '🤖',
      perplexity: '🔍',
      gemini: '✨',
      copilot: '💻',
      claude: '🧠',
      llama: '🦙',
      deepseek: '🔮',
      mistral: '🌪️',
      qwen: '🐼',
    };
    return icons[platform] || '🤖';
  };

  const getPlatformDisplayName = (platform: string) => {
    const names: Record<string, string> = {
      chatgpt: 'ChatGPT',
      perplexity: 'Perplexity',
      gemini: 'Gemini',
      copilot: 'Copilot',
      claude: 'Claude',
      llama: 'Llama 3.3',
      deepseek: 'DeepSeek',
      mistral: 'Mistral',
      qwen: 'Gemma 12B',
    };
    return names[platform] || platform;
  };

  // Calculate summary stats
  const mentionedCount = history.filter((c) => c.isMentioned).length;
  const totalChecks = history.length;
  const mentionRate = totalChecks > 0 ? Math.round((mentionedCount / totalChecks) * 100) : 0;

  // Calculate best platform
  const bestPlatform = useMemo(() => {
    if (history.length === 0) return null;
    const platformMentions: Record<string, number> = {};
    history.forEach((check) => {
      if (check.isMentioned) {
        platformMentions[check.platform] = (platformMentions[check.platform] || 0) + 1;
      }
    });
    const entries = Object.entries(platformMentions);
    if (entries.length === 0) return null;
    const best = entries.reduce((a, b) => (a[1] > b[1] ? a : b));
    return getPlatformDisplayName(best[0]);
  }, [history]);

  // Group results by platform for display
  const resultsByPlatform = useMemo(() => {
    const grouped: Record<string, VisibilityCheck[]> = {};
    history.forEach((check) => {
      if (!grouped[check.platform]) {
        grouped[check.platform] = [];
      }
      grouped[check.platform].push(check);
    });
    return grouped;
  }, [history]);

  // Get unique platforms from history
  const platformsInHistory = useMemo(() => {
    return [...new Set(history.map(h => h.platform))];
  }, [history]);

  // Show authentication error if shop detection failed
  if (shopDetectionFailed) {
    return <NotAuthenticated error={shopError} />;
  }

  if (loading || shopLoading) {
    return (
      <Page title={t.visibility.title} backAction={{ content: t.dashboard.title, url: '/admin' }}>
        <Layout>
          <Layout.Section>
            <Card>
              <Box padding="800">
                <BlockStack gap="400" inlineAlign="center">
                  <Spinner size="large" />
                  <Text as="p">{t.visibility.loading}</Text>
                </BlockStack>
              </Box>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  const tableRows = history.slice(0, 20).map((check) => [
    getPlatformBadge(check.platform),
    <Text key={check.id} as="p" variant="bodySm" truncate>{check.query}</Text>,
    getQualityBadge(check.responseQuality, check.isMentioned),
    check.position ? `#${check.position}` : '-',
    new Date(check.checkedAt).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US'),
    <Button
      key={`view-${check.id}`}
      size="slim"
      onClick={() => openResponseModal(check)}
      disabled={!check.rawResponse}
    >
      {t.visibility.viewResponse}
    </Button>,
  ]);

  return (
    <Page
      title={t.visibility.title}
      subtitle={t.visibility.subtitle}
      backAction={{ content: t.dashboard.title, url: '/admin' }}
      primaryAction={{
        content: checking ? t.visibility.checking : t.visibility.runCheck,
        onAction: () => runCheck(),
        loading: checking,
      }}
    >
      <Layout>
        {error && (
          <Layout.Section>
            <Banner tone="critical" title={t.common.error} onDismiss={() => setError(null)}>
              <p>{error}</p>
            </Banner>
          </Layout.Section>
        )}

        {lastResult && (
          <Layout.Section>
            <Banner
              tone={lastResult.summary.mentioned > 0 ? 'success' : 'warning'}
              title={t.visibility.checkComplete}
              onDismiss={() => setLastResult(null)}
            >
              <BlockStack gap="200">
                <Text as="p">
                  {t.visibility.brandMentioned} {lastResult.summary.mentioned} {t.visibility.responses} {t.visibility.outOf}{' '}
                  {lastResult.summary.totalChecks}.
                </Text>
                {lastResult.summary.competitorsFound.length > 0 && (
                  <Text as="p" tone="subdued">
                    {t.visibility.competitorsDetected}: {lastResult.summary.competitorsFound.join(', ')}
                  </Text>
                )}
              </BlockStack>
            </Banner>
          </Layout.Section>
        )}

        {/* Welcome Section for New Users */}
        {history.length === 0 && (
          <Layout.Section>
            <Card>
              <Box padding="600">
                <BlockStack gap="500">
                  <div style={{
                    background: 'linear-gradient(135deg, #10B981 0%, #38BDF8 100%)',
                    padding: '24px',
                    borderRadius: '12px',
                    color: 'white',
                  }}>
                    <BlockStack gap="400">
                      <Text as="h2" variant="headingLg">
                        {t.visibility.checkYourVisibility}
                      </Text>
                      <Text as="p">
                        {t.visibility.checkYourVisibilityDesc}
                      </Text>
                    </BlockStack>
                  </div>

                  <BlockStack gap="300">
                    <Text as="h3" variant="headingMd">{t.visibility.howItWorksTitle}</Text>
                    <InlineStack gap="400" wrap>
                      <Box minWidth="200px" maxWidth="300px">
                        <BlockStack gap="200">
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#10B981',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                          }}>1</div>
                          <Text as="p" fontWeight="semibold">{t.visibility.step1}</Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            {t.visibility.step1Desc}
                          </Text>
                        </BlockStack>
                      </Box>
                      <Box minWidth="200px" maxWidth="300px">
                        <BlockStack gap="200">
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#10B981',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                          }}>2</div>
                          <Text as="p" fontWeight="semibold">{t.visibility.step2}</Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            {t.visibility.step2Desc}
                          </Text>
                        </BlockStack>
                      </Box>
                      <Box minWidth="200px" maxWidth="300px">
                        <BlockStack gap="200">
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#10B981',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                          }}>3</div>
                          <Text as="p" fontWeight="semibold">{t.visibility.step3}</Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            {t.visibility.step3Desc}
                          </Text>
                        </BlockStack>
                      </Box>
                    </InlineStack>
                  </BlockStack>

                  <Box paddingBlockStart="200">
                    <Button variant="primary" size="large" onClick={() => runCheck()} loading={checking}>
                      {t.visibility.firstCheck}
                    </Button>
                  </Box>
                </BlockStack>
              </Box>
            </Card>
          </Layout.Section>
        )}

        {/* Summary Stats */}
        {history.length > 0 && (
          <Layout.Section>
            <InlineStack gap="400" align="start" wrap>
              <Box minWidth="200px">
                <Card>
                  <BlockStack gap="200">
                    <Text as="h3" variant="bodySm" tone="subdued">
                      {t.visibility.mentionRate}
                    </Text>
                    <Text as="p" variant="heading2xl" fontWeight="bold" tone={mentionRate > 30 ? 'success' : mentionRate > 0 ? 'caution' : 'critical'}>
                      {mentionRate}%
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {mentionedCount} {t.visibility.mentions} {t.visibility.outOf} {totalChecks} {t.visibility.checks}
                    </Text>
                  </BlockStack>
                </Card>
              </Box>

              <Box minWidth="200px">
                <Card>
                  <BlockStack gap="200">
                    <Text as="h3" variant="bodySm" tone="subdued">
                      {t.visibility.checksThisMonth}
                    </Text>
                    <Text as="p" variant="heading2xl" fontWeight="bold">
                      {totalChecks}
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {t.visibility.requestsSent}
                    </Text>
                  </BlockStack>
                </Card>
              </Box>

              <Box minWidth="200px">
                <Card>
                  <BlockStack gap="200">
                    <Text as="h3" variant="bodySm" tone="subdued">
                      {t.visibility.bestPlatform}
                    </Text>
                    <Text as="p" variant="heading2xl" fontWeight="bold">
                      {bestPlatform || '-'}
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {bestPlatform ? t.visibility.mentionsYouMost : t.visibility.noMentionsYet}
                    </Text>
                  </BlockStack>
                </Card>
              </Box>
            </InlineStack>
          </Layout.Section>
        )}

        {/* Custom Query */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <BlockStack gap="200">
                <Text as="h3" variant="headingMd">{t.visibility.customQuestion}</Text>
                <Text as="p" tone="subdued">
                  {t.visibility.customQuestionDesc}
                </Text>
              </BlockStack>
              <Divider />
              <InlineStack gap="200" blockAlign="end" wrap>
                <Box minWidth="300px" maxWidth="500px">
                  <TextField
                    label={t.visibility.yourQuestion}
                    labelHidden
                    placeholder={t.visibility.questionPlaceholder}
                    value={customQuery}
                    onChange={setCustomQuery}
                    autoComplete="off"
                  />
                </Box>
                <Button
                  onClick={handleCustomCheck}
                  disabled={!customQuery.trim() || checking}
                  loading={checking}
                  variant="primary"
                >
                  {t.visibility.testQuestion}
                </Button>
              </InlineStack>
              <Text as="p" variant="bodySm" tone="subdued">
                {t.visibility.questionTip}
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Results by Platform - Raw Responses */}
        {history.length > 0 && platformsInHistory.length > 0 && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">
                    {locale === 'fr' ? 'Réponses par Plateforme AI' : 'AI Platform Responses'}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    {locale === 'fr'
                      ? 'Comparez les réponses brutes de chaque AI pour voir comment votre marque est perçue.'
                      : 'Compare raw responses from each AI to see how your brand is perceived.'}
                  </Text>
                </BlockStack>
                <Divider />

                {/* Platform tabs/cards with raw responses */}
                <BlockStack gap="400">
                  {platformsInHistory.map((platform) => {
                    const platformChecks = resultsByPlatform[platform] || [];
                    const latestCheck = platformChecks[0]; // Most recent check for this platform
                    const mentionCount = platformChecks.filter(c => c.isMentioned).length;
                    const platformMentionRate = platformChecks.length > 0
                      ? Math.round((mentionCount / platformChecks.length) * 100)
                      : 0;
                    const isFree = ['copilot', 'llama', 'deepseek', 'mistral', 'qwen'].includes(platform);

                    return (
                      <Box
                        key={platform}
                        padding="400"
                        background="bg-surface-secondary"
                        borderRadius="300"
                        borderWidth="025"
                        borderColor="border"
                      >
                        <BlockStack gap="300">
                          {/* Platform Header */}
                          <InlineStack align="space-between" blockAlign="center" wrap>
                            <InlineStack gap="200" blockAlign="center">
                              <Text as="span" variant="headingLg">
                                {getPlatformIcon(platform)}
                              </Text>
                              <BlockStack gap="050">
                                <InlineStack gap="100">
                                  <Text as="h4" variant="headingMd">
                                    {getPlatformDisplayName(platform)}
                                  </Text>
                                  {isFree && <Badge tone="success">Free</Badge>}
                                </InlineStack>
                                <Text as="p" variant="bodySm" tone="subdued">
                                  {platformChecks.length} {locale === 'fr' ? 'vérifications' : 'checks'} • {platformMentionRate}% {locale === 'fr' ? 'mentions' : 'mention rate'}
                                </Text>
                              </BlockStack>
                            </InlineStack>
                            <Badge tone={platformMentionRate > 50 ? 'success' : platformMentionRate > 0 ? 'warning' : 'critical'}>
                              {`${platformMentionRate}%`}
                            </Badge>
                          </InlineStack>

                          {/* Latest Response */}
                          {latestCheck && (
                            <BlockStack gap="200">
                              <Box padding="200" background="bg-surface" borderRadius="200">
                                <BlockStack gap="100">
                                  <Text as="p" variant="bodySm" tone="subdued">
                                    {locale === 'fr' ? 'Question:' : 'Query:'} &quot;{latestCheck.query}&quot;
                                  </Text>
                                  {getQualityBadge(latestCheck.responseQuality, latestCheck.isMentioned)}
                                </BlockStack>
                              </Box>

                              {/* Raw Response Preview */}
                              {latestCheck.rawResponse && (
                                <Box
                                  padding="300"
                                  background="bg-surface"
                                  borderRadius="200"
                                  maxWidth="100%"
                                >
                                  <BlockStack gap="200">
                                    <Text as="h5" variant="headingSm">
                                      {locale === 'fr' ? 'Réponse brute:' : 'Raw Response:'}
                                    </Text>
                                    <Scrollable style={{ maxHeight: '200px' }}>
                                      <Text as="p" variant="bodySm">
                                        {latestCheck.rawResponse.length > 500
                                          ? latestCheck.rawResponse.substring(0, 500) + '...'
                                          : latestCheck.rawResponse}
                                      </Text>
                                    </Scrollable>
                                    {latestCheck.rawResponse.length > 500 && (
                                      <Button
                                        size="slim"
                                        onClick={() => openResponseModal(latestCheck)}
                                      >
                                        {locale === 'fr' ? 'Voir la réponse complète' : 'View full response'}
                                      </Button>
                                    )}
                                  </BlockStack>
                                </Box>
                              )}
                            </BlockStack>
                          )}
                        </BlockStack>
                      </Box>
                    );
                  })}
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

        {/* History Table */}
        {history.length > 0 && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">{t.visibility.checkHistory}</Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    {t.visibility.checkHistoryDesc}
                  </Text>
                </BlockStack>
                <Divider />
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text']}
                  headings={[t.visibility.platform, t.visibility.question, t.visibility.result, t.visibility.position, t.visibility.date, t.visibility.aiResponse]}
                  rows={tableRows}
                />
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

        {/* Tips */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <BlockStack gap="200">
                <Text as="h3" variant="headingMd">{t.visibility.howToBeRecommended}</Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  {t.visibility.howToBeRecommendedDesc}
                </Text>
              </BlockStack>
              <Divider />
              <BlockStack gap="200">
                <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                  <InlineStack align="space-between" blockAlign="center" gap="400" wrap>
                    <InlineStack gap="200" blockAlign="start">
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: '#5c6ac4',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '14px',
                      }}>1</div>
                      <BlockStack gap="100">
                        <Text as="p" fontWeight="semibold">{t.visibility.tip1Title}</Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          {t.visibility.tip1Desc}
                        </Text>
                      </BlockStack>
                    </InlineStack>
                    <Link href="/admin/products">
                      <Button>{t.visibility.optimizeProducts}</Button>
                    </Link>
                  </InlineStack>
                </Box>
                <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                  <InlineStack align="space-between" blockAlign="center" gap="400" wrap>
                    <InlineStack gap="200" blockAlign="start">
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: '#5c6ac4',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '14px',
                      }}>2</div>
                      <BlockStack gap="100">
                        <Text as="p" fontWeight="semibold">{t.visibility.tip2Title}</Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          {t.visibility.tip2Desc}
                        </Text>
                      </BlockStack>
                    </InlineStack>
                    <Link href="/admin/settings">
                      <Button>{t.visibility.checkSettings}</Button>
                    </Link>
                  </InlineStack>
                </Box>
                <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                  <InlineStack align="space-between" blockAlign="center" gap="400" wrap>
                    <InlineStack gap="200" blockAlign="start">
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: '#5c6ac4',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '14px',
                      }}>3</div>
                      <BlockStack gap="100">
                        <Text as="p" fontWeight="semibold">{t.visibility.tip3Title}</Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          {t.visibility.tip3Desc}
                        </Text>
                      </BlockStack>
                    </InlineStack>
                    <Link href="/admin/tools">
                      <Button variant="primary">{t.visibility.configureTools}</Button>
                    </Link>
                  </InlineStack>
                </Box>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      {/* AI Response Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={
          selectedCheck
            ? `${getPlatformIcon(selectedCheck.platform)} ${t.visibility.responseFrom} ${selectedCheck.platform.charAt(0).toUpperCase() + selectedCheck.platform.slice(1)}`
            : t.visibility.aiResponse
        }
        size="large"
      >
        <Modal.Section>
          {selectedCheck && (
            <BlockStack gap="400">
              {/* Query */}
              <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                <BlockStack gap="200">
                  <Text as="h4" variant="headingSm" tone="subdued">
                    {t.visibility.questionAsked}
                  </Text>
                  <Text as="p" fontWeight="semibold">
                    &quot;{selectedCheck.query}&quot;
                  </Text>
                </BlockStack>
              </Box>

              {/* Result Summary */}
              <InlineStack gap="300" align="start" wrap>
                <Box>
                  <BlockStack gap="100">
                    <Text as="span" variant="bodySm" tone="subdued">{t.visibility.result}</Text>
                    {getQualityBadge(selectedCheck.responseQuality, selectedCheck.isMentioned)}
                  </BlockStack>
                </Box>
                {selectedCheck.position && (
                  <Box>
                    <BlockStack gap="100">
                      <Text as="span" variant="bodySm" tone="subdued">{t.visibility.position}</Text>
                      <Badge tone="info">{`#${selectedCheck.position}`}</Badge>
                    </BlockStack>
                  </Box>
                )}
                {selectedCheck.competitorsFound && selectedCheck.competitorsFound.length > 0 && (
                  <Box>
                    <BlockStack gap="100">
                      <Text as="span" variant="bodySm" tone="subdued">{t.visibility.competitorsDetected}</Text>
                      <Text as="p" variant="bodySm">
                        {selectedCheck.competitorsFound.map(c => c.name).join(', ')}
                      </Text>
                    </BlockStack>
                  </Box>
                )}
              </InlineStack>

              {/* Mention Context */}
              {selectedCheck.isMentioned && selectedCheck.mentionContext && (
                <Box padding="300" background="bg-surface-success" borderRadius="200">
                  <BlockStack gap="200">
                    <InlineStack gap="200" blockAlign="center">
                      <Badge tone="success">{t.visibility.yourBrandMentioned}</Badge>
                    </InlineStack>
                    <Text as="p" variant="bodySm">
                      &quot;...{selectedCheck.mentionContext}...&quot;
                    </Text>
                  </BlockStack>
                </Box>
              )}

              {!selectedCheck.isMentioned && (
                <Box padding="300" background="bg-surface-critical" borderRadius="200">
                  <BlockStack gap="200">
                    <Text as="p" fontWeight="semibold">{t.visibility.yourBrandNotMentioned}</Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {t.visibility.notMentionedDesc}
                    </Text>
                  </BlockStack>
                </Box>
              )}

              <Divider />

              {/* Full AI Response */}
              <BlockStack gap="200">
                <Text as="h4" variant="headingSm">
                  {t.visibility.fullAiResponse}
                </Text>
                <Box
                  padding="400"
                  background="bg-surface-secondary"
                  borderRadius="200"
                  minHeight="200px"
                  maxWidth="100%"
                >
                  <Scrollable style={{ maxHeight: '400px' }}>
                    <Text as="p" variant="bodyMd">
                      {selectedCheck.rawResponse || t.visibility.responseNotAvailable}
                    </Text>
                  </Scrollable>
                </Box>
              </BlockStack>

              {/* Timestamp */}
              <Text as="p" variant="bodySm" tone="subdued">
                {t.visibility.checkedOn} {new Date(selectedCheck.checkedAt).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')} {t.visibility.at} {new Date(selectedCheck.checkedAt).toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </BlockStack>
          )}
        </Modal.Section>
      </Modal>
    </Page>
  );
}
