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
  Select,
  ResourceList,
  ResourceItem,
  ProgressBar,
  Modal,
} from '@shopify/polaris';
import { PlusCircleIcon } from '@shopify/polaris-icons';
import { useAuthenticatedFetch, useShopContext } from '@/components/providers/ShopProvider';
import { NotAuthenticated } from '@/components/admin/NotAuthenticated';
import { useAdminLanguage } from '@/lib/i18n/AdminLanguageContext';

type ABTest = {
  id: string;
  name: string;
  productTitle: string;
  field: string;
  status: 'draft' | 'running' | 'completed' | 'cancelled';
  winner: 'A' | 'B' | 'tie' | null;
  winnerApplied: boolean;
  variantAMentions: number;
  variantBMentions: number;
  totalChecks: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
};

type Quota = {
  canCreate: boolean;
  used: number;
  limit: number;
  remaining: number;
};

export default function ABTestsPage() {
  const { t } = useAdminLanguage();
  const { fetch: authenticatedFetch } = useAuthenticatedFetch();
  const { isLoading: shopLoading, shopDetectionFailed, error: shopError } = useShopContext();
  const [tests, setTests] = useState<ABTest[]>([]);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create test form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTest, setNewTest] = useState({
    name: '',
    productId: '',
    field: 'description',
    variantB: '',
  });

  const fetchTests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('/api/ab-tests');
      if (!response.ok) throw new Error(t.abTests.errorLoadingTests);
      const result = await response.json();
      if (result.success) {
        setTests(result.data.tests);
        setQuota(result.data.quota);
      } else {
        setError(result.error || t.abTests.errorUnknown);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.abTests.errorLoadingTests);
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch, t.abTests.errorLoadingTests, t.abTests.errorUnknown]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const createTest = async () => {
    if (!newTest.name || !newTest.productId || !newTest.variantB) {
      setError(t.abTests.errorFillAllFields);
      return;
    }

    try {
      setCreating(true);
      setError(null);
      const response = await authenticatedFetch('/api/ab-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTest),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t.abTests.errorCreatingTest);
      }
      await fetchTests();
      setShowCreateModal(false);
      setNewTest({ name: '', productId: '', field: 'description', variantB: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.abTests.errorCreatingTest);
    } finally {
      setCreating(false);
    }
  };

  const startTest = async (testId: string) => {
    try {
      setError(null);
      const response = await authenticatedFetch('/api/ab-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', testId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t.abTests.errorStartingTest);
      }
      await fetchTests();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.abTests.errorStartingTest);
    }
  };

  const cancelTest = async (testId: string) => {
    try {
      setError(null);
      const response = await authenticatedFetch('/api/ab-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', testId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t.abTests.errorCancellingTest);
      }
      await fetchTests();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.abTests.errorCancellingTest);
    }
  };

  const applyWinner = async (testId: string) => {
    try {
      setError(null);
      const response = await authenticatedFetch('/api/ab-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'apply', testId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t.abTests.errorApplyingWinner);
      }
      await fetchTests();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.abTests.errorApplyingWinner);
    }
  };

  const deleteTest = async (testId: string) => {
    try {
      setError(null);
      const response = await authenticatedFetch(`/api/ab-tests?id=${testId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t.abTests.errorDeletingTest);
      }
      await fetchTests();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.abTests.errorDeletingTest);
    }
  };

  const getStatusBadge = (status: ABTest['status']) => {
    const tones: Record<string, 'info' | 'attention' | 'success' | 'critical'> = {
      draft: 'info',
      running: 'attention',
      completed: 'success',
      cancelled: 'critical',
    };
    const labels: Record<string, string> = {
      draft: t.abTests.statusDraft,
      running: t.abTests.statusRunning,
      completed: t.abTests.statusCompleted,
      cancelled: t.abTests.statusCancelled,
    };
    return <Badge tone={tones[status]}>{labels[status]}</Badge>;
  };

  const getWinnerBadge = (test: ABTest) => {
    if (!test.winner) return null;
    if (test.winner === 'tie') {
      return <Badge>{t.abTests.tie}</Badge>;
    }
    return (
      <Badge tone="success">{`${t.abTests.variantWins} ${test.winner} ${t.abTests.wins}`}</Badge>
    );
  };

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      description: t.abTests.fieldDescription,
      seo_title: t.abTests.fieldSeoTitle,
      seo_description: t.abTests.fieldSeoDescription,
      tags: t.abTests.fieldTags,
    };
    return labels[field] || field;
  };

  // Show authentication error if shop detection failed
  if (shopDetectionFailed) {
    return <NotAuthenticated error={shopError} />;
  }

  if (loading || shopLoading) {
    return (
      <Page title={t.abTests.title} backAction={{ content: t.abTests.home, url: '/admin' }}>
        <Layout>
          <Layout.Section>
            <Card>
              <Box padding="800">
                <BlockStack gap="400" inlineAlign="center">
                  <Spinner size="large" />
                  <Text as="p">{t.abTests.loading}</Text>
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
      title={t.abTests.title}
      subtitle={t.abTests.subtitle}
      backAction={{ content: t.abTests.home, url: '/admin' }}
      primaryAction={{
        content: t.abTests.createTest,
        icon: PlusCircleIcon,
        onAction: () => setShowCreateModal(true),
        disabled: !quota?.canCreate,
      }}
    >
      <Layout>
        {error && (
          <Layout.Section>
            <Banner tone="critical" title={t.abTests.error} onDismiss={() => setError(null)}>
              <p>{error}</p>
            </Banner>
          </Layout.Section>
        )}

        {/* Welcome Section for New Users */}
        {tests.length === 0 && (
          <Layout.Section>
            <Card>
              <Box padding="600">
                <BlockStack gap="500">
                  <div style={{
                    background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)',
                    padding: '24px',
                    borderRadius: '12px',
                    color: 'white',
                  }}>
                    <BlockStack gap="400">
                      <Text as="h2" variant="headingLg">
                        {t.abTests.welcomeTitle}
                      </Text>
                      <Text as="p">
                        {t.abTests.welcomeDesc}
                      </Text>
                    </BlockStack>
                  </div>

                  <BlockStack gap="300">
                    <Text as="h3" variant="headingMd">{t.abTests.howItWorks}</Text>
                    <InlineStack gap="400" wrap>
                      <Box minWidth="200px" maxWidth="280px">
                        <BlockStack gap="200">
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#0EA5E9',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                          }}>1</div>
                          <Text as="p" fontWeight="semibold">{t.abTests.step1Title}</Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            {t.abTests.step1Desc}
                          </Text>
                        </BlockStack>
                      </Box>
                      <Box minWidth="200px" maxWidth="280px">
                        <BlockStack gap="200">
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#0EA5E9',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                          }}>2</div>
                          <Text as="p" fontWeight="semibold">{t.abTests.step2Title}</Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            {t.abTests.step2Desc}
                          </Text>
                        </BlockStack>
                      </Box>
                      <Box minWidth="200px" maxWidth="280px">
                        <BlockStack gap="200">
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#0EA5E9',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                          }}>3</div>
                          <Text as="p" fontWeight="semibold">{t.abTests.step3Title}</Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            {t.abTests.step3Desc}
                          </Text>
                        </BlockStack>
                      </Box>
                    </InlineStack>
                  </BlockStack>

                  <Box paddingBlockStart="200">
                    <Button variant="primary" size="large" onClick={() => setShowCreateModal(true)}>
                      {t.abTests.createFirstTest}
                    </Button>
                  </Box>
                </BlockStack>
              </Box>
            </Card>
          </Layout.Section>
        )}

        {/* Quota Info */}
        {tests.length > 0 && (
          <Layout.Section>
            <Card>
              <InlineStack align="space-between" blockAlign="center">
                <BlockStack gap="100">
                  <Text as="h3" variant="headingMd">{t.abTests.activeTests}</Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    {quota?.used || 0} {t.abTests.of} {quota?.limit || 0} {t.abTests.testsUsed}
                  </Text>
                </BlockStack>
                <Box minWidth="200px">
                  <ProgressBar
                    progress={quota ? (quota.used / quota.limit) * 100 : 0}
                    tone={quota?.canCreate ? 'primary' : 'critical'}
                    size="small"
                  />
                </Box>
              </InlineStack>
            </Card>
          </Layout.Section>
        )}

        {/* Tests List */}
        {tests.length > 0 && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">{t.abTests.yourTests}</Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    {t.abTests.manageTests}
                  </Text>
                </BlockStack>
                <Divider />

                <ResourceList
                  items={tests}
                  renderItem={(test) => (
                    <ResourceItem
                      id={test.id}
                      accessibilityLabel={`${t.abTests.viewDetails} ${test.name}`}
                      onClick={() => {}}
                    >
                      <BlockStack gap="300">
                        <InlineStack align="space-between" blockAlign="center" wrap>
                          <BlockStack gap="100">
                            <Text as="p" fontWeight="semibold">{test.name}</Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                              {test.productTitle} - {getFieldLabel(test.field)}
                            </Text>
                          </BlockStack>
                          <InlineStack gap="200">
                            {getStatusBadge(test.status)}
                            {getWinnerBadge(test)}
                          </InlineStack>
                        </InlineStack>

                        {test.status === 'completed' && (
                          <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                            <InlineStack gap="400" align="space-between" wrap>
                              <BlockStack gap="100">
                                <Text as="p" variant="bodySm">{t.abTests.variantACurrent}</Text>
                                <Text as="p" fontWeight="semibold">
                                  {test.variantAMentions} {test.variantAMentions !== 1 ? t.abTests.mentions : t.abTests.mention}
                                </Text>
                              </BlockStack>
                              <BlockStack gap="100">
                                <Text as="p" variant="bodySm">{t.abTests.variantBTest}</Text>
                                <Text as="p" fontWeight="semibold">
                                  {test.variantBMentions} {test.variantBMentions !== 1 ? t.abTests.mentions : t.abTests.mention}
                                </Text>
                              </BlockStack>
                              <BlockStack gap="100">
                                <Text as="p" variant="bodySm">{t.abTests.totalChecks}</Text>
                                <Text as="p" fontWeight="semibold">{test.totalChecks}</Text>
                              </BlockStack>
                            </InlineStack>
                          </Box>
                        )}

                        <InlineStack gap="200">
                          {test.status === 'draft' && (
                            <>
                              <Button size="slim" variant="primary" onClick={() => startTest(test.id)}>
                                {t.abTests.start}
                              </Button>
                              <Button
                                size="slim"
                                tone="critical"
                                onClick={() => deleteTest(test.id)}
                              >
                                {t.abTests.delete}
                              </Button>
                            </>
                          )}
                          {test.status === 'running' && (
                            <Button size="slim" onClick={() => cancelTest(test.id)}>
                              {t.abTests.cancel}
                            </Button>
                          )}
                          {test.status === 'completed' && !test.winnerApplied && test.winner !== 'tie' && (
                            <Button
                              size="slim"
                              variant="primary"
                              onClick={() => applyWinner(test.id)}
                            >
                              {t.abTests.applyWinner}
                            </Button>
                          )}
                          {test.status === 'completed' && test.winnerApplied && (
                            <Badge tone="success">{t.abTests.winnerApplied}</Badge>
                          )}
                          {(test.status === 'completed' || test.status === 'cancelled') && (
                            <Button
                              size="slim"
                              tone="critical"
                              onClick={() => deleteTest(test.id)}
                            >
                              {t.abTests.delete}
                            </Button>
                          )}
                        </InlineStack>
                      </BlockStack>
                    </ResourceItem>
                  )}
                />
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

        {/* Tips */}
        {tests.length > 0 && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">{t.abTests.tipsTitle}</Text>
                <Divider />
                <BlockStack gap="200">
                  <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                    <BlockStack gap="100">
                      <Text as="p" fontWeight="semibold">{t.abTests.tip1Title}</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        {t.abTests.tip1Desc}
                      </Text>
                    </BlockStack>
                  </Box>
                  <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                    <BlockStack gap="100">
                      <Text as="p" fontWeight="semibold">{t.abTests.tip2Title}</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        {t.abTests.tip2Desc}
                      </Text>
                    </BlockStack>
                  </Box>
                  <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                    <BlockStack gap="100">
                      <Text as="p" fontWeight="semibold">{t.abTests.tip3Title}</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        {t.abTests.tip3Desc}
                      </Text>
                    </BlockStack>
                  </Box>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}
      </Layout>

      {/* Create Test Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t.abTests.createTestModal}
        primaryAction={{
          content: t.abTests.createTestAction,
          onAction: createTest,
          loading: creating,
          disabled: !newTest.name || !newTest.productId || !newTest.variantB,
        }}
        secondaryActions={[
          {
            content: t.abTests.cancelAction,
            onAction: () => setShowCreateModal(false),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Banner tone="info">
              <Text as="p" variant="bodySm">
                {t.abTests.createTestInfo}
              </Text>
            </Banner>
            <TextField
              label={t.abTests.testName}
              placeholder={t.abTests.testNamePlaceholder}
              value={newTest.name}
              onChange={(value) => setNewTest({ ...newTest, name: value })}
              autoComplete="off"
              helpText={t.abTests.testNameHelp}
            />
            <TextField
              label={t.abTests.productId}
              placeholder={t.abTests.productIdPlaceholder}
              value={newTest.productId}
              onChange={(value) => setNewTest({ ...newTest, productId: value })}
              autoComplete="off"
              helpText={t.abTests.productIdHelp}
            />
            <Select
              label={t.abTests.fieldToTest}
              options={[
                { label: t.abTests.fieldDescription, value: 'description' },
                { label: t.abTests.fieldSeoTitle, value: 'seo_title' },
                { label: t.abTests.fieldSeoDescription, value: 'seo_description' },
                { label: t.abTests.fieldTags, value: 'tags' },
              ]}
              value={newTest.field}
              onChange={(value) => setNewTest({ ...newTest, field: value })}
            />
            <TextField
              label={t.abTests.variantBContent}
              placeholder={t.abTests.variantBPlaceholder}
              value={newTest.variantB}
              onChange={(value) => setNewTest({ ...newTest, variantB: value })}
              multiline={4}
              autoComplete="off"
              helpText={t.abTests.variantBHelp}
            />
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
