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
  ProgressBar,
  DataTable,
  Modal,
  Spinner,
  Checkbox,
} from '@shopify/polaris';
import {
  RefreshIcon,
  ClipboardIcon,
  MagicIcon,
  CheckIcon,
  UndoIcon,
} from '@shopify/polaris-icons';
import { useAuthenticatedFetch } from '@/components/providers/ShopProvider';

interface ProductForOptimization {
  id: string;
  shopifyProductId: string;
  title: string;
  handle: string;
  aiScore: number;
  issues: { code: string; message: string }[];
}

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

interface ApplyResult {
  applied: number;
  hadConflict: boolean;
  scoreBefore: number | null;
  scoreAfter: number | null;
  historyIds?: string[];
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

export default function OptimizePage() {
  const { fetch } = useAuthenticatedFetch();

  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [products, setProducts] = useState<ProductForOptimization[]>([]);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductForOptimization | null>(null);
  const [optimization, setOptimization] = useState<ProductOptimization | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Selection state for checkboxes
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());

  // Apply confirmation state
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);
  const [suggestionsToApply, setSuggestionsToApply] = useState<OptimizationSuggestion[]>([]);
  const [_applyResult, setApplyResult] = useState<ApplyResult | null>(null);
  const [lastAppliedHistoryIds, setLastAppliedHistoryIds] = useState<string[]>([]);

  // Conflict warning
  const [hasConflict, setHasConflict] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/optimize');
      const data = await response.json();

      if (data.success) {
        setProducts(data.data.products);
        setQuota(data.data.quota);
        setHistory(data.data.history || []);
      } else {
        setError(data.error || 'Failed to load data');
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

  const handleOptimize = async (product: ProductForOptimization) => {
    try {
      setOptimizing(true);
      setError(null);
      setSelectedProduct(product);
      setShowModal(true);
      setOptimization(null);
      setSelectedSuggestions(new Set());
      setApplyResult(null);

      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.shopifyProductId }),
      });

      const data = await response.json();

      if (data.success) {
        setOptimization(data.data.optimization);
        setQuota(data.data.quota);
        // Select all suggestions by default
        const allSelected = new Set<number>();
        data.data.optimization.suggestions.forEach((_: OptimizationSuggestion, i: number) => allSelected.add(i));
        setSelectedSuggestions(allSelected);
      } else {
        setError(data.error || 'Failed to generate suggestions');
        setShowModal(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to optimize');
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
      setError('Failed to copy to clipboard');
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
      setHasConflict(false);

      const response = await fetch('/api/optimize', {
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
        setApplyResult(data.data);
        if (data.data.hadConflict) {
          setHasConflict(true);
        }
        if (data.data.historyIds) {
          setLastAppliedHistoryIds(data.data.historyIds);
        }
        setShowApplyConfirm(false);
        setSuccess(
          `Applied ${data.data.applied} change${data.data.applied !== 1 ? 's' : ''}! ` +
            `Score: ${data.data.scoreBefore ?? '?'} → ${data.data.scoreAfter ?? '?'}`
        );
        // Reload data to refresh product list
        loadData();
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

      const response = await fetch(`/api/optimize?historyId=${historyId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Undone: ${data.data.field} restored to original`);
        setApplyResult(null);
        loadData();
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
    if (score >= 40) return <Badge tone="warning">Needs Work</Badge>;
    return <Badge tone="critical">Critical</Badge>;
  };

  const getScoreColor = (score: number): 'success' | 'highlight' | 'critical' => {
    if (score >= 70) return 'success';
    if (score >= 40) return 'highlight';
    return 'critical';
  };

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      description: 'Product Description',
      seo_title: 'SEO Title',
      seo_description: 'SEO Description',
      tags: 'Product Tags',
      productType: 'Product Type',
      vendor: 'Vendor',
      altText: 'Image Alt Text',
    };
    return labels[field] || field;
  };

  if (loading) {
    return (
      <Page title="AI Content Optimizer" backAction={{ content: 'Dashboard', url: '/admin' }}>
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

  const tableRows = products.map((product) => [
    <BlockStack key={product.id} gap="100">
      <Text as="p" fontWeight="semibold" truncate>
        {product.title}
      </Text>
      <Text as="p" variant="bodySm" tone="subdued">
        /{product.handle}
      </Text>
    </BlockStack>,
    <InlineStack key={`score-${product.id}`} gap="200" blockAlign="center">
      <Box width="60px">
        <ProgressBar progress={product.aiScore} tone={getScoreColor(product.aiScore)} size="small" />
      </Box>
      <Text as="p" fontWeight="semibold">
        {product.aiScore}
      </Text>
    </InlineStack>,
    getScoreBadge(product.aiScore),
    <Text key={`issues-${product.id}`} as="p" tone="subdued">
      {product.issues.length} issue{product.issues.length !== 1 ? 's' : ''}
    </Text>,
    <Button
      key={`action-${product.id}`}
      icon={MagicIcon}
      onClick={() => handleOptimize(product)}
      disabled={!quota?.available}
    >
      Optimize
    </Button>,
  ]);

  return (
    <Page
      title="AI Content Optimizer"
      subtitle="Generate AI-powered suggestions to improve your product content"
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
            <Banner tone="critical" onDismiss={() => setError(null)}>
              {error}
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

        {/* Quota Card */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <BlockStack gap="100">
                  <Text as="h2" variant="headingMd">
                    AI Optimization Credits
                  </Text>
                  <Text as="p" tone="subdued">
                    {quota?.remaining ?? 0} of {quota?.limit ?? 0} optimizations remaining this month
                  </Text>
                </BlockStack>
                <Badge tone={quota?.available ? 'success' : 'critical'}>
                  {quota?.available ? 'Credits Available' : 'Limit Reached'}
                </Badge>
              </InlineStack>

              <Box width="100%">
                <ProgressBar
                  progress={quota ? ((quota.limit - quota.remaining) / quota.limit) * 100 : 0}
                  tone={quota?.remaining && quota.remaining > 5 ? 'highlight' : 'critical'}
                  size="small"
                />
              </Box>

              {!quota?.available && (
                <Banner tone="warning">
                  <Text as="p">
                    You&apos;ve reached your monthly optimization limit. Upgrade your plan for more AI optimizations.
                  </Text>
                </Banner>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Products needing optimization */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <BlockStack gap="100">
                <Text as="h2" variant="headingMd">
                  Products Needing Optimization
                </Text>
                <Text as="p" tone="subdued">
                  Products with an AI score below 70 that could benefit from content improvements
                </Text>
              </BlockStack>

              <Divider />

              {products.length === 0 ? (
                <Box padding="400">
                  <BlockStack gap="200" inlineAlign="center">
                    <Text as="p" tone="success" fontWeight="semibold">
                      All your products are well optimized!
                    </Text>
                    <Text as="p" tone="subdued">
                      Run an audit to check for new products that might need attention.
                    </Text>
                  </BlockStack>
                </Box>
              ) : (
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text', 'text']}
                  headings={['Product', 'Score', 'Status', 'Issues', 'Action']}
                  rows={tableRows}
                />
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* History Section */}
        {history.length > 0 && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="100">
                    <Text as="h2" variant="headingMd">
                      Optimization History
                    </Text>
                    <Text as="p" tone="subdued">
                      {history.filter((h) => h.status === 'applied').length} active changes
                    </Text>
                  </BlockStack>
                  <Button
                    onClick={() => setShowHistory(!showHistory)}
                    disclosure={showHistory ? 'up' : 'down'}
                  >
                    {showHistory ? 'Hide' : 'Show'} History
                  </Button>
                </InlineStack>

                {showHistory && (
                  <>
                    <Divider />
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
                  </>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

        {/* How it works */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                How AI Optimization Works
              </Text>
              <Divider />
              <BlockStack gap="300">
                <Box padding="200" background="bg-surface-secondary" borderRadius="200">
                  <InlineStack gap="200" blockAlign="start">
                    <Badge tone="info">1</Badge>
                    <BlockStack gap="100">
                      <Text as="p" fontWeight="semibold">
                        Select a product
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Choose a product with a low AI score that needs improvement.
                      </Text>
                    </BlockStack>
                  </InlineStack>
                </Box>
                <Box padding="200" background="bg-surface-secondary" borderRadius="200">
                  <InlineStack gap="200" blockAlign="start">
                    <Badge tone="info">2</Badge>
                    <BlockStack gap="100">
                      <Text as="p" fontWeight="semibold">
                        Review suggestions
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        AI generates optimized descriptions, SEO content, and tags. Select the ones you want.
                      </Text>
                    </BlockStack>
                  </InlineStack>
                </Box>
                <Box padding="200" background="bg-surface-success" borderRadius="200">
                  <InlineStack gap="200" blockAlign="start">
                    <Badge tone="success">3</Badge>
                    <BlockStack gap="100">
                      <Text as="p" fontWeight="semibold">
                        Apply with one click
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Click Apply to update your product directly. You can always undo if needed.
                      </Text>
                    </BlockStack>
                  </InlineStack>
                </Box>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      {/* Optimization Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={selectedProduct ? `Optimize: ${selectedProduct.title}` : 'Optimization'}
        primaryAction={
          optimization && optimization.suggestions.length > 0
            ? {
                content: `Apply ${selectedSuggestions.size} Selected`,
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
                  This may take a few seconds
                </Text>
              </BlockStack>
            </Box>
          ) : optimization ? (
            <BlockStack gap="500">
              {/* Score improvement */}
              <Box padding="400" background="bg-surface-success" borderRadius="200">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="p" fontWeight="semibold">
                    Estimated Score Improvement
                  </Text>
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
                    No suggestions generated. This product may already be well optimized, or it lacks the data needed
                    for AI improvement (like existing description or product type).
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
                      <Button
                        variant="primary"
                        icon={CheckIcon}
                        onClick={handleApplySelected}
                        disabled={selectedSuggestions.size === 0 || applying}
                        loading={applying}
                      >
                        Apply {selectedSuggestions.size} Selected
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
            </BlockStack>
          ) : null}
        </Modal.Section>
      </Modal>

      {/* Apply Confirmation Modal */}
      <Modal
        open={showApplyConfirm}
        onClose={() => setShowApplyConfirm(false)}
        title="Apply Changes"
        primaryAction={{
          content: hasConflict ? 'Apply Anyway' : 'Confirm & Apply',
          onAction: confirmApply,
          loading: applying,
          destructive: hasConflict,
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
            {hasConflict && (
              <Banner tone="warning" title="Product was recently modified">
                <Text as="p">
                  This product was modified after you generated these suggestions. The changes will still be applied,
                  but you may want to review the current product content first.
                </Text>
              </Banner>
            )}

            <Text as="p">
              You are about to apply {suggestionsToApply.length} change{suggestionsToApply.length !== 1 ? 's' : ''} to
              your product:
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

            <Text as="p" tone="subdued" variant="bodySm">
              You can undo these changes at any time.
            </Text>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
