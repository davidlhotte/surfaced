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
  SkeletonBodyText,
  Box,
  Divider,
} from '@shopify/polaris';
import { RefreshIcon } from '@shopify/polaris-icons';
import Link from 'next/link';
import { useAuthenticatedFetch } from '@/components/providers/ShopProvider';
import { AdminNav } from '@/components/admin/AdminNav';
import { PageBanner } from '@/components/admin/PageBanner';
import { useAdminLanguage } from '@/lib/i18n/AdminLanguageContext';

const AEO_TOOLS = [
  {
    id: 'llmsTxt',
    icon: '📄',
    color: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)',
    href: '/admin/tools?tool=llms',
    plans: ['FREE', 'BASIC', 'PLUS', 'PREMIUM'],
  },
  {
    id: 'jsonLd',
    icon: '🏷️',
    color: 'linear-gradient(135deg, #14B8A6 0%, #2DD4BF 100%)',
    href: '/admin/tools?tool=jsonld',
    plans: ['FREE', 'BASIC', 'PLUS', 'PREMIUM'],
  },
  {
    id: 'robots',
    icon: '🤖',
    color: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
    href: '/admin/aeo-tools/robots-txt',
    plans: ['FREE', 'BASIC', 'PLUS', 'PREMIUM'],
  },
  {
    id: 'sitemap',
    icon: '🗺️',
    color: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)',
    href: '/admin/aeo-tools/sitemap',
    plans: ['FREE', 'BASIC', 'PLUS', 'PREMIUM'],
  },
  {
    id: 'duplicate',
    icon: '🔍',
    color: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
    href: '/admin/aeo-tools/duplicate-content',
    plans: ['BASIC', 'PLUS', 'PREMIUM'],
  },
  {
    id: 'reports',
    icon: '📈',
    color: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
    href: '/admin/aeo-tools/reports',
    plans: ['PLUS', 'PREMIUM'],
  },
];

