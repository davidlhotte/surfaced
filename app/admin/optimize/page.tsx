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
} from '@shopify/polaris';
import {
  RefreshIcon,
  ClipboardIcon,
  MagicIcon,
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

export default function OptimizePage() {
  const { fetch } = useAuthenticatedFetch();

  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [products, setProducts] = useState<ProductForOptimization[]>([]);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductForOptimization | null>(null);
  const [optimization, setOptimization] = useState<ProductOptimization | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/optimize');
      const data = await response.json();

      if (data.success) {
        setProducts(data.data.products);
        setQuota(data.data.quota);
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

      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.shopifyProductId }),
      });

      const data = await response.json();

      if (data.success) {
        setOptimization(data.data.optimization);
        setQuota(data.data.quota);
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

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      description: 'Product Description',
      seoTitle: 'SEO Title',
      seoDescription: 'SEO Description',
      tags: 'Product Tags',
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
            <Banner tone="warning" onDismiss={() => setError(null)}>
              {error}
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
                      <Text as="p" fontWeight="semibold">Select a product</Text>
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
                      <Text as="p" fontWeight="semibold">AI generates suggestions</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Our AI analyzes your product and creates optimized descriptions, SEO content, and tags.
                      </Text>
                    </BlockStack>
                  </InlineStack>
                </Box>
                <Box padding="200" background="bg-surface-secondary" borderRadius="200">
                  <InlineStack gap="200" blockAlign="start">
                    <Badge tone="info">3</Badge>
                    <BlockStack gap="100">
                      <Text as="p" fontWeight="semibold">Copy and apply</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Review the suggestions, copy the content you like, and paste it into your Shopify product editor.
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
                  <Text as="p" fontWeight="semibold">Estimated Score Improvement</Text>
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
                    No suggestions generated. This product may already be well optimized, or it lacks the data needed
                    for AI improvement (like existing description or product type).
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
                          <Text as="p" variant="bodySm" fontWeight="semibold">Original:</Text>
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
            </BlockStack>
          ) : null}
        </Modal.Section>
      </Modal>
    </Page>
  );
}
