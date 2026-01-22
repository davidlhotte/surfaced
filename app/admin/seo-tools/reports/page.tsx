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
  Select,
  Spinner,
} from '@shopify/polaris';
import { RefreshIcon, ExportIcon } from '@shopify/polaris-icons';
import { useAuthenticatedFetch } from '@/components/providers/ShopProvider';
import { useAdminLanguage } from '@/lib/i18n/AdminLanguageContext';

type ReportType = 'audit' | 'visibility' | 'summary';

export default function ReportsPage() {
  const { fetch } = useAuthenticatedFetch();
  const { locale } = useAdminLanguage();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [reportType, setReportType] = useState<ReportType>('audit');
  const [format, setFormat] = useState<string>('csv');

  const tr = {
    en: {
      title: 'SEO Reports',
      subtitle: 'Generate comprehensive reports for your store\'s SEO performance',
      back: 'SEO Tools',
      reportType: 'Report Type',
      auditReport: 'Product Audit Report',
      auditDesc: 'Complete analysis of all products with AI scores and issues',
      visibilityReport: 'AI Visibility Report',
      visibilityDesc: 'Results of AI visibility checks across platforms',
      summaryReport: 'Executive Summary',
      summaryDesc: 'High-level overview of your AI optimization status',
      format: 'Export Format',
      csv: 'CSV (Spreadsheet)',
      json: 'JSON (Data)',
      txt: 'Text (Summary)',
      generate: 'Generate Report',
      generating: 'Generating...',
      download: 'Download',
      reportContents: 'What\'s Included',
      auditContents: [
        'Product ID and title for each product',
        'AI score and detailed breakdown',
        'Issues found with severity level',
        'Recommendations for improvement',
      ],
      visibilityContents: [
        'Check ID and timestamp',
        'AI platform and query used',
        'Whether your brand was mentioned',
        'Position in AI response',
        'Competitors found',
      ],
      summaryContents: [
        'Shop overview and statistics',
        'Overall AI score and trend',
        'Issue breakdown by severity',
        'Visibility stats by platform',
        'Recommendations summary',
      ],
      benefits: 'Why Export Reports?',
      benefit1: 'Share progress with your team',
      benefit2: 'Track improvements over time',
      benefit3: 'Identify patterns in issues',
      benefit4: 'Make data-driven decisions',
      successMsg: 'Report generated successfully!',
      errorMsg: 'Failed to generate report',
    },
    fr: {
      title: 'Rapports SEO',
      subtitle: 'Generez des rapports complets sur les performances SEO de votre boutique',
      back: 'Outils SEO',
      reportType: 'Type de Rapport',
      auditReport: 'Rapport d\'Audit Produits',
      auditDesc: 'Analyse complete de tous les produits avec scores IA et problemes',
      visibilityReport: 'Rapport de Visibilite IA',
      visibilityDesc: 'Resultats des verifications de visibilite IA sur les plateformes',
      summaryReport: 'Resume Executif',
      summaryDesc: 'Vue d\'ensemble de haut niveau de votre statut d\'optimisation IA',
      format: 'Format d\'Export',
      csv: 'CSV (Tableur)',
      json: 'JSON (Donnees)',
      txt: 'Texte (Resume)',
      generate: 'Generer le Rapport',
      generating: 'Generation...',
      download: 'Telecharger',
      reportContents: 'Contenu du Rapport',
      auditContents: [
        'ID et titre de chaque produit',
        'Score IA et details',
        'Problemes trouves avec niveau de severite',
        'Recommandations d\'amelioration',
      ],
      visibilityContents: [
        'ID de verification et horodatage',
        'Plateforme IA et requete utilisee',
        'Si votre marque a ete mentionnee',
        'Position dans la reponse IA',
        'Concurrents trouves',
      ],
      summaryContents: [
        'Apercu de la boutique et statistiques',
        'Score IA global et tendance',
        'Repartition des problemes par severite',
        'Statistiques de visibilite par plateforme',
        'Resume des recommandations',
      ],
      benefits: 'Pourquoi Exporter des Rapports?',
      benefit1: 'Partagez les progres avec votre equipe',
      benefit2: 'Suivez les ameliorations dans le temps',
      benefit3: 'Identifiez les tendances des problemes',
      benefit4: 'Prenez des decisions basees sur les donnees',
      successMsg: 'Rapport genere avec succes!',
      errorMsg: 'Echec de la generation du rapport',
    },
  };

  const t = tr[locale] || tr.en;

  const generateReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(
        `/api/reports?type=${reportType}&format=${format}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t.errorMsg);
      }

      // Handle different content types
      const contentType = response.headers.get('content-type') || '';
      let blob: Blob;
      let filename: string;

      if (contentType.includes('application/json')) {
        const data = await response.json();
        blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        filename = `surfaced-${reportType}-report.json`;
      } else if (contentType.includes('text/csv')) {
        const text = await response.text();
        blob = new Blob([text], { type: 'text/csv' });
        filename = `surfaced-${reportType}-report.csv`;
      } else {
        const text = await response.text();
        blob = new Blob([text], { type: 'text/plain' });
        filename = `surfaced-${reportType}-report.txt`;
      }

      // Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess(t.successMsg);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.errorMsg);
    } finally {
      setLoading(false);
    }
  }, [fetch, reportType, format, t]);

  const getReportContents = () => {
    switch (reportType) {
      case 'audit':
        return t.auditContents;
      case 'visibility':
        return t.visibilityContents;
      case 'summary':
        return t.summaryContents;
      default:
        return [];
    }
  };

  return (
    <Page
      title={t.title}
      backAction={{ content: t.back, url: '/admin/seo-tools' }}
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
            <BlockStack gap="500">
              <InlineStack gap="300" blockAlign="center">
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                  }}
                >
                  📈
                </div>
                <BlockStack gap="050">
                  <Text as="h2" variant="headingLg">{t.title}</Text>
                  <Text as="p" tone="subdued">{t.subtitle}</Text>
                </BlockStack>
              </InlineStack>

              <Divider />

              <Text as="h3" variant="headingSm">{t.reportType}</Text>

              <BlockStack gap="300">
                <div
                  onClick={() => setReportType('audit')}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    border: reportType === 'audit' ? '2px solid #5c6ac4' : '2px solid #e1e3e5',
                    background: reportType === 'audit' ? '#f4f5fa' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <InlineStack gap="300" blockAlign="center">
                    <Text as="span" variant="headingSm">📊</Text>
                    <BlockStack gap="050">
                      <Text as="p" fontWeight="semibold">{t.auditReport}</Text>
                      <Text as="p" variant="bodySm" tone="subdued">{t.auditDesc}</Text>
                    </BlockStack>
                  </InlineStack>
                </div>

                <div
                  onClick={() => setReportType('visibility')}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    border: reportType === 'visibility' ? '2px solid #5c6ac4' : '2px solid #e1e3e5',
                    background: reportType === 'visibility' ? '#f4f5fa' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <InlineStack gap="300" blockAlign="center">
                    <Text as="span" variant="headingSm">👁️</Text>
                    <BlockStack gap="050">
                      <Text as="p" fontWeight="semibold">{t.visibilityReport}</Text>
                      <Text as="p" variant="bodySm" tone="subdued">{t.visibilityDesc}</Text>
                    </BlockStack>
                  </InlineStack>
                </div>

                <div
                  onClick={() => setReportType('summary')}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    border: reportType === 'summary' ? '2px solid #5c6ac4' : '2px solid #e1e3e5',
                    background: reportType === 'summary' ? '#f4f5fa' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <InlineStack gap="300" blockAlign="center">
                    <Text as="span" variant="headingSm">📝</Text>
                    <BlockStack gap="050">
                      <Text as="p" fontWeight="semibold">{t.summaryReport}</Text>
                      <Text as="p" variant="bodySm" tone="subdued">{t.summaryDesc}</Text>
                    </BlockStack>
                  </InlineStack>
                </div>
              </BlockStack>

              <Divider />

              <Select
                label={t.format}
                options={[
                  { label: t.csv, value: 'csv' },
                  { label: t.json, value: 'json' },
                  { label: t.txt, value: 'txt' },
                ]}
                value={format}
                onChange={setFormat}
              />

              <Button
                variant="primary"
                icon={ExportIcon}
                onClick={generateReport}
                loading={loading}
                size="large"
              >
                {loading ? t.generating : t.generate}
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <Text as="h3" variant="headingSm">{t.reportContents}</Text>
              <BlockStack gap="200">
                {getReportContents().map((item, index) => (
                  <Text key={index} as="p" variant="bodySm">
                    • {item}
                  </Text>
                ))}
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
                <Text as="p" variant="bodySm">✅ {t.benefit4}</Text>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
