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
  ProgressBar,
  Badge,
  Spinner,
  Banner,
  Divider,
  Icon,
} from '@shopify/polaris';
import {
  RefreshIcon,
  SearchIcon,
  TargetIcon,
  ChartVerticalFilledIcon,
} from '@shopify/polaris-icons';
import Link from 'next/link';

type DashboardData = {
  shop: {
    name: string;
    domain: string;
    plan: string;
    productsCount: number;
    aiScore: number | null;
    lastAuditAt: string | null;
  };
  audit: {
    totalProducts: number;
    auditedProducts: number;
    averageScore: number;
    issues: {
      critical: number;
      warning: number;
      info: number;
    };
  };
  visibility: {
    lastCheck: string | null;
    mentionedCount: number;
    totalChecks: number;
    platforms: {
      name: string;
      mentioned: boolean;
      lastCheck: string | null;
    }[];
  };
  competitors: {
    tracked: number;
    limit: number;
    topCompetitor: string | null;
  };
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [auditing, setAuditing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard');
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const runAudit = async () => {
    try {
      setAuditing(true);
      const response = await fetch('/api/audit', { method: 'POST' });
      if (!response.ok) throw new Error('Audit failed');
      await fetchDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Audit failed');
    } finally {
      setAuditing(false);
    }
  };

  const getScoreColor = (score: number): "success" | "highlight" | "critical" => {
    if (score >= 70) return 'success';
    if (score >= 40) return 'highlight';
    return 'critical';
  };

  const getScoreTone = (score: number): "success" | "warning" | "critical" => {
    if (score >= 70) return 'success';
    if (score >= 40) return 'warning';
    return 'critical';
  };

  if (loading) {
    return (
      <Page title="Dashboard">
        <Layout>
          <Layout.Section>
            <Card>
              <Box padding="800">
                <InlineStack align="center" blockAlign="center">
                  <Spinner size="large" />
                  <Text as="p">Loading your AI visibility data...</Text>
                </InlineStack>
              </Box>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="Dashboard">
        <Layout>
          <Layout.Section>
            <Banner tone="critical" title="Error loading dashboard">
              <p>{error}</p>
              <Box paddingBlockStart="200">
                <Button onClick={fetchDashboard}>Try again</Button>
              </Box>
            </Banner>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  const aiScore = data?.shop.aiScore ?? 0;
  const auditScore = data?.audit.averageScore ?? 0;

  return (
    <Page title="AI Visibility Dashboard">
      <Layout>
        {/* AI Readiness Score - Hero Section */}
        <Layout.Section>
          <Card>
            <Box padding="600">
              <BlockStack gap="600">
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="200">
                    <Text as="h2" variant="headingXl">
                      AI Readiness Score
                    </Text>
                    <Text as="p" tone="subdued">
                      How well your store is optimized for AI search engines
                    </Text>
                  </BlockStack>
                  <Button
                    icon={RefreshIcon}
                    onClick={runAudit}
                    loading={auditing}
                  >
                    Run Audit
                  </Button>
                </InlineStack>

                <InlineStack gap="800" align="start" blockAlign="center">
                  {/* Big Score Circle */}
                  <Box
                    background={aiScore >= 70 ? "bg-fill-success" : aiScore >= 40 ? "bg-fill-warning" : "bg-fill-critical"}
                    padding="800"
                    borderRadius="full"
                    minWidth="140px"
                  >
                    <BlockStack gap="100" inlineAlign="center">
                      <Text as="p" variant="heading3xl" fontWeight="bold" tone="text-inverse">
                        {aiScore}
                      </Text>
                      <Text as="p" variant="bodySm" tone="text-inverse">
                        / 100
                      </Text>
                    </BlockStack>
                  </Box>

                  {/* Score Breakdown */}
                  <BlockStack gap="400" align="start">
                    <InlineStack gap="400">
                      <Badge tone={getScoreTone(aiScore)}>
                        {aiScore >= 70 ? 'Good' : aiScore >= 40 ? 'Needs Work' : 'Critical'}
                      </Badge>
                      {data?.shop.lastAuditAt && (
                        <Text as="p" variant="bodySm" tone="subdued">
                          Last audit: {new Date(data.shop.lastAuditAt).toLocaleDateString()}
                        </Text>
                      )}
                    </InlineStack>

                    <BlockStack gap="200">
                      <Text as="p" variant="bodyMd">
                        {data?.audit.auditedProducts} of {data?.audit.totalProducts} products audited
                      </Text>
                      <Box width="300px">
                        <ProgressBar
                          progress={auditScore}
                          tone={getScoreColor(auditScore)}
                          size="small"
                        />
                      </Box>
                    </BlockStack>

                    {/* Issues Summary */}
                    <InlineStack gap="300">
                      {data?.audit.issues.critical && data.audit.issues.critical > 0 && (
                        <Badge tone="critical">{`${data.audit.issues.critical} Critical`}</Badge>
                      )}
                      {data?.audit.issues.warning && data.audit.issues.warning > 0 && (
                        <Badge tone="warning">{`${data.audit.issues.warning} Warnings`}</Badge>
                      )}
                      {data?.audit.issues.info && data.audit.issues.info > 0 && (
                        <Badge tone="info">{`${data.audit.issues.info} Tips`}</Badge>
                      )}
                    </InlineStack>
                  </BlockStack>
                </InlineStack>
              </BlockStack>
            </Box>
          </Card>
        </Layout.Section>

        {/* Quick Stats */}
        <Layout.Section>
          <InlineStack gap="400" align="start">
            {/* Visibility Status */}
            <Box minWidth="280px">
              <Card>
                <BlockStack gap="400">
                  <InlineStack gap="200" blockAlign="center">
                    <Icon source={SearchIcon} tone="base" />
                    <Text as="h3" variant="headingMd">AI Visibility</Text>
                  </InlineStack>
                  <Divider />
                  <BlockStack gap="300">
                    <InlineStack align="space-between">
                      <Text as="p" tone="subdued">ChatGPT</Text>
                      <Badge tone={data?.visibility.platforms.find(p => p.name === 'chatgpt')?.mentioned ? 'success' : 'critical'}>
                        {data?.visibility.platforms.find(p => p.name === 'chatgpt')?.mentioned ? 'Visible' : 'Not Found'}
                      </Badge>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="p" tone="subdued">Perplexity</Text>
                      <Badge tone={data?.visibility.platforms.find(p => p.name === 'perplexity')?.mentioned ? 'success' : 'attention'}>
                        {data?.visibility.platforms.find(p => p.name === 'perplexity')?.mentioned ? 'Visible' : 'Not Checked'}
                      </Badge>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="p" tone="subdued">Checks this month</Text>
                      <Text as="p" fontWeight="semibold">{data?.visibility.totalChecks ?? 0}</Text>
                    </InlineStack>
                  </BlockStack>
                  <Link href="/admin/visibility">
                    <Button fullWidth>Run Visibility Check</Button>
                  </Link>
                </BlockStack>
              </Card>
            </Box>

            {/* Competitor Status */}
            <Box minWidth="280px">
              <Card>
                <BlockStack gap="400">
                  <InlineStack gap="200" blockAlign="center">
                    <Icon source={TargetIcon} tone="base" />
                    <Text as="h3" variant="headingMd">Competitors</Text>
                  </InlineStack>
                  <Divider />
                  <BlockStack gap="300">
                    <InlineStack align="space-between">
                      <Text as="p" tone="subdued">Tracked</Text>
                      <Text as="p" fontWeight="semibold">
                        {data?.competitors.tracked ?? 0} / {data?.competitors.limit ?? 3}
                      </Text>
                    </InlineStack>
                    {data?.competitors.topCompetitor && (
                      <InlineStack align="space-between">
                        <Text as="p" tone="subdued">Top competitor</Text>
                        <Text as="p" fontWeight="semibold">{data.competitors.topCompetitor}</Text>
                      </InlineStack>
                    )}
                    <Box paddingBlockStart="200">
                      <Banner tone="warning">
                        <Text as="p" variant="bodySm">
                          Track competitors to see where they appear instead of you
                        </Text>
                      </Banner>
                    </Box>
                  </BlockStack>
                  <Link href="/admin/competitors">
                    <Button fullWidth>Manage Competitors</Button>
                  </Link>
                </BlockStack>
              </Card>
            </Box>

            {/* Quick Actions */}
            <Box minWidth="280px">
              <Card>
                <BlockStack gap="400">
                  <InlineStack gap="200" blockAlign="center">
                    <Icon source={ChartVerticalFilledIcon} tone="base" />
                    <Text as="h3" variant="headingMd">Quick Actions</Text>
                  </InlineStack>
                  <Divider />
                  <BlockStack gap="300">
                    <Link href="/admin/audit">
                      <Button fullWidth variant="secondary">View Audit Details</Button>
                    </Link>
                    <Link href="/admin/llms-txt">
                      <Button fullWidth variant="secondary">Configure llms.txt</Button>
                    </Link>
                    <Link href="/admin/settings">
                      <Button fullWidth variant="secondary">Settings</Button>
                    </Link>
                  </BlockStack>
                </BlockStack>
              </Card>
            </Box>
          </InlineStack>
        </Layout.Section>

        {/* Recommendations */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">Top Recommendations</Text>
              <Divider />
              <BlockStack gap="300">
                {(!data?.audit.auditedProducts || data.audit.auditedProducts === 0) ? (
                  <Banner tone="info">
                    <BlockStack gap="200">
                      <Text as="p" fontWeight="semibold">Run your first audit</Text>
                      <Text as="p" variant="bodySm">
                        Click "Run Audit" to scan your products and get personalized recommendations.
                      </Text>
                    </BlockStack>
                  </Banner>
                ) : (
                  <>
                    {data?.audit.issues.critical && data.audit.issues.critical > 0 && (
                      <Box padding="300" background="bg-surface-critical" borderRadius="200">
                        <InlineStack gap="300" blockAlign="start">
                          <Badge tone="critical">Critical</Badge>
                          <BlockStack gap="100">
                            <Text as="p" fontWeight="semibold">
                              {data.audit.issues.critical} products have critical issues
                            </Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                              Missing descriptions or images prevent AI from recommending your products.
                            </Text>
                          </BlockStack>
                        </InlineStack>
                      </Box>
                    )}
                    {data?.audit.issues.warning && data.audit.issues.warning > 0 && (
                      <Box padding="300" background="bg-surface-warning" borderRadius="200">
                        <InlineStack gap="300" blockAlign="start">
                          <Badge tone="warning">Warning</Badge>
                          <BlockStack gap="100">
                            <Text as="p" fontWeight="semibold">
                              {data.audit.issues.warning} products need improvement
                            </Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                              Short descriptions or missing metafields reduce your AI visibility.
                            </Text>
                          </BlockStack>
                        </InlineStack>
                      </Box>
                    )}
                    {data?.visibility.mentionedCount === 0 && (
                      <Box padding="300" background="bg-surface-info" borderRadius="200">
                        <InlineStack gap="300" blockAlign="start">
                          <Badge tone="info">Tip</Badge>
                          <BlockStack gap="100">
                            <Text as="p" fontWeight="semibold">
                              Check your AI visibility
                            </Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                              Run a visibility check to see if ChatGPT mentions your brand.
                            </Text>
                          </BlockStack>
                        </InlineStack>
                      </Box>
                    )}
                  </>
                )}
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
