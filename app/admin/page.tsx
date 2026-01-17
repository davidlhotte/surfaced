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
  Icon,
  Tooltip,
} from '@shopify/polaris';
import {
  SearchIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ChartVerticalFilledIcon,
  SettingsIcon,
  QuestionCircleIcon,
} from '@shopify/polaris-icons';
import Link from 'next/link';
import { useAuthenticatedFetch, useShopContext } from '@/components/providers/ShopProvider';

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

  const { fetch: authFetch } = useAuthenticatedFetch();
  const { isLoading: shopLoading, error: shopError, isAuthenticated } = useShopContext();

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authFetch('/api/dashboard');

      if (!response.ok) {
        throw new Error('Unable to load your data');
      }

      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error || 'Something went wrong');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load your data');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (!shopLoading && isAuthenticated) {
      fetchDashboard();
    } else if (!shopLoading && shopError) {
      setError(shopError);
      setLoading(false);
    }
  }, [fetchDashboard, shopLoading, isAuthenticated, shopError]);

  const runAudit = async () => {
    try {
      setAuditing(true);
      const response = await authFetch('/api/audit', { method: 'POST' });
      if (!response.ok) throw new Error('Analysis failed');
      await fetchDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAuditing(false);
    }
  };

  // Loading state - friendly message
  if (loading || shopLoading) {
    return (
      <Page title="Home">
        <Layout>
          <Layout.Section>
            <Card>
              <Box padding="1000">
                <BlockStack gap="400" inlineAlign="center">
                  <Spinner size="large" />
                  <Text as="p" variant="bodyLg">
                    {shopLoading ? 'Connecting to your store...' : 'Loading your dashboard...'}
                  </Text>
                </BlockStack>
              </Box>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  // Error state - helpful message
  if (error) {
    return (
      <Page title="Home">
        <Layout>
          <Layout.Section>
            <Banner tone="critical" title="We hit a snag">
              <BlockStack gap="300">
                <Text as="p">{error}</Text>
                <Button onClick={fetchDashboard}>Try again</Button>
              </BlockStack>
            </Banner>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  const score = data?.shop.aiScore ?? 0;
  const hasAnalyzed = (data?.audit.auditedProducts ?? 0) > 0;
  const criticalCount = data?.audit.issues.critical ?? 0;
  const warningCount = data?.audit.issues.warning ?? 0;
  const totalIssues = criticalCount + warningCount;

  // Score interpretation in human terms
  const getScoreMessage = (s: number) => {
    if (s >= 80) return { text: 'Excellent', tone: 'success' as const, emoji: '🎉' };
    if (s >= 60) return { text: 'Good', tone: 'success' as const, emoji: '👍' };
    if (s >= 40) return { text: 'Needs work', tone: 'warning' as const, emoji: '🔧' };
    return { text: 'Needs attention', tone: 'critical' as const, emoji: '⚠️' };
  };

  const scoreInfo = getScoreMessage(score);

  // Determine the next best action for the user
  const getNextAction = () => {
    if (!hasAnalyzed) {
      return {
        title: 'Analyze your products',
        description: 'See how AI-ready your store is',
        action: runAudit,
        actionLabel: 'Start Analysis',
        loading: auditing,
      };
    }
    if (criticalCount > 0) {
      return {
        title: `Fix ${criticalCount} urgent ${criticalCount === 1 ? 'issue' : 'issues'}`,
        description: 'Products without descriptions or images are invisible to AI',
        href: '/admin/products',
        actionLabel: 'Fix Now',
      };
    }
    if (warningCount > 0) {
      return {
        title: `Improve ${warningCount} ${warningCount === 1 ? 'product' : 'products'}`,
        description: 'Small improvements can boost your visibility',
        href: '/admin/products',
        actionLabel: 'View Products',
      };
    }
    if ((data?.visibility.totalChecks ?? 0) === 0) {
      return {
        title: 'Check where you appear',
        description: 'See if AI assistants mention your brand',
        href: '/admin/visibility',
        actionLabel: 'Check Visibility',
      };
    }
    return {
      title: 'You\'re doing great!',
      description: 'Keep monitoring your AI visibility',
      href: '/admin/insights',
      actionLabel: 'View Insights',
    };
  };

  const nextAction = getNextAction();

  return (
    <Page
      title={`Welcome${data?.shop.name ? `, ${data.shop.name}` : ''}`}
      secondaryActions={[
        {
          content: 'Settings',
          icon: SettingsIcon,
          url: '/admin/settings',
        },
      ]}
    >
      <Layout>
        {/* Hero: Your Score */}
        <Layout.Section>
          <Card>
            <Box padding="600">
              <BlockStack gap="600">
                {/* Score Display */}
                <InlineStack gap="600" align="space-between" blockAlign="start" wrap={false}>
                  <BlockStack gap="300">
                    <InlineStack gap="200" blockAlign="center">
                      <Text as="h2" variant="headingLg">
                        Your AI Score
                      </Text>
                      <Tooltip content="How likely AI assistants are to recommend your products">
                        <Icon source={QuestionCircleIcon} tone="subdued" />
                      </Tooltip>
                    </InlineStack>

                    {hasAnalyzed ? (
                      <BlockStack gap="200">
                        <InlineStack gap="300" blockAlign="center">
                          <Text as="p" variant="heading3xl" fontWeight="bold">
                            {score}
                          </Text>
                          <Badge tone={scoreInfo.tone}>{scoreInfo.text}</Badge>
                        </InlineStack>
                        <Box width="250px">
                          <ProgressBar
                            progress={score}
                            tone={score >= 60 ? 'success' : score >= 40 ? 'highlight' : 'critical'}
                            size="small"
                          />
                        </Box>
                        {data?.shop.lastAuditAt && (
                          <Text as="p" variant="bodySm" tone="subdued">
                            Last checked {new Date(data.shop.lastAuditAt).toLocaleDateString()}
                          </Text>
                        )}
                      </BlockStack>
                    ) : (
                      <BlockStack gap="200">
                        <Text as="p" variant="heading3xl" fontWeight="bold" tone="subdued">
                          --
                        </Text>
                        <Text as="p" tone="subdued">
                          Analyze your products to get your score
                        </Text>
                      </BlockStack>
                    )}
                  </BlockStack>

                  {/* Score Breakdown */}
                  {hasAnalyzed && (
                    <Box minWidth="200px">
                      <BlockStack gap="200">
                        <Text as="p" variant="bodySm" fontWeight="semibold">
                          {data?.audit.auditedProducts} products analyzed
                        </Text>
                        {totalIssues > 0 ? (
                          <BlockStack gap="100">
                            {criticalCount > 0 && (
                              <InlineStack gap="200" blockAlign="center">
                                <Box width="8px" minHeight="8px" background="bg-fill-critical" borderRadius="full" />
                                <Text as="p" variant="bodySm">{criticalCount} need urgent fixes</Text>
                              </InlineStack>
                            )}
                            {warningCount > 0 && (
                              <InlineStack gap="200" blockAlign="center">
                                <Box width="8px" minHeight="8px" background="bg-fill-warning" borderRadius="full" />
                                <Text as="p" variant="bodySm">{warningCount} can be improved</Text>
                              </InlineStack>
                            )}
                          </BlockStack>
                        ) : (
                          <InlineStack gap="200" blockAlign="center">
                            <Icon source={CheckCircleIcon} tone="success" />
                            <Text as="p" variant="bodySm" tone="success">All products look good!</Text>
                          </InlineStack>
                        )}
                      </BlockStack>
                    </Box>
                  )}
                </InlineStack>
              </BlockStack>
            </Box>
          </Card>
        </Layout.Section>

        {/* Next Action - The ONE thing to do */}
        <Layout.Section>
          <Card>
            <Box padding="500" background={criticalCount > 0 ? 'bg-surface-warning' : 'bg-surface-secondary'}>
              <InlineStack align="space-between" blockAlign="center" gap="400">
                <BlockStack gap="100">
                  <InlineStack gap="200" blockAlign="center">
                    {criticalCount > 0 && <Icon source={AlertTriangleIcon} tone="warning" />}
                    <Text as="h3" variant="headingMd">{nextAction.title}</Text>
                  </InlineStack>
                  <Text as="p" tone="subdued">{nextAction.description}</Text>
                </BlockStack>
                {'action' in nextAction ? (
                  <Button
                    variant="primary"
                    onClick={nextAction.action}
                    loading={nextAction.loading}
                  >
                    {nextAction.actionLabel}
                  </Button>
                ) : (
                  <Link href={nextAction.href}>
                    <Button variant="primary">{nextAction.actionLabel}</Button>
                  </Link>
                )}
              </InlineStack>
            </Box>
          </Card>
        </Layout.Section>

        {/* Quick Access - Simplified to 4 key areas */}
        <Layout.Section>
          <InlineStack gap="400" align="start">
            {/* Products */}
            <Box minWidth="220px">
              <Card>
                <BlockStack gap="300">
                  <InlineStack gap="200" blockAlign="center">
                    <Box padding="200" background="bg-fill-info" borderRadius="200">
                      <Icon source={SearchIcon} tone="base" />
                    </Box>
                    <Text as="h3" variant="headingMd">Products</Text>
                  </InlineStack>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Analyze and improve your product content
                  </Text>
                  <Link href="/admin/products">
                    <Button fullWidth>View Products</Button>
                  </Link>
                </BlockStack>
              </Card>
            </Box>

            {/* Visibility */}
            <Box minWidth="220px">
              <Card>
                <BlockStack gap="300">
                  <InlineStack gap="200" blockAlign="center">
                    <Box padding="200" background="bg-fill-success" borderRadius="200">
                      <Icon source={CheckCircleIcon} tone="base" />
                    </Box>
                    <Text as="h3" variant="headingMd">Visibility</Text>
                  </InlineStack>
                  <Text as="p" variant="bodySm" tone="subdued">
                    See where AI mentions your brand
                  </Text>
                  <Link href="/admin/visibility">
                    <Button fullWidth>Check Now</Button>
                  </Link>
                </BlockStack>
              </Card>
            </Box>

            {/* Tools */}
            <Box minWidth="220px">
              <Card>
                <BlockStack gap="300">
                  <InlineStack gap="200" blockAlign="center">
                    <Box padding="200" background="bg-fill-warning" borderRadius="200">
                      <Icon source={SettingsIcon} tone="base" />
                    </Box>
                    <Text as="h3" variant="headingMd">Tools</Text>
                  </InlineStack>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Help AI crawlers understand your store
                  </Text>
                  <Link href="/admin/tools">
                    <Button fullWidth>Open Tools</Button>
                  </Link>
                </BlockStack>
              </Card>
            </Box>

            {/* Insights */}
            <Box minWidth="220px">
              <Card>
                <BlockStack gap="300">
                  <InlineStack gap="200" blockAlign="center">
                    <Box padding="200" background="bg-fill-magic" borderRadius="200">
                      <Icon source={ChartVerticalFilledIcon} tone="base" />
                    </Box>
                    <Text as="h3" variant="headingMd">Insights</Text>
                  </InlineStack>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Track your progress and ROI
                  </Text>
                  <Link href="/admin/insights">
                    <Button fullWidth>View Insights</Button>
                  </Link>
                </BlockStack>
              </Card>
            </Box>
          </InlineStack>
        </Layout.Section>

        {/* Tips - Only show if relevant */}
        {hasAnalyzed && score < 80 && (
          <Layout.Section>
            <Card>
              <BlockStack gap="300">
                <Text as="h3" variant="headingMd">Quick Tips</Text>
                <BlockStack gap="200">
                  {score < 60 && (
                    <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                      <Text as="p" variant="bodySm">
                        <strong>Add detailed descriptions</strong> — AI needs text to understand your products. Aim for 150+ words per product.
                      </Text>
                    </Box>
                  )}
                  {criticalCount > 0 && (
                    <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                      <Text as="p" variant="bodySm">
                        <strong>Upload product images</strong> — Products without images are rarely recommended by AI.
                      </Text>
                    </Box>
                  )}
                  <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                    <Text as="p" variant="bodySm">
                      <strong>Use specific keywords</strong> — Include materials, sizes, colors, and use cases in your descriptions.
                    </Text>
                  </Box>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}
