'use client';

export const dynamic = 'force-dynamic';

import { useState, useCallback } from 'react';
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
  TextField,
  Checkbox,
  Box,
  Divider,
  Spinner,
} from '@shopify/polaris';
import { RefreshIcon, ClipboardIcon } from '@shopify/polaris-icons';
import { useAuthenticatedFetch } from '@/components/providers/ShopProvider';
import { useAdminLanguage } from '@/lib/i18n/AdminLanguageContext';

export default function SitemapPage() {
  const { fetch } = useAuthenticatedFetch();
  const { locale } = useAdminLanguage();

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sitemapPreview, setSitemapPreview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Options
  const [includeProducts, setIncludeProducts] = useState(true);
  const [includeCollections, setIncludeCollections] = useState(true);
  const [includePages, setIncludePages] = useState(true);
  const [includeImages, setIncludeImages] = useState(true);
  const [changefreq, setChangefreq] = useState('weekly');

  const tr = {
    en: {
      title: 'Sitemap Generator',
      subtitle: 'Generate optimized XML sitemaps for better search engine indexing',
      back: 'AEO Tools',
      refresh: 'Refresh',
      generate: 'Generate Sitemap',
      generating: 'Generating...',
      preview: 'Sitemap Preview',
      copy: 'Copy',
      copied: 'Copied!',
      download: 'Download',
      options: 'Sitemap Options',
      includeProducts: 'Include Products',
      includeCollections: 'Include Collections',
      includePages: 'Include Pages',
      includeImages: 'Include Image Sitemaps',
      changefreq: 'Default Change Frequency',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      howToInstall: 'How to Install',
      step1: 'Download the generated sitemap.xml file',
      step2: 'Upload to your store\'s root directory or hosting',
      step3: 'Submit to Google Search Console',
      benefits: 'Benefits',
      benefit1: 'Faster indexing of new products',
      benefit2: 'Image sitemap for Google Images',
      benefit3: 'Proper priority signals for important pages',
      successMsg: 'Sitemap generated successfully!',
      errorMsg: 'Failed to generate sitemap',
    },
    fr: {
      title: 'Generateur de Sitemap',
      subtitle: 'Generez des sitemaps XML optimises pour un meilleur indexage',
      back: 'Outils AEO',
      refresh: 'Actualiser',
      generate: 'Generer le Sitemap',
      generating: 'Generation...',
      preview: 'Apercu du Sitemap',
      copy: 'Copier',
      copied: 'Copie!',
      download: 'Telecharger',
      options: 'Options du Sitemap',
      includeProducts: 'Inclure les Produits',
      includeCollections: 'Inclure les Collections',
      includePages: 'Inclure les Pages',
      includeImages: 'Inclure les Sitemaps Images',
      changefreq: 'Frequence de Modification par Defaut',
      daily: 'Quotidienne',
      weekly: 'Hebdomadaire',
      monthly: 'Mensuelle',
      howToInstall: 'Comment Installer',
      step1: 'Telechargez le fichier sitemap.xml genere',
      step2: 'Uploadez dans le repertoire racine de votre boutique',
      step3: 'Soumettez a Google Search Console',
      benefits: 'Avantages',
      benefit1: 'Indexation plus rapide des nouveaux produits',
      benefit2: 'Sitemap images pour Google Images',
      benefit3: 'Signaux de priorite pour les pages importantes',
      successMsg: 'Sitemap genere avec succes!',
      errorMsg: 'Echec de la generation du sitemap',
    },
  };

  const t = tr[locale] || tr.en;

  const generateSitemap = useCallback(async () => {
    try {
      setGenerating(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/sitemap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          includeProducts,
          includeCollections,
          includePages,
          includeImages,
          changefreq,
        }),
      });

      const data = await response.json();

      if (data.success || data.sitemap) {
        setSitemapPreview(data.sitemap || data.content);
        setSuccess(t.successMsg);
      } else {
        setError(data.error || t.errorMsg);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t.errorMsg);
    } finally {
      setGenerating(false);
    }
  }, [fetch, includeProducts, includeCollections, includePages, includeImages, changefreq, t]);

  const handleCopy = async () => {
    if (sitemapPreview) {
      await navigator.clipboard.writeText(sitemapPreview);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (sitemapPreview) {
      const blob = new Blob([sitemapPreview], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sitemap.xml';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Page
      title={t.title}
      backAction={{ content: t.back, url: '/admin/aeo-tools' }}
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
                    background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                  }}
                >
                  🗺️
                </div>
                <BlockStack gap="050">
                  <Text as="h2" variant="headingLg">{t.title}</Text>
                  <Text as="p" tone="subdued">{t.subtitle}</Text>
                </BlockStack>
              </InlineStack>

              <Divider />

              <Text as="h3" variant="headingSm">{t.options}</Text>

              <BlockStack gap="300">
                <Checkbox
                  label={t.includeProducts}
                  checked={includeProducts}
                  onChange={setIncludeProducts}
                />
                <Checkbox
                  label={t.includeCollections}
                  checked={includeCollections}
                  onChange={setIncludeCollections}
                />
                <Checkbox
                  label={t.includePages}
                  checked={includePages}
                  onChange={setIncludePages}
                />
                <Checkbox
                  label={t.includeImages}
                  checked={includeImages}
                  onChange={setIncludeImages}
                />
              </BlockStack>

              <Divider />

              <Button
                variant="primary"
                onClick={generateSitemap}
                loading={generating}
                size="large"
              >
                {generating ? t.generating : t.generate}
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>

        {sitemapPreview && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h3" variant="headingSm">{t.preview}</Text>
                  <InlineStack gap="200">
                    <Button icon={ClipboardIcon} onClick={handleCopy} size="slim">
                      {copied ? t.copied : t.copy}
                    </Button>
                    <Button onClick={handleDownload} size="slim" variant="primary">
                      {t.download}
                    </Button>
                  </InlineStack>
                </InlineStack>
                <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                  <pre
                    style={{
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      maxHeight: '300px',
                      overflow: 'auto',
                      color: '#374151',
                    }}
                  >
                    {sitemapPreview.substring(0, 2000)}
                    {sitemapPreview.length > 2000 && '...'}
                  </pre>
                </Box>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <Text as="h3" variant="headingSm">{t.howToInstall}</Text>
              <BlockStack gap="200">
                <InlineStack gap="200" blockAlign="start">
                  <Badge tone="info">1</Badge>
                  <Text as="p" variant="bodySm">{t.step1}</Text>
                </InlineStack>
                <InlineStack gap="200" blockAlign="start">
                  <Badge tone="info">2</Badge>
                  <Text as="p" variant="bodySm">{t.step2}</Text>
                </InlineStack>
                <InlineStack gap="200" blockAlign="start">
                  <Badge tone="info">3</Badge>
                  <Text as="p" variant="bodySm">{t.step3}</Text>
                </InlineStack>
              </BlockStack>
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
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
