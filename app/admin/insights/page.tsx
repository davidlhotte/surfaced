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
  ChartVerticalFilledIcon,
  AlertTriangleIcon,
} from '@shopify/polaris-icons';
import Link from 'next/link';
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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [period, setPeriod] = useState<TimePeriod>('30d');

  // ROI state
  const [metrics, setMetrics] = useState<ROIMetrics | null>(null);
  const [estimatedROI, setEstimatedROI] = useState<EstimatedROI | null>(null);

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
        setEstimatedROI(roiData.data.estimatedROI);
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
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [fetch, period]);

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
        setError(data.error || 'Failed to save');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
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
      critical: 'Urgent',
      high: 'Important',
      medium: 'Info',
      low: 'Tip',
    };
    return <Badge tone={tones[priority]}>{labels[priority]}</Badge>;
  };

  const getIssueLabel = (code: string): string => {
    const labels: Record<string, string> = {
      NO_DESCRIPTION: 'Missing description',
      SHORT_DESCRIPTION: 'Short description',
      BRIEF_DESCRIPTION: 'Brief description',
      NO_IMAGES: 'Missing images',
      MISSING_ALT_TEXT: 'Missing image descriptions',
      NO_SEO_TITLE: 'Missing page title',
      NO_SEO_DESCRIPTION: 'Missing page description',
      NO_PRODUCT_TYPE: 'Missing product type',
      NO_TAGS: 'Missing tags',
      NO_METAFIELDS: 'Missing details',
      NO_VENDOR: 'Missing brand',
    };
    return labels[code] || code;
  };

  const periodOptions = [
    { label: 'Last 7 days', value: '7d' },
    { label: 'Last 30 days', value: '30d' },
    { label: 'Last 90 days', value: '90d' },
    { label: 'Last year', value: '365d' },
  ];

  if (loading) {
    return (
      <Page title="Insights" backAction={{ content: 'Home', url: '/admin' }}>
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
    { id: 'progress', content: 'Your Progress' },
    { id: 'alerts', content: `Alerts (${alerts.length})` },
    { id: 'report', content: 'Weekly Report' },
  ];

  const hasAlerts = alerts.length > 0;
  const criticalAlerts = alerts.filter(a => a.priority === 'critical' || a.priority === 'high');

  return (
    <Page
      title="Insights"
      subtitle="Track your progress and stay informed"
      backAction={{ content: 'Home', url: '/admin' }}
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
              title={`You have ${criticalAlerts.length} important ${criticalAlerts.length === 1 ? 'alert' : 'alerts'}`}
              action={{ content: 'View Alerts', onAction: () => setSelectedTab(1) }}
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
                      <Text as="h2" variant="headingMd">Your AI Visibility Progress</Text>
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

                    {/* Key Metrics */}
                    <InlineStack gap="400" align="start">
                      {/* Current Score */}
                      <Box minWidth="180px">
                        <Card>
                          <BlockStack gap="200">
                            <Text as="h3" variant="bodySm" tone="subdued">Your AI Score</Text>
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
                            <Text as="h3" variant="bodySm" tone="subdued">AI Mention Rate</Text>
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
                      <Box minWidth="180px">
                        <Card>
                          <BlockStack gap="200">
                            <Text as="h3" variant="bodySm" tone="subdued">Products Improved</Text>
                            <Text as="p" variant="heading2xl" fontWeight="bold">
                              {metrics?.productsImproved ?? 0}
                            </Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                              of {metrics?.totalProducts ?? 0} total
                            </Text>
                          </BlockStack>
                        </Card>
                      </Box>

                      {/* AI Optimizations */}
                      <Box minWidth="180px">
                        <Card>
                          <BlockStack gap="200">
                            <Text as="h3" variant="bodySm" tone="subdued">AI Suggestions Used</Text>
                            <Text as="p" variant="heading2xl" fontWeight="bold">
                              {metrics?.optimizationsUsed ?? 0}
                            </Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                              this period
                            </Text>
                          </BlockStack>
                        </Card>
                      </Box>
                    </InlineStack>

                    <Divider />

                    {/* Estimated Impact */}
                    <BlockStack gap="300">
                      <InlineStack gap="200" blockAlign="center">
                        <ChartVerticalFilledIcon />
                        <Text as="h3" variant="headingSm">Your Impact</Text>
                      </InlineStack>

                      <InlineStack gap="400" align="start">
                        <Box minWidth="200px" padding="300" background="bg-surface-success" borderRadius="200">
                          <BlockStack gap="100">
                            <Text as="p" variant="bodySm" tone="subdued">vs. Average Store</Text>
                            <Text as="p" variant="headingSm" fontWeight="bold">
                              {estimatedROI?.visibilityIncrease ?? 'N/A'}
                            </Text>
                          </BlockStack>
                        </Box>

                        <Box minWidth="200px" padding="300" background="bg-surface-info" borderRadius="200">
                          <BlockStack gap="100">
                            <Text as="p" variant="bodySm" tone="subdued">AI Recommendations</Text>
                            <Text as="p" variant="headingSm" fontWeight="bold">
                              {estimatedROI?.potentialReachIncrease ?? 'N/A'}
                            </Text>
                          </BlockStack>
                        </Box>

                        <Box minWidth="200px" padding="300" background="bg-surface-warning" borderRadius="200">
                          <BlockStack gap="100">
                            <Text as="p" variant="bodySm" tone="subdued">Product Quality</Text>
                            <Text as="p" variant="headingSm" fontWeight="bold">
                              {estimatedROI?.qualityImprovement ?? 'N/A'}
                            </Text>
                          </BlockStack>
                        </Box>
                      </InlineStack>
                    </BlockStack>

                    <Divider />

                    {/* Product Quality Distribution */}
                    <BlockStack gap="300">
                      <Text as="h3" variant="headingSm">Product Quality Breakdown</Text>
                      <BlockStack gap="200">
                        <InlineStack align="space-between">
                          <InlineStack gap="200" blockAlign="center">
                            <Box width="12px" minHeight="12px" background="bg-fill-success" borderRadius="full" />
                            <Text as="p">Excellent (90+)</Text>
                          </InlineStack>
                          <Text as="p" fontWeight="semibold">{metrics?.scoreDistribution.excellent ?? 0}</Text>
                        </InlineStack>

                        <InlineStack align="space-between">
                          <InlineStack gap="200" blockAlign="center">
                            <Box width="12px" minHeight="12px" background="bg-fill-success" borderRadius="full" />
                            <Text as="p">Good (70-89)</Text>
                          </InlineStack>
                          <Text as="p" fontWeight="semibold">{metrics?.scoreDistribution.good ?? 0}</Text>
                        </InlineStack>

                        <InlineStack align="space-between">
                          <InlineStack gap="200" blockAlign="center">
                            <Box width="12px" minHeight="12px" background="bg-fill-warning" borderRadius="full" />
                            <Text as="p">Needs Work (40-69)</Text>
                          </InlineStack>
                          <Text as="p" fontWeight="semibold">{metrics?.scoreDistribution.needsWork ?? 0}</Text>
                        </InlineStack>

                        <InlineStack align="space-between">
                          <InlineStack gap="200" blockAlign="center">
                            <Box width="12px" minHeight="12px" background="bg-fill-critical" borderRadius="full" />
                            <Text as="p">Fix Now (&lt;40)</Text>
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
                          <Text as="h3" variant="headingSm">Where You Appear</Text>
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
                        <Text as="h2" variant="headingMd">Active Alerts</Text>
                      </InlineStack>
                      <Badge>{String(alerts.length)}</Badge>
                    </InlineStack>

                    <Divider />

                    {!hasAlerts ? (
                      <Box padding="600">
                        <BlockStack gap="200" inlineAlign="center">
                          <Text as="p" variant="headingMd" tone="success">All clear!</Text>
                          <Text as="p" tone="subdued">
                            No issues detected. Keep up the good work!
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
                                    <Button size="slim">{alert.actionLabel || 'Fix This'}</Button>
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
                      <Text as="h3" variant="headingSm">Notification Settings</Text>
                      <BlockStack gap="200">
                        <Checkbox
                          label="Email me about important issues"
                          helpText="Get notified when something needs your attention"
                          checked={emailAlerts}
                          onChange={setEmailAlerts}
                        />
                        <Checkbox
                          label="Send weekly summary"
                          helpText="Receive a weekly report of your AI visibility progress"
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
                          Save Settings
                        </Button>
                      </Box>
                    </BlockStack>
                  </BlockStack>
                )}

                {/* Weekly Report Tab */}
                {selectedTab === 2 && (
                  <BlockStack gap="600">
                    <Text as="h2" variant="headingMd">
                      Weekly Summary
                    </Text>
                    {report && (
                      <Text as="p" tone="subdued" variant="bodySm">
                        {new Date(report.period.start).toLocaleDateString()} - {new Date(report.period.end).toLocaleDateString()}
                      </Text>
                    )}

                    <Divider />

                    {!report ? (
                      <Box padding="600">
                        <BlockStack gap="200" inlineAlign="center">
                          <Text as="p" tone="subdued">
                            No report available yet. Check back after your first week of using Surfaced.
                          </Text>
                        </BlockStack>
                      </Box>
                    ) : (
                      <>
                        {/* Report Metrics */}
                        <InlineStack gap="400" align="start">
                          <Box minWidth="140px">
                            <Card>
                              <BlockStack gap="100">
                                <Text as="p" variant="bodySm" tone="subdued">AI Score</Text>
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
                                <Text as="p" variant="bodySm" tone="subdued">Products</Text>
                                <Text as="p" variant="headingLg" fontWeight="bold">
                                  {report.metrics.productsAudited}
                                </Text>
                              </BlockStack>
                            </Card>
                          </Box>

                          <Box minWidth="140px">
                            <Card>
                              <BlockStack gap="100">
                                <Text as="p" variant="bodySm" tone="subdued">Issues</Text>
                                <Text as="p" variant="headingLg" fontWeight="bold" tone={report.metrics.criticalIssues > 0 ? 'critical' : undefined}>
                                  {report.metrics.criticalIssues}
                                </Text>
                              </BlockStack>
                            </Card>
                          </Box>

                          <Box minWidth="140px">
                            <Card>
                              <BlockStack gap="100">
                                <Text as="p" variant="bodySm" tone="subdued">Mention Rate</Text>
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
                              <Text as="h3" variant="headingSm">Most Common Issues</Text>
                              <BlockStack gap="200">
                                {report.topIssues.map((issue) => (
                                  <InlineStack key={issue.code} align="space-between">
                                    <Text as="p">{getIssueLabel(issue.code)}</Text>
                                    <Badge>{`${issue.count} products`}</Badge>
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
                              <Text as="h3" variant="headingSm">Suggested Next Steps</Text>
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

        {/* Quick Tips */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">How to Improve</Text>
              <Divider />
              <BlockStack gap="200">
                <Box padding="200" background="bg-surface-secondary" borderRadius="100">
                  <Text as="p" variant="bodySm">
                    <strong>Check your products weekly</strong> - Run an analysis to catch new issues early
                  </Text>
                </Box>
                <Box padding="200" background="bg-surface-secondary" borderRadius="100">
                  <Text as="p" variant="bodySm">
                    <strong>Use AI suggestions</strong> - Let AI help you write better product descriptions
                  </Text>
                </Box>
                <Box padding="200" background="bg-surface-secondary" borderRadius="100">
                  <Text as="p" variant="bodySm">
                    <strong>Monitor visibility</strong> - Check if AI assistants are recommending your store
                  </Text>
                </Box>
                <Box padding="200" background="bg-surface-secondary" borderRadius="100">
                  <Text as="p" variant="bodySm">
                    <strong>Set up your AI Guide</strong> - Help AI crawlers understand your store better
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
