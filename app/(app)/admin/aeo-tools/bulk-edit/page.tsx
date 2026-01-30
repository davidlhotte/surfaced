'use client';

export const dynamic = 'force-dynamic';

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
  Box,
  Divider,
  Select,
  Checkbox,
  ProgressBar,
  Spinner,
  ResourceList,
  ResourceItem,
  Thumbnail,
  Filters,
} from '@shopify/polaris';
import { RefreshIcon, ImageIcon } from '@shopify/polaris-icons';
import { useAuthenticatedFetch } from '@/components/providers/ShopProvider';
import { AdminNav } from '@/components/admin/AdminNav';
import { PageBanner } from '@/components/admin/PageBanner';
import { useAdminLanguage } from '@/lib/i18n/AdminLanguageContext';

interface Product {
  id: string;
  title: string;
  handle: string;
  imageUrl?: string;
  aiScore?: number;
}

interface BulkJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  total: number;
  completed: number;
  failed: number;
  type: string;
}

export default function BulkEditPage() {
  const { fetch } = useAuthenticatedFetch();
  const { locale } = useAdminLanguage();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [operationType, setOperationType] = useState<string>('alt_text');
  const [currentJob, setCurrentJob] = useState<BulkJob | null>(null);
  const [queryValue, setQueryValue] = useState('');

  const tr = {
    en: {
      title: 'Bulk Editor',
      subtitle: 'Edit multiple products at once with AI assistance',
      back: 'AEO Tools',
      refresh: 'Refresh',
      selectProducts: 'Select Products',
      selectAll: 'Select All',
      deselectAll: 'Deselect All',
      selected: 'selected',
      operationType: 'Operation Type',
      altText: 'Generate Alt Text',
      metaTags: 'Generate Meta Tags',
      description: 'Optimize Descriptions',
      startJob: 'Start Bulk Edit',
      starting: 'Starting...',
      jobProgress: 'Job Progress',
      processing: 'Processing',
      completed: 'Completed',
      failed: 'Failed',
      products: 'products',
      noProducts: 'No products found',
      noProductsDesc: 'Add products to your store to use bulk editing',
      search: 'Search products...',
      benefits: 'Bulk Edit Features',
      benefit1: 'AI-generated alt text for all images',
      benefit2: 'Optimized meta titles and descriptions',
      benefit3: 'Improved product descriptions for AI',
      benefit4: 'Process up to 250 products at once',
      successMsg: 'Bulk edit job started successfully!',
      errorMsg: 'Failed to start bulk edit',
      jobComplete: 'Bulk edit completed!',
    },
    fr: {
      title: 'Editeur en Masse',
      subtitle: 'Modifiez plusieurs produits a la fois avec l\'assistance IA',
      back: 'Outils AEO',
      refresh: 'Actualiser',
      selectProducts: 'Selectionner les Produits',
      selectAll: 'Tout Selectionner',
      deselectAll: 'Tout Deselectionner',
      selected: 'selectionne(s)',
      operationType: 'Type d\'Operation',
      altText: 'Generer les Alt Text',
      metaTags: 'Generer les Meta Tags',
      description: 'Optimiser les Descriptions',
      startJob: 'Demarrer l\'Edition en Masse',
      starting: 'Demarrage...',
      jobProgress: 'Progression',
      processing: 'En cours',
      completed: 'Termine',
      failed: 'Echoue',
      products: 'produits',
      noProducts: 'Aucun produit trouve',
      noProductsDesc: 'Ajoutez des produits a votre boutique pour utiliser l\'edition en masse',
      search: 'Rechercher des produits...',
      benefits: 'Fonctionnalites d\'Edition en Masse',
      benefit1: 'Alt text genere par IA pour toutes les images',
      benefit2: 'Meta titres et descriptions optimises',
      benefit3: 'Descriptions de produits ameliorees pour l\'IA',
      benefit4: 'Traitez jusqu\'a 250 produits a la fois',
      successMsg: 'Tache d\'edition en masse demarree avec succes!',
      errorMsg: 'Echec du demarrage de l\'edition en masse',
      jobComplete: 'Edition en masse terminee!',
    },
  };

  const t = tr[locale] || tr.en;

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/products?limit=100');
      const data = await response.json();

      if (data.success && data.data?.products) {
        setProducts(
          data.data.products.map((p: { id: string; title: string; handle: string; images?: { edges: Array<{ node: { url: string } }> }; aiScore?: number }) => ({
            id: p.id,
            title: p.title,
            handle: p.handle,
            imageUrl: p.images?.edges?.[0]?.node?.url,
            aiScore: p.aiScore,
          }))
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [fetch]);

  const checkJobStatus = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`/api/bulk-edit?jobId=${jobId}`);
      const data = await response.json();

      if (data.status) {
        setCurrentJob({
          id: jobId,
          status: data.status,
          progress: data.completed / data.total,
          total: data.total,
          completed: data.completed,
          failed: data.failed || 0,
          type: data.operation?.type || operationType,
        });

        if (data.status === 'processing' || data.status === 'pending') {
          setTimeout(() => checkJobStatus(jobId), 2000);
        } else if (data.status === 'completed') {
          setSuccess(t.jobComplete);
          loadProducts();
        }
      }
    } catch {
      // Silently fail status checks
    }
  }, [fetch, operationType, t, loadProducts]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const startBulkEdit = async () => {
    if (selectedProducts.length === 0) return;

    try {
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/bulk-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: {
            type: operationType,
            productIds: selectedProducts,
          },
        }),
      });

      const data = await response.json();

      if (data.jobId) {
        setSuccess(t.successMsg);
        checkJobStatus(data.jobId);
      } else {
        setError(data.error || t.errorMsg);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t.errorMsg);
    }
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((p) => p.id));
    }
  };

  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(queryValue.toLowerCase())
  );

  if (loading) {
    return (
      <Page title={t.title} backAction={{ content: t.back, url: '/admin/aeo-tools' }}>
        <Layout>
          <Layout.Section>
            <Card>
              <Box padding="800">
                <BlockStack gap="400" inlineAlign="center">
                  <Spinner size="large" />
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
      title={t.title}
      backAction={{ content: t.back, url: '/admin/aeo-tools' }}
      secondaryActions={[
        {
          content: t.refresh,
          icon: RefreshIcon,
          onAction: loadProducts,
        },
      ]}
    >
      <AdminNav locale={locale} />
      <PageBanner pageKey="bulkEdit" />
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
              {success}
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack gap="300" blockAlign="center">
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                  }}
                >
                  ✏️
                </div>
                <BlockStack gap="050">
                  <Text as="h2" variant="headingLg">{t.title}</Text>
                  <Text as="p" tone="subdued">{t.subtitle}</Text>
                </BlockStack>
              </InlineStack>

              <Divider />

              <Select
                label={t.operationType}
                options={[
                  { label: t.altText, value: 'alt_text' },
                  { label: t.metaTags, value: 'meta_tags' },
                  { label: t.description, value: 'description' },
                ]}
                value={operationType}
                onChange={setOperationType}
              />

              {currentJob && currentJob.status === 'processing' && (
                <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                  <BlockStack gap="300">
                    <InlineStack align="space-between">
                      <Text as="h3" variant="headingSm">{t.jobProgress}</Text>
                      <Badge tone="info">{t.processing}</Badge>
                    </InlineStack>
                    <ProgressBar progress={currentJob.progress * 100} size="small" />
                    <Text as="p" variant="bodySm" tone="subdued">
                      {currentJob.completed} / {currentJob.total} {t.products}
                    </Text>
                  </BlockStack>
                </Box>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h2" variant="headingMd">{t.selectProducts}</Text>
                <InlineStack gap="200">
                  <Badge>
                    {`${selectedProducts.length} ${t.selected}`}
                  </Badge>
                  <Button onClick={handleSelectAll} size="slim">
                    {selectedProducts.length === products.length
                      ? t.deselectAll
                      : t.selectAll}
                  </Button>
                </InlineStack>
              </InlineStack>

              <Filters
                queryValue={queryValue}
                queryPlaceholder={t.search}
                onQueryChange={setQueryValue}
                onQueryClear={() => setQueryValue('')}
                filters={[]}
                onClearAll={() => setQueryValue('')}
              />

              {filteredProducts.length > 0 ? (
                <ResourceList
                  resourceName={{ singular: 'product', plural: 'products' }}
                  items={filteredProducts}
                  selectedItems={selectedProducts}
                  onSelectionChange={setSelectedProducts as (selected: string[]) => void}
                  selectable
                  renderItem={(item) => {
                    const { id, title, handle, imageUrl, aiScore } = item as Product;

                    return (
                      <ResourceItem
                        id={id}
                        onClick={() => {}}
                        accessibilityLabel={`View details for ${title}`}
                        media={
                          imageUrl ? (
                            <Thumbnail source={imageUrl} alt={title} size="small" />
                          ) : (
                            <div
                              style={{
                                width: '40px',
                                height: '40px',
                                background: '#F3F4F6',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <ImageIcon />
                            </div>
                          )
                        }
                      >
                        <InlineStack align="space-between" blockAlign="center">
                          <BlockStack gap="050">
                            <Text as="span" variant="bodyMd" fontWeight="semibold">
                              {title}
                            </Text>
                            <Text as="span" variant="bodySm" tone="subdued">
                              {handle}
                            </Text>
                          </BlockStack>
                          {aiScore !== undefined && (
                            <Badge tone={aiScore >= 70 ? 'success' : aiScore >= 40 ? 'warning' : 'critical'}>
                              {`${aiScore}/100`}
                            </Badge>
                          )}
                        </InlineStack>
                      </ResourceItem>
                    );
                  }}
                />
              ) : (
                <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                  <BlockStack gap="200" inlineAlign="center">
                    <Text as="p">{t.noProducts}</Text>
                    <Text as="p" variant="bodySm" tone="subdued">{t.noProductsDesc}</Text>
                  </BlockStack>
                </Box>
              )}

              <Divider />

              <Button
                variant="primary"
                onClick={startBulkEdit}
                disabled={selectedProducts.length === 0 || (currentJob?.status === 'processing')}
                size="large"
              >
                {t.startJob} ({String(selectedProducts.length)} {t.products})
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <Text as="h3" variant="headingSm">{t.benefits}</Text>
              <BlockStack gap="200">
                <Text as="p" variant="bodySm">✅ {t.benefit1}</Text>
                <Text as="p" variant="bodySm">✅ {t.benefit2}</Text>
                <Text as="p" variant="bodySm">✅ {t.benefit3}</Text>
                <Text as="p" variant="bodySm">✅ {t.benefit4}</Text>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
