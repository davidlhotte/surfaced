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
  DataTable,
  Spinner,
} from '@shopify/polaris';
import { RefreshIcon, ClipboardIcon } from '@shopify/polaris-icons';
import { useAuthenticatedFetch } from '@/components/providers/ShopProvider';
import { useAdminLanguage } from '@/lib/i18n/AdminLanguageContext';

interface AITrafficStats {
  totalVisits: number;
  conversions: number;
  conversionRate: number;
  totalRevenue: number;
  platformBreakdown: Array<{
    platform: string;
    visits: number;
    conversions: number;
    revenue: number;
  }>;
}

export default function AITrafficPage() {
  const { fetch } = useAuthenticatedFetch();
  const { locale } = useAdminLanguage();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AITrafficStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [shopDomain, setShopDomain] = useState<string>('');

  const tr = {
    en: {
      title: 'AI Traffic Tracking',
      subtitle: 'Track visitors coming from AI platforms like ChatGPT and Perplexity',
      back: 'SEO Tools',
      refresh: 'Refresh',
      totalVisits: 'Total AI Visits',
      conversions: 'Conversions',
      conversionRate: 'Conversion Rate',
      totalRevenue: 'Total Revenue',
      platformBreakdown: 'Traffic by Platform',
      platform: 'Platform',
      visits: 'Visits',
      revenue: 'Revenue',
      noData: 'No AI traffic data yet',
      noDataDesc: 'Install the tracking script to start tracking AI referrals',
      installScript: 'Install Tracking Script',
      scriptTitle: 'Tracking Script',
      scriptDesc: 'Add this script to your theme to track AI traffic',
      copy: 'Copy Script',
      copied: 'Copied!',
      step1: 'Go to your Shopify Admin',
      step2: 'Navigate to Online Store > Themes > Edit Code',
      step3: 'Open theme.liquid and paste the script before </head>',
      benefits: 'What You\'ll Track',
      benefit1: 'Visitors from ChatGPT, Claude, Perplexity, Gemini',
      benefit2: 'Conversion rates by AI platform',
      benefit3: 'Revenue attributed to AI traffic',
      benefit4: 'Landing pages and customer journeys',
      errorMsg: 'Failed to load traffic data',
    },
    fr: {
      title: 'Suivi du Trafic IA',
      subtitle: 'Suivez les visiteurs venant des plateformes IA comme ChatGPT et Perplexity',
      back: 'Outils SEO',
      refresh: 'Actualiser',
      totalVisits: 'Visites IA Totales',
      conversions: 'Conversions',
      conversionRate: 'Taux de Conversion',
      totalRevenue: 'Revenu Total',
      platformBreakdown: 'Trafic par Plateforme',
      platform: 'Plateforme',
      visits: 'Visites',
      revenue: 'Revenu',
      noData: 'Pas encore de donnees de trafic IA',
      noDataDesc: 'Installez le script de suivi pour commencer a suivre les referrals IA',
      installScript: 'Installer le Script de Suivi',
      scriptTitle: 'Script de Suivi',
      scriptDesc: 'Ajoutez ce script a votre theme pour suivre le trafic IA',
      copy: 'Copier le Script',
      copied: 'Copie!',
      step1: 'Allez dans votre Admin Shopify',
      step2: 'Naviguez vers Boutique en ligne > Themes > Modifier le code',
      step3: 'Ouvrez theme.liquid et collez le script avant </head>',
      benefits: 'Ce que Vous Suivrez',
      benefit1: 'Visiteurs de ChatGPT, Claude, Perplexity, Gemini',
      benefit2: 'Taux de conversion par plateforme IA',
      benefit3: 'Revenu attribue au trafic IA',
      benefit4: 'Pages d\'atterrissage et parcours clients',
      errorMsg: 'Echec du chargement des donnees de trafic',
    },
  };

  const t = tr[locale] || tr.en;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const dashboardRes = await fetch('/api/dashboard');
      const dashboardData = await dashboardRes.json();

      if (dashboardData.success) {
        setShopDomain(dashboardData.data.shop.domain);
      }

      const response = await fetch('/api/ai-traffic?action=stats');
      const data = await response.json();

      if (data.error) {
        // No data is OK, just show empty state
        setStats(null);
      } else {
        setStats(data);
      }
    } catch (e) {
      // Don't show error for no data
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [fetch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getTrackingScript = () => {
    const apiEndpoint = typeof window !== 'undefined'
      ? `${window.location.origin}/api/ai-traffic`
      : 'https://surfaced.vercel.app/api/ai-traffic';

    return `<script>
(function() {
  var SHOP_DOMAIN = "${shopDomain}";
  var API_ENDPOINT = "${apiEndpoint}";

  var AI_PATTERNS = {
    chatgpt: /chat\\.openai\\.com|chatgpt\\.com/i,
    perplexity: /perplexity\\.ai/i,
    claude: /claude\\.ai/i,
    gemini: /gemini\\.google\\.com/i,
    copilot: /copilot\\.microsoft\\.com|bing\\.com\\/chat/i
  };

  function detectAI(referrer) {
    for (var key in AI_PATTERNS) {
      if (AI_PATTERNS[key].test(referrer)) return key;
    }
    return null;
  }

  var referrer = document.referrer || '';
  var platform = detectAI(referrer);

  if (platform) {
    fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shopDomain: SHOP_DOMAIN,
        referrer: referrer,
        landingPage: window.location.pathname,
        userAgent: navigator.userAgent
      })
    }).catch(function() {});
  }
})();
</script>`;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getTrackingScript());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <Page title={t.title} backAction={{ content: t.back, url: '/admin/seo-tools' }}>
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
      backAction={{ content: t.back, url: '/admin/seo-tools' }}
      secondaryActions={[
        {
          content: t.refresh,
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
          <Card>
            <BlockStack gap="400">
              <InlineStack gap="300" blockAlign="center">
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                  }}
                >
                  📊
                </div>
                <BlockStack gap="050">
                  <Text as="h2" variant="headingLg">{t.title}</Text>
                  <Text as="p" tone="subdued">{t.subtitle}</Text>
                </BlockStack>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {stats && stats.totalVisits > 0 ? (
          <>
            <Layout.Section>
              <InlineStack gap="400" wrap>
                <Box minWidth="200px">
                  <Card>
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingSm">{t.totalVisits}</Text>
                      <Text as="p" variant="heading2xl" fontWeight="bold">
                        {stats.totalVisits}
                      </Text>
                    </BlockStack>
                  </Card>
                </Box>
                <Box minWidth="200px">
                  <Card>
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingSm">{t.conversions}</Text>
                      <Text as="p" variant="heading2xl" fontWeight="bold">
                        {stats.conversions}
                      </Text>
                    </BlockStack>
                  </Card>
                </Box>
                <Box minWidth="200px">
                  <Card>
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingSm">{t.conversionRate}</Text>
                      <Text as="p" variant="heading2xl" fontWeight="bold">
                        {stats.conversionRate.toFixed(1)}%
                      </Text>
                    </BlockStack>
                  </Card>
                </Box>
                <Box minWidth="200px">
                  <Card>
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingSm">{t.totalRevenue}</Text>
                      <Text as="p" variant="heading2xl" fontWeight="bold">
                        ${stats.totalRevenue.toFixed(2)}
                      </Text>
                    </BlockStack>
                  </Card>
                </Box>
              </InlineStack>
            </Layout.Section>

            {stats.platformBreakdown && stats.platformBreakdown.length > 0 && (
              <Layout.Section>
                <Card>
                  <BlockStack gap="400">
                    <Text as="h2" variant="headingMd">{t.platformBreakdown}</Text>
                    <DataTable
                      columnContentTypes={['text', 'numeric', 'numeric', 'numeric']}
                      headings={[t.platform, t.visits, t.conversions, t.revenue]}
                      rows={stats.platformBreakdown.map((p) => [
                        p.platform.charAt(0).toUpperCase() + p.platform.slice(1),
                        p.visits.toString(),
                        p.conversions.toString(),
                        `$${p.revenue.toFixed(2)}`,
                      ])}
                    />
                  </BlockStack>
                </Card>
              </Layout.Section>
            )}
          </>
        ) : (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Box padding="400" background="bg-surface-secondary" borderRadius="300">
                  <BlockStack gap="300" inlineAlign="center">
                    <Text as="h3" variant="headingMd">{t.noData}</Text>
                    <Text as="p" tone="subdued">{t.noDataDesc}</Text>
                  </BlockStack>
                </Box>

                <Divider />

                <Text as="h3" variant="headingSm">{t.scriptTitle}</Text>
                <Text as="p" variant="bodySm" tone="subdued">{t.scriptDesc}</Text>

                <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                  <pre
                    style={{
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      maxHeight: '200px',
                      overflow: 'auto',
                      color: '#374151',
                    }}
                  >
                    {getTrackingScript()}
                  </pre>
                </Box>

                <Button icon={ClipboardIcon} onClick={handleCopy} variant="primary">
                  {copied ? t.copied : t.copy}
                </Button>

                <Divider />

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
        )}

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
