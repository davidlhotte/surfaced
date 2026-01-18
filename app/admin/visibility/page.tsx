'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { useAuthenticatedFetch } from '@/components/providers/ShopProvider';

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
      if (!response.ok) throw new Error('Failed to fetch visibility history');
      const result = await response.json();
      if (result.success) {
        setHistory(result.data);
      } else {
        setError(result.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch]);

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
        throw new Error(errorData.error || 'Visibility check failed');
      }
      const result = await response.json();
      if (result.success) {
        setLastResult(result.data);
        await fetchHistory();
      } else {
        setError(result.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check failed');
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
      chatgpt: 'success',
      perplexity: 'info',
      gemini: 'warning',
      copilot: 'attention',
    };
    return <Badge tone={colors[platform] || 'info'}>{platform}</Badge>;
  };

  const getQualityBadge = (quality: string | null, isMentioned: boolean) => {
    if (!isMentioned) {
      return <Badge tone="critical">Not Found</Badge>;
    }
    if (quality === 'good') {
      return <Badge tone="success">Recommended</Badge>;
    }
    if (quality === 'partial') {
      return <Badge tone="warning">Mentioned</Badge>;
    }
    return <Badge tone="info">Found</Badge>;
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
    };
    return icons[platform] || '🤖';
  };

  // Calculate summary stats
  const mentionedCount = history.filter((c) => c.isMentioned).length;
  const totalChecks = history.length;
  const mentionRate = totalChecks > 0 ? Math.round((mentionedCount / totalChecks) * 100) : 0;

  if (loading) {
    return (
      <Page title="Check Your Visibility" backAction={{ content: 'Home', url: '/admin' }}>
        <Layout>
          <Layout.Section>
            <Card>
              <Box padding="800">
                <BlockStack gap="400" inlineAlign="center">
                  <Spinner size="large" />
                  <Text as="p">Loading your visibility data...</Text>
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
    new Date(check.checkedAt).toLocaleDateString(),
    <Button
      key={`view-${check.id}`}
      size="slim"
      onClick={() => openResponseModal(check)}
      disabled={!check.rawResponse}
    >
      View Response
    </Button>,
  ]);

  return (
    <Page
      title="Check Your Visibility"
      subtitle="See if AI assistants recommend your store"
      backAction={{ content: 'Home', url: '/admin' }}
      primaryAction={{
        content: 'Check Now',
        onAction: () => runCheck(),
        loading: checking,
      }}
    >
      <Layout>
        {error && (
          <Layout.Section>
            <Banner tone="critical" title="Error" onDismiss={() => setError(null)}>
              <p>{error}</p>
            </Banner>
          </Layout.Section>
        )}

        {lastResult && (
          <Layout.Section>
            <Banner
              tone={lastResult.summary.mentioned > 0 ? 'success' : 'warning'}
              title="Visibility Check Complete"
              onDismiss={() => setLastResult(null)}
            >
              <BlockStack gap="200">
                <Text as="p">
                  Your brand was mentioned in {lastResult.summary.mentioned} of{' '}
                  {lastResult.summary.totalChecks} queries.
                </Text>
                {lastResult.summary.competitorsFound.length > 0 && (
                  <Text as="p" tone="subdued">
                    Competitors found: {lastResult.summary.competitorsFound.join(', ')}
                  </Text>
                )}
              </BlockStack>
            </Banner>
          </Layout.Section>
        )}

        {/* Summary Stats */}
        <Layout.Section>
          <InlineStack gap="400" align="start">
            <Box minWidth="200px">
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm" tone="subdued">
                    Mention Rate
                  </Text>
                  <Text as="p" variant="heading2xl" fontWeight="bold">
                    {mentionRate}%
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    {mentionedCount} of {totalChecks} checks
                  </Text>
                </BlockStack>
              </Card>
            </Box>

            <Box minWidth="200px">
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm" tone="subdued">
                    Total Checks
                  </Text>
                  <Text as="p" variant="heading2xl" fontWeight="bold">
                    {totalChecks}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    This month
                  </Text>
                </BlockStack>
              </Card>
            </Box>

            <Box minWidth="200px">
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm" tone="subdued">
                    Best Platform
                  </Text>
                  <Text as="p" variant="heading2xl" fontWeight="bold">
                    {mentionedCount > 0 ? 'ChatGPT' : '-'}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Most mentions
                  </Text>
                </BlockStack>
              </Card>
            </Box>
          </InlineStack>
        </Layout.Section>

        {/* Custom Query */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">Test a Question</Text>
              <Divider />
              <Text as="p" tone="subdued">
                Type a question shoppers might ask and see if AI mentions your store.
              </Text>
              <InlineStack gap="200" blockAlign="end">
                <Box minWidth="400px">
                  <TextField
                    label="Custom query"
                    labelHidden
                    placeholder="e.g., What are the best running shoes online?"
                    value={customQuery}
                    onChange={setCustomQuery}
                    autoComplete="off"
                  />
                </Box>
                <Button
                  onClick={handleCustomCheck}
                  disabled={!customQuery.trim() || checking}
                  loading={checking}
                >
                  Test Query
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* History Table */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">Recent Checks</Text>
              <Divider />
              {history.length === 0 ? (
                <Box padding="400">
                  <BlockStack gap="200" inlineAlign="center">
                    <Text as="p" variant="headingMd">No checks yet</Text>
                    <Text as="p" tone="subdued">
                      See if AI assistants are talking about your store.
                    </Text>
                    <Box paddingBlockStart="200">
                      <Button variant="primary" onClick={() => runCheck()} loading={checking}>
                        Check Now
                      </Button>
                    </Box>
                  </BlockStack>
                </Box>
              ) : (
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text']}
                  headings={['Platform', 'Query', 'Result', 'Position', 'Date', 'AI Response']}
                  rows={tableRows}
                />
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Tips */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">How to Get More Mentions</Text>
              <Divider />
              <BlockStack gap="200">
                <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                  <InlineStack align="space-between" blockAlign="center" gap="400">
                    <InlineStack gap="200" blockAlign="start">
                      <Badge tone="info">1</Badge>
                      <BlockStack gap="100">
                        <Text as="p" fontWeight="semibold">Write detailed product descriptions</Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          AI learns from your content. Better descriptions = more recommendations.
                        </Text>
                      </BlockStack>
                    </InlineStack>
                    <Link href="/admin/optimize">
                      <Button>Optimize Products</Button>
                    </Link>
                  </InlineStack>
                </Box>
                <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                  <InlineStack align="space-between" blockAlign="center" gap="400">
                    <InlineStack gap="200" blockAlign="start">
                      <Badge tone="info">2</Badge>
                      <BlockStack gap="100">
                        <Text as="p" fontWeight="semibold">Be consistent with your brand name</Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          Use the same name everywhere so AI can recognize you.
                        </Text>
                      </BlockStack>
                    </InlineStack>
                    <Link href="/admin/settings">
                      <Button>Check Settings</Button>
                    </Link>
                  </InlineStack>
                </Box>
                <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                  <InlineStack align="space-between" blockAlign="center" gap="400">
                    <InlineStack gap="200" blockAlign="start">
                      <Badge tone="info">3</Badge>
                      <BlockStack gap="100">
                        <Text as="p" fontWeight="semibold">Set up AI tools</Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          Configure your llms.txt and JSON-LD to help AI understand your store.
                        </Text>
                      </BlockStack>
                    </InlineStack>
                    <Link href="/admin/tools">
                      <Button variant="primary">Configure Tools</Button>
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
            ? `${getPlatformIcon(selectedCheck.platform)} ${selectedCheck.platform.toUpperCase()} Response`
            : 'AI Response'
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
                    Query
                  </Text>
                  <Text as="p" fontWeight="semibold">
                    &quot;{selectedCheck.query}&quot;
                  </Text>
                </BlockStack>
              </Box>

              {/* Result Summary */}
              <InlineStack gap="300" align="start">
                <Box>
                  <BlockStack gap="100">
                    <Text as="span" variant="bodySm" tone="subdued">Status</Text>
                    {getQualityBadge(selectedCheck.responseQuality, selectedCheck.isMentioned)}
                  </BlockStack>
                </Box>
                {selectedCheck.position && (
                  <Box>
                    <BlockStack gap="100">
                      <Text as="span" variant="bodySm" tone="subdued">Position</Text>
                      <Badge tone="info">{`#${selectedCheck.position}`}</Badge>
                    </BlockStack>
                  </Box>
                )}
                {selectedCheck.competitorsFound && selectedCheck.competitorsFound.length > 0 && (
                  <Box>
                    <BlockStack gap="100">
                      <Text as="span" variant="bodySm" tone="subdued">Competitors Found</Text>
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
                      <Badge tone="success">Brand Mentioned</Badge>
                    </InlineStack>
                    <Text as="p" variant="bodySm">
                      &quot;...{selectedCheck.mentionContext}...&quot;
                    </Text>
                  </BlockStack>
                </Box>
              )}

              <Divider />

              {/* Full AI Response */}
              <BlockStack gap="200">
                <Text as="h4" variant="headingSm">
                  Full AI Response
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
                      {selectedCheck.rawResponse || 'No response available'}
                    </Text>
                  </Scrollable>
                </Box>
              </BlockStack>

              {/* Timestamp */}
              <Text as="p" variant="bodySm" tone="subdued">
                Checked on {new Date(selectedCheck.checkedAt).toLocaleString()}
              </Text>
            </BlockStack>
          )}
        </Modal.Section>
      </Modal>
    </Page>
  );
}