export default function AeoToolsPage() {
  const { fetch } = useAuthenticatedFetch();
  const { locale } = useAdminLanguage();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shopPlan, setShopPlan] = useState<string>('FREE');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/dashboard');
      const data = await response.json();

      if (data.success) {
        setShopPlan(data.data.shop.plan || 'FREE');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [fetch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const translations = {
    en: {
      title: 'AEO Tools',
      subtitle: 'AI Engine Optimization tools to maximize your visibility on ChatGPT, Claude, Perplexity and other AI assistants',
      home: 'Home',
      refresh: 'Refresh',
      upgradePlan: 'Upgrade Plan',
      available: 'Available',
      requiresUpgrade: 'Requires upgrade',
      tools: {
        llmsTxt: {
          title: 'llms.txt Generator',
          description: 'Create a guide file that helps AI assistants understand your store and recommend your products',
          stat: 'File configured',
        },
        jsonLd: {
          title: 'JSON-LD Schemas',
          description: 'Add structured data to help AI crawlers understand your products, prices, and reviews',
          stat: 'Schema active',
        },
        robots: {
          title: 'AI Bot Manager',
          description: 'Control which AI bots (GPTBot, ClaudeBot, PerplexityBot) can crawl and learn from your store',
          stat: 'AI bots managed',
        },
        sitemap: {
          title: 'Sitemap Generator',
          description: 'Generate optimized XML sitemaps to help AI crawlers index your products',
          stat: 'URLs indexed',
        },
        duplicate: {
          title: 'Content Quality',
          description: 'Detect duplicate content that confuses AI and hurts recommendations',
          stat: 'Content score',
        },
        reports: {
          title: 'AEO Reports',
          description: 'Generate comprehensive AI visibility and audit reports for your store',
          stat: 'Reports available',
        },
      },
    },
    fr: {
      title: 'Outils AEO',
      subtitle: 'Outils d\'optimisation pour moteurs IA pour maximiser votre visibilite sur ChatGPT, Claude, Perplexity et autres assistants IA',
      home: 'Accueil',
      refresh: 'Actualiser',
      upgradePlan: 'Mettre a niveau',
      available: 'Disponible',
      requiresUpgrade: 'Mise a niveau requise',
      tools: {
        llmsTxt: {
          title: 'Generateur llms.txt',
          description: 'Creez un fichier guide qui aide les assistants IA a comprendre votre boutique et recommander vos produits',
          stat: 'Fichier configure',
        },
        jsonLd: {
          title: 'Schemas JSON-LD',
          description: 'Ajoutez des donnees structurees pour aider les crawlers IA a comprendre vos produits, prix et avis',
          stat: 'Schema actif',
        },
        robots: {
          title: 'Gestionnaire Bots IA',
          description: 'Controlez quels bots IA (GPTBot, ClaudeBot, PerplexityBot) peuvent explorer votre boutique',
          stat: 'Bots IA geres',
        },
        sitemap: {
          title: 'Generateur Sitemap',
          description: 'Generez des sitemaps XML optimises pour aider les crawlers IA a indexer vos produits',
          stat: 'URLs indexees',
        },
        duplicate: {
          title: 'Qualite du Contenu',
          description: 'Detectez le contenu duplique qui confond les IA et nuit aux recommandations',
          stat: 'Score de contenu',
        },
        reports: {
          title: 'Rapports AEO',
          description: 'Generez des rapports complets de visibilite IA et d\'audit pour votre boutique',
          stat: 'Rapports disponibles',
        },
      },
    },
  };

  const tr = translations[locale] || translations.en;

  if (loading) {
    return (
      <Page title={tr.title} backAction={{ content: tr.home, url: '/admin' }}>
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

  const canAccessTool = (plans: string[]) => plans.includes(shopPlan);

  return (
    <Page
      title={tr.title}
      backAction={{ content: tr.home, url: '/admin' }}
      secondaryActions={[
        {
          content: tr.refresh,
          icon: RefreshIcon,
          onAction: loadData,
        },
      ]}
    >
      <AdminNav locale={locale} />
      <PageBanner pageKey="aeoTools" />
      <Layout>
        {error && (
          <Layout.Section>
            <Banner tone="critical" onDismiss={() => setError(null)}>
              {error}
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Text as="p" variant="bodyLg" tone="subdued">
            {tr.subtitle}
          </Text>
        </Layout.Section>

        <Layout.Section>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '16px',
            }}
          >
            {AEO_TOOLS.map((tool) => {
              const toolTr = tr.tools[tool.id as keyof typeof tr.tools];
              const hasAccess = canAccessTool(tool.plans);

              return (
                <Card key={tool.id}>
                  <BlockStack gap="400">
                    <InlineStack align="space-between" blockAlign="start">
                      <InlineStack gap="300" blockAlign="center">
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: tool.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px',
                          }}
                        >
                          {tool.icon}
                        </div>
                        <BlockStack gap="050">
                          <Text as="h3" variant="headingMd">
                            {toolTr.title}
                          </Text>
                        </BlockStack>
                      </InlineStack>
                      <Badge tone={hasAccess ? 'success' : 'attention'}>
                        {hasAccess ? tr.available : tr.requiresUpgrade}
                      </Badge>
                    </InlineStack>

                    <Text as="p" variant="bodySm" tone="subdued">
                      {toolTr.description}
                    </Text>

                    <Divider />

                    <InlineStack align="space-between" blockAlign="center">
                      {hasAccess ? (
                        <Link href={tool.href}>
                          <Button variant="primary">
                            {locale === 'fr' ? 'Ouvrir' : 'Open'} →
                          </Button>
                        </Link>
                      ) : (
                        <Link href="/admin/settings">
                          <Button>{tr.upgradePlan}</Button>
                        </Link>
                      )}
                    </InlineStack>
                  </BlockStack>
                </Card>
              );
            })}
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
