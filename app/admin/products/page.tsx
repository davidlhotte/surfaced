'use client';

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
  DataTable,
  ProgressBar,
  Filters,
  ChoiceList,
  Pagination,
  Modal,
  Tabs,
  Checkbox,
} from '@shopify/polaris';
import {
  RefreshIcon,
  ClipboardIcon,
  MagicIcon,
  CheckIcon,
  UndoIcon,
} from '@shopify/polaris-icons';
import { useAuthenticatedFetch, useShopContext } from '@/components/providers/ShopProvider';
import { NotAuthenticated } from '@/components/admin/NotAuthenticated';

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

type PlanInfo = {
  current: string;
  productLimit: number;
  isAtLimit: boolean;
  productsNotAnalyzed: number;
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
  plan?: PlanInfo;
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

interface HistoryEntry {
  id: string;
  shopifyProductId: string;
  productTitle: string;
  field: string;
  originalValue: string;
  appliedValue: string;
  scoreBefore: number | null;
  scoreAfter: number | null;
  status: 'applied' | 'undone';
  createdAt: string;
  undoneAt: string | null;
}

type SortColumn = 'title' | 'score' | 'status';
type SortDirection = 'asc' | 'desc';

export default function ProductsPage() {
  const [data, setData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [auditing, setAuditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTab, setSelectedTab] = useState(0);
  const [sortColumn, setSortColumn] = useState<SortColumn>('score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const itemsPerPage = 15;

  // Optimization state
  const [optimizing, setOptimizing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductAudit | null>(null);
  const [optimization, setOptimization] = useState<ProductOptimization | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Selection state for checkboxes
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());

  // Apply confirmation state
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);
  const [suggestionsToApply, setSuggestionsToApply] = useState<OptimizationSuggestion[]>([]);
  const [lastAppliedHistoryIds, setLastAppliedHistoryIds] = useState<string[]>([]);

  const { fetch: authFetch } = useAuthenticatedFetch();
  const { isLoading: shopLoading, isAuthenticated, shopDetectionFailed, error: shopError } = useShopContext();

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
          setHistory(optimizeResult.data.history || []);
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
      setSuccess('Products analyzed successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAuditing(false);
    }
  };

  const handleOptimize = useCallback(async (product: ProductAudit) => {
    try {
      setOptimizing(true);
      setError(null);
      setSelectedProduct(product);
      setShowModal(true);
      setOptimization(null);
      setSelectedSuggestions(new Set());

      const response = await authFetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.shopifyProductId }),
      });

      const result = await response.json();

      if (result.success) {
        setOptimization(result.data.optimization);
        setQuota(result.data.quota);
        // Select all suggestions by default
        const allSelected = new Set<number>();
        result.data.optimization.suggestions.forEach((_: OptimizationSuggestion, i: number) => allSelected.add(i));
        setSelectedSuggestions(allSelected);
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
  }, [authFetch]);

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setError('Failed to copy');
    }
  };

  const toggleSuggestion = (index: number) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedSuggestions(newSelected);
  };

  const handleApplySingle = (suggestion: OptimizationSuggestion) => {
    setSuggestionsToApply([suggestion]);
    setShowApplyConfirm(true);
  };

  const handleApplySelected = () => {
    if (!optimization) return;
    const selected = optimization.suggestions.filter((_, i) => selectedSuggestions.has(i));
    if (selected.length === 0) {
      setError('Please select at least one suggestion to apply');
      return;
    }
    setSuggestionsToApply(selected);
    setShowApplyConfirm(true);
  };

  const confirmApply = async () => {
    if (!optimization || suggestionsToApply.length === 0) return;

    try {
      setApplying(true);
      setError(null);

      const response = await authFetch('/api/optimize', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: optimization.productId,
          suggestions: suggestionsToApply.map((s) => ({
            field: s.field,
            original: s.original,
            suggested: s.suggested,
            reasoning: s.reasoning,
          })),
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.data.historyIds) {
          setLastAppliedHistoryIds(data.data.historyIds);
        }
        setShowApplyConfirm(false);
        setShowModal(false);
        setSuccess(
          `Applied ${data.data.applied} change${data.data.applied !== 1 ? 's' : ''}! ` +
            `Score: ${data.data.scoreBefore ?? '?'} → ${data.data.scoreAfter ?? '?'}`
        );
        // Reload data to refresh product list
        fetchData();
      } else {
        setError(data.error || 'Failed to apply changes');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  const handleUndo = async (historyId: string) => {
    try {
      setApplying(true);
      setError(null);

      const response = await authFetch(`/api/optimize?historyId=${historyId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Change undone: ${data.data.field} restored to original`);
        setLastAppliedHistoryIds([]);
        fetchData();
      } else {
        setError(data.error || 'Failed to undo');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to undo');
    } finally {
      setApplying(false);
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
      seo_title: 'SEO Title',
      seoTitle: 'SEO Title',
      seo_description: 'SEO Description',
      seoDescription: 'SEO Description',
      tags: 'Tags',
      altText: 'Image Alt Text',
      productType: 'Product Type',
      vendor: 'Vendor',
    };
    return labels[field] || field;
  };

  // Sort function - memoized to prevent unnecessary re-renders
  const sortProducts = useCallback((products: ProductAudit[]) => {
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
  }, [sortColumn, sortDirection]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Filter products - memoized to avoid recalculation on unrelated state changes
  const filteredProducts = useMemo(() => {
    if (!data?.products) return [];
    if (selectedFilter.length === 0) return data.products;
    return data.products.filter((product) => {
      if (selectedFilter.includes('critical') && product.aiScore < 40) return true;
      if (selectedFilter.includes('warning') && product.aiScore >= 40 && product.aiScore < 70) return true;
      if (selectedFilter.includes('good') && product.aiScore >= 70) return true;
      return false;
    });
  }, [data?.products, selectedFilter]);

  // Sort filtered products - memoized O(n log n) operation
  const sortedProducts = useMemo(() => {
    return sortProducts(filteredProducts);
  }, [filteredProducts, sortProducts]);

  // Products needing improvement - memoized
  const productsNeedingWork = useMemo(() => {
    if (!data?.products) return [];
    return sortProducts(data.products.filter(p => p.aiScore < 70));
  }, [data?.products, sortProducts]);

  // Active history entries - memoized
  const activeHistory = useMemo(() => {
    return history.filter(h => h.status === 'applied');
  }, [history]);

  // Pagination - memoized
  const totalPages = useMemo(() => Math.ceil(sortedProducts.length / itemsPerPage), [sortedProducts.length]);
  const paginatedProducts = useMemo(() => {
    return sortedProducts.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [sortedProducts, currentPage]);

  const handleFilterChange = (selected: string[]) => {
    setSelectedFilter(selected);
    setCurrentPage(1);
  };

  // Tabs - memoized (must be before early returns per rules of hooks)
  const tabs = useMemo(() => [
    { id: 'all', content: `All Products (${sortedProducts.length})` },
    { id: 'improve', content: `Need Improvement (${productsNeedingWork.length})` },
    { id: 'history', content: `History (${activeHistory.length})` },
  ], [sortedProducts.length, productsNeedingWork.length, activeHistory.length]);

  // Display products based on selected tab - memoized
  const displayProducts = useMemo(() => {
    if (selectedTab === 0) return paginatedProducts;
    if (selectedTab === 1) return productsNeedingWork.slice(0, 15);
    return [];
  }, [selectedTab, paginatedProducts, productsNeedingWork]);

  // Table rows - memoized to avoid JSX recreation on every render
  const tableRows = useMemo(() => displayProducts.map((product) => [
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
      Optimize
    </Button>,
  ]), [displayProducts, quota?.available, handleOptimize]);

  // Show authentication error if shop detection failed
  if (shopDetectionFailed) {
    return <NotAuthenticated error={shopError} />;
  }

  // Loading state
  if (loading || shopLoading) {
    return (
      <Page title="Products" backAction={{ content: 'Home', url: '/admin' }}>
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

  return (
    <Page
      title="Products"
      subtitle="Analyze and optimize your products for AI visibility"
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

        {success && (
          <Layout.Section>
            <Banner tone="success" onDismiss={() => setSuccess(null)}>
              <InlineStack gap="400" blockAlign="center">
                <Text as="p">{success}</Text>
                {lastAppliedHistoryIds.length > 0 && (
                  <Button
                    icon={UndoIcon}
                    size="slim"
                    onClick={() => handleUndo(lastAppliedHistoryIds[0])}
                    loading={applying}
                  >
                    Undo
                  </Button>
                )}
              </InlineStack>
            </Banner>
          </Layout.Section>
        )}

        {/* Plan Limit Banner */}
        {data?.plan?.isAtLimit && (
          <Layout.Section>
            <Banner tone="warning" title="Plan Limit Reached">
              <BlockStack gap="200">
                <Text as="p">
                  Your {data.plan.current} plan allows analyzing up to{' '}
                  <strong>{data.plan.productLimit} products</strong>.
                  You have {data.plan.productsNotAnalyzed} more products that aren&apos;t being analyzed.
                </Text>
                <InlineStack gap="200">
                  <Button url="/admin/settings" variant="primary">
                    Upgrade Your Plan
                  </Button>
                  <Text as="span" tone="subdued" variant="bodySm">
                    to analyze all {data.totalProducts} products
                  </Text>
                </InlineStack>
              </BlockStack>
            </Banner>
          </Layout.Section>
        )}

        {/* Summary Stats */}
        <Layout.Section>
          <InlineStack gap="400" align="start" wrap>
            <Box minWidth="160px">
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

            <Box minWidth="140px">
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="bodySm" tone="subdued">Products</Text>
                  <Text as="p" variant="heading2xl" fontWeight="bold">
                    {data?.auditedProducts ?? 0}
                  </Text>
                  <Text as="p" variant="bodySm" tone={data?.plan?.isAtLimit ? 'critical' : 'subdued'}>
                    {data?.plan?.isAtLimit ? (
                      <>of {data?.plan?.productLimit} (limit)</>
                    ) : (
                      <>of {data?.totalProducts ?? 0} total</>
                    )}
                  </Text>
                </BlockStack>
              </Card>
            </Box>

            <Box minWidth="140px">
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="bodySm" tone="subdued">Need Work</Text>
                  <Text as="p" variant="heading2xl" fontWeight="bold" tone={productsNeedingWork.length > 0 ? 'critical' : 'success'}>
                    {productsNeedingWork.length}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    score below 70
                  </Text>
                </BlockStack>
              </Card>
            </Box>

            <Box minWidth="160px">
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="bodySm" tone="subdued">AI Credits</Text>
                  <InlineStack gap="200" blockAlign="center">
                    <Text as="p" variant="heading2xl" fontWeight="bold">
                      {quota?.remaining ?? 0}
                    </Text>
                    <Badge tone={quota?.available ? 'success' : 'critical'}>
                      {quota?.available ? 'Available' : 'Limit'}
                    </Badge>
                  </InlineStack>
                  <Text as="p" variant="bodySm" tone="subdued">
                    of {quota?.limit ?? 0} this month
                  </Text>
                </BlockStack>
              </Card>
            </Box>
          </InlineStack>
        </Layout.Section>

        {/* Products Table / History */}
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

              {/* History Tab */}
              {selectedTab === 2 ? (
                history.length === 0 ? (
                  <Box padding="600">
                    <BlockStack gap="300" inlineAlign="center">
                      <Text as="p" variant="headingMd">No optimization history yet</Text>
                      <Text as="p" tone="subdued">
                        When you apply AI suggestions to your products, they&apos;ll appear here.
                      </Text>
                    </BlockStack>
                  </Box>
                ) : (
                  <BlockStack gap="300">
                    {history.slice(0, 20).map((entry) => (
                      <Box
                        key={entry.id}
                        padding="300"
                        background={entry.status === 'applied' ? 'bg-surface-success' : 'bg-surface-secondary'}
                        borderRadius="200"
                      >
                        <InlineStack align="space-between" blockAlign="center" gap="400" wrap>
                          <BlockStack gap="100">
                            <InlineStack gap="200" blockAlign="center">
                              <Text as="p" fontWeight="semibold">{entry.productTitle}</Text>
                              <Badge tone={entry.status === 'applied' ? 'success' : 'info'}>
                                {entry.status === 'applied' ? 'Active' : 'Undone'}
                              </Badge>
                            </InlineStack>
                            <InlineStack gap="200">
                              <Badge>{getFieldLabel(entry.field)}</Badge>
                              <Text as="span" variant="bodySm" tone="subdued">
                                {new Date(entry.createdAt).toLocaleDateString()} at{' '}
                                {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </Text>
                              {entry.scoreBefore !== null && entry.scoreAfter !== null && (
                                <Text as="span" variant="bodySm">
                                  Score: {entry.scoreBefore} → {entry.scoreAfter}
                                </Text>
                              )}
                            </InlineStack>
                          </BlockStack>
                          {entry.status === 'applied' && (
                            <Button
                              icon={UndoIcon}
                              size="slim"
                              onClick={() => handleUndo(entry.id)}
                              loading={applying}
                            >
                              Undo
                            </Button>
                          )}
                        </InlineStack>
                      </Box>
                    ))}
                  </BlockStack>
                )
              ) : !hasProducts ? (
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
              ) : displayProducts.length === 0 ? (
                <Box padding="600">
                  <BlockStack gap="300" inlineAlign="center">
                    <Text as="p" variant="headingMd" tone="success">All products are well optimized!</Text>
                    <Text as="p" tone="subdued">
                      Your products all have a score of 70 or above. Great job!
                    </Text>
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
        {hasProducts && (criticalCount > 0 || warningCount > 0) && selectedTab !== 2 && (
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
                      <Text as="p" fontWeight="semibold">Use the &quot;Optimize&quot; button</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Get AI-powered suggestions and apply them directly to your products with one click.
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
        title={selectedProduct ? `Optimize: ${selectedProduct.title}` : 'Optimize Product'}
        primaryAction={
          optimization && optimization.suggestions.length > 0
            ? {
                content: `Apply ${selectedSuggestions.size} to Shopify`,
                icon: CheckIcon,
                onAction: handleApplySelected,
                disabled: selectedSuggestions.size === 0 || applying,
                loading: applying,
              }
            : undefined
        }
        secondaryActions={[
          {
            content: 'Close',
            onAction: () => setShowModal(false),
          },
        ]}
        size="large"
      >
        <Modal.Section>
          {optimizing ? (
            <Box padding="800">
              <BlockStack gap="400" inlineAlign="center">
                <Spinner size="large" />
                <Text as="p">Generating AI suggestions...</Text>
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
                    <Badge tone="info">{`+${optimization.estimatedNewScore - optimization.currentScore}`}</Badge>
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
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="center" wrap>
                    <Text as="p" fontWeight="semibold">
                      {selectedSuggestions.size} of {optimization.suggestions.length} selected
                    </Text>
                    <InlineStack gap="200">
                      <Button
                        size="slim"
                        onClick={() => {
                          if (selectedSuggestions.size === optimization.suggestions.length) {
                            setSelectedSuggestions(new Set());
                          } else {
                            const all = new Set<number>();
                            optimization.suggestions.forEach((_, i) => all.add(i));
                            setSelectedSuggestions(all);
                          }
                        }}
                      >
                        {selectedSuggestions.size === optimization.suggestions.length ? 'Deselect All' : 'Select All'}
                      </Button>
                    </InlineStack>
                  </InlineStack>

                  {optimization.suggestions.map((suggestion, index) => (
                    <Card key={index}>
                      <BlockStack gap="300">
                        <InlineStack align="space-between" blockAlign="center">
                          <InlineStack gap="300" blockAlign="center">
                            <Checkbox
                              label=""
                              labelHidden
                              checked={selectedSuggestions.has(index)}
                              onChange={() => toggleSuggestion(index)}
                            />
                            <Badge tone="info">{getFieldLabel(suggestion.field)}</Badge>
                            <Badge tone="success">{suggestion.improvement}</Badge>
                          </InlineStack>
                          <InlineStack gap="200">
                            <Button
                              icon={ClipboardIcon}
                              size="slim"
                              onClick={() => handleCopy(suggestion.suggested, suggestion.field)}
                            >
                              {copied === suggestion.field ? 'Copied!' : 'Copy'}
                            </Button>
                            <Button
                              icon={CheckIcon}
                              size="slim"
                              variant="primary"
                              onClick={() => handleApplySingle(suggestion)}
                              loading={applying}
                            >
                              Apply
                            </Button>
                          </InlineStack>
                        </InlineStack>

                        <Text as="p" variant="bodySm" tone="subdued">
                          {suggestion.reasoning}
                        </Text>

                        <Divider />

                        <InlineStack gap="400" align="start">
                          {/* Before */}
                          <Box minWidth="45%">
                            <BlockStack gap="100">
                              <Text as="p" variant="bodySm" fontWeight="semibold">
                                Before:
                              </Text>
                              <Box padding="200" background="bg-surface-secondary" borderRadius="100">
                                <Text as="p" variant="bodySm">
                                  {suggestion.original
                                    ? suggestion.original.length > 150
                                      ? `${suggestion.original.substring(0, 150)}...`
                                      : suggestion.original
                                    : '(empty)'}
                                </Text>
                              </Box>
                            </BlockStack>
                          </Box>

                          {/* After */}
                          <Box minWidth="45%">
                            <BlockStack gap="100">
                              <Text as="p" variant="bodySm" fontWeight="semibold">
                                After:
                              </Text>
                              <Box padding="200" background="bg-surface-success" borderRadius="100">
                                <Text as="p" variant="bodySm">
                                  {suggestion.suggested.length > 150
                                    ? `${suggestion.suggested.substring(0, 150)}...`
                                    : suggestion.suggested}
                                </Text>
                              </Box>
                            </BlockStack>
                          </Box>
                        </InlineStack>
                      </BlockStack>
                    </Card>
                  ))}
                </BlockStack>
              )}

              <Banner tone="info">
                <Text as="p">
                  Click &quot;Apply&quot; to update your product directly in Shopify, or &quot;Copy&quot; to paste manually.
                  You can undo any changes from the History tab.
                </Text>
              </Banner>
            </BlockStack>
          ) : null}
        </Modal.Section>
      </Modal>

      {/* Apply Confirmation Modal */}
      <Modal
        open={showApplyConfirm}
        onClose={() => setShowApplyConfirm(false)}
        title="Apply Changes to Shopify"
        primaryAction={{
          content: 'Confirm & Apply',
          icon: CheckIcon,
          onAction: confirmApply,
          loading: applying,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setShowApplyConfirm(false),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Text as="p">
              You are about to apply {suggestionsToApply.length} change{suggestionsToApply.length !== 1 ? 's' : ''} to
              your product in Shopify:
            </Text>

            <BlockStack gap="200">
              {suggestionsToApply.map((s, i) => (
                <Box key={i} padding="200" background="bg-surface-secondary" borderRadius="100">
                  <InlineStack gap="200">
                    <Badge>{getFieldLabel(s.field)}</Badge>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {s.improvement}
                    </Text>
                  </InlineStack>
                </Box>
              ))}
            </BlockStack>

            <Banner tone="info">
              <Text as="p">
                You can undo these changes at any time from the History tab.
              </Text>
            </Banner>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
