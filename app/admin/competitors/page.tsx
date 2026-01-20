'use client';

export const dynamic = 'force-dynamic';

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
  ResourceList,
  ResourceItem,
  Avatar,
  Modal,
  ProgressBar,
} from '@shopify/polaris';
import { PlusCircleIcon } from '@shopify/polaris-icons';
import { useAuthenticatedFetch, useShopContext } from '@/components/providers/ShopProvider';
import { NotAuthenticated } from '@/components/admin/NotAuthenticated';
import { useAdminLanguage } from '@/lib/i18n/AdminLanguageContext';

type Competitor = {
  id: string;
  domain: string;
  name: string | null;
  isActive: boolean;
  createdAt: string;
};

type CompetitorsData = {
  competitors: Competitor[];
  limit: number;
  remaining: number;
};

type CompetitorAnalysis = {
  shopDomain: string;
  brandName: string;
  competitors: {
    domain: string;
    name: string | null;
    mentionRate: number;
    averagePosition: number | null;
  }[];
  comparisons: {
    query: string;
    yourBrand: {
      isMentioned: boolean;
      position: number | null;
      context: string | null;
    };
    competitors: {
      domain: string;
      name: string | null;
      isMentioned: boolean;
      mentionContext: string | null;
      position: number | null;
    }[];
    winner: string | null;
    gap: string;
  }[];
  insights: {
    type: 'danger' | 'warning' | 'opportunity';
    title: string;
    description: string;
  }[];
  summary: {
    yourMentionRate: number;
    bestCompetitorMentionRate: number;
    gapPercentage: number;
  };
};

