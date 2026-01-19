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
  Icon,
  Tooltip,
} from '@shopify/polaris';
import {
  CheckCircleIcon,
  AlertTriangleIcon,
  ChartVerticalFilledIcon,
  SettingsIcon,
  QuestionCircleIcon,
  ProductIcon,
  ViewIcon,
  TargetIcon,
  ReplayIcon,
  CodeIcon,
} from '@shopify/polaris-icons';
import Link from 'next/link';
import { useAuthenticatedFetch, useShopContext } from '@/components/providers/ShopProvider';
import { ResponsiveGrid } from '@/components/admin/ResponsiveGrid';
import { NotAuthenticated } from '@/components/admin/NotAuthenticated';

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
  const { isLoading: shopLoading, error: shopError, isAuthenticated, shopDetectionFailed } = useShopContext();

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

  // Show authentication error if shop detection failed
  if (shopDetectionFailed) {
    return <NotAuthenticated error={shopError} />;
  }

  // Loading state
  if (loading || shopLoading) {
    return (
      <Page title="Home">
        <Layout>
          <Layout.Section>
            <Card>
              <Box padding="800">
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

  // Error state
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

  // Score interpretation
  const getScoreInfo = (s: number) => {
    if (s >= 80) return { text: 'Excellent', tone: 'success' as const, color: '#108043' };
    if (s >= 60) return { text: 'Good', tone: 'success' as const, color: '#108043' };
    if (s >= 40) return { text: 'Needs work', tone: 'warning' as const, color: '#B98900' };
    return { text: 'Needs attention', tone: 'critical' as const, color: '#D82C0D' };
  };

  const scoreInfo = getScoreInfo(score);

  // Determine next action
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

  // Quick access cards data
  const quickAccessCards = [
    {
      title: 'Products',
      description: 'Analyze, optimize and apply AI improvements',
      icon: ProductIcon,
      href: '/admin/products',
      color: 'bg-fill-info',
    },
    {
      title: 'Visibility',
      description: 'See where AI mentions your brand',
      icon: ViewIcon,
      href: '/admin/visibility',
      color: 'bg-fill-warning',
    },
    {
      title: 'Competitors',
      description: 'Compare your AI presence to rivals',
      icon: TargetIcon,
      href: '/admin/competitors',
      color: 'bg-fill-critical',
    },
    {
      title: 'A/B Testing',
      description: 'Test content variations with AI',
      icon: ReplayIcon,
      href: '/admin/ab-tests',
      color: 'bg-fill-transparent',
    },
    {
      title: 'Insights',
      description: 'Track your progress and ROI',
      icon: ChartVerticalFilledIcon,
      href: '/admin/insights',
      color: 'bg-fill-magic',
    },
    {
      title: 'AI Tools',
      description: 'llms.txt and JSON-LD generators',
      icon: CodeIcon,
      href: '/admin/tools',
      color: 'bg-fill-success',
    },
  ];

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
      <BlockStack gap="500">
        {/* Hero: AI Score */}
        <Card>
          <Box padding="500">
            <BlockStack gap="400">
              <InlineStack gap="200" blockAlign="center">
                <Text as="h2" variant="headingMd">Your AI Score</Text>
                <Tooltip content="How likely AI assistants are to recommend your products">
                  <Icon source={QuestionCircleIcon} tone="subdued" />
                </Tooltip>
              </InlineStack>

              {hasAnalyzed ? (
                <InlineStack gap="600" align="start" blockAlign="center" wrap>
                  {/* Score circle */}
                  <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: `conic-gradient(${scoreInfo.color} ${score * 3.6}deg, #E4E5E7 0deg)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <div style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: '32px', fontWeight: 700, color: scoreInfo.color }}>
                        {score}
                      </span>
                      <span style={{ fontSize: '12px', color: '#6D7175' }}>/ 100</span>
                    </div>
                  </div>

                  {/* Score details */}
                  <BlockStack gap="300">
                    <InlineStack gap="200" blockAlign="center">
                      <Badge tone={scoreInfo.tone}>{scoreInfo.text}</Badge>
                      {data?.shop.lastAuditAt && (
                        <Text as="span" variant="bodySm" tone="subdued">
                          Updated {new Date(data.shop.lastAuditAt).toLocaleDateString()}
                        </Text>
                      )}
                    </InlineStack>

                    <BlockStack gap="100">
                      <Text as="p" variant="bodySm">
                        <strong>{data?.audit.auditedProducts}</strong> products analyzed
                      </Text>
                      {criticalCount > 0 && (
                        <InlineStack gap="100" blockAlign="center">
                          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#D82C0D' }} />
                          <Text as="span" variant="bodySm">{criticalCount} need urgent fixes</Text>
                        </InlineStack>
                      )}
                      {warningCount > 0 && (
                        <InlineStack gap="100" blockAlign="center">
                          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#B98900' }} />
                          <Text as="span" variant="bodySm">{warningCount} can be improved</Text>
                        </InlineStack>
                      )}
                      {criticalCount === 0 && warningCount === 0 && (
                        <InlineStack gap="100" blockAlign="center">
                          <Icon source={CheckCircleIcon} tone="success" />
                          <Text as="span" variant="bodySm" tone="success">All products look good!</Text>
                        </InlineStack>
                      )}
                    </BlockStack>
                  </BlockStack>
                </InlineStack>
              ) : (
                <BlockStack gap="300">
                  <Text as="p" variant="heading3xl" fontWeight="bold" tone="subdued">--</Text>
                  <Text as="p" tone="subdued">Analyze your products to get your score</Text>
                </BlockStack>
              )}
            </BlockStack>
          </Box>
        </Card>

        {/* Next Action CTA */}
        <Card>
          <Box
            padding="400"
            background={criticalCount > 0 ? 'bg-surface-warning' : 'bg-surface-secondary'}
            borderRadius="300"
          >
            <InlineStack align="space-between" blockAlign="center" gap="400" wrap>
              <BlockStack gap="100">
                <InlineStack gap="200" blockAlign="center">
                  {criticalCount > 0 && <Icon source={AlertTriangleIcon} tone="warning" />}
                  <Text as="h3" variant="headingMd">{nextAction.title}</Text>
                </InlineStack>
                <Text as="p" tone="subdued">{nextAction.description}</Text>
              </BlockStack>
              {'action' in nextAction ? (
                <Button variant="primary" onClick={nextAction.action} loading={nextAction.loading}>
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

        {/* Quick Access Grid - Responsive */}
        <ResponsiveGrid columns={{ xs: 1, sm: 2, md: 3, lg: 4 }} gap="base">
          {quickAccessCards.map((card) => (
            <Card key={card.title}>
              <BlockStack gap="300">
                <InlineStack gap="200" blockAlign="center">
                  <Box padding="200" background={card.color as 'bg-fill-info'} borderRadius="200">
                    <Icon source={card.icon} tone="base" />
                  </Box>
                  <Text as="h3" variant="headingMd">{card.title}</Text>
                </InlineStack>
                <Text as="p" variant="bodySm" tone="subdued">{card.description}</Text>
                <Link href={card.href}>
                  <Button fullWidth>View {card.title}</Button>
                </Link>
              </BlockStack>
            </Card>
          ))}
        </ResponsiveGrid>

        {/* Tips - Only if needed */}
        {hasAnalyzed && score < 80 && (
          <Card>
            <BlockStack gap="300">
              <Text as="h3" variant="headingMd">Quick Tips</Text>
              <BlockStack gap="200">
                {score < 60 && (
                  <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                    <Text as="p" variant="bodySm">
                      <strong>Add detailed descriptions</strong> — AI needs text to understand your products. Aim for 150+ words.
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
                    <strong>Use specific keywords</strong> — Include materials, sizes, colors, and use cases.
                  </Text>
                </Box>
              </BlockStack>
            </BlockStack>
          </Card>
        )}
      </BlockStack>
    </Page>
  );
}
