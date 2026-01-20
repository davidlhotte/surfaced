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
  Divider,
} from '@shopify/polaris';
import {
  CheckCircleIcon,
  AlertTriangleIcon,
  SettingsIcon,
  QuestionCircleIcon,
  ProductIcon,
  ViewIcon,
  TargetIcon,
  ReplayIcon,
  CodeIcon,
  ChartVerticalFilledIcon,
  StarFilledIcon,
} from '@shopify/polaris-icons';
import Link from 'next/link';
import { useAuthenticatedFetch, useShopContext } from '@/components/providers/ShopProvider';
import { NotAuthenticated } from '@/components/admin/NotAuthenticated';
import { useAdminLanguage } from '@/lib/i18n/AdminLanguageContext';

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
  const { t, locale } = useAdminLanguage();

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authFetch('/api/dashboard');

      if (!response.ok) {
        throw new Error(locale === 'fr' ? 'Impossible de charger vos données' : 'Unable to load your data');
      }

      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error || (locale === 'fr' ? 'Une erreur est survenue' : 'An error occurred'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : (locale === 'fr' ? 'Impossible de charger vos données' : 'Unable to load your data'));
    } finally {
      setLoading(false);
    }
  }, [authFetch, locale]);

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
      if (!response.ok) throw new Error(locale === 'fr' ? 'Analyse échouée' : 'Analysis failed');
      await fetchDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : (locale === 'fr' ? 'Analyse échouée' : 'Analysis failed'));
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
      <Page title={t.dashboard.title}>
        <Layout>
          <Layout.Section>
            <Card>
              <Box padding="800">
                <BlockStack gap="400" inlineAlign="center">
                  <Spinner size="large" />
                  <Text as="p" variant="bodyLg">
                    {shopLoading ? t.common.connectingStore : t.common.loadingDashboard}
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
      <Page title={t.dashboard.title}>
        <Layout>
          <Layout.Section>
            <Banner tone="critical" title={t.common.error}>
              <BlockStack gap="300">
                <Text as="p">{error}</Text>
                <Button onClick={fetchDashboard}>{t.common.retry}</Button>
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
  const mentionRate = data?.visibility.totalChecks ? Math.round((data.visibility.mentionedCount / data.visibility.totalChecks) * 100) : 0;

  // Score interpretation
  const getScoreInfo = (s: number) => {
    if (s >= 80) return { text: t.dashboard.scoreExcellent, tone: 'success' as const, color: '#108043', emoji: '🌟' };
    if (s >= 60) return { text: t.dashboard.scoreGood, tone: 'success' as const, color: '#108043', emoji: '👍' };
    if (s >= 40) return { text: t.dashboard.scoreNeedsWork, tone: 'warning' as const, color: '#B98900', emoji: '⚠️' };
    return { text: t.dashboard.scoreUrgent, tone: 'critical' as const, color: '#D82C0D', emoji: '🚨' };
  };

  const scoreInfo = getScoreInfo(score);

  // Feature cards with clear value propositions
  const featureCards = [
    {
      title: t.features.products.title,
      subtitle: t.features.products.subtitle,
      description: t.features.products.description,
      icon: ProductIcon,
      href: '/admin/products',
      gradient: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)',
      stat: hasAnalyzed ? `${data?.audit.auditedProducts} ${t.features.products.analyzed}` : t.common.notAnalyzed,
      statTone: hasAnalyzed ? (criticalCount > 0 ? 'critical' : 'success') : 'subdued',
    },
    {
      title: t.features.visibility.title,
      subtitle: t.features.visibility.subtitle,
      description: t.features.visibility.description,
      icon: ViewIcon,
      href: '/admin/visibility',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      stat: data?.visibility.totalChecks ? `${mentionRate}% ${t.features.visibility.mentions}` : t.features.visibility.noTest,
      statTone: mentionRate > 50 ? 'success' : mentionRate > 20 ? 'warning' : 'subdued',
    },
    {
      title: t.features.competitors.title,
      subtitle: t.features.competitors.subtitle,
      description: t.features.competitors.description,
      icon: TargetIcon,
      href: '/admin/competitors',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      stat: data?.competitors.tracked ? `${data.competitors.tracked} ${t.features.competitors.tracked}` : t.features.competitors.noTracking,
      statTone: data?.competitors.tracked ? 'success' : 'subdued',
    },
    {
      title: t.features.abTests.title,
      subtitle: t.features.abTests.subtitle,
      description: t.features.abTests.description,
      icon: ReplayIcon,
      href: '/admin/ab-tests',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      stat: t.features.abTests.experiment,
      statTone: 'subdued',
    },
    {
      title: t.features.insights.title,
      subtitle: t.features.insights.subtitle,
      description: t.features.insights.description,
      icon: ChartVerticalFilledIcon,
      href: '/admin/insights',
      gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
      stat: t.features.insights.dashboards,
      statTone: 'subdued',
    },
    {
      title: t.features.tools.title,
      subtitle: t.features.tools.subtitle,
      description: t.features.tools.description,
      icon: CodeIcon,
      href: '/admin/tools',
      gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      stat: t.common.configure,
      statTone: 'subdued',
    },
  ];

  return (
    <Page
      title={`${t.dashboard.hello}${data?.shop.name ? `, ${data.shop.name}` : ''}!`}
      secondaryActions={[
        {
          content: t.common.settings,
          icon: SettingsIcon,
          url: '/admin/settings',
        },
        {
          content: t.common.help,
          icon: QuestionCircleIcon,
          url: '/help',
        },
      ]}
    >
      <BlockStack gap="600">
        {/* Welcome Banner - Only for new users */}
        {!hasAnalyzed && (
          <Card>
            <Box
              padding="500"
              background="bg-surface-info"
              borderRadius="300"
            >
              <BlockStack gap="400">
                <InlineStack gap="300" blockAlign="center">
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                    }}
                  >
                    🚀
                  </div>
                  <BlockStack gap="100">
                    <Text as="h2" variant="headingLg">{t.dashboard.welcome}</Text>
                    <Text as="p" tone="subdued">
                      {t.dashboard.welcomeSubtitle}
                    </Text>
                  </BlockStack>
                </InlineStack>

                <Box
                  padding="400"
                  background="bg-surface"
                  borderRadius="200"
                >
                  <BlockStack gap="300">
                    <Text as="h3" variant="headingSm">💡 {t.dashboard.howItWorks}</Text>
                    <BlockStack gap="200">
                      <InlineStack gap="200" blockAlign="center">
                        <Badge tone="info">1</Badge>
                        <Text as="p" variant="bodyMd">
                          <strong>{t.dashboard.step1}</strong> {t.dashboard.step1Desc}
                        </Text>
                      </InlineStack>
                      <InlineStack gap="200" blockAlign="center">
                        <Badge tone="info">2</Badge>
                        <Text as="p" variant="bodyMd">
                          <strong>{t.dashboard.step2}</strong> {t.dashboard.step2Desc}
                        </Text>
                      </InlineStack>
                      <InlineStack gap="200" blockAlign="center">
                        <Badge tone="info">3</Badge>
                        <Text as="p" variant="bodyMd">
                          <strong>{t.dashboard.step3}</strong> {t.dashboard.step3Desc}
                        </Text>
                      </InlineStack>
                    </BlockStack>
                  </BlockStack>
                </Box>

                <Button variant="primary" onClick={runAudit} loading={auditing} size="large">
                  {t.dashboard.firstAnalysis}
                </Button>
              </BlockStack>
            </Box>
          </Card>
        )}

        {/* AI Score Card - For returning users */}
        {hasAnalyzed && (
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <BlockStack gap="100">
                  <InlineStack gap="200" blockAlign="center">
                    <Text as="h2" variant="headingMd">{t.dashboard.aiScore}</Text>
                    <Badge tone={scoreInfo.tone}>{scoreInfo.text}</Badge>
                  </InlineStack>
                  <Text as="p" tone="subdued">
                    {t.dashboard.scoreDescription}
                  </Text>
                </BlockStack>
                {data?.shop.lastAuditAt && (
                  <Text as="span" variant="bodySm" tone="subdued">
                    {t.dashboard.updatedOn} {new Date(data.shop.lastAuditAt).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}
                  </Text>
                )}
              </InlineStack>

              <InlineStack gap="600" align="start" blockAlign="center" wrap>
                {/* Score circle */}
                <div style={{
                  width: '140px',
                  height: '140px',
                  borderRadius: '50%',
                  background: `conic-gradient(${scoreInfo.color} ${score * 3.6}deg, #E4E5E7 0deg)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <div style={{
                    width: '115px',
                    height: '115px',
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: '14px' }}>{scoreInfo.emoji}</span>
                    <span style={{ fontSize: '36px', fontWeight: 700, color: scoreInfo.color }}>
                      {score}
                    </span>
                    <span style={{ fontSize: '12px', color: '#6D7175' }}>/ 100</span>
                  </div>
                </div>

                {/* Score breakdown */}
                <BlockStack gap="300">
                  <Text as="p" variant="bodyMd">
                    <strong>{data?.audit.auditedProducts}</strong> {t.dashboard.productsAnalyzed}
                  </Text>

                  {criticalCount > 0 && (
                    <Box padding="200" background="bg-surface-critical" borderRadius="200">
                      <InlineStack gap="200" blockAlign="center">
                        <Icon source={AlertTriangleIcon} tone="critical" />
                        <Text as="span" variant="bodySm">
                          <strong>{criticalCount}</strong> {t.dashboard.needsUrgentAttention}
                        </Text>
                      </InlineStack>
                    </Box>
                  )}

                  {warningCount > 0 && criticalCount === 0 && (
                    <Box padding="200" background="bg-surface-warning" borderRadius="200">
                      <InlineStack gap="200" blockAlign="center">
                        <Icon source={AlertTriangleIcon} tone="warning" />
                        <Text as="span" variant="bodySm">
                          <strong>{warningCount}</strong> {t.dashboard.canBeImproved}
                        </Text>
                      </InlineStack>
                    </Box>
                  )}

                  {criticalCount === 0 && warningCount === 0 && (
                    <Box padding="200" background="bg-surface-success" borderRadius="200">
                      <InlineStack gap="200" blockAlign="center">
                        <Icon source={CheckCircleIcon} tone="success" />
                        <Text as="span" variant="bodySm" tone="success">
                          {t.dashboard.allOptimized}
                        </Text>
                      </InlineStack>
                    </Box>
                  )}

                  <InlineStack gap="200">
                    <Link href="/admin/products">
                      <Button variant={criticalCount > 0 ? 'primary' : 'secondary'}>
                        {criticalCount > 0 ? t.dashboard.fixIssues : t.dashboard.viewProducts}
                      </Button>
                    </Link>
                    <Button onClick={runAudit} loading={auditing}>
                      {t.dashboard.rerunAnalysis}
                    </Button>
                  </InlineStack>
                </BlockStack>
              </InlineStack>
            </BlockStack>
          </Card>
        )}

        {/* Quick Stats - Only for returning users */}
        {hasAnalyzed && (
          <InlineStack gap="400" wrap>
            <Box minWidth="200px" maxWidth="300px">
              <Card>
                <BlockStack gap="200">
                  <InlineStack gap="200" blockAlign="center">
                    <Icon source={ViewIcon} tone="base" />
                    <Text as="h3" variant="headingSm">{t.dashboard.aiVisibility}</Text>
                  </InlineStack>
                  <Text as="p" variant="heading2xl" fontWeight="bold">
                    {mentionRate}%
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    {t.dashboard.mentionRate}
                  </Text>
                </BlockStack>
              </Card>
            </Box>
            <Box minWidth="200px" maxWidth="300px">
              <Card>
                <BlockStack gap="200">
                  <InlineStack gap="200" blockAlign="center">
                    <Icon source={TargetIcon} tone="base" />
                    <Text as="h3" variant="headingSm">{t.dashboard.competitors}</Text>
                  </InlineStack>
                  <Text as="p" variant="heading2xl" fontWeight="bold">
                    {data?.competitors.tracked || 0}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    {t.dashboard.competitorsTracked}
                  </Text>
                </BlockStack>
              </Card>
            </Box>
            <Box minWidth="200px" maxWidth="300px">
              <Card>
                <BlockStack gap="200">
                  <InlineStack gap="200" blockAlign="center">
                    <Icon source={StarFilledIcon} tone="base" />
                    <Text as="h3" variant="headingSm">{t.dashboard.currentPlan}</Text>
                  </InlineStack>
                  <Text as="p" variant="heading2xl" fontWeight="bold">
                    {data?.shop.plan || 'FREE'}
                  </Text>
                  <Link href="/admin/settings">
                    <Text as="p" variant="bodySm" tone="subdued">
                      {t.dashboard.seeOptions}
                    </Text>
                  </Link>
                </BlockStack>
              </Card>
            </Box>
          </InlineStack>
        )}

        {/* Feature Cards */}
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">{t.dashboard.whatToDo}</Text>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px'
          }}>
            {featureCards.map((card) => (
              <Link key={card.title} href={card.href} style={{ textDecoration: 'none' }}>
                <Card>
                  <BlockStack gap="300">
                    <InlineStack gap="300" blockAlign="center">
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '10px',
                          background: card.gradient,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon source={card.icon} tone="base" />
                      </div>
                      <BlockStack gap="050">
                        <Text as="h3" variant="headingMd">{card.title}</Text>
                        <Text as="p" variant="bodySm" tone="subdued">{card.subtitle}</Text>
                      </BlockStack>
                    </InlineStack>

                    <Text as="p" variant="bodySm" tone="subdued">
                      {card.description}
                    </Text>

                    <Divider />

                    <InlineStack align="space-between" blockAlign="center">
                      <Badge tone={card.statTone as 'success' | 'warning' | 'critical' | undefined}>
                        {card.stat}
                      </Badge>
                      <Button variant="plain">{t.common.open} →</Button>
                    </InlineStack>
                  </BlockStack>
                </Card>
              </Link>
            ))}
          </div>
        </BlockStack>

        {/* Tips - Only if needed */}
        {hasAnalyzed && score < 70 && (
          <Card>
            <BlockStack gap="400">
              <InlineStack gap="200" blockAlign="center">
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                  }}
                >
                  💡
                </div>
                <Text as="h3" variant="headingMd">{t.dashboard.tipsTitle}</Text>
              </InlineStack>

              <Divider />

              <BlockStack gap="300">
                {criticalCount > 0 && (
                  <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                    <InlineStack align="space-between" blockAlign="center" gap="400">
                      <BlockStack gap="100">
                        <Text as="p" fontWeight="semibold">{t.dashboard.tip1Title}</Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          {t.dashboard.tip1Desc}
                        </Text>
                      </BlockStack>
                      <Link href="/admin/products">
                        <Button size="slim">{t.dashboard.fix}</Button>
                      </Link>
                    </InlineStack>
                  </Box>
                )}

                {score < 60 && (
                  <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                    <InlineStack align="space-between" blockAlign="center" gap="400">
                      <BlockStack gap="100">
                        <Text as="p" fontWeight="semibold">{t.dashboard.tip2Title}</Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          {t.dashboard.tip2Desc}
                        </Text>
                      </BlockStack>
                      <Link href="/admin/products">
                        <Button size="slim">{t.dashboard.optimize}</Button>
                      </Link>
                    </InlineStack>
                  </Box>
                )}

                <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                  <InlineStack align="space-between" blockAlign="center" gap="400">
                    <BlockStack gap="100">
                      <Text as="p" fontWeight="semibold">{t.dashboard.tip3Title}</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        {t.dashboard.tip3Desc}
                      </Text>
                    </BlockStack>
                    <Link href="/admin/tools">
                      <Button size="slim" variant="primary">{t.common.configure}</Button>
                    </Link>
                  </InlineStack>
                </Box>
              </BlockStack>
            </BlockStack>
          </Card>
        )}
      </BlockStack>
    </Page>
  );
}
