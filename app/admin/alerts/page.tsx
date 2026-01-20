'use client';

export const dynamic = 'force-dynamic';

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
} from '@shopify/polaris';
import {
  RefreshIcon,
  AlertTriangleIcon,
} from '@shopify/polaris-icons';
import Link from 'next/link';
import { useAuthenticatedFetch, useShopContext } from '@/components/providers/ShopProvider';
import { NotAuthenticated } from '@/components/admin/NotAuthenticated';

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
  scoreDropThreshold: number;
  criticalAlertsOnly: boolean;
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

export default function AlertsPage() {
  const { fetch } = useAuthenticatedFetch();
  const { isLoading: shopLoading, shopDetectionFailed, error: shopError } = useShopContext();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [preferences, setPreferences] = useState<AlertPreferences | null>(null);
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/alerts?report=true');
      const data = await response.json();

      if (data.success) {
        setAlerts(data.data.alerts);
        setPreferences(data.data.preferences);
        setReport(data.data.report);

        // Set form state
        setEmailAlerts(data.data.preferences?.emailAlerts ?? true);
        setWeeklyReport(data.data.preferences?.weeklyReport ?? true);
      } else {
        setError(data.error || 'Failed to load alerts');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [fetch]);

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
        body: JSON.stringify({
          emailAlerts,
          weeklyReport,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPreferences(data.data.preferences);
      } else {
        setError(data.error || 'Failed to save preferences');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const getPriorityBadge = (priority: Alert['priority']) => {
    const tones: Record<Alert['priority'], 'critical' | 'warning' | 'info' | 'success'> = {
      critical: 'critical',
      high: 'warning',
      medium: 'info',
      low: 'success',
    };
    return <Badge tone={tones[priority]}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</Badge>;
  };

  const getIssueLabel = (code: string): string => {
    const labels: Record<string, string> = {
      NO_DESCRIPTION: 'Missing description',
      SHORT_DESCRIPTION: 'Short description',
      BRIEF_DESCRIPTION: 'Brief description',
      NO_IMAGES: 'Missing images',
      MISSING_ALT_TEXT: 'Missing alt text',
      NO_SEO_TITLE: 'Missing SEO title',
      NO_SEO_DESCRIPTION: 'Missing SEO description',
      NO_PRODUCT_TYPE: 'Missing product type',
      NO_TAGS: 'Missing tags',
      NO_METAFIELDS: 'Missing metafields',
      NO_VENDOR: 'Missing vendor',
    };
    return labels[code] || code;
  };

  // Show authentication error if shop detection failed
  if (shopDetectionFailed) {
    return <NotAuthenticated error={shopError} />;
  }

  if (loading || shopLoading) {
    return (
      <Page title="Alerts & Reports" backAction={{ content: 'Dashboard', url: '/admin' }}>
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
      title="Alerts & Reports"
      subtitle="Stay informed about your AI visibility status"
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

        {/* Active Alerts */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <InlineStack gap="200" blockAlign="center">
                  <AlertTriangleIcon />
                  <Text as="h2" variant="headingMd">
                    Active Alerts
                  </Text>
                </InlineStack>
                <Badge>{String(alerts.length)}</Badge>
              </InlineStack>

              <Divider />

              {alerts.length === 0 ? (
                <Box padding="400">
                  <BlockStack gap="200" inlineAlign="center">
                    <Text as="p" tone="success" fontWeight="semibold">
                      No active alerts
                    </Text>
                    <Text as="p" tone="subdued">
                      Your store is in good shape! Keep monitoring for changes.
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
                              <Button size="slim">{alert.actionLabel || 'View'}</Button>
                            </Link>
                          </Box>
                        )}
                      </BlockStack>
                    </Box>
                  ))}
                </BlockStack>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Weekly Report */}
        {report && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Weekly Report
                </Text>
                <Text as="p" tone="subdued" variant="bodySm">
                  {new Date(report.period.start).toLocaleDateString()} - {new Date(report.period.end).toLocaleDateString()}
                </Text>

                <Divider />

                {/* Metrics Grid */}
                <InlineStack gap="400" align="start">
                  <Box minWidth="150px">
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

                  <Box minWidth="150px">
                    <Card>
                      <BlockStack gap="100">
                        <Text as="p" variant="bodySm" tone="subdued">Products Audited</Text>
                        <Text as="p" variant="headingLg" fontWeight="bold">
                          {report.metrics.productsAudited}
                        </Text>
                      </BlockStack>
                    </Card>
                  </Box>

                  <Box minWidth="150px">
                    <Card>
                      <BlockStack gap="100">
                        <Text as="p" variant="bodySm" tone="subdued">Critical Issues</Text>
                        <Text as="p" variant="headingLg" fontWeight="bold" tone={report.metrics.criticalIssues > 0 ? 'critical' : undefined}>
                          {report.metrics.criticalIssues}
                        </Text>
                      </BlockStack>
                    </Card>
                  </Box>

                  <Box minWidth="150px">
                    <Card>
                      <BlockStack gap="100">
                        <Text as="p" variant="bodySm" tone="subdued">Mention Rate</Text>
                        <InlineStack gap="100" blockAlign="center">
                          <Text as="p" variant="headingLg" fontWeight="bold">
                            {Math.round(report.metrics.mentionRate)}%
                          </Text>
                        </InlineStack>
                        <Box width="100%">
                          <ProgressBar
                            progress={report.metrics.mentionRate}
                            tone={report.metrics.mentionRate >= 50 ? 'success' : 'critical'}
                            size="small"
                          />
                        </Box>
                      </BlockStack>
                    </Card>
                  </Box>
                </InlineStack>

                {/* Top Issues */}
                {report.topIssues.length > 0 && (
                  <>
                    <Text as="h3" variant="headingSm">Top Issues</Text>
                    <BlockStack gap="200">
                      {report.topIssues.map((issue) => (
                        <InlineStack key={issue.code} align="space-between">
                          <Text as="p" tone="subdued">{getIssueLabel(issue.code)}</Text>
                          <Badge>{`${issue.count} products`}</Badge>
                        </InlineStack>
                      ))}
                    </BlockStack>
                  </>
                )}

                {/* Recommendations */}
                {report.recommendations.length > 0 && (
                  <>
                    <Text as="h3" variant="headingSm">Recommendations</Text>
                    <BlockStack gap="200">
                      {report.recommendations.map((rec, index) => (
                        <Box key={index} padding="200" background="bg-surface-info" borderRadius="100">
                          <Text as="p" variant="bodySm">{rec}</Text>
                        </Box>
                      ))}
                    </BlockStack>
                  </>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

        {/* Alert Preferences */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Notification Preferences
              </Text>

              <Divider />

              <BlockStack gap="300">
                <Checkbox
                  label="Email alerts"
                  helpText="Receive email notifications when critical issues are detected"
                  checked={emailAlerts}
                  onChange={setEmailAlerts}
                />
                <Checkbox
                  label="Weekly report"
                  helpText="Receive a weekly summary of your AI visibility performance"
                  checked={weeklyReport}
                  onChange={setWeeklyReport}
                />
              </BlockStack>

              <Box paddingBlockStart="200">
                <Button
                  onClick={handleSavePreferences}
                  loading={saving}
                  disabled={
                    preferences?.emailAlerts === emailAlerts &&
                    preferences?.weeklyReport === weeklyReport
                  }
                >
                  Save Preferences
                </Button>
              </Box>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
