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
  DataTable,
  ProgressBar,
  Filters,
  ChoiceList,
  Pagination,
} from '@shopify/polaris';
import { useAuthenticatedFetch, useShopContext } from '@/components/providers/ShopProvider';

type ProductIssue = {
  code: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  recommendation: string;
};

type ProductAudit = {
  id: string;
  shopifyProductId: string;
  title: string;
  handle: string;
  aiScore: number;
  issues: ProductIssue[];
  hasImages: boolean;
  hasDescription: boolean;
  hasMetafields: boolean;
  descriptionLength: number;
  lastAuditAt: string;
};

type AuditData = {
  totalProducts: number;
  auditedProducts: number;
  averageScore: number;
  lastAuditAt: string | null;
  issues: {
    critical: number;
    warning: number;
    info: number;
  };
  products: ProductAudit[];
};

export default function AuditPage() {
  const [data, setData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [auditing, setAuditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const { fetch: authFetch } = useAuthenticatedFetch();
  const { isLoading: shopLoading, isAuthenticated } = useShopContext();

  const fetchAudit = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authFetch('/api/audit');
      if (!response.ok) throw new Error('Failed to fetch audit data');
      const result = await response.json();
      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (!shopLoading && isAuthenticated) {
      fetchAudit();
    }
  }, [fetchAudit, shopLoading, isAuthenticated]);

  const runAudit = async () => {
    try {
      setAuditing(true);
      setError(null);
      const response = await authFetch('/api/audit', { method: 'POST' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Audit failed');
      }
      await fetchAudit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Audit failed');
    } finally {
      setAuditing(false);
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return <Badge tone="success">Excellent</Badge>;
    if (score >= 70) return <Badge tone="success">Good</Badge>;
    if (score >= 40) return <Badge tone="warning">Needs Work</Badge>;
    return <Badge tone="critical">Critical</Badge>;
  };

  const getScoreColor = (score: number): "success" | "highlight" | "critical" => {
    if (score >= 70) return 'success';
    if (score >= 40) return 'highlight';
    return 'critical';
  };


  // Filter products based on selected filter
  const filteredProducts = data?.products.filter((product) => {
    if (selectedFilter.length === 0) return true;
    if (selectedFilter.includes('critical') && product.aiScore < 40) return true;
    if (selectedFilter.includes('warning') && product.aiScore >= 40 && product.aiScore < 70) return true;
    if (selectedFilter.includes('good') && product.aiScore >= 70) return true;
    return false;
  }) || [];

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleFilterChange = (selected: string[]) => {
    setSelectedFilter(selected);
    setCurrentPage(1);
  };

  if (loading || shopLoading) {
    return (
      <Page title="Product Audit" backAction={{ content: 'Dashboard', url: '/admin' }}>
        <Layout>
          <Layout.Section>
            <Card>
              <Box padding="800">
                <InlineStack align="center" blockAlign="center">
                  <Spinner size="large" />
                  <Text as="p">Loading audit data...</Text>
                </InlineStack>
              </Box>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  const tableRows = paginatedProducts.map((product) => [
    <BlockStack key={product.id} gap="100">
      <Text as="p" fontWeight="semibold" truncate>{product.title}</Text>
      <Text as="p" variant="bodySm" tone="subdued">/{product.handle}</Text>
    </BlockStack>,
    <InlineStack key={`score-${product.id}`} gap="200" blockAlign="center">
      <Box width="60px">
        <ProgressBar
          progress={product.aiScore}
          tone={getScoreColor(product.aiScore)}
          size="small"
        />
      </Box>
      <Text as="p" fontWeight="semibold">{product.aiScore}</Text>
    </InlineStack>,
    getScoreBadge(product.aiScore),
    <InlineStack key={`issues-${product.id}`} gap="100">
      {product.issues.length === 0 ? (
        <Text as="p" tone="subdued">No issues</Text>
      ) : (
        <>
          {product.issues.filter(i => i.severity === 'critical').length > 0 && (
            <Badge tone="critical">{String(product.issues.filter(i => i.severity === 'critical').length)}</Badge>
          )}
          {product.issues.filter(i => i.severity === 'warning').length > 0 && (
            <Badge tone="warning">{String(product.issues.filter(i => i.severity === 'warning').length)}</Badge>
          )}
        </>
      )}
    </InlineStack>,
    <InlineStack key={`features-${product.id}`} gap="100">
      {product.hasImages ? (
        <Badge tone="success">Images</Badge>
      ) : (
        <Badge tone="critical">No Images</Badge>
      )}
      {product.hasDescription ? (
        <Badge tone="success">Desc</Badge>
      ) : (
        <Badge tone="critical">No Desc</Badge>
      )}
    </InlineStack>,
  ]);

  return (
    <Page
      title="Product Audit"
      backAction={{ content: 'Dashboard', url: '/admin' }}
      primaryAction={{
        content: 'Re-run Audit',
        onAction: runAudit,
        loading: auditing,
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

        {/* Summary Stats */}
        <Layout.Section>
          <InlineStack gap="400" align="start">
            <Box minWidth="200px">
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm" tone="subdued">Average Score</Text>
                  <Text as="p" variant="heading2xl" fontWeight="bold">
                    {data?.averageScore ?? 0}
                  </Text>
                  <Box width="100%">
                    <ProgressBar
                      progress={data?.averageScore ?? 0}
                      tone={getScoreColor(data?.averageScore ?? 0)}
                      size="small"
                    />
                  </Box>
                </BlockStack>
              </Card>
            </Box>

            <Box minWidth="200px">
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm" tone="subdued">Products Audited</Text>
                  <Text as="p" variant="heading2xl" fontWeight="bold">
                    {data?.auditedProducts ?? 0}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    of {data?.totalProducts ?? 0} total
                  </Text>
                </BlockStack>
              </Card>
            </Box>

            <Box minWidth="200px">
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm" tone="subdued">Critical Issues</Text>
                  <Text as="p" variant="heading2xl" fontWeight="bold" tone="critical">
                    {data?.issues.critical ?? 0}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    products need attention
                  </Text>
                </BlockStack>
              </Card>
            </Box>

            <Box minWidth="200px">
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm" tone="subdued">Last Audit</Text>
                  <Text as="p" variant="headingLg" fontWeight="semibold">
                    {data?.lastAuditAt
                      ? new Date(data.lastAuditAt).toLocaleDateString()
                      : 'Never'}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    {data?.lastAuditAt
                      ? new Date(data.lastAuditAt).toLocaleTimeString()
                      : 'Run your first audit'}
                  </Text>
                </BlockStack>
              </Card>
            </Box>
          </InlineStack>
        </Layout.Section>

        {/* Issue Summary */}
        {(data?.issues.critical ?? 0) > 0 || (data?.issues.warning ?? 0) > 0 ? (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">Issues Summary</Text>
                <Divider />
                <InlineStack gap="400">
                  {(data?.issues.critical ?? 0) > 0 && (
                    <Box padding="300" background="bg-surface-critical" borderRadius="200">
                      <BlockStack gap="100">
                        <Badge tone="critical">Critical</Badge>
                        <Text as="p" fontWeight="semibold">
                          {data?.issues.critical} products
                        </Text>
                        <Text as="p" variant="bodySm">
                          Missing essential data (images, descriptions)
                        </Text>
                      </BlockStack>
                    </Box>
                  )}
                  {(data?.issues.warning ?? 0) > 0 && (
                    <Box padding="300" background="bg-surface-warning" borderRadius="200">
                      <BlockStack gap="100">
                        <Badge tone="warning">Warning</Badge>
                        <Text as="p" fontWeight="semibold">
                          {data?.issues.warning} products
                        </Text>
                        <Text as="p" variant="bodySm">
                          Short descriptions or missing metafields
                        </Text>
                      </BlockStack>
                    </Box>
                  )}
                  {(data?.issues.info ?? 0) > 0 && (
                    <Box padding="300" background="bg-surface-info" borderRadius="200">
                      <BlockStack gap="100">
                        <Badge tone="info">Tips</Badge>
                        <Text as="p" fontWeight="semibold">
                          {data?.issues.info} products
                        </Text>
                        <Text as="p" variant="bodySm">
                          Could be optimized further
                        </Text>
                      </BlockStack>
                    </Box>
                  )}
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        ) : null}

        {/* Products Table */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h3" variant="headingMd">Products ({filteredProducts.length})</Text>
                <Filters
                  queryValue=""
                  filters={[
                    {
                      key: 'status',
                      label: 'Status',
                      filter: (
                        <ChoiceList
                          title="Status"
                          titleHidden
                          choices={[
                            { label: 'Critical (< 40)', value: 'critical' },
                            { label: 'Needs Work (40-69)', value: 'warning' },
                            { label: 'Good (70+)', value: 'good' },
                          ]}
                          selected={selectedFilter}
                          onChange={handleFilterChange}
                          allowMultiple
                        />
                      ),
                      shortcut: true,
                    },
                  ]}
                  appliedFilters={selectedFilter.map((filter) => ({
                    key: filter,
                    label: filter === 'critical' ? 'Critical' : filter === 'warning' ? 'Needs Work' : 'Good',
                    onRemove: () => handleFilterChange(selectedFilter.filter((f) => f !== filter)),
                  }))}
                  onClearAll={() => handleFilterChange([])}
                  onQueryChange={() => {}}
                  onQueryClear={() => {}}
                />
              </InlineStack>
              <Divider />
              {(data?.products.length ?? 0) === 0 ? (
                <Box padding="400">
                  <BlockStack gap="200" inlineAlign="center">
                    <Text as="p" tone="subdued">No products audited yet.</Text>
                    <Button onClick={runAudit} loading={auditing}>
                      Run Your First Audit
                    </Button>
                  </BlockStack>
                </Box>
              ) : (
                <>
                  <DataTable
                    columnContentTypes={['text', 'text', 'text', 'text', 'text']}
                    headings={['Product', 'Score', 'Status', 'Issues', 'Features']}
                    rows={tableRows}
                  />
                  {totalPages > 1 && (
                    <InlineStack align="center">
                      <Pagination
                        hasPrevious={currentPage > 1}
                        hasNext={currentPage < totalPages}
                        onPrevious={() => setCurrentPage((p) => p - 1)}
                        onNext={() => setCurrentPage((p) => p + 1)}
                      />
                    </InlineStack>
                  )}
                </>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Tips */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">How to Improve Your Score</Text>
              <Divider />
              <BlockStack gap="200">
                <Box padding="200" background="bg-surface-secondary" borderRadius="200">
                  <InlineStack gap="200" blockAlign="start">
                    <Badge tone="critical">Fix First</Badge>
                    <BlockStack gap="100">
                      <Text as="p" fontWeight="semibold">Add missing images and descriptions</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Products without images or descriptions are almost never recommended by AI.
                      </Text>
                    </BlockStack>
                  </InlineStack>
                </Box>
                <Box padding="200" background="bg-surface-secondary" borderRadius="200">
                  <InlineStack gap="200" blockAlign="start">
                    <Badge tone="warning">Then Improve</Badge>
                    <BlockStack gap="100">
                      <Text as="p" fontWeight="semibold">Write detailed descriptions (100+ characters)</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Include features, materials, use cases, and benefits.
                      </Text>
                    </BlockStack>
                  </InlineStack>
                </Box>
                <Box padding="200" background="bg-surface-secondary" borderRadius="200">
                  <InlineStack gap="200" blockAlign="start">
                    <Badge tone="info">Optimize</Badge>
                    <BlockStack gap="100">
                      <Text as="p" fontWeight="semibold">Add product type, vendor, and tags</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Help AI understand and categorize your products correctly.
                      </Text>
                    </BlockStack>
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
