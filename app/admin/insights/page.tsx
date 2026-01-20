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
  Banner,
  SkeletonBodyText,
  Box,
  Divider,
  Checkbox,
  ProgressBar,
  Select,
  Tabs,
} from '@shopify/polaris';
import {
  RefreshIcon,
  AlertTriangleIcon,
} from '@shopify/polaris-icons';
import Link from 'next/link';
import { useAuthenticatedFetch } from '@/components/providers/ShopProvider';
import { useAdminLanguage } from '@/lib/i18n/AdminLanguageContext';

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

interface Alert {
  id: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: string;
}

interface AlertPreferences {
  emailAlerts: boolean;
  weeklyReport: boolean;
}

interface WeeklyReport {
  period: { start: string; end: string };
  metrics: {
    aiScore: number;
    scoreChange: number;
    productsAudited: number;
    criticalIssues: number;
    visibilityChecks: number;
    mentionRate: number;
  };
  topIssues: { code: string; count: number }[];
  recommendations: string[];
}

export default function InsightsPage() {
  const { fetch } = useAuthenticatedFetch();
  const { t, locale } = useAdminLanguage();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [period, setPeriod] = useState<TimePeriod>('30d');

  // ROI state
  const [metrics, setMetrics] = useState<ROIMetrics | null>(null);

  // Alerts state
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [preferences, setPreferences] = useState<AlertPreferences | null>(null);
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [roiResponse, alertsResponse] = await Promise.all([
        fetch(`/api/roi?period=${period}`),
        fetch('/api/alerts?report=true'),
      ]);

      // Load ROI data
      const roiData = await roiResponse.json();
      if (roiData.success) {
        setMetrics(roiData.data.metrics);
      }

      // Load alerts data
      const alertsData = await alertsResponse.json();
      if (alertsData.success) {
        setAlerts(alertsData.data.alerts);
        setPreferences(alertsData.data.preferences);
        setReport(alertsData.data.report);
        setEmailAlerts(alertsData.data.preferences?.emailAlerts ?? true);
        setWeeklyReport(alertsData.data.preferences?.weeklyReport ?? true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t.insights.errorLoadingData);
    } finally {
      setLoading(false);
    }
  }, [fetch, period, t.insights.errorLoadingData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailAlerts, weeklyReport }),
      });

      const data = await response.json();
      if (data.success) {
        setPreferences(data.data.preferences);
      } else {
        setError(data.error || t.insights.errorSaving);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t.insights.errorSaving);
    } finally {
      setSaving(false);
    }
  };

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

  const getPriorityBadge = (priority: Alert['priority']) => {
    const tones: Record<Alert['priority'], 'critical' | 'warning' | 'info' | 'success'> = {
      critical: 'critical',
      high: 'warning',
      medium: 'info',
      low: 'success',
    };
    const labels: Record<Alert['priority'], string> = {
      critical: t.insights.priorityUrgent,
      high: t.insights.priorityImportant,
      medium: t.insights.priorityInfo,
      low: t.insights.priorityTip,
    };
    return <Badge tone={tones[priority]}>{labels[priority]}</Badge>;
  };

  const getIssueLabel = (code: string): string => {
    const labels: Record<string, string> = {
      NO_DESCRIPTION: t.insights.issueNoDescription,
      SHORT_DESCRIPTION: t.insights.issueShortDescription,
      BRIEF_DESCRIPTION: t.insights.issueBriefDescription,
      NO_IMAGES: t.insights.issueNoImages,
      MISSING_ALT_TEXT: t.insights.issueMissingAltText,
      NO_SEO_TITLE: t.insights.issueNoSeoTitle,
      NO_SEO_DESCRIPTION: t.insights.issueNoSeoDescription,
      NO_PRODUCT_TYPE: t.insights.issueNoProductType,
      NO_TAGS: t.insights.issueNoTags,
      NO_METAFIELDS: t.insights.issueNoMetafields,
      NO_VENDOR: t.insights.issueNoVendor,
    };
    return labels[code] || code;
  };

  const periodOptions = [
    { label: t.insights.last7Days, value: '7d' },
    { label: t.insights.last30Days, value: '30d' },
    { label: t.insights.last90Days, value: '90d' },
    { label: t.insights.thisYear, value: '365d' },
  ];

  if (loading) {
    return (
      <Page title={t.insights.title} backAction={{ content: t.insights.home, url: '/admin' }}>
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

  const tabs = [
    { id: 'progress', content: t.insights.tabProgress },
    { id: 'alerts', content: `${t.insights.tabAlerts} (${alerts.length})` },
    { id: 'report', content: t.insights.tabReport },
  ];

  const hasAlerts = alerts.length > 0;
  const criticalAlerts = alerts.filter(a => a.priority === 'critical' || a.priority === 'high');

  return (
    <Page
      title={t.insights.title}
      subtitle={t.insights.subtitle}
      backAction={{ content: t.insights.home, url: '/admin' }}
      secondaryActions={[
        {
          content: t.insights.refresh,
          icon: RefreshIcon,
          onAction: loadData,
        },
      ]}
    >
      <Layout>
        {error && (
          <Layout.Section>
            <Banner tone="critical" onDismiss={() => setError(null)}>
              {error}
            </Banner>
          </Layout.Section>
        )}

        {/* Alert Banner if there are critical alerts */}
        {criticalAlerts.length > 0 && selectedTab !== 1 && (
          <Layout.Section>
            <Banner
              tone="warning"
              title={`${t.insights.youHaveImportantAlerts} ${criticalAlerts.length} ${criticalAlerts.length > 1 ? t.insights.importantAlerts : t.insights.importantAlert}`}
              action={{ content: t.insights.viewAlerts, onAction: () => setSelectedTab(1) }}
            >
              {criticalAlerts[0].message}
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
              <Box paddingBlockStart="400">
                {/* Progress Tab */}
                {selectedTab === 0 && (
                  <BlockStack gap="600">
                    {/* Period Selector */}
                    <InlineStack align="space-between" blockAlign="center">
                      <Text as="h2" variant="headingMd">{t.insights.yourAiProgress}</Text>
                      <Box minWidth="150px">
                        <Select
                          label={t.insights.period}
                          labelHidden
                          options={periodOptions}
                          value={period}
                          onChange={(value) => setPeriod(value as TimePeriod)}
                        />
                      </Box>
                    </InlineStack>

                    {/* Key Metrics */}
                    <InlineStack gap="400" align="start" wrap>
                      {/* Current Score */}
                      <Box minWidth="180px">
                        <Card>
                          <BlockStack gap="200">
                            <Text as="h3" variant="bodySm" tone="subdued">{t.insights.aiScore}</Text>
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
                      <Box minWidth="180px">
                        <Card>
                          <BlockStack gap="200">
                            <Text as="h3" variant="bodySm" tone="subdued">{t.insights.mentionRate}</Text>
                            <Text as="p" variant="heading2xl" fontWeight="bold">
                              {metrics?.visibility.mentionRate ?? 0}%
                            </Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                              {metrics?.visibility.mentioned ?? 0} {t.insights.outOf} {metrics?.visibility.totalChecks ?? 0}
                            </Text>
                          </BlockStack>
                        </Card>
                      </Box>

                      {/* Products Improved */}
                      <Box minWidth="180px">
                        <Card>
                          <BlockStack gap="200">
                            <Text as="h3" variant="bodySm" tone="subdued">{t.insights.productsImproved}</Text>
                            <Text as="p" variant="heading2xl" fontWeight="bold">
                              {metrics?.productsImproved ?? 0}
                            </Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                              {t.insights.outOf} {metrics?.totalProducts ?? 0} {t.insights.total}
                            </Text>
                          </BlockStack>
                        </Card>
                      </Box>

                      {/* AI Optimizations */}
                      <Box minWidth="180px">
                        <Card>
                          <BlockStack gap="200">
                            <Text as="h3" variant="bodySm" tone="subdued">{t.insights.aiSuggestionsUsed}</Text>
                            <Text as="p" variant="heading2xl" fontWeight="bold">
                              {metrics?.optimizationsUsed ?? 0}
                            </Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                              {t.insights.thisPeriod}
                            </Text>
                          </BlockStack>
                        </Card>
                      </Box>
                    </InlineStack>

                    <Divider />

                    {/* Next Steps - More actionable than vague impact metrics */}
                    <BlockStack gap="300">
                      <Text as="h3" variant="headingSm">{t.insights.recommendedActions}</Text>
                      <BlockStack gap="200">
                        {(metrics?.productsWithCriticalIssues ?? 0) > 0 && (
                          <Box padding="300" background="bg-surface-critical" borderRadius="200">
                            <InlineStack align="space-between" blockAlign="center" wrap>
                              <BlockStack gap="100">
                                <Text as="p" fontWeight="semibold">
                                  {metrics?.productsWithCriticalIssues} {(metrics?.productsWithCriticalIssues ?? 0) > 1 ? t.insights.productsNeedUrgentActionPlural : t.insights.productsNeedUrgentAction}
                                </Text>
                                <Text as="p" variant="bodySm" tone="subdued">
                                  {t.insights.missingContentHurtsVisibility}
                                </Text>
                              </BlockStack>
                              <Link href="/admin/products">
                                <Button variant="primary">{t.insights.fixNow}</Button>
                              </Link>
                            </InlineStack>
                          </Box>
                        )}

                        {(metrics?.visibility.totalChecks ?? 0) === 0 && (
                          <Box padding="300" background="bg-surface-warning" borderRadius="200">
                            <InlineStack align="space-between" blockAlign="center" wrap>
                              <BlockStack gap="100">
                                <Text as="p" fontWeight="semibold">
                                  {t.insights.checkIfAiMentionsYou}
                                </Text>
                                <Text as="p" variant="bodySm" tone="subdued">
                                  {t.insights.discoverWhichAiRecommends}
                                </Text>
                              </BlockStack>
                              <Link href="/admin/visibility">
                                <Button>{t.insights.checkMyVisibility}</Button>
                              </Link>
                            </InlineStack>
                          </Box>
                        )}

                        {(metrics?.currentScore ?? 0) < 70 && (
                          <Box padding="300" background="bg-surface-info" borderRadius="200">
                            <InlineStack align="space-between" blockAlign="center" wrap>
                              <BlockStack gap="100">
                                <Text as="p" fontWeight="semibold">
                                  {t.insights.improveProductContent}
                                </Text>
                                <Text as="p" variant="bodySm" tone="subdued">
                                  {t.insights.useAiToSuggestBetter}
                                </Text>
                              </BlockStack>
                              <Link href="/admin/products">
                                <Button>{t.insights.optimizeMyProducts}</Button>
                              </Link>
                            </InlineStack>
                          </Box>
                        )}

                        {(metrics?.currentScore ?? 0) >= 70 && (metrics?.productsWithCriticalIssues ?? 0) === 0 && (
                          <Box padding="300" background="bg-surface-success" borderRadius="200">
                            <BlockStack gap="100">
                              <Text as="p" fontWeight="semibold">
                                {t.insights.storeInGoodShape}
                              </Text>
                              <Text as="p" variant="bodySm" tone="subdued">
                                {t.insights.keepMonitoring}
                              </Text>
                            </BlockStack>
                          </Box>
                        )}
                      </BlockStack>
                    </BlockStack>

                    <Divider />

                    {/* Product Quality Distribution */}
                    <BlockStack gap="300">
                      <Text as="h3" variant="headingSm">{t.insights.productQualityDistribution}</Text>
                      <BlockStack gap="200">
                        <InlineStack align="space-between">
                          <InlineStack gap="200" blockAlign="center">
                            <Box width="12px" minHeight="12px" background="bg-fill-success" borderRadius="full" />
                            <Text as="p">{t.insights.excellent}</Text>
                          </InlineStack>
                          <Text as="p" fontWeight="semibold">{metrics?.scoreDistribution.excellent ?? 0}</Text>
                        </InlineStack>

                        <InlineStack align="space-between">
                          <InlineStack gap="200" blockAlign="center">
                            <Box width="12px" minHeight="12px" background="bg-fill-success" borderRadius="full" />
                            <Text as="p">{t.insights.good}</Text>
                          </InlineStack>
                          <Text as="p" fontWeight="semibold">{metrics?.scoreDistribution.good ?? 0}</Text>
                        </InlineStack>

                        <InlineStack align="space-between">
                          <InlineStack gap="200" blockAlign="center">
                            <Box width="12px" minHeight="12px" background="bg-fill-warning" borderRadius="full" />
                            <Text as="p">{t.insights.needsImprovement}</Text>
                          </InlineStack>
                          <Text as="p" fontWeight="semibold">{metrics?.scoreDistribution.needsWork ?? 0}</Text>
                        </InlineStack>

                        <InlineStack align="space-between">
                          <InlineStack gap="200" blockAlign="center">
                            <Box width="12px" minHeight="12px" background="bg-fill-critical" borderRadius="full" />
                            <Text as="p">{t.insights.urgent}</Text>
                          </InlineStack>
                          <Text as="p" fontWeight="semibold">{metrics?.scoreDistribution.critical ?? 0}</Text>
                        </InlineStack>
                      </BlockStack>
                    </BlockStack>

                    {/* Visibility by Platform */}
                    {metrics?.visibility.byPlatform && metrics.visibility.byPlatform.length > 0 && (
                      <>
                        <Divider />
                        <BlockStack gap="300">
                          <Text as="h3" variant="headingSm">{t.insights.whereYouAppear}</Text>
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
                              </BlockStack>
                            ))}
                          </BlockStack>
                        </BlockStack>
                      </>
                    )}
                  </BlockStack>
                )}

                {/* Alerts Tab */}
                {selectedTab === 1 && (
                  <BlockStack gap="600">
                    <InlineStack align="space-between" blockAlign="center">
                      <InlineStack gap="200" blockAlign="center">
                        <AlertTriangleIcon />
                        <Text as="h2" variant="headingMd">{t.insights.activeAlerts}</Text>
                      </InlineStack>
                      <Badge>{String(alerts.length)}</Badge>
                    </InlineStack>

                    <Divider />

                    {!hasAlerts ? (
                      <Box padding="600">
                        <BlockStack gap="200" inlineAlign="center">
                          <Text as="p" variant="headingMd" tone="success">{t.insights.allGood}</Text>
                          <Text as="p" tone="subdued">
                            {t.insights.noProblemsDetected}
                          </Text>
                        </BlockStack>
                      </Box>
                    ) : (
                      <BlockStack gap="300">
                        {alerts.map((alert) => (
                          <Box
                            key={alert.id}
                            padding="400"
                            background={
                              alert.priority === 'critical'
                                ? 'bg-surface-critical'
                                : alert.priority === 'high'
                                ? 'bg-surface-warning'
                                : 'bg-surface-secondary'
                            }
                            borderRadius="200"
                          >
                            <BlockStack gap="200">
                              <InlineStack align="space-between" blockAlign="center">
                                <Text as="p" fontWeight="semibold">{alert.title}</Text>
                                {getPriorityBadge(alert.priority)}
                              </InlineStack>
                              <Text as="p" tone="subdued" variant="bodySm">
                                {alert.message}
                              </Text>
                              {alert.actionUrl && (
                                <Box paddingBlockStart="200">
                                  <Link href={alert.actionUrl}>
                                    <Button size="slim">{alert.actionLabel || t.insights.fix}</Button>
                                  </Link>
                                </Box>
                              )}
                            </BlockStack>
                          </Box>
                        ))}
                      </BlockStack>
                    )}

                    <Divider />

                    {/* Notification Preferences */}
                    <BlockStack gap="300">
                      <Text as="h3" variant="headingSm">{t.insights.notificationSettings}</Text>
                      <BlockStack gap="200">
                        <Checkbox
                          label={t.insights.emailForImportantIssues}
                          helpText={t.insights.emailForImportantIssuesHelp}
                          checked={emailAlerts}
                          onChange={setEmailAlerts}
                        />
                        <Checkbox
                          label={t.insights.sendWeeklySummary}
                          helpText={t.insights.sendWeeklySummaryHelp}
                          checked={weeklyReport}
                          onChange={setWeeklyReport}
                        />
                      </BlockStack>
                      <Box>
                        <Button
                          onClick={handleSavePreferences}
                          loading={saving}
                          disabled={
                            preferences?.emailAlerts === emailAlerts &&
                            preferences?.weeklyReport === weeklyReport
                          }
                        >
                          {t.insights.save}
                        </Button>
                      </Box>
                    </BlockStack>
                  </BlockStack>
                )}

                {/* Weekly Report Tab */}
                {selectedTab === 2 && (
                  <BlockStack gap="600">
                    <Text as="h2" variant="headingMd">
                      {t.insights.weeklySummary}
                    </Text>
                    {report && (
                      <Text as="p" tone="subdued" variant="bodySm">
                        {t.insights.fromTo} {new Date(report.period.start).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')} {t.insights.to} {new Date(report.period.end).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}
                      </Text>
                    )}

                    <Divider />

                    {!report ? (
                      <Box padding="600">
                        <BlockStack gap="200" inlineAlign="center">
                          <Text as="p" tone="subdued">
                            {t.insights.noReportYet}
                          </Text>
                        </BlockStack>
                      </Box>
                    ) : (
                      <>
                        {/* Report Metrics */}
                        <InlineStack gap="400" align="start" wrap>
                          <Box minWidth="140px">
                            <Card>
                              <BlockStack gap="100">
                                <Text as="p" variant="bodySm" tone="subdued">{t.insights.aiScore}</Text>
                                <InlineStack gap="100" blockAlign="center">
                                  <Text as="p" variant="headingLg" fontWeight="bold">
                                    {report.metrics.aiScore}
                                  </Text>
                                  {report.metrics.scoreChange !== 0 && (
                                    <Badge tone={report.metrics.scoreChange > 0 ? 'success' : 'critical'}>
                                      {(report.metrics.scoreChange > 0 ? '+' : '') + report.metrics.scoreChange}
                                    </Badge>
                                  )}
                                </InlineStack>
                              </BlockStack>
                            </Card>
                          </Box>

                          <Box minWidth="140px">
                            <Card>
                              <BlockStack gap="100">
                                <Text as="p" variant="bodySm" tone="subdued">{t.insights.products}</Text>
                                <Text as="p" variant="headingLg" fontWeight="bold">
                                  {report.metrics.productsAudited}
                                </Text>
                              </BlockStack>
                            </Card>
                          </Box>

                          <Box minWidth="140px">
                            <Card>
                              <BlockStack gap="100">
                                <Text as="p" variant="bodySm" tone="subdued">{t.insights.issues}</Text>
                                <Text as="p" variant="headingLg" fontWeight="bold" tone={report.metrics.criticalIssues > 0 ? 'critical' : undefined}>
                                  {report.metrics.criticalIssues}
                                </Text>
                              </BlockStack>
                            </Card>
                          </Box>

                          <Box minWidth="140px">
                            <Card>
                              <BlockStack gap="100">
                                <Text as="p" variant="bodySm" tone="subdued">{t.insights.mentionRate}</Text>
                                <Text as="p" variant="headingLg" fontWeight="bold">
                                  {Math.round(report.metrics.mentionRate)}%
                                </Text>
                              </BlockStack>
                            </Card>
                          </Box>
                        </InlineStack>

                        {/* Top Issues */}
                        {report.topIssues.length > 0 && (
                          <>
                            <Divider />
                            <BlockStack gap="300">
                              <Text as="h3" variant="headingSm">{t.insights.mostFrequentIssues}</Text>
                              <BlockStack gap="200">
                                {report.topIssues.map((issue) => (
                                  <InlineStack key={issue.code} align="space-between">
                                    <Text as="p">{getIssueLabel(issue.code)}</Text>
                                    <Badge>{`${issue.count} ${t.insights.products.toLowerCase()}`}</Badge>
                                  </InlineStack>
                                ))}
                              </BlockStack>
                            </BlockStack>
                          </>
                        )}

                        {/* Recommendations */}
                        {report.recommendations.length > 0 && (
                          <>
                            <Divider />
                            <BlockStack gap="300">
                              <Text as="h3" variant="headingSm">{t.insights.suggestedNextSteps}</Text>
                              <BlockStack gap="200">
                                {report.recommendations.map((rec, index) => (
                                  <Box key={index} padding="300" background="bg-surface-info" borderRadius="200">
                                    <Text as="p" variant="bodySm">{rec}</Text>
                                  </Box>
                                ))}
                              </BlockStack>
                            </BlockStack>
                          </>
                        )}
                      </>
                    )}
                  </BlockStack>
                )}
              </Box>
            </Tabs>
          </Card>
        </Layout.Section>

        {/* Quick Tips with Action Buttons */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">{t.insights.howToImprove}</Text>
              <Divider />
              <BlockStack gap="300">
                <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                  <InlineStack align="space-between" blockAlign="center" gap="400" wrap>
                    <BlockStack gap="100">
                      <Text as="p" fontWeight="semibold">{t.insights.checkProductsRegularly}</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        {t.insights.checkProductsRegularlyDesc}
                      </Text>
                    </BlockStack>
                    <Link href="/admin/products">
                      <Button>{t.insights.viewProducts}</Button>
                    </Link>
                  </InlineStack>
                </Box>
                <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                  <InlineStack align="space-between" blockAlign="center" gap="400" wrap>
                    <BlockStack gap="100">
                      <Text as="p" fontWeight="semibold">{t.insights.useAiSuggestions}</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        {t.insights.useAiSuggestionsDesc}
                      </Text>
                    </BlockStack>
                    <Link href="/admin/products">
                      <Button>{t.insights.optimizeNow}</Button>
                    </Link>
                  </InlineStack>
                </Box>
                <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                  <InlineStack align="space-between" blockAlign="center" gap="400" wrap>
                    <BlockStack gap="100">
                      <Text as="p" fontWeight="semibold">{t.insights.monitorVisibility}</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        {t.insights.monitorVisibilityDesc}
                      </Text>
                    </BlockStack>
                    <Link href="/admin/visibility">
                      <Button>{t.insights.checkVisibility}</Button>
                    </Link>
                  </InlineStack>
                </Box>
                <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                  <InlineStack align="space-between" blockAlign="center" gap="400" wrap>
                    <BlockStack gap="100">
                      <Text as="p" fontWeight="semibold">{t.insights.configureAiTools}</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        {t.insights.configureAiToolsDesc}
                      </Text>
                    </BlockStack>
                    <Link href="/admin/tools">
                      <Button variant="primary">{t.insights.configureTools}</Button>
                    </Link>
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