export default function CompetitorsPage() {
  const { fetch: authenticatedFetch } = useAuthenticatedFetch();
  const { isLoading: shopLoading, shopDetectionFailed, error: shopError } = useShopContext();
  const { t } = useAdminLanguage();
  const [data, setData] = useState<CompetitorsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<CompetitorAnalysis | null>(null);

  // Add competitor form
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchCompetitors = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('/api/competitors');
      if (!response.ok) throw new Error(t.common.error);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || t.common.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch, t.common.error]);

  useEffect(() => {
    fetchCompetitors();
  }, [fetchCompetitors]);

  const addCompetitor = async () => {
    if (!newDomain.trim()) return;

    try {
      setAdding(true);
      setError(null);
      const response = await authenticatedFetch('/api/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: newDomain.trim(),
          name: newName.trim() || undefined,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t.common.error);
      }
      const result = await response.json();
      if (result.success) {
        setData(result.data);
        setNewDomain('');
        setNewName('');
        setShowAddModal(false);
      } else {
        setError(result.error || t.common.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setAdding(false);
    }
  };

  const removeCompetitor = async (id: string) => {
    try {
      setError(null);
      const response = await authenticatedFetch(`/api/competitors?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t.common.error);
      }
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || t.common.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    }
  };

  const runAnalysis = async () => {
    try {
      setAnalyzing(true);
      setError(null);
      const response = await authenticatedFetch('/api/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze' }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t.common.error);
      }
      const result = await response.json();
      if (result.success) {
        setAnalysis(result.data);
      } else {
        setError(result.error || t.common.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setAnalyzing(false);
    }
  };

  const getInsightBadge = (type: string) => {
    const tones: Record<string, 'critical' | 'warning' | 'success'> = {
      danger: 'critical',
      warning: 'warning',
      opportunity: 'success',
    };
    return tones[type] || 'info';
  };

  const getInsightLabel = (type: string) => {
    const labels: Record<string, string> = {
      danger: t.competitors.actionRequired,
      warning: t.competitors.attention,
      opportunity: t.competitors.opportunity,
    };
    return labels[type] || type;
  };

  // Show authentication error if shop detection failed
  if (shopDetectionFailed) {
    return <NotAuthenticated error={shopError} />;
  }

  if (loading || shopLoading) {
    return (
      <Page title={t.competitors.title} backAction={{ content: t.dashboard.title, url: '/admin' }}>
        <Layout>
          <Layout.Section>
            <Card>
              <Box padding="800">
                <BlockStack gap="400" inlineAlign="center">
                  <Spinner size="large" />
                  <Text as="p">{t.competitors.loading}</Text>
                </BlockStack>
              </Box>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page
      title={t.competitors.title}
      subtitle={t.competitors.subtitle}
      backAction={{ content: t.dashboard.title, url: '/admin' }}
      primaryAction={{
        content: analyzing ? t.competitors.analyzing : t.competitors.runAnalysis,
        onAction: runAnalysis,
        loading: analyzing,
        disabled: !data?.competitors.length,
      }}
      secondaryActions={[
        {
          content: t.competitors.addCompetitor,
          icon: PlusCircleIcon,
          onAction: () => setShowAddModal(true),
          disabled: data?.remaining === 0,
        },
      ]}
    >
      <Layout>
        {error && (
          <Layout.Section>
            <Banner tone="critical" title={t.common.error} onDismiss={() => setError(null)}>
              <p>{error}</p>
            </Banner>
          </Layout.Section>
        )}

        {/* Welcome Section for New Users */}
        {!data?.competitors.length && !analysis && (
          <Layout.Section>
            <Card>
              <Box padding="600">
                <BlockStack gap="500">
                  <div style={{
                    background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
                    padding: '24px',
                    borderRadius: '12px',
                    color: 'white',
                  }}>
                    <BlockStack gap="400">
                      <Text as="h2" variant="headingLg">
                        {t.competitors.watchCompetitors}
                      </Text>
                      <Text as="p">
                        {t.competitors.watchCompetitorsDesc}
                      </Text>
                    </BlockStack>
                  </div>

                  <BlockStack gap="300">
                    <Text as="h3" variant="headingMd">{t.competitors.howItWorksTitle}</Text>
                    <InlineStack gap="400" wrap>
                      <Box minWidth="200px" maxWidth="300px">
                        <BlockStack gap="200">
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#F59E0B',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                          }}>1</div>
                          <Text as="p" fontWeight="semibold">{t.competitors.step1}</Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            {t.competitors.step1Desc}
                          </Text>
                        </BlockStack>
                      </Box>
                      <Box minWidth="200px" maxWidth="300px">
                        <BlockStack gap="200">
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#F59E0B',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                          }}>2</div>
                          <Text as="p" fontWeight="semibold">{t.competitors.step2}</Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            {t.competitors.step2Desc}
                          </Text>
                        </BlockStack>
                      </Box>
                      <Box minWidth="200px" maxWidth="300px">
                        <BlockStack gap="200">
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#F59E0B',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                          }}>3</div>
                          <Text as="p" fontWeight="semibold">{t.competitors.step3}</Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            {t.competitors.step3Desc}
                          </Text>
                        </BlockStack>
                      </Box>
                    </InlineStack>
                  </BlockStack>

                  <Box paddingBlockStart="200">
                    <Button variant="primary" size="large" onClick={() => setShowAddModal(true)}>
                      {t.competitors.addFirstCompetitor}
                    </Button>
                  </Box>
                </BlockStack>
              </Box>
            </Card>
          </Layout.Section>
        )}

        {/* Analysis Results */}
        {analysis && (
          <>
            <Layout.Section>
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="h2" variant="headingLg">{t.competitors.analysisResults}</Text>
                    <Button variant="plain" onClick={() => setAnalysis(null)}>
                      {t.competitors.close}
                    </Button>
                  </InlineStack>
                  <Divider />

                  {/* Summary */}
                  <InlineStack gap="400" align="start" wrap>
                    <Box minWidth="180px">
                      <Card>
                        <BlockStack gap="200">
                          <Text as="p" variant="bodySm" tone="subdued">{t.competitors.yourMentionRate}</Text>
                          <Text as="p" variant="heading2xl" fontWeight="bold" tone={analysis.summary.yourMentionRate > 30 ? 'success' : 'critical'}>
                            {analysis.summary.yourMentionRate}%
                          </Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            {t.competitors.recommendationFrequency}
                          </Text>
                        </BlockStack>
                      </Card>
                    </Box>
                    <Box minWidth="180px">
                      <Card>
                        <BlockStack gap="200">
                          <Text as="p" variant="bodySm" tone="subdued">{t.competitors.bestCompetitor}</Text>
                          <Text as="p" variant="heading2xl" fontWeight="bold">
                            {analysis.summary.bestCompetitorMentionRate}%
                          </Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            {t.competitors.mostMentioned}
                          </Text>
                        </BlockStack>
                      </Card>
                    </Box>
                    <Box minWidth="180px">
                      <Card>
                        <BlockStack gap="200">
                          <Text as="p" variant="bodySm" tone="subdued">{t.competitors.gap}</Text>
                          <Text
                            as="p"
                            variant="heading2xl"
                            fontWeight="bold"
                            tone={analysis.summary.gapPercentage > 0 ? 'critical' : 'success'}
                          >
                            {analysis.summary.gapPercentage > 0 ? '-' : '+'}{Math.abs(analysis.summary.gapPercentage)}%
                          </Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            {analysis.summary.gapPercentage > 0 ? t.competitors.youAreBehind : t.competitors.youAreAhead}
                          </Text>
                        </BlockStack>
                      </Card>
                    </Box>
                  </InlineStack>
                </BlockStack>
              </Card>
            </Layout.Section>

            {/* Insights */}
            {analysis.insights.length > 0 && (
              <Layout.Section>
                <Card>
                  <BlockStack gap="400">
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingMd">{t.competitors.keyInsights}</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        {t.competitors.keyInsightsDesc}
                      </Text>
                    </BlockStack>
                    <Divider />
                    <BlockStack gap="300">
                      {analysis.insights.map((insight, index) => (
                        <Box
                          key={index}
                          padding="300"
                          background={
                            insight.type === 'danger'
                              ? 'bg-surface-critical'
                              : insight.type === 'warning'
                              ? 'bg-surface-warning'
                              : 'bg-surface-success'
                          }
                          borderRadius="200"
                        >
                          <InlineStack gap="300" blockAlign="start">
                            <Badge tone={getInsightBadge(insight.type)}>
                              {getInsightLabel(insight.type)}
                            </Badge>
                            <BlockStack gap="100">
                              <Text as="p" fontWeight="semibold">{insight.title}</Text>
                              <Text as="p" variant="bodySm" tone="subdued">
                                {insight.description}
                              </Text>
                            </BlockStack>
                          </InlineStack>
                        </Box>
                      ))}
                    </BlockStack>
                  </BlockStack>
                </Card>
              </Layout.Section>
            )}

            {/* Competitor Comparison */}
            <Layout.Section>
              <Card>
                <BlockStack gap="400">
                  <BlockStack gap="200">
                    <Text as="h3" variant="headingMd">{t.competitors.mentionRateComparison}</Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {t.competitors.mentionRateComparisonDesc}
                    </Text>
                  </BlockStack>
                  <Divider />
                  <BlockStack gap="300">
                    <Box padding="300" background="bg-surface-success" borderRadius="200">
                      <InlineStack align="space-between" blockAlign="center">
                        <InlineStack gap="200" blockAlign="center">
                          <Badge tone="success">{t.competitors.you}</Badge>
                          <Text as="p" fontWeight="semibold">{analysis.brandName}</Text>
                        </InlineStack>
                        <InlineStack gap="200" blockAlign="center">
                          <Box minWidth="120px">
                            <ProgressBar
                              progress={analysis.summary.yourMentionRate}
                              tone="success"
                              size="small"
                            />
                          </Box>
                          <Text as="p" fontWeight="bold">{analysis.summary.yourMentionRate}%</Text>
                        </InlineStack>
                      </InlineStack>
                    </Box>
                    {analysis.competitors.map((comp) => (
                      <Box key={comp.domain} padding="300" background="bg-surface-secondary" borderRadius="200">
                        <InlineStack align="space-between" blockAlign="center">
                          <Text as="p">{comp.name || comp.domain}</Text>
                          <InlineStack gap="200" blockAlign="center">
                            <Box minWidth="120px">
                              <ProgressBar
                                progress={comp.mentionRate}
                                tone={comp.mentionRate > analysis.summary.yourMentionRate ? 'critical' : 'primary'}
                                size="small"
                              />
                            </Box>
                            <Text as="p" fontWeight="semibold" tone={comp.mentionRate > analysis.summary.yourMentionRate ? 'critical' : undefined}>
                              {comp.mentionRate}%
                            </Text>
                          </InlineStack>
                        </InlineStack>
                      </Box>
                    ))}
                  </BlockStack>
                </BlockStack>
              </Card>
            </Layout.Section>

            {/* Query Results */}
            <Layout.Section>
              <Card>
                <BlockStack gap="400">
                  <BlockStack gap="200">
                    <Text as="h3" variant="headingMd">{t.competitors.queryResults}</Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {t.competitors.queryResultsDesc}
                    </Text>
                  </BlockStack>
                  <Divider />
                  <BlockStack gap="400">
                    {analysis.comparisons.map((comp, index) => (
                      <Box key={index} padding="300" background="bg-surface-secondary" borderRadius="200">
                        <BlockStack gap="200">
                          <InlineStack align="space-between" blockAlign="center" wrap>
                            <Text as="p" fontWeight="semibold">
                              &ldquo;{comp.query}&rdquo;
                            </Text>
                            {comp.winner && (
                              <Badge tone={comp.winner === analysis.brandName ? 'success' : 'critical'}>
                                {`${t.competitors.winner}: ${comp.winner}`}
                              </Badge>
                            )}
                          </InlineStack>
                          <Text as="p" variant="bodySm" tone="subdued">
                            {comp.gap}
                          </Text>
                          <InlineStack gap="200" wrap>
                            <Badge tone={comp.yourBrand.isMentioned ? 'success' : 'critical'}>
                              {`${t.competitors.you}: ${comp.yourBrand.isMentioned ? `#${comp.yourBrand.position || '?'}` : t.visibility.notFound}`}
                            </Badge>
                            {comp.competitors.slice(0, 3).map((c) => (
                              <Badge key={c.domain} tone={c.isMentioned ? 'attention' : 'new'}>
                                {`${c.name || c.domain}: ${c.isMentioned ? `#${c.position || '?'}` : t.visibility.notFound}`}
                              </Badge>
                            ))}
                          </InlineStack>
                        </BlockStack>
                      </Box>
                    ))}
                  </BlockStack>
                </BlockStack>
              </Card>
            </Layout.Section>
          </>
        )}

        {/* Competitors List */}
        {data?.competitors && data.competitors.length > 0 && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="100">
                    <Text as="h3" variant="headingMd">{t.competitors.competitorsTracked}</Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {t.competitors.competitorsTrackedDesc}
                    </Text>
                  </BlockStack>
                  <Badge tone={data.remaining > 0 ? 'info' : 'warning'}>
                    {`${data.competitors.length} / ${data.limit}`}
                  </Badge>
                </InlineStack>
                <Divider />

                <ResourceList
                  items={data.competitors}
                  renderItem={(item) => (
                    <ResourceItem
                      id={item.id}
                      accessibilityLabel={`${item.name || item.domain}`}
                      onClick={() => {}}
                      media={
                        <Avatar
                          customer
                          size="md"
                          name={item.name || item.domain}
                        />
                      }
                      shortcutActions={[
                        {
                          content: t.competitors.remove,
                          onAction: () => removeCompetitor(item.id),
                        },
                      ]}
                    >
                      <BlockStack gap="100">
                        <Text as="p" fontWeight="semibold">
                          {item.name || item.domain}
                        </Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          {item.domain}
                        </Text>
                      </BlockStack>
                    </ResourceItem>
                  )}
                />

                {data.remaining > 0 && (
                  <Box paddingBlockStart="200">
                    <Button onClick={() => setShowAddModal(true)} icon={PlusCircleIcon}>
                      {`${t.competitors.addCompetitor} (${data.remaining} ${t.competitors.remaining})`}
                    </Button>
                  </Box>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

        {/* Value Proposition */}
        {data?.competitors && data.competitors.length > 0 && !analysis && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">{t.competitors.whyTrackCompetitors}</Text>
                <Divider />
                <BlockStack gap="200">
                  <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                    <BlockStack gap="100">
                      <Text as="p" fontWeight="semibold">{t.competitors.identifyOpportunities}</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        {t.competitors.identifyOpportunitiesDesc}
                      </Text>
                    </BlockStack>
                  </Box>
                  <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                    <BlockStack gap="100">
                      <Text as="p" fontWeight="semibold">{t.competitors.understandPositioning}</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        {t.competitors.understandPositioningDesc}
                      </Text>
                    </BlockStack>
                  </Box>
                  <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                    <BlockStack gap="100">
                      <Text as="p" fontWeight="semibold">{t.competitors.improveStrategy}</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        {t.competitors.improveStrategyDesc}
                      </Text>
                    </BlockStack>
                  </Box>
                </BlockStack>

                <Box paddingBlockStart="200">
                  <Button variant="primary" onClick={runAnalysis} loading={analyzing}>
                    {t.competitors.runComparativeAnalysis}
                  </Button>
                </Box>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}
      </Layout>

      {/* Add Competitor Modal */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={t.competitors.addCompetitorTitle}
        primaryAction={{
          content: t.common.add,
          onAction: addCompetitor,
          loading: adding,
          disabled: !newDomain.trim(),
        }}
        secondaryActions={[
          {
            content: t.common.cancel,
            onAction: () => setShowAddModal(false),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Banner tone="info">
              <Text as="p" variant="bodySm">
                {t.competitors.addCompetitorDesc}
              </Text>
            </Banner>
            <TextField
              label={t.competitors.competitorDomain}
              placeholder={t.competitors.domainPlaceholder}
              value={newDomain}
              onChange={setNewDomain}
              autoComplete="off"
              helpText={t.competitors.domainHelp}
            />
            <TextField
              label={t.competitors.competitorName}
              placeholder={t.competitors.namePlaceholder}
              value={newName}
              onChange={setNewName}
              autoComplete="off"
              helpText={t.competitors.nameHelp}
            />
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
