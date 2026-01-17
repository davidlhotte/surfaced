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
  Banner,
  SkeletonBodyText,
  Box,
  Divider,
  ProgressBar,
  Select,
} from '@shopify/polaris';
import {
  RefreshIcon,
  ChartVerticalFilledIcon,
} from '@shopify/polaris-icons';
import { useAuthenticatedFetch } from '@/components/providers/ShopProvider';

type TimePeriod = '7d' | '30d' | '90d' | '365d';

interface TrendDataPoint {
  date: string;
  value: number;
}

interface ScoreDistribution {
  excellent: number;
  good: number;
  needsWork: number;
  critical: number;
}

interface VisibilityMetrics {
  totalChecks: number;
  mentioned: number;
  mentionRate: number;
  byPlatform: {
    platform: string;
    checks: number;
    mentioned: number;
    rate: number;
  }[];
}

interface ROIMetrics {
  currentScore: number;
  scoreAtPeriodStart: number;
  scoreImprovement: number;
  scoreImprovementPercent: number;
  totalProducts: number;
  productsImproved: number;
  productsWithCriticalIssues: number;
  visibility: VisibilityMetrics;
  optimizationsUsed: number;
  scoreTrend: TrendDataPoint[];
  visibilityTrend: TrendDataPoint[];
  scoreDistribution: ScoreDistribution;
}

interface EstimatedROI {
  visibilityIncrease: string;
  potentialReachIncrease: string;
  qualityImprovement: string;
}

