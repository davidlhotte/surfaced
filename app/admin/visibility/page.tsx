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
} from '@shopify/polaris';
import Link from 'next/link';

type VisibilityCheck = {
  id: string;
  platform: string;
  query: string;
  isMentioned: boolean;
  mentionContext: string | null;
  position: number | null;
  competitorsFound: { name: string; url?: string }[];
  responseQuality: string | null;
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
  const [history, setHistory] = useState<VisibilityCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<VisibilityResult | null>(null);
  const [customQuery, setCustomQuery] = useState('');

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/visibility');
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
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const runCheck = async (queries?: string[]) => {
    try {
      setChecking(true);
      setError(null);
      const response = await fetch('/api/visibility', {
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

  // Calculate summary stats
  const mentionedCount = history.filter((c) => c.isMentioned).length;
  const totalChecks = history.length;
  const mentionRate = totalChecks > 0 ? Math.round((mentionedCount / totalChecks) * 100) : 0;

  if (loading) {
    return (
      <Page title="AI Visibility Check" backAction={{ content: 'Dashboard', url: '/admin' }}>
        <Layout>
          <Layout.Section>
            <Card>
              <Box padding="800">
                <InlineStack align="center" blockAlign="center">
                  <Spinner size="large" />
                  <Text as="p">Loading visibility data...</Text>
                </InlineStack>
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
  ]);

  return (
    <Page
      title="AI Visibility Check"
      backAction={{ content: 'Dashboard', url: '/admin' }}
      primaryAction={{
        content: 'Run Check',
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
              <Text as="h3" variant="headingMd">Custom Query Check</Text>
              <Divider />
              <Text as="p" tone="subdued">
                Test a specific query to see if ChatGPT mentions your brand.
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
              <Text as="h3" variant="headingMd">Check History</Text>
              <Divider />
              {history.length === 0 ? (
                <Box padding="400">
                  <BlockStack gap="200" inlineAlign="center">
                    <Text as="p" tone="subdued">
                      No visibility checks yet.
                    </Text>
                    <Button onClick={() => runCheck()} loading={checking}>
                      Run Your First Check
                    </Button>
                  </BlockStack>
                </Box>
              ) : (
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text', 'text']}
                  headings={['Platform', 'Query', 'Result', 'Position', 'Date']}
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
              <Text as="h3" variant="headingMd">How to Improve AI Visibility</Text>
              <Divider />
              <BlockStack gap="200">
                <Box padding="200" background="bg-surface-secondary" borderRadius="200">
                  <InlineStack gap="200" blockAlign="start">
                    <Badge tone="info">1</Badge>
                    <BlockStack gap="100">
                      <Text as="p" fontWeight="semibold">Write detailed product descriptions</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        AI models learn from your content. Rich descriptions = better recommendations.
                      </Text>
                    </BlockStack>
                  </InlineStack>
                </Box>
                <Box padding="200" background="bg-surface-secondary" borderRadius="200">
                  <InlineStack gap="200" blockAlign="start">
                    <Badge tone="info">2</Badge>
                    <BlockStack gap="100">
                      <Text as="p" fontWeight="semibold">Use clear brand identity</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Consistent brand name across your store helps AI recognize you.
                      </Text>
                    </BlockStack>
                  </InlineStack>
                </Box>
                <Box padding="200" background="bg-surface-secondary" borderRadius="200">
                  <InlineStack gap="200" blockAlign="start">
                    <Badge tone="info">3</Badge>
                    <BlockStack gap="100">
                      <Text as="p" fontWeight="semibold">Enable llms.txt</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        <Link href="/admin/llms-txt">Configure llms.txt</Link> to help AI crawlers understand your store.
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
