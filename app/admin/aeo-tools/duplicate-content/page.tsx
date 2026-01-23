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
  Box,
  Divider,
  ProgressBar,
  DataTable,
  Spinner,
} from '@shopify/polaris';
import { RefreshIcon } from '@shopify/polaris-icons';
import { useAuthenticatedFetch } from '@/components/providers/ShopProvider';
import { AdminNav } from '@/components/admin/AdminNav';
import { useAdminLanguage } from '@/lib/i18n/AdminLanguageContext';

interface DuplicateGroup {
  id: string;
  similarity: number;
  products: Array<{
    id: string;
    title: string;
    handle: string;
  }>;
  type: 'title' | 'description' | 'both';
}

interface DuplicateReport {
  score: number;
  totalProducts: number;
  affectedProducts: number;
  duplicateGroups: DuplicateGroup[];
  templateIssues: number;
}

export default function DuplicateContentPage() {
  const { fetch } = useAuthenticatedFetch();
  const { locale } = useAdminLanguage();

  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<DuplicateReport | null>(null);

  const tr = {
    en: {
      title: 'Duplicate Content Analysis',
      subtitle: 'Detect duplicate titles and descriptions that hurt your SEO',
      back: 'AEO Tools',
      analyze: 'Analyze Content',
      analyzing: 'Analyzing...',
      refresh: 'Refresh',
      score: 'Content Uniqueness Score',
      totalProducts: 'Total Products',
      affectedProducts: 'Affected Products',
      duplicateGroups: 'Duplicate Groups',
      templateIssues: 'Template Issues',
      excellent: 'Excellent',
      good: 'Good',
      needsWork: 'Needs Work',
      critical: 'Critical',
      duplicateTitle: 'Duplicate Title',
      duplicateDesc: 'Duplicate Description',
      duplicateBoth: 'Both Duplicate',
      similarity: 'Similarity',
      viewProducts: 'View Products',
      noIssues: 'No duplicate content issues found!',
      benefits: 'Why Fix Duplicates?',
      benefit1: 'Avoid Google penalties for duplicate content',
      benefit2: 'Improve AI understanding of your products',
      benefit3: 'Better search rankings for unique content',
      benefit4: 'Higher conversion with unique descriptions',
      howToFix: 'How to Fix',
      fix1: 'Rewrite duplicate descriptions to be unique',
      fix2: 'Use AI suggestions to generate new content',
      fix3: 'Remove template placeholders',
      fix4: 'Add unique product details and benefits',
      errorMsg: 'Failed to analyze content',
    },
    fr: {
      title: 'Analyse du Contenu Duplique',
      subtitle: 'Detectez les titres et descriptions dupliques qui nuisent a votre SEO',
      back: 'Outils AEO',
      analyze: 'Analyser le Contenu',
      analyzing: 'Analyse...',
      refresh: 'Actualiser',
      score: 'Score d\'Unicite du Contenu',
      totalProducts: 'Produits Totaux',
      affectedProducts: 'Produits Affectes',
      duplicateGroups: 'Groupes de Doublons',
      templateIssues: 'Problemes de Template',
      excellent: 'Excellent',
      good: 'Bon',
      needsWork: 'A Ameliorer',
      critical: 'Critique',
      duplicateTitle: 'Titre Duplique',
      duplicateDesc: 'Description Dupliquee',
      duplicateBoth: 'Les Deux Dupliques',
      similarity: 'Similarite',
      viewProducts: 'Voir les Produits',
      noIssues: 'Aucun probleme de contenu duplique trouve!',
      benefits: 'Pourquoi Corriger les Doublons?',
      benefit1: 'Evitez les penalites Google pour contenu duplique',
      benefit2: 'Ameliorez la comprehension IA de vos produits',
      benefit3: 'Meilleurs classements pour le contenu unique',
      benefit4: 'Meilleures conversions avec des descriptions uniques',
      howToFix: 'Comment Corriger',
      fix1: 'Reecrivez les descriptions dupliquees pour les rendre uniques',
      fix2: 'Utilisez les suggestions IA pour generer du nouveau contenu',
      fix3: 'Supprimez les placeholders de template',
      fix4: 'Ajoutez des details et avantages uniques aux produits',
      errorMsg: 'Echec de l\'analyse du contenu',
    },
  };

  const t = tr[locale] || tr.en;

  const analyzeContent = useCallback(async () => {
    try {
      setAnalyzing(true);
      setError(null);

      const response = await fetch('/api/duplicate-content');
      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setReport(data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t.errorMsg);
    } finally {
      setAnalyzing(false);
    }
  }, [fetch, t]);

  const getScoreInfo = (score: number) => {
    if (score >= 90) return { label: t.excellent, tone: 'success' as const, color: '#108043' };
    if (score >= 70) return { label: t.good, tone: 'success' as const, color: '#108043' };
    if (score >= 50) return { label: t.needsWork, tone: 'warning' as const, color: '#B98900' };
    return { label: t.critical, tone: 'critical' as const, color: '#D82C0D' };
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'title':
        return t.duplicateTitle;
      case 'description':
        return t.duplicateDesc;
      default:
        return t.duplicateBoth;
    }
  };

  return (
    <Page
      title={t.title}
      backAction={{ content: t.back, url: '/admin/aeo-tools' }}
      secondaryActions={
        report
          ? [
              {
                content: t.refresh,
                icon: RefreshIcon,
                onAction: analyzeContent,
              },
            ]
          : undefined
      }
    >
      <AdminNav locale={locale} />
      <Layout>
        {error && (
          <Layout.Section>
            <Banner tone="critical" onDismiss={() => setError(null)}>
              {error}
            </Banner>
          </Layout.Section>
        )}

        {!report && !analyzing && (
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <InlineStack gap="300" blockAlign="center">
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                    }}
                  >
                    🔍
                  </div>
                  <BlockStack gap="050">
                    <Text as="h2" variant="headingLg">{t.title}</Text>
                    <Text as="p" tone="subdued">{t.subtitle}</Text>
                  </BlockStack>
                </InlineStack>

                <Divider />

                <Box padding="400" background="bg-surface-secondary" borderRadius="300">
                  <BlockStack gap="300">
                    <Text as="h3" variant="headingSm">{t.benefits}</Text>
                    <BlockStack gap="200">
                      <Text as="p" variant="bodySm">✅ {t.benefit1}</Text>
                      <Text as="p" variant="bodySm">✅ {t.benefit2}</Text>
                      <Text as="p" variant="bodySm">✅ {t.benefit3}</Text>
                      <Text as="p" variant="bodySm">✅ {t.benefit4}</Text>
                    </BlockStack>
                  </BlockStack>
                </Box>

                <Button
                  variant="primary"
                  onClick={analyzeContent}
                  size="large"
                >
                  {t.analyze}
                </Button>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

        {analyzing && (
          <Layout.Section>
            <Card>
              <Box padding="800">
                <BlockStack gap="400" inlineAlign="center">
                  <Spinner size="large" />
                  <Text as="p" variant="bodyLg">{t.analyzing}</Text>
                </BlockStack>
              </Box>
            </Card>
          </Layout.Section>
        )}

        {report && !analyzing && (
          <>
            <Layout.Section>
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">{t.score}</Text>
                  <InlineStack gap="600" align="start" blockAlign="center">
                    <div
                      style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        background: `conic-gradient(${getScoreInfo(report.score).color} ${report.score * 3.6}deg, #E4E5E7 0deg)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <div
                        style={{
                          width: '100px',
                          height: '100px',
                          borderRadius: '50%',
                          backgroundColor: 'white',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '32px',
                            fontWeight: 700,
                            color: getScoreInfo(report.score).color,
                          }}
                        >
                          {report.score}
                        </span>
                        <span style={{ fontSize: '12px', color: '#6D7175' }}>/ 100</span>
                      </div>
                    </div>

                    <BlockStack gap="300">
                      <Badge tone={getScoreInfo(report.score).tone}>
                        {getScoreInfo(report.score).label}
                      </Badge>
                      <InlineStack gap="400">
                        <BlockStack gap="050">
                          <Text as="p" variant="headingMd">{report.totalProducts}</Text>
                          <Text as="p" variant="bodySm" tone="subdued">{t.totalProducts}</Text>
                        </BlockStack>
                        <BlockStack gap="050">
                          <Text as="p" variant="headingMd">{report.affectedProducts}</Text>
                          <Text as="p" variant="bodySm" tone="subdued">{t.affectedProducts}</Text>
                        </BlockStack>
                        <BlockStack gap="050">
                          <Text as="p" variant="headingMd">{report.duplicateGroups?.length || 0}</Text>
                          <Text as="p" variant="bodySm" tone="subdued">{t.duplicateGroups}</Text>
                        </BlockStack>
                        <BlockStack gap="050">
                          <Text as="p" variant="headingMd">{report.templateIssues || 0}</Text>
                          <Text as="p" variant="bodySm" tone="subdued">{t.templateIssues}</Text>
                        </BlockStack>
                      </InlineStack>
                    </BlockStack>
                  </InlineStack>
                </BlockStack>
              </Card>
            </Layout.Section>

            {report.duplicateGroups && report.duplicateGroups.length > 0 ? (
              <Layout.Section>
                <Card>
                  <BlockStack gap="400">
                    <Text as="h2" variant="headingMd">{t.duplicateGroups}</Text>
                    {report.duplicateGroups.map((group, index) => (
                      <Box
                        key={group.id || index}
                        padding="400"
                        background="bg-surface-secondary"
                        borderRadius="200"
                      >
                        <BlockStack gap="300">
                          <InlineStack align="space-between">
                            <Badge tone="warning">{getTypeLabel(group.type)}</Badge>
                            <Text as="span" variant="bodySm" tone="subdued">
                              {t.similarity}: {Math.round(group.similarity * 100)}%
                            </Text>
                          </InlineStack>
                          <BlockStack gap="100">
                            {group.products.map((product) => (
                              <Text key={product.id} as="p" variant="bodySm">
                                • {product.title}
                              </Text>
                            ))}
                          </BlockStack>
                        </BlockStack>
                      </Box>
                    ))}
                  </BlockStack>
                </Card>
              </Layout.Section>
            ) : (
              <Layout.Section>
                <Banner tone="success">{t.noIssues}</Banner>
              </Layout.Section>
            )}

            <Layout.Section variant="oneThird">
              <Card>
                <BlockStack gap="400">
                  <Text as="h3" variant="headingSm">{t.howToFix}</Text>
                  <BlockStack gap="200">
                    <Text as="p" variant="bodySm">1. {t.fix1}</Text>
                    <Text as="p" variant="bodySm">2. {t.fix2}</Text>
                    <Text as="p" variant="bodySm">3. {t.fix3}</Text>
                    <Text as="p" variant="bodySm">4. {t.fix4}</Text>
                  </BlockStack>
                </BlockStack>
              </Card>
            </Layout.Section>
          </>
        )}
      </Layout>
    </Page>
  );
}
