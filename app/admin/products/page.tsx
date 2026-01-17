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
  DataTable,
  ProgressBar,
  Filters,
  ChoiceList,
  Pagination,
  Modal,
  Tabs,
} from '@shopify/polaris';
import {
  RefreshIcon,
  ClipboardIcon,
  MagicIcon,
} from '@shopify/polaris-icons';
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

interface OptimizationSuggestion {
  field: string;
  original: string;
  suggested: string;
  reasoning: string;
  improvement: string;
}

interface ProductOptimization {
  productId: string;
  title: string;
  handle: string;
  currentScore: number;
  estimatedNewScore: number;
  suggestions: OptimizationSuggestion[];
}

interface QuotaInfo {
  used: number;
  limit: number;
  remaining: number;
  available: boolean;
}

type SortColumn = 'title' | 'score' | 'status';
type SortDirection = 'asc' | 'desc';

export default function ProductsPage() {
  const [data, setData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [auditing, setAuditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTab, setSelectedTab] = useState(0);
  const [sortColumn, setSortColumn] = useState<SortColumn>('score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const itemsPerPage = 15;

  // Optimization state
  const [optimizing, setOptimizing] = useState(false);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductAudit | null>(null);
  const [optimization, setOptimization] = useState<ProductOptimization | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const { fetch: authFetch } = useAuthenticatedFetch();
  const { isLoading: shopLoading, isAuthenticated } = useShopContext();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [auditResponse, optimizeResponse] = await Promise.all([
        authFetch('/api/audit'),
        authFetch('/api/optimize'),
      ]);

      if (!auditResponse.ok) throw new Error('Unable to load your products');

      const auditResult = await auditResponse.json();
      if (auditResult.success) {
        setData(auditResult.data);
        setError(null);
      } else {
        setError(auditResult.error || 'Something went wrong');
      }

      if (optimizeResponse.ok) {
        const optimizeResult = await optimizeResponse.json();
        if (optimizeResult.success) {
          setQuota(optimizeResult.data.quota);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load your products');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (!shopLoading && isAuthenticated) {
      fetchData();
    }
  }, [fetchData, shopLoading, isAuthenticated]);

  const runAudit = async () => {
    try {
      setAuditing(true);
      setError(null);
      const response = await authFetch('/api/audit', { method: 'POST' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAuditing(false);
    }
  };

  const handleOptimize = async (product: ProductAudit) => {
    try {
      setOptimizing(true);
      setError(null);
      setSelectedProduct(product);
      setShowModal(true);
      setOptimization(null);

      const response = await authFetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.shopifyProductId }),
      });

      const result = await response.json();

      if (result.success) {
        setOptimization(result.data.optimization);
        setQuota(result.data.quota);
      } else {
        setError(result.error || 'Failed to generate suggestions');
        setShowModal(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to optimize');
      setShowModal(false);
    } finally {
      setOptimizing(false);
    }
  };

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setError('Failed to copy');
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return <Badge tone="success">Excellent</Badge>;
    if (score >= 70) return <Badge tone="success">Good</Badge>;
    if (score >= 40) return <Badge tone="warning">Needs work</Badge>;
    return <Badge tone="critical">Fix now</Badge>;
  };

  const getScoreColor = (score: number): "success" | "highlight" | "critical" => {
    if (score >= 70) return 'success';
    if (score >= 40) return 'highlight';
    return 'critical';
  };

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      description: 'Description',
      seoTitle: 'Page Title',
      seoDescription: 'Page Description',
      tags: 'Tags',
      altText: 'Image Description',
    };
    return labels[field] || field;
  };

  // Sort function
  const sortProducts = (products: ProductAudit[]) => {
    return [...products].sort((a, b) => {
      let comparison = 0;
      switch (sortColumn) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'score':
          comparison = a.aiScore - b.aiScore;
          break;
        case 'status':
          // Sort by: critical (no image/desc) first, then warning, then good
          const getStatusPriority = (p: ProductAudit) => {
            if (!p.hasImages || !p.hasDescription) return 0;
            if (p.aiScore < 70) return 1;
            return 2;
          };
          comparison = getStatusPriority(a) - getStatusPriority(b);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Filter products
  const filteredProducts = data?.products.filter((product) => {
    if (selectedFilter.length === 0) return true;
    if (selectedFilter.includes('critical') && product.aiScore < 40) return true;
    if (selectedFilter.includes('warning') && product.aiScore >= 40 && product.aiScore < 70) return true;
    if (selectedFilter.includes('good') && product.aiScore >= 70) return true;
    return false;
  }) || [];

  // Sort filtered products
  const sortedProducts = sortProducts(filteredProducts);

  // Get products needing improvement (sorted by score, lowest first)
  const productsNeedingWork = sortProducts(data?.products.filter(p => p.aiScore < 70) || []);

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleFilterChange = (selected: string[]) => {
    setSelectedFilter(selected);
    setCurrentPage(1);
  };

  // Loading state
  if (loading || shopLoading) {
    return (
      <Page title="Your Products" backAction={{ content: 'Home', url: '/admin' }}>
        <Layout>
          <Layout.Section>
            <Card>
              <Box padding="1000">
                <BlockStack gap="400" inlineAlign="center">
                  <Spinner size="large" />
                  <Text as="p" variant="bodyLg">Loading your products...</Text>
                </BlockStack>
              </Box>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  const hasProducts = (data?.auditedProducts ?? 0) > 0;
  const criticalCount = data?.issues.critical ?? 0;
  const warningCount = data?.issues.warning ?? 0;

  const tabs = [
    { id: 'all', content: `All Products (${sortedProducts.length})` },
    { id: 'improve', content: `Need Improvement (${productsNeedingWork.length})` },
  ];

  const displayProducts = selectedTab === 0 ? paginatedProducts : productsNeedingWork.slice(0, 15);

  const tableRows = displayProducts.map((product) => [
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
    <InlineStack key={`status-${product.id}`} gap="100">
      {!product.hasImages && <Badge tone="critical">No images</Badge>}
      {!product.hasDescription && <Badge tone="critical">No description</Badge>}
      {product.hasImages && product.hasDescription && product.aiScore >= 70 && (
        <Badge tone="success">Ready</Badge>
      )}
    </InlineStack>,
    <Button
      key={`action-${product.id}`}
      icon={MagicIcon}
      onClick={() => handleOptimize(product)}
      disabled={!quota?.available || product.aiScore >= 90}
      size="slim"
    >
      Improve
    </Button>,
  ]);

  return (
    <Page
      title="Your Products"
      subtitle="See how AI-ready your products are"
      backAction={{ content: 'Home', url: '/admin' }}
      primaryAction={{
        content: auditing ? 'Analyzing...' : 'Analyze Products',
        onAction: runAudit,
        loading: auditing,
      }}
      secondaryActions={[
        {
          content: 'Refresh',
          icon: RefreshIcon,
          onAction: fetchData,
        },
      ]}
    >
      <Layout>
        {error && (
          <Layout.Section>
            <Banner tone="critical" title="Something went wrong" onDismiss={() => setError(null)}>
              <p>{error}</p>
            </Banner>
          </Layout.Section>
        )}

        {/* Summary Stats */}
        <Layout.Section>
          <InlineStack gap="400" align="start">
            <Box minWidth="180px">
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="bodySm" tone="subdued">Average Score</Text>
                  <InlineStack gap="200" blockAlign="center">
                    <Text as="p" variant="heading2xl" fontWeight="bold">
                      {hasProducts ? data?.averageScore ?? 0 : '--'}
                    </Text>
                    {hasProducts && getScoreBadge(data?.averageScore ?? 0)}
                  </InlineStack>
                  {hasProducts && (
                    <Box width="100%">
                      <ProgressBar
                        progress={data?.averageScore ?? 0}
                        tone={getScoreColor(data?.averageScore ?? 0)}
                        size="small"
                      />
                    </Box>
                  )}
                </BlockStack>
              </Card>
            </Box>

            <Box minWidth="180px">
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="bodySm" tone="subdued">Products Analyzed</Text>
                  <Text as="p" variant="heading2xl" fontWeight="bold">
                    {data?.auditedProducts ?? 0}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    of {data?.totalProducts ?? 0} total
                  </Text>
                </BlockStack>
              </Card>
            </Box>

            {criticalCount > 0 && (
              <Box minWidth="180px">
                <Card>
                  <BlockStack gap="200">
                    <Text as="h3" variant="bodySm" tone="subdued">Need Urgent Fix</Text>
                    <Text as="p" variant="heading2xl" fontWeight="bold" tone="critical">
                      {criticalCount}
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      missing images or descriptions
                    </Text>
                  </BlockStack>
                </Card>
              </Box>
            )}

            {warningCount > 0 && (
              <Box minWidth="180px">
                <Card>
                  <BlockStack gap="200">
                    <Text as="h3" variant="bodySm" tone="subdued">Can Be Improved</Text>
                    <Text as="p" variant="heading2xl" fontWeight="bold">
                      {warningCount}
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      short descriptions or missing details
                    </Text>
                  </BlockStack>
                </Card>
              </Box>
            )}

            {quota && (
              <Box minWidth="180px">
                <Card>
                  <BlockStack gap="200">
                    <Text as="h3" variant="bodySm" tone="subdued">AI Improvements Left</Text>
                    <Text as="p" variant="heading2xl" fontWeight="bold">
                      {quota.remaining}
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      this month
                    </Text>
                  </BlockStack>
                </Card>
              </Box>
            )}
          </InlineStack>
        </Layout.Section>

        {/* Products Table */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
                <Box paddingBlockStart="400">
                  {selectedTab === 0 && (
                    <InlineStack align="end" blockAlign="center">
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
                                  { label: 'Fix now (score < 40)', value: 'critical' },
                                  { label: 'Needs work (40-69)', value: 'warning' },
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
                          label: filter === 'critical' ? 'Fix now' : filter === 'warning' ? 'Needs work' : 'Good',
                          onRemove: () => handleFilterChange(selectedFilter.filter((f) => f !== filter)),
                        }))}
                        onClearAll={() => handleFilterChange([])}
                        onQueryChange={() => {}}
                        onQueryClear={() => {}}
                      />
                    </InlineStack>
                  )}
                </Box>
              </Tabs>

              <Divider />

              {!hasProducts ? (
                <Box padding="600">
                  <BlockStack gap="300" inlineAlign="center">
                    <Text as="p" variant="headingMd">No products analyzed yet</Text>
                    <Text as="p" tone="subdued">
                      Click &quot;Analyze Products&quot; to see how AI-ready your products are.
                    </Text>
                    <Box paddingBlockStart="200">
                      <Button variant="primary" onClick={runAudit} loading={auditing}>
                        Analyze Products
                      </Button>
                    </Box>
                  </BlockStack>
                </Box>
              ) : (
                <>
                  <DataTable
                    columnContentTypes={['text', 'text', 'text', 'text', 'text']}
                    headings={[
                      <InlineStack key="h-product" gap="100" blockAlign="center">
                        <Button variant="plain" onClick={() => handleSort('title')}>
                          {`Product ${sortColumn === 'title' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}`}
                        </Button>
                      </InlineStack>,
                      <InlineStack key="h-score" gap="100" blockAlign="center">
                        <Button variant="plain" onClick={() => handleSort('score')}>
                          {`Score ${sortColumn === 'score' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}`}
                        </Button>
                      </InlineStack>,
                      <InlineStack key="h-status" gap="100" blockAlign="center">
                        <Button variant="plain" onClick={() => handleSort('status')}>
                          {`Status ${sortColumn === 'status' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}`}
                        </Button>
                      </InlineStack>,
                      'Issues',
                      'Action',
                    ]}
                    rows={tableRows}
                  />
                  {selectedTab === 0 && totalPages > 1 && (
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
        {hasProducts && (criticalCount > 0 || warningCount > 0) && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">How to Improve Your Products</Text>
                <Divider />
                <BlockStack gap="200">
                  {criticalCount > 0 && (
                    <Box padding="300" background="bg-surface-critical" borderRadius="200">
                      <BlockStack gap="100">
                        <Text as="p" fontWeight="semibold">Add images and descriptions</Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          Products without images or descriptions are almost never recommended by AI assistants.
                        </Text>
                      </BlockStack>
                    </Box>
                  )}
                  <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                    <BlockStack gap="100">
                      <Text as="p" fontWeight="semibold">Write detailed descriptions</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Include materials, sizes, colors, and use cases. Aim for 150+ words.
                      </Text>
                    </BlockStack>
                  </Box>
                  <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                    <BlockStack gap="100">
                      <Text as="p" fontWeight="semibold">Use the &quot;Improve&quot; button</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Get AI-powered suggestions to make your content more discoverable.
                      </Text>
                    </BlockStack>
                  </Box>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}
      </Layout>

      {/* Optimization Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={selectedProduct ? `Improve: ${selectedProduct.title}` : 'Improve Product'}
        primaryAction={
          optimization
            ? {
                content: 'Done',
                onAction: () => setShowModal(false),
              }
            : undefined
        }
      >
        <Modal.Section>
          {optimizing ? (
            <Box padding="800">
              <BlockStack gap="400" inlineAlign="center">
                <Spinner size="large" />
                <Text as="p">Creating suggestions...</Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  This takes a few seconds
                </Text>
              </BlockStack>
            </Box>
          ) : optimization ? (
            <BlockStack gap="500">
              {/* Score improvement */}
              <Box padding="400" background="bg-surface-success" borderRadius="200">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="p" fontWeight="semibold">Expected Improvement</Text>
                  <InlineStack gap="200">
                    <Badge tone="critical">{String(optimization.currentScore)}</Badge>
                    <Text as="p">→</Text>
                    <Badge tone="success">{String(optimization.estimatedNewScore)}</Badge>
                  </InlineStack>
                </InlineStack>
              </Box>

              {/* Suggestions */}
              {optimization.suggestions.length === 0 ? (
                <Banner tone="info">
                  <Text as="p">
                    This product is already well optimized, or it needs more basic content (like a description) before AI can help.
                  </Text>
                </Banner>
              ) : (
                optimization.suggestions.map((suggestion, index) => (
                  <Card key={index}>
                    <BlockStack gap="300">
                      <InlineStack align="space-between" blockAlign="center">
                        <Badge tone="info">{getFieldLabel(suggestion.field)}</Badge>
                        <Badge tone="success">{suggestion.improvement}</Badge>
                      </InlineStack>

                      <Text as="p" variant="bodySm" tone="subdued">
                        {suggestion.reasoning}
                      </Text>

                      <Divider />

                      {suggestion.original && (
                        <BlockStack gap="100">
                          <Text as="p" variant="bodySm" fontWeight="semibold">Current:</Text>
                          <Box padding="200" background="bg-surface-secondary" borderRadius="100">
                            <Text as="p" variant="bodySm">
                              {suggestion.original.length > 200
                                ? `${suggestion.original.substring(0, 200)}...`
                                : suggestion.original || '(empty)'}
                            </Text>
                          </Box>
                        </BlockStack>
                      )}

                      <BlockStack gap="100">
                        <InlineStack align="space-between" blockAlign="center">
                          <Text as="p" variant="bodySm" fontWeight="semibold">Suggested:</Text>
                          <Button
                            icon={ClipboardIcon}
                            size="slim"
                            onClick={() => handleCopy(suggestion.suggested, suggestion.field)}
                          >
                            {copied === suggestion.field ? 'Copied!' : 'Copy'}
                          </Button>
                        </InlineStack>
                        <Box padding="200" background="bg-surface-success" borderRadius="100">
                          <Text as="p" variant="bodySm">
                            {suggestion.suggested}
                          </Text>
                        </Box>
                      </BlockStack>
                    </BlockStack>
                  </Card>
                ))
              )}

              <Banner tone="info">
                <Text as="p">
                  Copy the suggestions above and paste them into your product editor in Shopify.
                </Text>
              </Banner>
            </BlockStack>
          ) : null}
        </Modal.Section>
      </Modal>
    </Page>
  );
}
