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
  Divider,
  TextField,
  ResourceList,
  ResourceItem,
  Avatar,
  Modal,
  ProgressBar,
} from '@shopify/polaris';
import { PlusCircleIcon } from '@shopify/polaris-icons';

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
      const response = await fetch('/api/competitors');
      if (!response.ok) throw new Error('Failed to fetch competitors');
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load competitors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompetitors();
  }, [fetchCompetitors]);

  const addCompetitor = async () => {
    if (!newDomain.trim()) return;

    try {
      setAdding(true);
      setError(null);
      const response = await fetch('/api/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: newDomain.trim(),
          name: newName.trim() || undefined,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add competitor');
      }
      const result = await response.json();
      if (result.success) {
        setData(result.data);
        setNewDomain('');
        setNewName('');
        setShowAddModal(false);
      } else {
        setError(result.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add competitor');
    } finally {
      setAdding(false);
    }
  };

  const removeCompetitor = async (id: string) => {
    try {
      setError(null);
      const response = await fetch(`/api/competitors?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove competitor');
      }
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove competitor');
    }
  };

  const runAnalysis = async () => {
    try {
      setAnalyzing(true);
      setError(null);
      const response = await fetch('/api/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze' }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }
      const result = await response.json();
      if (result.success) {
        setAnalysis(result.data);
      } else {
        setError(result.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
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

  if (loading) {
    return (
      <Page title="Competitor Intelligence" backAction={{ content: 'Dashboard', url: '/admin' }}>
        <Layout>
          <Layout.Section>
            <Card>
              <Box padding="800">
                <InlineStack align="center" blockAlign="center">
                  <Spinner size="large" />
                  <Text as="p">Loading competitors...</Text>
                </InlineStack>
              </Box>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page
      title="Competitor Intelligence"
      backAction={{ content: 'Dashboard', url: '/admin' }}
      primaryAction={{
        content: 'Run Analysis',
        onAction: runAnalysis,
        loading: analyzing,
        disabled: !data?.competitors.length,
      }}
      secondaryActions={[
        {
          content: 'Add Competitor',
          icon: PlusCircleIcon,
          onAction: () => setShowAddModal(true),
          disabled: data?.remaining === 0,
        },
      ]}
    >
      <Layout>
        {error && (
          <Layout.Section>
            <Banner tone="critical" title="Error" onDismiss={() => setError(null)}>
              <p>{error}</p>
            </Banner>
          </Layout.Section>
        )}

        {/* Analysis Results */}
        {analysis && (
          <>
            <Layout.Section>
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="h2" variant="headingLg">Analysis Results</Text>
                    <Button variant="plain" onClick={() => setAnalysis(null)}>
                      Close
                    </Button>
                  </InlineStack>
                  <Divider />

                  {/* Summary */}
                  <InlineStack gap="400" align="start">
                    <Box minWidth="150px">
                      <BlockStack gap="200">
                        <Text as="p" tone="subdued">Your Mention Rate</Text>
                        <Text as="p" variant="headingXl" fontWeight="bold">
                          {analysis.summary.yourMentionRate}%
                        </Text>
                      </BlockStack>
                    </Box>
                    <Box minWidth="150px">
                      <BlockStack gap="200">
                        <Text as="p" tone="subdued">Best Competitor</Text>
                        <Text as="p" variant="headingXl" fontWeight="bold">
                          {analysis.summary.bestCompetitorMentionRate}%
                        </Text>
                      </BlockStack>
                    </Box>
                    <Box minWidth="150px">
                      <BlockStack gap="200">
                        <Text as="p" tone="subdued">Gap</Text>
                        <Text
                          as="p"
                          variant="headingXl"
                          fontWeight="bold"
                          tone={analysis.summary.gapPercentage > 0 ? 'critical' : 'success'}
                        >
                          {analysis.summary.gapPercentage > 0 ? '-' : '+'}{analysis.summary.gapPercentage}%
                        </Text>
                      </BlockStack>
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
                    <Text as="h3" variant="headingMd">Key Insights</Text>
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
                              {insight.type === 'danger' ? 'Action Needed' : insight.type === 'warning' ? 'Warning' : 'Good'}
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
                  <Text as="h3" variant="headingMd">Competitor Comparison</Text>
                  <Divider />
                  <BlockStack gap="300">
                    <Box padding="200" background="bg-surface-secondary" borderRadius="200">
                      <InlineStack align="space-between">
                        <Text as="p" fontWeight="semibold">Your Brand ({analysis.brandName})</Text>
                        <InlineStack gap="200">
                          <Text as="p">{analysis.summary.yourMentionRate}%</Text>
                          <Box minWidth="100px">
                            <ProgressBar
                              progress={analysis.summary.yourMentionRate}
                              tone="success"
                              size="small"
                            />
                          </Box>
                        </InlineStack>
                      </InlineStack>
                    </Box>
                    {analysis.competitors.map((comp) => (
                      <Box key={comp.domain} padding="200" borderRadius="200">
                        <InlineStack align="space-between">
                          <Text as="p">{comp.name || comp.domain}</Text>
                          <InlineStack gap="200">
                            <Text as="p">{comp.mentionRate}%</Text>
                            <Box minWidth="100px">
                              <ProgressBar
                                progress={comp.mentionRate}
                                tone={comp.mentionRate > analysis.summary.yourMentionRate ? 'critical' : 'primary'}
                                size="small"
                              />
                            </Box>
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
                  <Text as="h3" variant="headingMd">Query-by-Query Results</Text>
                  <Divider />
                  <BlockStack gap="400">
                    {analysis.comparisons.map((comp, index) => (
                      <Box key={index} padding="300" background="bg-surface-secondary" borderRadius="200">
                        <BlockStack gap="200">
                          <InlineStack align="space-between">
                            <Text as="p" fontWeight="semibold" truncate>
                              &ldquo;{comp.query}&rdquo;
                            </Text>
                            {comp.winner && (
                              <Badge tone="info">{`Winner: ${comp.winner}`}</Badge>
                            )}
                          </InlineStack>
                          <Text as="p" variant="bodySm" tone="subdued">
                            {comp.gap}
                          </Text>
                          <InlineStack gap="200">
                            <Badge tone={comp.yourBrand.isMentioned ? 'success' : 'critical'}>
                              {`You: ${comp.yourBrand.isMentioned ? `#${comp.yourBrand.position || '?'}` : 'Not found'}`}
                            </Badge>
                            {comp.competitors.slice(0, 3).map((c) => (
                              <Badge key={c.domain} tone={c.isMentioned ? 'attention' : 'new'}>
                                {`${c.name || c.domain}: ${c.isMentioned ? `#${c.position || '?'}` : 'Not found'}`}
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
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h3" variant="headingMd">Tracked Competitors</Text>
                <Badge>{`${data?.competitors.length || 0} / ${data?.limit || 0}`}</Badge>
              </InlineStack>
              <Divider />

              {!data?.competitors.length ? (
                <Box padding="600">
                  <BlockStack gap="300" inlineAlign="center">
                    <Text as="p" tone="subdued">
                      No competitors tracked yet.
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Add competitors to see how you compare in AI search results.
                    </Text>
                    <Button onClick={() => setShowAddModal(true)}>
                      Add Your First Competitor
                    </Button>
                  </BlockStack>
                </Box>
              ) : (
                <ResourceList
                  items={data.competitors}
                  renderItem={(item) => (
                    <ResourceItem
                      id={item.id}
                      accessibilityLabel={`View details for ${item.name || item.domain}`}
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
                          content: 'Remove',
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
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Value Proposition */}
        <Layout.Section>
          <Banner title="Why Track Competitors?">
            <BlockStack gap="200">
              <Text as="p">
                <strong>Competitor Intelligence</strong> shows you exactly where your
                competitors appear in AI recommendations instead of you.
              </Text>
              <Text as="p" variant="bodySm">
                When you know what your competitors do differently, you can improve your
                content strategy to outrank them in AI search results.
              </Text>
            </BlockStack>
          </Banner>
        </Layout.Section>
      </Layout>

      {/* Add Competitor Modal */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Competitor"
        primaryAction={{
          content: 'Add Competitor',
          onAction: addCompetitor,
          loading: adding,
          disabled: !newDomain.trim(),
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setShowAddModal(false),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <TextField
              label="Competitor Domain"
              placeholder="competitor.com or competitor.myshopify.com"
              value={newDomain}
              onChange={setNewDomain}
              autoComplete="off"
              helpText="Enter the domain of a competitor you want to track"
            />
            <TextField
              label="Competitor Name (optional)"
              placeholder="Competitor Brand Name"
              value={newName}
              onChange={setNewName}
              autoComplete="off"
              helpText="A friendly name to identify this competitor"
            />
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
