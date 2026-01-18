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
  Select,
  ResourceList,
  ResourceItem,
  ProgressBar,
  Modal,
} from '@shopify/polaris';
import { PlusCircleIcon } from '@shopify/polaris-icons';
import { useAuthenticatedFetch, useShopContext } from '@/components/providers/ShopProvider';
import { NotAuthenticated } from '@/components/admin/NotAuthenticated';

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
      if (!response.ok) throw new Error('Failed to fetch tests');
      const result = await response.json();
      if (result.success) {
        setTests(result.data.tests);
        setQuota(result.data.quota);
      } else {
        setError(result.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tests');
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const createTest = async () => {
    if (!newTest.name || !newTest.productId || !newTest.variantB) {
      setError('Please fill in all required fields');
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
        throw new Error(errorData.error || 'Failed to create test');
      }
      await fetchTests();
      setShowCreateModal(false);
      setNewTest({ name: '', productId: '', field: 'description', variantB: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create test');
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
        throw new Error(errorData.error || 'Failed to start test');
      }
      await fetchTests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start test');
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
        throw new Error(errorData.error || 'Failed to cancel test');
      }
      await fetchTests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel test');
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
        throw new Error(errorData.error || 'Failed to apply winner');
      }
      await fetchTests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply winner');
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
        throw new Error(errorData.error || 'Failed to delete test');
      }
      await fetchTests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete test');
    }
  };

  const getStatusBadge = (status: ABTest['status']) => {
    const tones: Record<string, 'info' | 'attention' | 'success' | 'critical'> = {
      draft: 'info',
      running: 'attention',
      completed: 'success',
      cancelled: 'critical',
    };
    return <Badge tone={tones[status]}>{status}</Badge>;
  };

  const getWinnerBadge = (test: ABTest) => {
    if (!test.winner) return null;
    if (test.winner === 'tie') {
      return <Badge>Tie</Badge>;
    }
    return (
      <Badge tone="success">{`Variant ${test.winner} Wins`}</Badge>
    );
  };

  // Show authentication error if shop detection failed
  if (shopDetectionFailed) {
    return <NotAuthenticated error={shopError} />;
  }

  if (loading || shopLoading) {
    return (
      <Page title="A/B Testing" backAction={{ content: 'Dashboard', url: '/admin' }}>
        <Layout>
          <Layout.Section>
            <Card>
              <Box padding="800">
                <InlineStack align="center" blockAlign="center">
                  <Spinner size="large" />
                  <Text as="p">Loading A/B tests...</Text>
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
      title="A/B Testing"
      backAction={{ content: 'Dashboard', url: '/admin' }}
      primaryAction={{
        content: 'Create Test',
        icon: PlusCircleIcon,
        onAction: () => setShowCreateModal(true),
        disabled: !quota?.canCreate,
      }}
    >
      <Layout>
        {error && (
          <Layout.Section>
            <Banner tone="critical" title="Error" onDismiss={() => setError(null)}>
              <p>{error}</p>
            </Banner>
          </Layout.Section>
        )}

        {/* Quota Info */}
        <Layout.Section>
          <Card>
            <InlineStack align="space-between" blockAlign="center">
              <BlockStack gap="100">
                <Text as="h3" variant="headingMd">Active Tests</Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  {quota?.used || 0} of {quota?.limit || 0} tests in use
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

        {/* Tests List */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">Your Tests</Text>
              <Divider />

              {tests.length === 0 ? (
                <Box padding="600">
                  <BlockStack gap="300" inlineAlign="center">
                    <Text as="p" tone="subdued">
                      No A/B tests yet.
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Test different content variations to see which performs better with AI.
                    </Text>
                    <Button onClick={() => setShowCreateModal(true)}>
                      Create Your First Test
                    </Button>
                  </BlockStack>
                </Box>
              ) : (
                <ResourceList
                  items={tests}
                  renderItem={(test) => (
                    <ResourceItem
                      id={test.id}
                      accessibilityLabel={`View details for ${test.name}`}
                      onClick={() => {}}
                    >
                      <BlockStack gap="300">
                        <InlineStack align="space-between" blockAlign="center">
                          <BlockStack gap="100">
                            <Text as="p" fontWeight="semibold">{test.name}</Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                              {test.productTitle} - {test.field}
                            </Text>
                          </BlockStack>
                          <InlineStack gap="200">
                            {getStatusBadge(test.status)}
                            {getWinnerBadge(test)}
                          </InlineStack>
                        </InlineStack>

                        {test.status === 'completed' && (
                          <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                            <InlineStack gap="400" align="space-between">
                              <BlockStack gap="100">
                                <Text as="p" variant="bodySm">Variant A (Control)</Text>
                                <Text as="p" fontWeight="semibold">
                                  {test.variantAMentions} mentions
                                </Text>
                              </BlockStack>
                              <BlockStack gap="100">
                                <Text as="p" variant="bodySm">Variant B (Test)</Text>
                                <Text as="p" fontWeight="semibold">
                                  {test.variantBMentions} mentions
                                </Text>
                              </BlockStack>
                              <BlockStack gap="100">
                                <Text as="p" variant="bodySm">Total Checks</Text>
                                <Text as="p" fontWeight="semibold">{test.totalChecks}</Text>
                              </BlockStack>
                            </InlineStack>
                          </Box>
                        )}

                        <InlineStack gap="200">
                          {test.status === 'draft' && (
                            <>
                              <Button size="slim" onClick={() => startTest(test.id)}>
                                Start Test
                              </Button>
                              <Button
                                size="slim"
                                tone="critical"
                                onClick={() => deleteTest(test.id)}
                              >
                                Delete
                              </Button>
                            </>
                          )}
                          {test.status === 'running' && (
                            <Button size="slim" onClick={() => cancelTest(test.id)}>
                              Cancel
                            </Button>
                          )}
                          {test.status === 'completed' && !test.winnerApplied && test.winner !== 'tie' && (
                            <Button
                              size="slim"
                              variant="primary"
                              onClick={() => applyWinner(test.id)}
                            >
                              Apply Winner
                            </Button>
                          )}
                          {test.status === 'completed' && test.winnerApplied && (
                            <Badge tone="success">Winner Applied</Badge>
                          )}
                          {(test.status === 'completed' || test.status === 'cancelled') && (
                            <Button
                              size="slim"
                              tone="critical"
                              onClick={() => deleteTest(test.id)}
                            >
                              Delete
                            </Button>
                          )}
                        </InlineStack>
                      </BlockStack>
                    </ResourceItem>
                  )}
                />
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* How it works */}
        <Layout.Section>
          <Banner title="How A/B Testing Works">
            <BlockStack gap="200">
              <Text as="p">
                <strong>1. Create a test</strong> — Choose a product and write an alternative version of its content.
              </Text>
              <Text as="p">
                <strong>2. Run the test</strong> — We simulate AI queries with both content versions.
              </Text>
              <Text as="p">
                <strong>3. See results</strong> — Find out which version gets mentioned more by AI.
              </Text>
              <Text as="p">
                <strong>4. Apply the winner</strong> — Update your product with the winning content.
              </Text>
            </BlockStack>
          </Banner>
        </Layout.Section>
      </Layout>

      {/* Create Test Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create A/B Test"
        primaryAction={{
          content: 'Create Test',
          onAction: createTest,
          loading: creating,
          disabled: !newTest.name || !newTest.productId || !newTest.variantB,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setShowCreateModal(false),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <TextField
              label="Test Name"
              placeholder="e.g., Product Description Test v1"
              value={newTest.name}
              onChange={(value) => setNewTest({ ...newTest, name: value })}
              autoComplete="off"
            />
            <TextField
              label="Product ID"
              placeholder="Shopify Product ID"
              value={newTest.productId}
              onChange={(value) => setNewTest({ ...newTest, productId: value })}
              autoComplete="off"
              helpText="Enter the numeric Shopify product ID"
            />
            <Select
              label="Field to Test"
              options={[
                { label: 'Description', value: 'description' },
                { label: 'SEO Title', value: 'seo_title' },
                { label: 'SEO Description', value: 'seo_description' },
                { label: 'Tags', value: 'tags' },
              ]}
              value={newTest.field}
              onChange={(value) => setNewTest({ ...newTest, field: value })}
            />
            <TextField
              label="Variant B (Test Content)"
              placeholder="Enter the alternative content to test..."
              value={newTest.variantB}
              onChange={(value) => setNewTest({ ...newTest, variantB: value })}
              multiline={4}
              autoComplete="off"
              helpText="This will be compared against the current content (Variant A)"
            />
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