export default function ROIDashboardPage() {
  const { fetch } = useAuthenticatedFetch();

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<ROIMetrics | null>(null);
  const [estimatedROI, setEstimatedROI] = useState<EstimatedROI | null>(null);
  const [period, setPeriod] = useState<TimePeriod>('30d');
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/roi?period=${period}`);
      const data = await response.json();

      if (data.success) {
        setMetrics(data.data.metrics);
        setEstimatedROI(data.data.estimatedROI);
      } else {
        setError(data.error || 'Failed to load metrics');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [fetch, period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const periodOptions = [
    { label: 'Last 7 days', value: '7d' },
    { label: 'Last 30 days', value: '30d' },
    { label: 'Last 90 days', value: '90d' },
    { label: 'Last year', value: '365d' },
  ];

  const getScoreColor = (score: number): "success" | "highlight" | "critical" => {
    if (score >= 70) return 'success';
    if (score >= 40) return 'highlight';
    return 'critical';
  };

  const getPlatformLabel = (platform: string): string => {
    const labels: Record<string, string> = {
      chatgpt: 'ChatGPT',
      perplexity: 'Perplexity',
      gemini: 'Gemini',
      copilot: 'Copilot',
    };
    return labels[platform] || platform;
  };

  if (loading) {
    return (
      <Page title="ROI Dashboard" backAction={{ content: 'Dashboard', url: '/admin' }}>
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
      title="ROI Dashboard"
      subtitle="Track your AI visibility improvements and estimated impact"
      backAction={{ content: 'Dashboard', url: '/admin' }}
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
            <Banner tone="warning" onDismiss={() => setError(null)}>
              {error}
            </Banner>
          </Layout.Section>
        )}

        {/* Period Selector */}
        <Layout.Section>
          <Card>
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h2" variant="headingMd">Time Period</Text>
              <Box minWidth="150px">
                <Select
                  label="Period"
                  labelHidden
                  options={periodOptions}
                  value={period}
                  onChange={(value) => setPeriod(value as TimePeriod)}
                />
              </Box>
            </InlineStack>
          </Card>
        </Layout.Section>

        {/* Key Metrics */}
        <Layout.Section>
          <InlineStack gap="400" align="start">
            {/* Current Score */}
            <Box minWidth="200px">
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm" tone="subdued">AI Readiness Score</Text>
                  <InlineStack gap="200" blockAlign="center">
                    <Text as="p" variant="heading2xl" fontWeight="bold">
                      {metrics?.currentScore ?? 0}
                    </Text>
                    {metrics && metrics.scoreImprovement !== 0 && (
                      <Badge tone={metrics.scoreImprovement > 0 ? 'success' : 'critical'}>
                        {(metrics.scoreImprovement > 0 ? '+' : '') + metrics.scoreImprovement}
                      </Badge>
                    )}
                  </InlineStack>
                  <Box width="100%">
                    <ProgressBar
                      progress={metrics?.currentScore ?? 0}
                      tone={getScoreColor(metrics?.currentScore ?? 0)}
                      size="small"
                    />
                  </Box>
                </BlockStack>
              </Card>
            </Box>

            {/* Visibility Rate */}
            <Box minWidth="200px">
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm" tone="subdued">AI Mention Rate</Text>
                  <Text as="p" variant="heading2xl" fontWeight="bold">
                    {metrics?.visibility.mentionRate ?? 0}%
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    {metrics?.visibility.mentioned ?? 0} of {metrics?.visibility.totalChecks ?? 0} checks
                  </Text>
                </BlockStack>
              </Card>
            </Box>

            {/* Products Improved */}
            <Box minWidth="200px">
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm" tone="subdued">Products Improved</Text>
                  <Text as="p" variant="heading2xl" fontWeight="bold">
                    {metrics?.productsImproved ?? 0}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    of {metrics?.totalProducts ?? 0} total
                  </Text>
                </BlockStack>
              </Card>
            </Box>

            {/* AI Optimizations Used */}
            <Box minWidth="200px">
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm" tone="subdued">AI Optimizations</Text>
                  <Text as="p" variant="heading2xl" fontWeight="bold">
                    {metrics?.optimizationsUsed ?? 0}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    suggestions generated
                  </Text>
                </BlockStack>
              </Card>
            </Box>
          </InlineStack>
        </Layout.Section>

        {/* Estimated ROI */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack gap="200" blockAlign="center">
                <ChartVerticalFilledIcon />
                <Text as="h2" variant="headingMd">Estimated Impact</Text>
              </InlineStack>

              <Divider />

              <InlineStack gap="400" align="start">
                <Box minWidth="250px" padding="300" background="bg-surface-success" borderRadius="200">
                  <BlockStack gap="100">
                    <Text as="p" variant="bodySm" tone="subdued">Visibility vs. Average</Text>
                    <Text as="p" variant="headingMd" fontWeight="bold">
                      {estimatedROI?.visibilityIncrease ?? 'N/A'}
                    </Text>
                  </BlockStack>
                </Box>

                <Box minWidth="250px" padding="300" background="bg-surface-info" borderRadius="200">
                  <BlockStack gap="100">
                    <Text as="p" variant="bodySm" tone="subdued">Potential Reach</Text>
                    <Text as="p" variant="headingMd" fontWeight="bold">
                      {estimatedROI?.potentialReachIncrease ?? 'N/A'}
                    </Text>
                  </BlockStack>
                </Box>

                <Box minWidth="250px" padding="300" background="bg-surface-warning" borderRadius="200">
                  <BlockStack gap="100">
                    <Text as="p" variant="bodySm" tone="subdued">Product Quality</Text>
                    <Text as="p" variant="headingMd" fontWeight="bold">
                      {estimatedROI?.qualityImprovement ?? 'N/A'}
                    </Text>
                  </BlockStack>
                </Box>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Score Distribution */}
        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Product Score Distribution</Text>
              <Divider />

              <BlockStack gap="300">
                <InlineStack align="space-between">
                  <InlineStack gap="200" blockAlign="center">
                    <Badge tone="success">Excellent (90+)</Badge>
                  </InlineStack>
                  <Text as="p" fontWeight="semibold">{metrics?.scoreDistribution.excellent ?? 0}</Text>
                </InlineStack>

                <InlineStack align="space-between">
                  <InlineStack gap="200" blockAlign="center">
                    <Badge tone="success">Good (70-89)</Badge>
                  </InlineStack>
                  <Text as="p" fontWeight="semibold">{metrics?.scoreDistribution.good ?? 0}</Text>
                </InlineStack>

                <InlineStack align="space-between">
                  <InlineStack gap="200" blockAlign="center">
                    <Badge tone="warning">Needs Work (40-69)</Badge>
                  </InlineStack>
                  <Text as="p" fontWeight="semibold">{metrics?.scoreDistribution.needsWork ?? 0}</Text>
                </InlineStack>

                <InlineStack align="space-between">
                  <InlineStack gap="200" blockAlign="center">
                    <Badge tone="critical">Critical (&lt;40)</Badge>
                  </InlineStack>
                  <Text as="p" fontWeight="semibold">{metrics?.scoreDistribution.critical ?? 0}</Text>
                </InlineStack>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Visibility by Platform */}
        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Visibility by Platform</Text>
              <Divider />

              {metrics?.visibility.byPlatform && metrics.visibility.byPlatform.length > 0 ? (
                <BlockStack gap="300">
                  {metrics.visibility.byPlatform.map((platform) => (
                    <BlockStack key={platform.platform} gap="100">
                      <InlineStack align="space-between">
                        <Text as="p">{getPlatformLabel(platform.platform)}</Text>
                        <Badge tone={platform.rate >= 50 ? 'success' : platform.rate >= 30 ? 'warning' : 'critical'}>
                          {`${platform.rate}%`}
                        </Badge>
                      </InlineStack>
                      <Box width="100%">
                        <ProgressBar
                          progress={platform.rate}
                          tone={platform.rate >= 50 ? 'success' : platform.rate >= 30 ? 'highlight' : 'critical'}
                          size="small"
                        />
                      </Box>
                      <Text as="p" variant="bodySm" tone="subdued">
                        {platform.mentioned} of {platform.checks} checks
                      </Text>
                    </BlockStack>
                  ))}
                </BlockStack>
              ) : (
                <Box padding="300">
                  <Text as="p" tone="subdued" alignment="center">
                    No visibility checks in this period
                  </Text>
                </Box>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Score Trend */}
        {metrics?.scoreTrend && metrics.scoreTrend.length > 0 && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Score Trend</Text>
                <Divider />

                <BlockStack gap="200">
                  {metrics.scoreTrend.slice(-7).map((point, index) => (
                    <InlineStack key={index} align="space-between">
                      <Text as="p" tone="subdued">{new Date(point.date).toLocaleDateString()}</Text>
                      <InlineStack gap="200" blockAlign="center">
                        <Box width="100px">
                          <ProgressBar
                            progress={point.value}
                            tone={getScoreColor(point.value)}
                            size="small"
                          />
                        </Box>
                        <Text as="p" fontWeight="semibold">{point.value}</Text>
                      </InlineStack>
                    </InlineStack>
                  ))}
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

        {/* Tips */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">How to Improve Your ROI</Text>
              <Divider />

              <BlockStack gap="200">
                <Box padding="200" background="bg-surface-secondary" borderRadius="100">
                  <Text as="p" variant="bodySm">
                    <strong>Run regular audits</strong> - Monitor your AI score weekly to catch issues early
                  </Text>
                </Box>
                <Box padding="200" background="bg-surface-secondary" borderRadius="100">
                  <Text as="p" variant="bodySm">
                    <strong>Use AI optimization</strong> - Generate AI-powered content suggestions for low-scoring products
                  </Text>
                </Box>
                <Box padding="200" background="bg-surface-secondary" borderRadius="100">
                  <Text as="p" variant="bodySm">
                    <strong>Check visibility regularly</strong> - Run visibility checks across multiple AI platforms
                  </Text>
                </Box>
                <Box padding="200" background="bg-surface-secondary" borderRadius="100">
                  <Text as="p" variant="bodySm">
                    <strong>Enable llms.txt</strong> - Help AI crawlers understand your store better
                  </Text>
                </Box>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
