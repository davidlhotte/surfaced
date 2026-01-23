'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Tabs,
} from '@shopify/polaris';
import { PlusCircleIcon, RefreshIcon, DeleteIcon } from '@shopify/polaris-icons';
import { useAuthenticatedFetch, useShopContext } from '@/components/providers/ShopProvider';
import { NotAuthenticated } from '@/components/admin/NotAuthenticated';
import { AdminNav } from '@/components/admin/AdminNav';
import { PageBanner } from '@/components/admin/PageBanner';
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
  const { t, locale } = useAdminLanguage();
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

  // Analysis configuration - editable by user (inline, no modal needed)
  const [brandName, setBrandName] = useState('');
  const [customQueries, setCustomQueries] = useState<string[]>([]);

  // History state
  const [history, setHistory] = useState<CompetitorAnalysis[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);

  // Detail modal state for query responses
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedComparison, setSelectedComparison] = useState<CompetitorAnalysis['comparisons'][0] | null>(null);

  const fetchCompetitors = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('/api/competitors');
      if (!response.ok) throw new Error(t.common.error);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
        // Initialize brand name from shop domain only if not already set
        setBrandName((current) => {
          if (current) return current; // Don't override if already set
          if (result.data.shopDomain) {
            const shopName = result.data.shopDomain.replace('.myshopify.com', '').replace(/-/g, ' ');
            return shopName.charAt(0).toUpperCase() + shopName.slice(1);
          }
          return current;
        });
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
        body: JSON.stringify({
          action: 'analyze',
          brandName: brandName || undefined,
          customQueries: customQueries.length > 0 ? customQueries : undefined,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t.common.error);
      }
      const result = await response.json();
      if (result.success) {
        setAnalysis(result.data);
        // Add to history
        setHistory((prev) => [result.data, ...prev].slice(0, 10));
      } else {
        setError(result.error || t.common.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setAnalyzing(false);
    }
  };


  // Default query suggestions based on competitors
  const suggestedQueries = useMemo(() => {
    const brand = brandName || 'your store';
    return [
      locale === 'fr' ? `Quel est le meilleur ${brand} ?` : `What is the best ${brand}?`,
      locale === 'fr' ? `Ou acheter des produits comme ${brand} ?` : `Where to buy products like ${brand}?`,
      locale === 'fr' ? `${brand} vs concurrents` : `${brand} vs competitors`,
      locale === 'fr' ? `Avis sur ${brand}` : `${brand} reviews`,
      locale === 'fr' ? `Alternative a ${brand}` : `Alternative to ${brand}`,
    ];
  }, [brandName, locale]);

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

  // Tabs for main view
  const tabs = useMemo(() => [
    {
      id: 'analysis',
      content: locale === 'fr' ? 'Analyse' : 'Analysis',
    },
    {
      id: 'history',
      content: locale === 'fr' ? `Historique (${history.length})` : `History (${history.length})`,
    },
  ], [history.length, locale]);

  // Show authentication error if shop detection failed
  if (shopDetectionFailed) {
    return <NotAuthenticated error={shopError} />;
  }

  if (loading || shopLoading) {
    return (
      <Page title={t.competitors.title}>
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
      <AdminNav locale={locale} />
      <PageBanner pageKey="competitors" />
      <Layout>
        {error && (
          <Layout.Section>
            <Banner tone="critical" title={t.common.error} onDismiss={() => setError(null)}>
              <p>{error}</p>
            </Banner>
          </Layout.Section>
        )}

        {/* Analysis Configuration Section - Inline editing without modal */}
        {data?.competitors && data.competitors.length > 0 && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <BlockStack gap="100">
                  <Text as="h3" variant="headingMd">
                    {locale === 'fr' ? 'Configuration de l\'analyse' : 'Analysis Configuration'}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    {locale === 'fr'
                      ? 'Personnalisez les questions posees aux IA pour comparer votre marque avec vos concurrents.'
                      : 'Customize the questions asked to AI to compare your brand with competitors.'}
                  </Text>
                </BlockStack>
                <Divider />

                {/* Brand Name - Inline editable */}
                <TextField
                  label={locale === 'fr' ? 'Nom de votre marque' : 'Your brand name'}
                  value={brandName}
                  onChange={setBrandName}
                  autoComplete="off"
                  helpText={locale === 'fr'
                    ? 'Le nom qui sera recherche dans les reponses IA'
                    : 'The name that will be searched for in AI responses'}
                />

                {/* Custom Queries - Inline editable */}
                <BlockStack gap="200">
                  <Text as="p" fontWeight="semibold">
                    {locale === 'fr' ? 'Questions a poser aux IA' : 'Questions to ask AI'}
                  </Text>
                  <TextField
                    label=""
                    labelHidden
                    value={customQueries.join('\n')}
                    onChange={(value) => setCustomQueries(value.split('\n').map((q) => q.trim()).filter((q) => q.length > 0))}
                    multiline={4}
                    autoComplete="off"
                    placeholder={suggestedQueries.join('\n')}
                    helpText={locale === 'fr'
                      ? 'Une question par ligne. Laissez vide pour utiliser les questions par defaut.'
                      : 'One question per line. Leave empty to use default questions.'}
                  />
                  <InlineStack gap="200" wrap>
                    {suggestedQueries.slice(0, 3).map((q, i) => (
                      <Button
                        key={i}
                        size="slim"
                        onClick={() => setCustomQueries((prev) => [...prev, q])}
                      >
                        + {q.length > 25 ? `${q.substring(0, 25)}...` : q}
                      </Button>
                    ))}
                  </InlineStack>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

        {/* Tabs for Analysis/History */}
        {data?.competitors && data.competitors.length > 0 && (
          <Layout.Section>
            <Card>
              <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
                <Box paddingBlockStart="400" />
              </Tabs>
            </Card>
          </Layout.Section>
        )}

        {/* History Tab Content */}
        {selectedTab === 1 && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">
                  {locale === 'fr' ? 'Historique des analyses' : 'Analysis History'}
                </Text>
                <Divider />
                {history.length === 0 ? (
                  <Box padding="600">
                    <BlockStack gap="300" inlineAlign="center">
                      <Text as="p" variant="headingMd">
                        {locale === 'fr' ? 'Pas encore d\'historique' : 'No history yet'}
                      </Text>
                      <Text as="p" tone="subdued">
                        {locale === 'fr'
                          ? 'Lancez votre premiere analyse pour voir les resultats ici.'
                          : 'Run your first analysis to see results here.'}
                      </Text>
                    </BlockStack>
                  </Box>
                ) : (
                  <BlockStack gap="300">
                    {history.map((entry, index) => (
                      <Box
                        key={index}
                        padding="300"
                        background="bg-surface-secondary"
                        borderRadius="200"
                      >
                        <InlineStack align="space-between" blockAlign="center" gap="400" wrap>
                          <BlockStack gap="100">
                            <InlineStack gap="200" blockAlign="center">
                              <Text as="p" fontWeight="semibold">{entry.brandName}</Text>
                              <Badge tone={entry.summary.yourMentionRate >= 30 ? 'success' : 'warning'}>
                                {`${entry.summary.yourMentionRate}% ${locale === 'fr' ? 'mentions' : 'mentions'}`}
                              </Badge>
                            </InlineStack>
                            <Text as="p" variant="bodySm" tone="subdued">
                              {entry.comparisons.length} {locale === 'fr' ? 'questions testees' : 'queries tested'} •{' '}
                              {entry.competitors.length} {locale === 'fr' ? 'concurrents' : 'competitors'}
                            </Text>
                          </BlockStack>
                          <Button size="slim" onClick={() => { setAnalysis(entry); setSelectedTab(0); }}>
                            {locale === 'fr' ? 'Voir' : 'View'}
                          </Button>
                        </InlineStack>
                      </Box>
                    ))}
                  </BlockStack>
                )}
              </BlockStack>
            </Card>
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

        {/* Analysis Results - Only show on Analysis tab */}
        {analysis && selectedTab === 0 && (
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
                      <div
                        key={index}
                        onClick={() => { setSelectedComparison(comp); setDetailModalOpen(true); }}
                        style={{ cursor: 'pointer' }}
                      >
                        <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                          <BlockStack gap="200">
                            <InlineStack align="space-between" blockAlign="center" wrap>
                              <InlineStack gap="200" blockAlign="center">
                                <Text as="p" fontWeight="semibold">
                                  &ldquo;{comp.query}&rdquo;
                                </Text>
                                <Text as="span" variant="bodySm" tone="subdued">
                                  {locale === 'fr' ? '(cliquez pour détails)' : '(click for details)'}
                                </Text>
                              </InlineStack>
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
                      </div>
                    ))}
                  </BlockStack>
                </BlockStack>
              </Card>
            </Layout.Section>
          </>
        )}

        {/* Detail Modal for Query Response */}
        <Modal
          open={detailModalOpen}
          onClose={() => { setDetailModalOpen(false); setSelectedComparison(null); }}
          title={selectedComparison ? `"${selectedComparison.query}"` : locale === 'fr' ? 'Détails' : 'Details'}
          size="large"
        >
          <Modal.Section>
            {selectedComparison && analysis && (
              <BlockStack gap="500">
                {/* Winner Summary */}
                <Box padding="300" background={selectedComparison.winner === analysis.brandName ? 'bg-surface-success' : 'bg-surface-warning'} borderRadius="200">
                  <InlineStack gap="300" blockAlign="center">
                    <Text as="span" variant="headingMd">
                      {locale === 'fr' ? 'Gagnant :' : 'Winner:'}
                    </Text>
                    <Badge tone={selectedComparison.winner === analysis.brandName ? 'success' : 'warning'} size="large">
                      {selectedComparison.winner || (locale === 'fr' ? 'Aucun' : 'None')}
                    </Badge>
                  </InlineStack>
                </Box>

                {/* Gap Analysis */}
                <BlockStack gap="200">
                  <Text as="h4" variant="headingSm">{locale === 'fr' ? 'Analyse' : 'Analysis'}</Text>
                  <Text as="p" variant="bodyMd">{selectedComparison.gap}</Text>
                </BlockStack>

                <Divider />

                {/* Your Brand Section */}
                <BlockStack gap="300">
                  <InlineStack gap="200" blockAlign="center">
                    <Badge tone="success">{t.competitors.you}</Badge>
                    <Text as="h4" variant="headingSm">{analysis.brandName}</Text>
                  </InlineStack>
                  <Box padding="300" background={selectedComparison.yourBrand.isMentioned ? 'bg-surface-success' : 'bg-surface-critical'} borderRadius="200">
                    <BlockStack gap="200">
                      <InlineStack gap="400" wrap>
                        <BlockStack gap="100">
                          <Text as="span" variant="bodySm" tone="subdued">{locale === 'fr' ? 'Statut' : 'Status'}</Text>
                          <Badge tone={selectedComparison.yourBrand.isMentioned ? 'success' : 'critical'}>
                            {selectedComparison.yourBrand.isMentioned ? (locale === 'fr' ? 'Mentionné' : 'Mentioned') : (locale === 'fr' ? 'Non mentionné' : 'Not mentioned')}
                          </Badge>
                        </BlockStack>
                        {selectedComparison.yourBrand.position && (
                          <BlockStack gap="100">
                            <Text as="span" variant="bodySm" tone="subdued">{locale === 'fr' ? 'Position' : 'Position'}</Text>
                            <Badge tone="info">{`#${selectedComparison.yourBrand.position}`}</Badge>
                          </BlockStack>
                        )}
                      </InlineStack>
                      {selectedComparison.yourBrand.context && (
                        <BlockStack gap="100">
                          <Text as="span" variant="bodySm" tone="subdued">{locale === 'fr' ? 'Contexte de mention' : 'Mention context'}</Text>
                          <Text as="p" variant="bodyMd">
                            &ldquo;...{selectedComparison.yourBrand.context}...&rdquo;
                          </Text>
                        </BlockStack>
                      )}
                    </BlockStack>
                  </Box>
                </BlockStack>

                <Divider />

                {/* Competitors Section */}
                <BlockStack gap="300">
                  <Text as="h4" variant="headingSm">{locale === 'fr' ? 'Concurrents' : 'Competitors'}</Text>
                  {selectedComparison.competitors.map((competitor) => (
                    <Box key={competitor.domain} padding="300" background={competitor.isMentioned ? 'bg-surface-warning' : 'bg-surface-secondary'} borderRadius="200">
                      <BlockStack gap="200">
                        <InlineStack align="space-between" blockAlign="center">
                          <Text as="p" fontWeight="semibold">{competitor.name || competitor.domain}</Text>
                          <InlineStack gap="200">
                            <Badge tone={competitor.isMentioned ? 'attention' : 'new'}>
                              {competitor.isMentioned ? (locale === 'fr' ? 'Mentionné' : 'Mentioned') : (locale === 'fr' ? 'Non mentionné' : 'Not mentioned')}
                            </Badge>
                            {competitor.position && (
                              <Badge tone="info">{`#${competitor.position}`}</Badge>
                            )}
                          </InlineStack>
                        </InlineStack>
                        {competitor.mentionContext && (
                          <BlockStack gap="100">
                            <Text as="span" variant="bodySm" tone="subdued">{locale === 'fr' ? 'Contexte' : 'Context'}</Text>
                            <Text as="p" variant="bodySm">
                              &ldquo;...{competitor.mentionContext}...&rdquo;
                            </Text>
                          </BlockStack>
                        )}
                      </BlockStack>
                    </Box>
                  ))}
                </BlockStack>
              </BlockStack>
            )}
          </Modal.Section>
        </Modal>

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
