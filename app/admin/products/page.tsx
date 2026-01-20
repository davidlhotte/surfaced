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
import { useAdminLanguage } from '@/lib/i18n/AdminLanguageContext';

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
  const { t, locale } = useAdminLanguage();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [auditResponse, optimizeResponse] = await Promise.all([
        authFetch('/api/audit'),
        authFetch('/api/optimize'),
      ]);

      if (!auditResponse.ok) throw new Error(t.products.loading);

      const auditResult = await auditResponse.json();
      if (auditResult.success) {
        setData(auditResult.data);
        setError(null);
      } else {
        setError(auditResult.error || t.common.error);
      }

      if (optimizeResponse.ok) {
        const optimizeResult = await optimizeResponse.json();
        if (optimizeResult.success) {
          setQuota(optimizeResult.data.quota);
          setHistory(optimizeResult.data.history || []);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setLoading(false);
    }
  }, [authFetch, t.common.error, t.products.loading]);

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
        throw new Error(errorData.error || t.common.error);
      }
      await fetchData();
      setSuccess(locale === 'fr' ? 'Produits analysés avec succès !' : 'Products analyzed successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
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
        setError(result.error || t.common.error);
        setShowModal(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
      setShowModal(false);
    } finally {
      setOptimizing(false);
    }
  }, [authFetch, t.common.error]);

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setError(locale === 'fr' ? 'Echec de la copie' : 'Copy failed');
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
      setError(locale === 'fr' ? 'Veuillez selectionner au moins une suggestion a appliquer' : 'Please select at least one suggestion to apply');
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
        const appliedText = locale === 'fr'
          ? `${data.data.applied} modification${data.data.applied !== 1 ? 's' : ''} appliquee${data.data.applied !== 1 ? 's' : ''} !`
          : `${data.data.applied} change${data.data.applied !== 1 ? 's' : ''} applied!`;
        setSuccess(
          `${appliedText} ` +
            `${locale === 'fr' ? 'Score' : 'Score'}: ${data.data.scoreBefore ?? '?'} → ${data.data.scoreAfter ?? '?'}`
        );
        // Reload data to refresh product list
        fetchData();
      } else {
        setError(data.error || t.common.error);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.error);
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
        const undoneText = locale === 'fr'
          ? `Modification annulee : ${getFieldLabel(data.data.field)} restaure`
          : `Change undone: ${getFieldLabel(data.data.field)} restored`;
        setSuccess(undoneText);
        setLastAppliedHistoryIds([]);
        fetchData();
      } else {
        setError(data.error || t.common.error);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.error);
    } finally {
      setApplying(false);
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return <Badge tone="success">{t.products.excellent}</Badge>;
    if (score >= 70) return <Badge tone="success">{t.products.good}</Badge>;
    if (score >= 40) return <Badge tone="warning">{t.products.warning}</Badge>;
    return <Badge tone="critical">{t.products.critical}</Badge>;
  };

  const getScoreColor = (score: number): "success" | "highlight" | "critical" => {
    if (score >= 70) return 'success';
    if (score >= 40) return 'highlight';
    return 'critical';
  };

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = locale === 'fr' ? {
      description: 'Description',
      seo_title: 'Titre SEO',
      seoTitle: 'Titre SEO',
      seo_description: 'Description SEO',
      seoDescription: 'Description SEO',
      tags: 'Tags',
      altText: 'Texte alt image',
      productType: 'Type de produit',
      vendor: 'Vendeur',
    } : {
      description: 'Description',
      seo_title: 'SEO Title',
      seoTitle: 'SEO Title',
      seo_description: 'SEO Description',
      seoDescription: 'SEO Description',
      tags: 'Tags',
      altText: 'Image alt text',
      productType: 'Product type',
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
    { id: 'all', content: locale === 'fr' ? `Tous les produits (${sortedProducts.length})` : `All products (${sortedProducts.length})` },
    { id: 'improve', content: locale === 'fr' ? `A ameliorer (${productsNeedingWork.length})` : `Needs improvement (${productsNeedingWork.length})` },
    { id: 'history', content: locale === 'fr' ? `Historique (${activeHistory.length})` : `History (${activeHistory.length})` },
  ], [sortedProducts.length, productsNeedingWork.length, activeHistory.length, locale]);

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
      {!product.hasImages && <Badge tone="critical">{t.products.noImages}</Badge>}
      {!product.hasDescription && <Badge tone="critical">{t.products.noDescription}</Badge>}
      {product.hasImages && product.hasDescription && product.aiScore >= 70 && (
        <Badge tone="success">{locale === 'fr' ? 'Pret' : 'Ready'}</Badge>
      )}
    </InlineStack>,
    <Button
      key={`action-${product.id}`}
      icon={MagicIcon}
      onClick={() => handleOptimize(product)}
      disabled={!quota?.available || product.aiScore >= 90}
      size="slim"
    >
      {t.products.optimize}
    </Button>,
  ]), [displayProducts, quota?.available, handleOptimize, t.products.noImages, t.products.noDescription, t.products.optimize, locale]);

  // Show authentication error if shop detection failed
  if (shopDetectionFailed) {
    return <NotAuthenticated error={shopError} />;
  }

  // Loading state
  if (loading || shopLoading) {
    return (
      <Page title={t.products.title} backAction={{ content: t.dashboard.title, url: '/admin' }}>
        <Layout>
          <Layout.Section>
            <Card>
              <Box padding="1000">
                <BlockStack gap="400" inlineAlign="center">
                  <Spinner size="large" />
                  <Text as="p" variant="bodyLg">{t.products.loading}</Text>
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
      title={t.products.title}
      subtitle={t.products.subtitle}
      backAction={{ content: t.dashboard.title, url: '/admin' }}
      primaryAction={{
        content: auditing ? t.products.analyzing : t.products.runAnalysis,
        onAction: runAudit,
        loading: auditing,
      }}
      secondaryActions={[
        {
          content: locale === 'fr' ? 'Actualiser' : 'Refresh',
          icon: RefreshIcon,
          onAction: fetchData,
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
                    {locale === 'fr' ? 'Annuler' : 'Undo'}
                  </Button>
                )}
              </InlineStack>
            </Banner>
          </Layout.Section>
        )}

        {/* Welcome Section for New Users */}
        {!hasProducts && (
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
                        {locale === 'fr' ? 'Bienvenue dans l\'analyse de produits' : 'Welcome to product analysis'}
                      </Text>
                      <Text as="p">
                        {locale === 'fr'
                          ? 'Decouvrez comment vos produits sont percus par ChatGPT, Perplexity et les autres IA. Nous analysons chaque produit et vous donnons un score de visibilite.'
                          : 'Discover how your products are perceived by ChatGPT, Perplexity and other AI. We analyze each product and give you a visibility score.'}
                      </Text>
                    </BlockStack>
                  </div>

                  <BlockStack gap="300">
                    <Text as="h3" variant="headingMd">{locale === 'fr' ? 'Comment ca marche ?' : 'How does it work?'}</Text>
                    <InlineStack gap="400" wrap>
                      <Box minWidth="200px" maxWidth="300px">
                        <BlockStack gap="200">
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#5c6ac4',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                          }}>1</div>
                          <Text as="p" fontWeight="semibold">{locale === 'fr' ? 'Analyse automatique' : 'Automatic analysis'}</Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            {locale === 'fr' ? 'Nous analysons vos descriptions, images, SEO et metadonnees' : 'We analyze your descriptions, images, SEO and metadata'}
                          </Text>
                        </BlockStack>
                      </Box>
                      <Box minWidth="200px" maxWidth="300px">
                        <BlockStack gap="200">
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#5c6ac4',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                          }}>2</div>
                          <Text as="p" fontWeight="semibold">{locale === 'fr' ? 'Score de visibilite IA' : 'AI visibility score'}</Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            {locale === 'fr' ? 'Chaque produit recoit un score de 0 a 100 base sur sa lisibilite par les IA' : 'Each product receives a score from 0 to 100 based on its readability by AI'}
                          </Text>
                        </BlockStack>
                      </Box>
                      <Box minWidth="200px" maxWidth="300px">
                        <BlockStack gap="200">
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#5c6ac4',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                          }}>3</div>
                          <Text as="p" fontWeight="semibold">{locale === 'fr' ? 'Optimisation en 1 clic' : 'One-click optimization'}</Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            {locale === 'fr' ? 'L\'IA genere des suggestions que vous appliquez directement a Shopify' : 'AI generates suggestions that you apply directly to Shopify'}
                          </Text>
                        </BlockStack>
                      </Box>
                    </InlineStack>
                  </BlockStack>

                  <Box paddingBlockStart="200">
                    <Button variant="primary" size="large" onClick={runAudit} loading={auditing}>
                      {locale === 'fr' ? 'Lancer ma premiere analyse' : 'Run my first analysis'}
                    </Button>
                  </Box>
                </BlockStack>
              </Box>
            </Card>
          </Layout.Section>
        )}

        {/* Plan Limit Banner */}
        {data?.plan?.isAtLimit && (
          <Layout.Section>
            <Banner tone="warning" title={locale === 'fr' ? 'Limite de plan atteinte' : 'Plan limit reached'}>
              <BlockStack gap="200">
                <Text as="p">
                  {locale === 'fr'
                    ? `Votre plan ${data.plan.current} permet d'analyser jusqu'a ${data.plan.productLimit} produits. Vous avez ${data.plan.productsNotAnalyzed} produits supplementaires non analyses.`
                    : `Your ${data.plan.current} plan allows analyzing up to ${data.plan.productLimit} products. You have ${data.plan.productsNotAnalyzed} additional products not analyzed.`}
                </Text>
                <InlineStack gap="200">
                  <Button url="/admin/settings" variant="primary">
                    {locale === 'fr' ? 'Passer a un plan superieur' : 'Upgrade plan'}
                  </Button>
                  <Text as="span" tone="subdued" variant="bodySm">
                    {locale === 'fr' ? `pour analyser vos ${data.totalProducts} produits` : `to analyze your ${data.totalProducts} products`}
                  </Text>
                </InlineStack>
              </BlockStack>
            </Banner>
          </Layout.Section>
        )}

        {/* Summary Stats */}
        {hasProducts && (
          <Layout.Section>
            <InlineStack gap="400" align="start" wrap>
              <Box minWidth="180px">
                <Card>
                  <BlockStack gap="200">
                    <Text as="h3" variant="bodySm" tone="subdued">{locale === 'fr' ? 'Score moyen' : 'Average score'}</Text>
                    <InlineStack gap="200" blockAlign="center">
                      <Text as="p" variant="heading2xl" fontWeight="bold">
                        {data?.averageScore ?? 0}
                      </Text>
                      {getScoreBadge(data?.averageScore ?? 0)}
                    </InlineStack>
                    <Box width="100%">
                      <ProgressBar
                        progress={data?.averageScore ?? 0}
                        tone={getScoreColor(data?.averageScore ?? 0)}
                        size="small"
                      />
                    </Box>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {locale === 'fr' ? 'Plus le score est eleve, plus les IA peuvent recommander vos produits' : 'The higher the score, the more AI can recommend your products'}
                    </Text>
                  </BlockStack>
                </Card>
              </Box>

              <Box minWidth="140px">
                <Card>
                  <BlockStack gap="200">
                    <Text as="h3" variant="bodySm" tone="subdued">{t.products.productsAnalyzed}</Text>
                    <Text as="p" variant="heading2xl" fontWeight="bold">
                      {data?.auditedProducts ?? 0}
                    </Text>
                    <Text as="p" variant="bodySm" tone={data?.plan?.isAtLimit ? 'critical' : 'subdued'}>
                      {data?.plan?.isAtLimit ? (
                        <>{locale === 'fr' ? `sur ${data?.plan?.productLimit} (limite)` : `of ${data?.plan?.productLimit} (limit)`}</>
                      ) : (
                        <>{locale === 'fr' ? `sur ${data?.totalProducts ?? 0} au total` : `of ${data?.totalProducts ?? 0} total`}</>
                      )}
                    </Text>
                  </BlockStack>
                </Card>
              </Box>

              <Box minWidth="140px">
                <Card>
                  <BlockStack gap="200">
                    <Text as="h3" variant="bodySm" tone="subdued">{t.products.needAttention}</Text>
                    <Text as="p" variant="heading2xl" fontWeight="bold" tone={productsNeedingWork.length > 0 ? 'critical' : 'success'}>
                      {productsNeedingWork.length}
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {locale === 'fr' ? 'produits avec un score < 70' : 'products with score < 70'}
                    </Text>
                  </BlockStack>
                </Card>
              </Box>

              <Box minWidth="160px">
                <Card>
                  <BlockStack gap="200">
                    <Text as="h3" variant="bodySm" tone="subdued">{locale === 'fr' ? 'Credits IA' : 'AI Credits'}</Text>
                    <InlineStack gap="200" blockAlign="center">
                      <Text as="p" variant="heading2xl" fontWeight="bold">
                        {quota?.remaining ?? 0}
                      </Text>
                      <Badge tone={quota?.available ? 'success' : 'critical'}>
                        {quota?.available ? (locale === 'fr' ? 'Disponibles' : 'Available') : (locale === 'fr' ? 'Epuises' : 'Exhausted')}
                      </Badge>
                    </InlineStack>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {locale === 'fr' ? `sur ${quota?.limit ?? 0} ce mois-ci` : `of ${quota?.limit ?? 0} this month`}
                    </Text>
                  </BlockStack>
                </Card>
              </Box>
            </InlineStack>
          </Layout.Section>
        )}

        {/* Products Table / History */}
        {hasProducts && (
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
                              label: t.products.status,
                              filter: (
                                <ChoiceList
                                  title={t.products.status}
                                  titleHidden
                                  choices={[
                                    { label: locale === 'fr' ? 'Urgent (score < 40)' : 'Urgent (score < 40)', value: 'critical' },
                                    { label: locale === 'fr' ? 'A ameliorer (40-69)' : 'Needs improvement (40-69)', value: 'warning' },
                                    { label: locale === 'fr' ? 'Bon (70+)' : 'Good (70+)', value: 'good' },
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
                            label: filter === 'critical' ? t.products.critical : filter === 'warning' ? t.products.warning : t.products.good,
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
                        <Text as="p" variant="headingMd">{locale === 'fr' ? 'Pas encore d\'historique' : 'No history yet'}</Text>
                        <Text as="p" tone="subdued">
                          {locale === 'fr'
                            ? 'Quand vous appliquez des suggestions IA a vos produits, elles apparaitront ici. Vous pourrez annuler n\'importe quelle modification.'
                            : 'When you apply AI suggestions to your products, they will appear here. You can undo any change.'}
                        </Text>
                      </BlockStack>
                    </Box>
                  ) : (
                    <BlockStack gap="300">
                      <Box padding="200">
                        <Text as="p" variant="bodySm" tone="subdued">
                          {locale === 'fr'
                            ? 'Retrouvez ici toutes vos modifications. Vous pouvez annuler une modification a tout moment pour restaurer la valeur originale.'
                            : 'Find all your changes here. You can undo a change at any time to restore the original value.'}
                        </Text>
                      </Box>
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
                                  {entry.status === 'applied' ? (locale === 'fr' ? 'Actif' : 'Active') : (locale === 'fr' ? 'Annule' : 'Undone')}
                                </Badge>
                              </InlineStack>
                              <InlineStack gap="200">
                                <Badge>{getFieldLabel(entry.field)}</Badge>
                                <Text as="span" variant="bodySm" tone="subdued">
                                  {new Date(entry.createdAt).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')} {locale === 'fr' ? 'a' : 'at'}{' '}
                                  {new Date(entry.createdAt).toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
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
                                {locale === 'fr' ? 'Annuler' : 'Undo'}
                              </Button>
                            )}
                          </InlineStack>
                        </Box>
                      ))}
                    </BlockStack>
                  )
                ) : displayProducts.length === 0 ? (
                  <Box padding="600">
                    <BlockStack gap="300" inlineAlign="center">
                      <Text as="p" variant="headingMd" tone="success">{locale === 'fr' ? 'Tous vos produits sont bien optimises !' : 'All your products are well optimized!'}</Text>
                      <Text as="p" tone="subdued">
                        {locale === 'fr' ? 'Tous vos produits ont un score de 70 ou plus. Excellent travail !' : 'All your products have a score of 70 or higher. Great job!'}
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
                            {`${locale === 'fr' ? 'Produit' : 'Product'} ${sortColumn === 'title' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}`}
                          </Button>
                        </InlineStack>,
                        <InlineStack key="h-score" gap="100" blockAlign="center">
                          <Button variant="plain" onClick={() => handleSort('score')}>
                            {`${t.products.score} ${sortColumn === 'score' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}`}
                          </Button>
                        </InlineStack>,
                        <InlineStack key="h-status" gap="100" blockAlign="center">
                          <Button variant="plain" onClick={() => handleSort('status')}>
                            {`${t.products.status} ${sortColumn === 'status' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}`}
                          </Button>
                        </InlineStack>,
                        t.products.issues,
                        locale === 'fr' ? 'Action' : 'Action',
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
        )}

        {/* Tips */}
        {hasProducts && (criticalCount > 0 || warningCount > 0) && selectedTab !== 2 && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">{locale === 'fr' ? 'Conseils pour ameliorer vos produits' : 'Tips to improve your products'}</Text>
                <Divider />
                <BlockStack gap="200">
                  {criticalCount > 0 && (
                    <Box padding="300" background="bg-surface-critical" borderRadius="200">
                      <BlockStack gap="100">
                        <Text as="p" fontWeight="semibold">{locale === 'fr' ? 'Ajoutez des images et descriptions' : 'Add images and descriptions'}</Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          {locale === 'fr'
                            ? 'Les produits sans images ou descriptions ne sont presque jamais recommandes par les IA. C\'est la base pour etre visible.'
                            : 'Products without images or descriptions are almost never recommended by AI. This is the foundation for being visible.'}
                        </Text>
                      </BlockStack>
                    </Box>
                  )}
                  <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                    <BlockStack gap="100">
                      <Text as="p" fontWeight="semibold">{locale === 'fr' ? 'Utilisez le bouton "Optimiser"' : 'Use the "Optimize" button'}</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        {locale === 'fr'
                          ? 'Notre IA analyse votre produit et genere des suggestions personnalisees. Appliquez-les en 1 clic directement sur Shopify.'
                          : 'Our AI analyzes your product and generates personalized suggestions. Apply them in 1 click directly to Shopify.'}
                      </Text>
                    </BlockStack>
                  </Box>
                  <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                    <BlockStack gap="100">
                      <Text as="p" fontWeight="semibold">{locale === 'fr' ? 'Visez un score de 70+' : 'Aim for a score of 70+'}</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        {locale === 'fr'
                          ? 'Les produits avec un score de 70 ou plus ont une bien meilleure chance d\'etre recommandes par ChatGPT, Perplexity et autres assistants IA.'
                          : 'Products with a score of 70 or higher have a much better chance of being recommended by ChatGPT, Perplexity and other AI assistants.'}
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
        title={selectedProduct ? `${t.products.optimize}: ${selectedProduct.title}` : t.products.optimize}
        primaryAction={
          optimization && optimization.suggestions.length > 0
            ? {
                content: locale === 'fr' ? `Appliquer ${selectedSuggestions.size} sur Shopify` : `Apply ${selectedSuggestions.size} to Shopify`,
                icon: CheckIcon,
                onAction: handleApplySelected,
                disabled: selectedSuggestions.size === 0 || applying,
                loading: applying,
              }
            : undefined
        }
        secondaryActions={[
          {
            content: t.common.close,
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
                <Text as="p">{locale === 'fr' ? 'Generation des suggestions IA...' : 'Generating AI suggestions...'}</Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  {locale === 'fr' ? 'Cela prend quelques secondes' : 'This takes a few seconds'}
                </Text>
              </BlockStack>
            </Box>
          ) : optimization ? (
            <BlockStack gap="500">
              {/* Score improvement */}
              <Box padding="400" background="bg-surface-success" borderRadius="200">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="p" fontWeight="semibold">{locale === 'fr' ? 'Amelioration prevue' : 'Expected improvement'}</Text>
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
                    {locale === 'fr'
                      ? 'Ce produit est deja bien optimise, ou il necessite du contenu de base (comme une description) avant que l\'IA puisse vous aider.'
                      : 'This product is already well optimized, or it needs basic content (like a description) before AI can help you.'}
                  </Text>
                </Banner>
              ) : (
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="center" wrap>
                    <Text as="p" fontWeight="semibold">
                      {locale === 'fr' ? `${selectedSuggestions.size} sur ${optimization.suggestions.length} selectionnees` : `${selectedSuggestions.size} of ${optimization.suggestions.length} selected`}
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
                        {selectedSuggestions.size === optimization.suggestions.length ? (locale === 'fr' ? 'Tout deselectionner' : 'Deselect all') : (locale === 'fr' ? 'Tout selectionner' : 'Select all')}
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
                              {copied === suggestion.field ? (locale === 'fr' ? 'Copie !' : 'Copied!') : (locale === 'fr' ? 'Copier' : 'Copy')}
                            </Button>
                            <Button
                              icon={CheckIcon}
                              size="slim"
                              variant="primary"
                              onClick={() => handleApplySingle(suggestion)}
                              loading={applying}
                            >
                              {locale === 'fr' ? 'Appliquer' : 'Apply'}
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
                                {locale === 'fr' ? 'Avant :' : 'Before:'}
                              </Text>
                              <Box padding="200" background="bg-surface-secondary" borderRadius="100">
                                <Text as="p" variant="bodySm">
                                  {suggestion.original
                                    ? suggestion.original.length > 150
                                      ? `${suggestion.original.substring(0, 150)}...`
                                      : suggestion.original
                                    : (locale === 'fr' ? '(vide)' : '(empty)')}
                                </Text>
                              </Box>
                            </BlockStack>
                          </Box>

                          {/* After */}
                          <Box minWidth="45%">
                            <BlockStack gap="100">
                              <Text as="p" variant="bodySm" fontWeight="semibold">
                                {locale === 'fr' ? 'Apres :' : 'After:'}
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
                  {locale === 'fr'
                    ? 'Cliquez sur "Appliquer" pour mettre a jour votre produit directement sur Shopify, ou "Copier" pour coller manuellement. Vous pouvez annuler toute modification depuis l\'onglet Historique.'
                    : 'Click "Apply" to update your product directly on Shopify, or "Copy" to paste manually. You can undo any change from the History tab.'}
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
        title={locale === 'fr' ? 'Appliquer les modifications sur Shopify' : 'Apply changes to Shopify'}
        primaryAction={{
          content: locale === 'fr' ? 'Confirmer et appliquer' : 'Confirm and apply',
          icon: CheckIcon,
          onAction: confirmApply,
          loading: applying,
        }}
        secondaryActions={[
          {
            content: t.common.cancel,
            onAction: () => setShowApplyConfirm(false),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Text as="p">
              {locale === 'fr'
                ? `Vous allez appliquer ${suggestionsToApply.length} modification${suggestionsToApply.length !== 1 ? 's' : ''} a votre produit sur Shopify :`
                : `You are about to apply ${suggestionsToApply.length} change${suggestionsToApply.length !== 1 ? 's' : ''} to your product on Shopify:`}
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
                {locale === 'fr'
                  ? 'Vous pourrez annuler ces modifications a tout moment depuis l\'onglet Historique.'
                  : 'You can undo these changes at any time from the History tab.'}
              </Text>
            </Banner>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
