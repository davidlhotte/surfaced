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
  Icon,
  ProgressBar,
} from '@shopify/polaris';
import {
  RefreshIcon,
  FileIcon,
  CodeIcon,
  SearchIcon,
  ChartVerticalFilledIcon,
  EditIcon,
  ImageIcon,
  AlertCircleIcon,
} from '@shopify/polaris-icons';
import Link from 'next/link';
import { useAuthenticatedFetch } from '@/components/providers/ShopProvider';
import { useAdminLanguage } from '@/lib/i18n/AdminLanguageContext';

interface ToolStats {
  sitemap?: { lastGenerated: string | null; urlCount: number };
  robotsTxt?: { isConfigured: boolean; aiBotsBlocked: number };
  duplicateContent?: { score: number; issuesCount: number };
  aiTraffic?: { totalVisits: number; conversions: number };
  bulkEdit?: { lastJob: string | null; productsEdited: number };
  reports?: { lastReport: string | null };
}

const SEO_TOOLS = [
  {
    id: 'sitemap',
    icon: '🗺️',
    color: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)',
    href: '/admin/seo-tools/sitemap',
    plans: ['FREE', 'BASIC', 'PLUS', 'PREMIUM'],
  },
  {
    id: 'robots',
    icon: '🤖',
    color: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
    href: '/admin/seo-tools/robots-txt',
    plans: ['FREE', 'BASIC', 'PLUS', 'PREMIUM'],
  },
  {
    id: 'duplicate',
    icon: '🔍',
    color: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
    href: '/admin/seo-tools/duplicate-content',
    plans: ['BASIC', 'PLUS', 'PREMIUM'],
  },
  {
    id: 'aiTraffic',
    icon: '📊',
    color: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
    href: '/admin/seo-tools/ai-traffic',
    plans: ['PLUS', 'PREMIUM'],
  },
  {
    id: 'bulkEdit',
    icon: '✏️',
    color: 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)',
    href: '/admin/seo-tools/bulk-edit',
    plans: ['BASIC', 'PLUS', 'PREMIUM'],
  },
  {
    id: 'reports',
    icon: '📈',
    color: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
    href: '/admin/seo-tools/reports',
    plans: ['PLUS', 'PREMIUM'],
  },
];

export default function SeoToolsPage() {
  const { fetch } = useAuthenticatedFetch();
  const { t, locale } = useAdminLanguage();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ToolStats>({});
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
      title: 'SEO Tools',
      subtitle: 'Advanced tools to optimize your store for AI and search engines',
      home: 'Home',
      refresh: 'Refresh',
      upgradePlan: 'Upgrade Plan',
      available: 'Available',
      requiresUpgrade: 'Requires upgrade',
      tools: {
        sitemap: {
          title: 'Sitemap Generator',
          description: 'Generate optimized XML sitemaps with image support for better indexing',
          stat: 'URLs indexed',
        },
        robots: {
          title: 'Robots.txt Manager',
          description: 'Control which bots can crawl your store and manage AI bot access',
          stat: 'AI bots managed',
        },
        duplicate: {
          title: 'Duplicate Content',
          description: 'Detect and fix duplicate content issues hurting your SEO',
          stat: 'Content score',
        },
        aiTraffic: {
          title: 'AI Traffic Tracking',
          description: 'Track visitors coming from ChatGPT, Perplexity, and other AI platforms',
          stat: 'AI visits tracked',
        },
        bulkEdit: {
          title: 'Bulk Editor',
          description: 'Edit alt texts, meta tags, and descriptions for multiple products at once',
          stat: 'Products edited',
        },
        reports: {
          title: 'SEO Reports',
          description: 'Generate comprehensive audit and visibility reports for your store',
          stat: 'Reports available',
        },
      },
    },
    fr: {
      title: 'Outils SEO',
      subtitle: 'Outils avances pour optimiser votre boutique pour l\'IA et les moteurs de recherche',
      home: 'Accueil',
      refresh: 'Actualiser',
      upgradePlan: 'Mettre a niveau',
      available: 'Disponible',
      requiresUpgrade: 'Mise a niveau requise',
      tools: {
        sitemap: {
          title: 'Generateur de Sitemap',
          description: 'Generez des sitemaps XML optimises avec support d\'images pour un meilleur indexage',
          stat: 'URLs indexees',
        },
        robots: {
          title: 'Gestionnaire Robots.txt',
          description: 'Controlez quels bots peuvent explorer votre boutique et gerez l\'acces des bots IA',
          stat: 'Bots IA geres',
        },
        duplicate: {
          title: 'Contenu Duplique',
          description: 'Detectez et corrigez les problemes de contenu duplique nuisant a votre SEO',
          stat: 'Score de contenu',
        },
        aiTraffic: {
          title: 'Suivi Trafic IA',
          description: 'Suivez les visiteurs venant de ChatGPT, Perplexity et autres plateformes IA',
          stat: 'Visites IA suivies',
        },
        bulkEdit: {
          title: 'Editeur en Masse',
          description: 'Modifiez les alt texts, meta tags et descriptions pour plusieurs produits a la fois',
          stat: 'Produits edites',
        },
        reports: {
          title: 'Rapports SEO',
          description: 'Generez des rapports d\'audit et de visibilite complets pour votre boutique',
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
            {SEO_TOOLS.map((tool) => {
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

        {/* Quick Links to Original Tools */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                {locale === 'fr' ? 'Outils AI Guide' : 'AI Guide Tools'}
              </Text>
              <InlineStack gap="400" wrap>
                <Link href="/admin/tools">
                  <Button icon={FileIcon}>
                    llms.txt & JSON-LD
                  </Button>
                </Link>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
