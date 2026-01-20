'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Badge,
  Button,
  Banner,
  Spinner,
  Box,
  Divider,
  ProgressBar,
} from '@shopify/polaris';
import { useAuthenticatedFetch, useShopContext } from '@/components/providers/ShopProvider';
import { TechnicalSeoCard } from '@/components/admin/TechnicalSeoCard';
import { LlmsTxtConfigModal } from '@/components/admin/LlmsTxtConfigModal';
import { JsonLdConfigModal } from '@/components/admin/JsonLdConfigModal';
import { NotAuthenticated } from '@/components/admin/NotAuthenticated';
import { useAdminLanguage } from '@/lib/i18n/AdminLanguageContext';
import type { AdminLocale } from '@/lib/i18n/translations';

interface ShopInfo {
  shopDomain: string;
  plan: string;
  installedAt: string;
}

interface UsageInfo {
  productsAudited: number;
  visibilityChecks: number;
  aiOptimizations: number;
}

// Dev mode secret - allows plan changes without billing
const DEV_SECRET = 'surfaced';

// Check if dev mode is enabled from multiple sources (embedded apps lose URL params)
function checkDevMode(): boolean {
  if (typeof window === 'undefined') return false;

  // Check current URL params
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('dev') === DEV_SECRET) {
    // Store in sessionStorage for persistence
    try { sessionStorage.setItem('surfaced_dev_mode', 'true'); } catch {}
    return true;
  }

  // Check parent URL (for embedded apps) via referrer
  try {
    const referrer = document.referrer;
    if (referrer && referrer.includes(`dev=${DEV_SECRET}`)) {
      sessionStorage.setItem('surfaced_dev_mode', 'true');
      return true;
    }
  } catch {}

  // Check sessionStorage (persisted from previous detection)
  try {
    if (sessionStorage.getItem('surfaced_dev_mode') === 'true') {
      return true;
    }
  } catch {}

  // Check if we're in development environment
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  return false;
}

// Plan hierarchy for comparison
const PLAN_ORDER = ['FREE', 'BASIC', 'PLUS', 'PREMIUM'] as const;

const getPlanIndex = (plan: string): number => {
  const index = PLAN_ORDER.indexOf(plan as typeof PLAN_ORDER[number]);
  return index === -1 ? 0 : index;
};

// Import plan limits from the central constants to stay in sync
import { PLAN_LIMITS, PLAN_PRICES } from '@/lib/constants/plans';

// Type for plan features
interface PlanFeature {
  name: string;
  included: boolean;
}

interface PlanInfo {
  name: string;
  price: number;
  priceLabel: string;
  description: string;
  popular?: boolean;
  limits: {
    products: number;
    visibilityChecks: number;
    aiOptimizations: number;
    competitors: number;
  };
  features: PlanFeature[];
}

type PlanFeaturesType = {
  FREE: PlanInfo;
  BASIC: PlanInfo;
  PLUS: PlanInfo;
  PREMIUM: PlanInfo;
};

// Function to get plan features with translations
function getPlanFeatures(t: ReturnType<typeof useAdminLanguage>['t']): PlanFeaturesType {
  return {
    FREE: {
      name: t.settings.planNames.free,
      price: 0,
      priceLabel: t.settings.free,
      description: t.settings.planDescriptions.free,
      limits: {
        products: PLAN_LIMITS.FREE.productsAudited,
        visibilityChecks: PLAN_LIMITS.FREE.visibilityChecksPerMonth,
        aiOptimizations: PLAN_LIMITS.FREE.aiOptimizationsPerMonth,
        competitors: PLAN_LIMITS.FREE.competitorsTracked,
      },
      features: [
        { name: 'AI Visibility Audit', included: true },
        { name: `Up to ${PLAN_LIMITS.FREE.productsAudited} products`, included: true },
        { name: `${PLAN_LIMITS.FREE.visibilityChecksPerMonth} checks/month`, included: true },
        { name: 'AI Guide Generator', included: true },
        { name: 'Basic recommendations', included: true },
        { name: `${PLAN_LIMITS.FREE.aiOptimizationsPerMonth} AI suggestions/month`, included: PLAN_LIMITS.FREE.aiOptimizationsPerMonth > 0 },
        { name: 'Auto JSON-LD schemas', included: false },
        { name: 'CSV Export', included: PLAN_LIMITS.FREE.exportCsv },
        { name: 'Weekly reports', included: false },
        { name: 'Competitor tracking', included: false },
        { name: 'Priority support', included: false },
      ],
    },
    BASIC: {
      name: t.settings.planNames.starter,
      price: PLAN_PRICES.BASIC,
      priceLabel: `$${PLAN_PRICES.BASIC}/${t.settings.perMonth.split(' ')[0]}`,
      description: t.settings.planDescriptions.starter,
      limits: {
        products: PLAN_LIMITS.BASIC.productsAudited,
        visibilityChecks: PLAN_LIMITS.BASIC.visibilityChecksPerMonth,
        aiOptimizations: PLAN_LIMITS.BASIC.aiOptimizationsPerMonth,
        competitors: PLAN_LIMITS.BASIC.competitorsTracked,
      },
      features: [
        { name: 'AI Visibility Audit', included: true },
        { name: `Up to ${PLAN_LIMITS.BASIC.productsAudited} products`, included: true },
        { name: `${PLAN_LIMITS.BASIC.visibilityChecksPerMonth} checks/month`, included: true },
        { name: 'AI Guide Generator', included: true },
        { name: 'Detailed recommendations', included: true },
        { name: `${PLAN_LIMITS.BASIC.aiOptimizationsPerMonth} AI suggestions/month`, included: true },
        { name: 'Auto JSON-LD schemas', included: true },
        { name: 'CSV Export', included: PLAN_LIMITS.BASIC.exportCsv },
        { name: 'Weekly reports', included: false },
        { name: `${PLAN_LIMITS.BASIC.competitorsTracked} competitor${PLAN_LIMITS.BASIC.competitorsTracked !== 1 ? 's' : ''} tracked`, included: PLAN_LIMITS.BASIC.competitorsTracked > 0 },
        { name: 'Priority support', included: false },
      ],
    },
    PLUS: {
      name: t.settings.planNames.growth,
      price: PLAN_PRICES.PLUS,
      priceLabel: `$${PLAN_PRICES.PLUS}/${t.settings.perMonth.split(' ')[0]}`,
      description: t.settings.planDescriptions.growth,
      popular: true,
      limits: {
        products: PLAN_LIMITS.PLUS.productsAudited,
        visibilityChecks: PLAN_LIMITS.PLUS.visibilityChecksPerMonth,
        aiOptimizations: PLAN_LIMITS.PLUS.aiOptimizationsPerMonth,
        competitors: PLAN_LIMITS.PLUS.competitorsTracked,
      },
      features: [
        { name: 'AI Visibility Audit', included: true },
        { name: `Up to ${PLAN_LIMITS.PLUS.productsAudited} products`, included: true },
        { name: `${PLAN_LIMITS.PLUS.visibilityChecksPerMonth} checks/month`, included: true },
        { name: 'AI Guide Generator', included: true },
        { name: 'Advanced recommendations', included: true },
        { name: `${PLAN_LIMITS.PLUS.aiOptimizationsPerMonth} AI suggestions/month`, included: true },
        { name: 'Auto JSON-LD schemas', included: true },
        { name: 'CSV Export', included: PLAN_LIMITS.PLUS.exportCsv },
        { name: 'Weekly reports', included: true },
        { name: `${PLAN_LIMITS.PLUS.competitorsTracked} competitors tracked`, included: true },
        { name: 'Priority support', included: false },
      ],
    },
    PREMIUM: {
      name: t.settings.planNames.scale,
      price: PLAN_PRICES.PREMIUM,
      priceLabel: `$${PLAN_PRICES.PREMIUM}/${t.settings.perMonth.split(' ')[0]}`,
      description: t.settings.planDescriptions.scale,
      limits: {
        products: -1, // Infinity becomes -1 for UI
        visibilityChecks: PLAN_LIMITS.PREMIUM.visibilityChecksPerMonth,
        aiOptimizations: PLAN_LIMITS.PREMIUM.aiOptimizationsPerMonth,
        competitors: PLAN_LIMITS.PREMIUM.competitorsTracked,
      },
      features: [
        { name: 'AI Visibility Audit', included: true },
        { name: t.settings.unlimited + ' products', included: true },
        { name: `${PLAN_LIMITS.PREMIUM.visibilityChecksPerMonth} checks/month`, included: true },
        { name: 'AI Guide Generator', included: true },
        { name: 'Premium recommendations', included: true },
        { name: `${PLAN_LIMITS.PREMIUM.aiOptimizationsPerMonth} AI suggestions/month`, included: true },
        { name: 'Auto JSON-LD schemas', included: true },
        { name: 'CSV Export', included: PLAN_LIMITS.PREMIUM.exportCsv },
        { name: 'Daily reports', included: true },
        { name: `${PLAN_LIMITS.PREMIUM.competitorsTracked} competitors tracked`, included: true },
        { name: 'Priority support', included: true },
      ],
    },
  };
}

export default function SettingsPage() {
  const { t, locale, setLanguage } = useAdminLanguage();
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDevMode, setIsDevMode] = useState(false);
  const [devClicks, setDevClicks] = useState(0);
  const { fetch: authFetch } = useAuthenticatedFetch();
  const { isLoading: shopLoading, shopDetectionFailed, error: shopError } = useShopContext();

  // Technical SEO state
  const [showLlmsTxtModal, setShowLlmsTxtModal] = useState(false);
  const [showJsonLdModal, setShowJsonLdModal] = useState(false);
  const [llmsTxtEnabled, setLlmsTxtEnabled] = useState(false);
  const [jsonLdEnabled, setJsonLdEnabled] = useState(false);
  const [llmsTxtLastUpdated, setLlmsTxtLastUpdated] = useState<string | null>(null);
  const [jsonLdLastUpdated, setJsonLdLastUpdated] = useState<string | null>(null);

  // Get plan features with translations
  const PLAN_FEATURES = getPlanFeatures(t);

  // Check dev mode on mount (client-side only)
  useEffect(() => {
    setIsDevMode(checkDevMode());
  }, []);

  // Hidden dev mode activation: click "Your store" 5 times
  const handleDevClick = useCallback(() => {
    const newClicks = devClicks + 1;
    setDevClicks(newClicks);
    if (newClicks >= 5 && !isDevMode) {
      setIsDevMode(true);
      try { sessionStorage.setItem('surfaced_dev_mode', 'true'); } catch {}
    }
  }, [devClicks, isDevMode]);

  const fetchShopInfo = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authFetch('/api/shop');
      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          setShopInfo({
            shopDomain: result.data.shopDomain,
            plan: result.data.plan,
            installedAt: result.data.createdAt,
          });
          // Mock usage data - in production this would come from the API
          setUsage({
            productsAudited: result.data.productsAudited || 12,
            visibilityChecks: result.data.visibilityChecks || 3,
            aiOptimizations: result.data.aiOptimizations || 0,
          });
        }
      } else {
        // Fallback for development
        setShopInfo({
          shopDomain: 'your-store.myshopify.com',
          plan: 'FREE',
          installedAt: new Date().toISOString(),
        });
        setUsage({
          productsAudited: 12,
          visibilityChecks: 3,
          aiOptimizations: 0,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setLoading(false);
    }
  }, [authFetch, t.common.error]);

  useEffect(() => {
    fetchShopInfo();
  }, [fetchShopInfo]);

  // Load Technical SEO config
  const loadTechnicalSeoConfig = useCallback(async () => {
    try {
      // Load llms.txt config
      const llmsResponse = await authFetch('/api/llms-txt');
      if (llmsResponse.ok) {
        const llmsData = await llmsResponse.json();
        if (llmsData.success) {
          setLlmsTxtEnabled(llmsData.data.config.isEnabled);
          setLlmsTxtLastUpdated(llmsData.data.config.lastGeneratedAt);
        }
      }

      // Load JSON-LD config
      const jsonLdResponse = await authFetch('/api/json-ld');
      if (jsonLdResponse.ok) {
        const jsonLdData = await jsonLdResponse.json();
        if (jsonLdData.success) {
          setJsonLdEnabled(jsonLdData.data.config.isEnabled);
          setJsonLdLastUpdated(jsonLdData.data.config.lastGeneratedAt);
        }
      }
    } catch {
      // Silently fail - these are optional features
    }
  }, [authFetch]);

  useEffect(() => {
    loadTechnicalSeoConfig();
  }, [loadTechnicalSeoConfig]);

  const handleUpgrade = async (plan: string) => {
    try {
      const response = await authFetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      const result = await response.json();

      if (response.ok && result.data?.confirmationUrl) {
        window.open(result.data.confirmationUrl, '_top');
      } else {
        setError(result.error || t.common.error);
      }
    } catch {
      setError(t.common.error);
    }
  };

  // DEV ONLY: Change plan directly for testing
  const handleDevPlanChange = async (plan: string) => {
    try {
      const response = await authFetch('/api/dev/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setShopInfo((prev) => prev ? { ...prev, plan } : null);
        setError(null);
      } else {
        setError(result.error || `${t.common.error} (${response.status})`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    }
  };

  // Show authentication error if shop detection failed
  if (shopDetectionFailed) {
    return <NotAuthenticated error={shopError} />;
  }

  if (loading || shopLoading) {
    return (
      <Page title={t.settings.title} backAction={{ content: t.settings.dashboard, url: '/admin' }}>
        <Layout>
          <Layout.Section>
            <Card>
              <Box padding="800">
                <BlockStack gap="400" inlineAlign="center">
                  <Spinner size="large" />
                  <Text as="p">{t.settings.loading}</Text>
                </BlockStack>
              </Box>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  const currentPlan = shopInfo?.plan || 'FREE';
  const planInfo = PLAN_FEATURES[currentPlan as keyof typeof PLAN_FEATURES];
  const limits = planInfo.limits;

  // Calculate usage percentages (cast to number to handle both finite and -1/Infinity cases)
  const productsLimit = limits.products as number;
  const visibilityLimit = limits.visibilityChecks as number;
  const optimizationLimit = limits.aiOptimizations as number;

  const productUsage = productsLimit < 0 || productsLimit === Infinity ? 0 : ((usage?.productsAudited || 0) / productsLimit) * 100;
  const visibilityUsage = visibilityLimit < 0 || visibilityLimit === Infinity ? 0 : ((usage?.visibilityChecks || 0) / visibilityLimit) * 100;
  const optimizationUsage = optimizationLimit <= 0 ? 0 : ((usage?.aiOptimizations || 0) / optimizationLimit) * 100;

  return (
    <Page
      title={t.settings.title}
      subtitle={t.settings.subtitle}
      backAction={{ content: t.settings.dashboard, url: '/admin' }}
    >
      <Layout>
        {error && (
          <Layout.Section>
            <Banner tone="critical" onDismiss={() => setError(null)}>
              {error}
            </Banner>
          </Layout.Section>
        )}

        {isDevMode && (
          <Layout.Section>
            <Banner tone="warning">
              <BlockStack gap="300">
                <Text as="p" fontWeight="bold">
                  {t.settings.devMode}
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  {t.settings.devModeDesc}
                </Text>
                <InlineStack gap="200">
                  {(['FREE', 'BASIC', 'PLUS', 'PREMIUM'] as const).map((plan) => (
                    <Button
                      key={plan}
                      size="slim"
                      variant={currentPlan === plan ? 'primary' : 'secondary'}
                      onClick={() => handleDevPlanChange(plan)}
                    >
                      {PLAN_FEATURES[plan].name}
                    </Button>
                  ))}
                </InlineStack>
              </BlockStack>
            </Banner>
          </Layout.Section>
        )}

        {/* Welcome Section */}
        <Layout.Section>
          <Card>
            <div style={{
              background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)',
              margin: '-16px -16px 16px -16px',
              padding: '24px',
              borderRadius: '12px 12px 0 0',
            }}>
              <BlockStack gap="200">
                <Text as="h2" variant="headingLg" fontWeight="bold">
                  <span style={{ color: 'white' }}>{t.settings.choosePlan}</span>
                </Text>
                <Text as="p" variant="bodyMd">
                  <span style={{ color: 'rgba(255,255,255,0.9)' }}>
                    {locale === 'fr'
                      ? 'Plus vous investissez dans votre visibilite IA, plus vous attirez de clients via ChatGPT, Perplexity et autres.'
                      : 'The more you invest in your AI visibility, the more customers you attract via ChatGPT, Perplexity and others.'}
                  </span>
                </Text>
              </BlockStack>
            </div>

            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">{t.settings.whyUpgrade}</Text>
              <InlineStack gap="400" wrap>
                <div style={{ flex: '1', minWidth: '200px' }}>
                  <BlockStack gap="200">
                    <InlineStack gap="200" blockAlign="center">
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '14px',
                      }}>1</div>
                      <Text as="p" fontWeight="semibold">{t.settings.moreProducts}</Text>
                    </InlineStack>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {t.settings.moreProductsDesc}
                    </Text>
                  </BlockStack>
                </div>
                <div style={{ flex: '1', minWidth: '200px' }}>
                  <BlockStack gap="200">
                    <InlineStack gap="200" blockAlign="center">
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '14px',
                      }}>2</div>
                      <Text as="p" fontWeight="semibold">{t.settings.competitorTracking}</Text>
                    </InlineStack>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {t.settings.competitorTrackingDesc}
                    </Text>
                  </BlockStack>
                </div>
                <div style={{ flex: '1', minWidth: '200px' }}>
                  <BlockStack gap="200">
                    <InlineStack gap="200" blockAlign="center">
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '14px',
                      }}>3</div>
                      <Text as="p" fontWeight="semibold">{t.settings.detailedReports}</Text>
                    </InlineStack>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {t.settings.detailedReportsDesc}
                    </Text>
                  </BlockStack>
                </div>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Current Plan Overview */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <BlockStack gap="100">
                  <InlineStack gap="200" blockAlign="center">
                    <Text as="h2" variant="headingLg">{planInfo.name}</Text>
                    {currentPlan !== 'FREE' && (
                      <Badge tone="success">{t.settings.active}</Badge>
                    )}
                    {currentPlan === 'FREE' && (
                      <Badge tone="info">{t.settings.currentPlan}</Badge>
                    )}
                  </InlineStack>
                  <Text as="p" tone="subdued">{planInfo.description}</Text>
                </BlockStack>
                <BlockStack gap="100" inlineAlign="end">
                  <Text as="p" variant="headingXl" fontWeight="bold">
                    {planInfo.price === 0 ? t.settings.free : `$${planInfo.price}`}
                  </Text>
                  {planInfo.price > 0 && (
                    <Text as="p" variant="bodySm" tone="subdued">{t.settings.perMonth}</Text>
                  )}
                </BlockStack>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Usage This Month */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">{t.settings.usageThisMonth}</Text>
              <Divider />

              {/* Products */}
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text as="p">{t.settings.productsAudited}</Text>
                  <Text as="p" fontWeight="semibold">
                    {usage?.productsAudited || 0} / {productsLimit < 0 || productsLimit === Infinity ? '∞' : productsLimit}
                  </Text>
                </InlineStack>
                {productsLimit > 0 && productsLimit !== Infinity && (
                  <ProgressBar
                    progress={Math.min(productUsage, 100)}
                    tone={productUsage > 80 ? 'critical' : 'highlight'}
                    size="small"
                  />
                )}
              </BlockStack>

              {/* Visibility Checks */}
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text as="p">{t.settings.visibilityChecks}</Text>
                  <Text as="p" fontWeight="semibold">
                    {usage?.visibilityChecks || 0} / {visibilityLimit < 0 || visibilityLimit === Infinity ? '∞' : visibilityLimit}
                  </Text>
                </InlineStack>
                {visibilityLimit > 0 && visibilityLimit !== Infinity && (
                  <ProgressBar
                    progress={Math.min(visibilityUsage, 100)}
                    tone={visibilityUsage > 80 ? 'critical' : 'highlight'}
                    size="small"
                  />
                )}
              </BlockStack>

              {/* AI Optimizations */}
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text as="p">{t.settings.aiSuggestions}</Text>
                  <Text as="p" fontWeight="semibold">
                    {usage?.aiOptimizations || 0} / {optimizationLimit < 0 || optimizationLimit === Infinity ? '∞' : optimizationLimit === 0 ? t.settings.notIncluded : optimizationLimit}
                  </Text>
                </InlineStack>
                {optimizationLimit > 0 && (
                  <ProgressBar
                    progress={Math.min(optimizationUsage, 100)}
                    tone={optimizationUsage > 80 ? 'critical' : 'highlight'}
                    size="small"
                  />
                )}
              </BlockStack>

              {(productUsage > 80 || visibilityUsage > 80) && currentPlan !== 'PREMIUM' && (
                <Banner tone="warning">
                  <Text as="p">
                    {t.settings.approachingLimits}
                  </Text>
                </Banner>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Compare All Plans - Full Comparison Table */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">{t.settings.compareAllPlans}</Text>
              <Text as="p" tone="subdued">
                {t.settings.choosePlanSubtitle}
              </Text>
              <Divider />

              {/* Comparison Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--p-color-border)' }}>
                      <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 600 }}>{t.settings.feature}</th>
                      {(['FREE', 'BASIC', 'PLUS', 'PREMIUM'] as const).map((planKey) => {
                        const plan = PLAN_FEATURES[planKey];
                        const isCurrent = planKey === currentPlan;
                        const isPopular = 'popular' in plan && plan.popular;
                        return (
                          <th
                            key={planKey}
                            style={{
                              padding: '12px 8px',
                              textAlign: 'center',
                              fontWeight: 600,
                              backgroundColor: isCurrent ? 'var(--p-color-bg-fill-success)' : isPopular ? 'var(--p-color-bg-fill-warning)' : undefined,
                              borderRadius: '8px 8px 0 0',
                            }}
                          >
                            <BlockStack gap="100" inlineAlign="center">
                              <Text as="span" variant="headingSm">{plan.name}</Text>
                              {isCurrent && <Badge tone="success" size="small">{t.settings.current}</Badge>}
                              {isPopular && !isCurrent && <Badge tone="attention" size="small">{t.settings.popular}</Badge>}
                              <Text as="span" variant="bodyLg" fontWeight="bold">
                                {plan.price === 0 ? t.settings.free : `$${plan.price}`}
                              </Text>
                              {plan.price > 0 && <Text as="span" variant="bodySm" tone="subdued">/{locale === 'fr' ? 'mois' : 'mo'}</Text>}
                            </BlockStack>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Products */}
                    <tr style={{ borderBottom: '1px solid var(--p-color-border-subdued)' }}>
                      <td style={{ padding: '10px 8px' }}>{t.settings.productsAuditedLabel}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.FREE.productsAudited}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.BASIC.productsAudited}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.PLUS.productsAudited}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 600 }}>{t.settings.unlimited}</td>
                    </tr>
                    {/* Visibility Checks */}
                    <tr style={{ borderBottom: '1px solid var(--p-color-border-subdued)' }}>
                      <td style={{ padding: '10px 8px' }}>{t.settings.visibilityChecksLabel}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.FREE.visibilityChecksPerMonth}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.BASIC.visibilityChecksPerMonth}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.PLUS.visibilityChecksPerMonth}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.PREMIUM.visibilityChecksPerMonth}</td>
                    </tr>
                    {/* AI Optimizations */}
                    <tr style={{ borderBottom: '1px solid var(--p-color-border-subdued)' }}>
                      <td style={{ padding: '10px 8px' }}>{t.settings.aiSuggestionsLabel}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.FREE.aiOptimizationsPerMonth}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.BASIC.aiOptimizationsPerMonth}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.PLUS.aiOptimizationsPerMonth}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.PREMIUM.aiOptimizationsPerMonth}</td>
                    </tr>
                    {/* Competitors */}
                    <tr style={{ borderBottom: '1px solid var(--p-color-border-subdued)' }}>
                      <td style={{ padding: '10px 8px' }}>{t.settings.competitorsTracked}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.FREE.competitorsTracked || '-'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.BASIC.competitorsTracked}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.PLUS.competitorsTracked}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.PREMIUM.competitorsTracked}</td>
                    </tr>
                    {/* History */}
                    <tr style={{ borderBottom: '1px solid var(--p-color-border-subdued)' }}>
                      <td style={{ padding: '10px 8px' }}>{t.settings.historyRetained}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.FREE.historyDays} {t.settings.days}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.BASIC.historyDays} {t.settings.days}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.PLUS.historyDays} {t.settings.days}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.PREMIUM.historyDays} {t.settings.days}</td>
                    </tr>
                    {/* Export CSV */}
                    <tr style={{ borderBottom: '1px solid var(--p-color-border-subdued)' }}>
                      <td style={{ padding: '10px 8px' }}>{t.settings.csvExport}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.FREE.exportCsv ? '✓' : '-'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.BASIC.exportCsv ? '✓' : '-'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.PLUS.exportCsv ? '✓' : '-'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.PREMIUM.exportCsv ? '✓' : '-'}</td>
                    </tr>
                    {/* API Access */}
                    <tr style={{ borderBottom: '1px solid var(--p-color-border-subdued)' }}>
                      <td style={{ padding: '10px 8px' }}>{t.settings.apiAccess}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.FREE.apiAccess ? '✓' : '-'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.BASIC.apiAccess ? '✓' : '-'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.PLUS.apiAccess ? '✓' : '-'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.PREMIUM.apiAccess ? '✓' : '-'}</td>
                    </tr>
                    {/* Priority Support */}
                    <tr style={{ borderBottom: '1px solid var(--p-color-border-subdued)' }}>
                      <td style={{ padding: '10px 8px' }}>{t.settings.prioritySupport}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.FREE.prioritySupport ? '✓' : '-'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.BASIC.prioritySupport ? '✓' : '-'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.PLUS.prioritySupport ? '✓' : '-'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.PREMIUM.prioritySupport ? '✓' : '-'}</td>
                    </tr>
                    {/* Action Row */}
                    <tr>
                      <td style={{ padding: '16px 8px' }}></td>
                      {(['FREE', 'BASIC', 'PLUS', 'PREMIUM'] as const).map((planKey) => {
                        const isCurrent = planKey === currentPlan;
                        const isUpgrade = getPlanIndex(planKey) > getPlanIndex(currentPlan);
                        const isDowngrade = getPlanIndex(planKey) < getPlanIndex(currentPlan);
                        return (
                          <td key={planKey} style={{ padding: '16px 8px', textAlign: 'center' }}>
                            {isCurrent ? (
                              <Badge tone="success">{t.settings.currentPlan}</Badge>
                            ) : planKey === 'FREE' ? null : (
                              <Button
                                size="slim"
                                variant={isUpgrade ? 'primary' : 'secondary'}
                                onClick={() => isDevMode ? handleDevPlanChange(planKey) : handleUpgrade(planKey)}
                              >
                                {isUpgrade ? t.settings.upgrade : isDowngrade ? t.settings.downgrade : t.settings.select}
                              </Button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Shop Info */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <div onClick={handleDevClick} style={{ cursor: 'default' }}>
                <Text as="h2" variant="headingMd">
                  {t.settings.yourStore} {devClicks > 0 && devClicks < 5 ? `(${5 - devClicks})` : ''}
                </Text>
              </div>
              <Divider />

              <BlockStack gap="200">
                <InlineStack gap="200">
                  <Text as="span" fontWeight="semibold" variant="bodySm">{t.settings.domain}:</Text>
                  <Text as="span" variant="bodySm">{shopInfo?.shopDomain}</Text>
                </InlineStack>
                <InlineStack gap="200">
                  <Text as="span" fontWeight="semibold" variant="bodySm">{t.settings.memberSince}:</Text>
                  <Text as="span" variant="bodySm">
                    {shopInfo?.installedAt
                      ? new Date(shopInfo.installedAt).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })
                      : 'N/A'}
                  </Text>
                </InlineStack>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Language Preferences */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                {locale === 'fr' ? 'Langue' : 'Language'}
              </Text>
              <Divider />

              <BlockStack gap="300">
                <Text as="p" tone="subdued">
                  {locale === 'fr'
                    ? 'Choisissez la langue de l\'interface. Ce paramètre sera sauvegardé pour vos prochaines visites.'
                    : 'Choose the interface language. This setting will be saved for your next visits.'}
                </Text>

                <InlineStack gap="200">
                  <Button
                    variant={locale === 'en' ? 'primary' : 'secondary'}
                    onClick={() => setLanguage('en' as AdminLocale)}
                  >
                    English
                  </Button>
                  <Button
                    variant={locale === 'fr' ? 'primary' : 'secondary'}
                    onClick={() => setLanguage('fr' as AdminLocale)}
                  >
                    Français
                  </Button>
                </InlineStack>

                <Text as="p" variant="bodySm" tone="subdued">
                  {locale === 'fr'
                    ? `Langue actuelle: Français (détectée depuis ${typeof localStorage !== 'undefined' && localStorage.getItem('surfaced-admin-language') ? 'vos préférences' : 'votre navigateur'})`
                    : `Current language: English (detected from ${typeof localStorage !== 'undefined' && localStorage.getItem('surfaced-admin-language') ? 'your preferences' : 'your browser'})`}
                </Text>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Technical SEO Section */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                {locale === 'fr' ? 'SEO Technique' : 'Technical SEO'}
              </Text>
              <Text as="p" tone="subdued">
                {locale === 'fr'
                  ? 'Configurez comment les crawlers IA et les moteurs de recherche comprennent votre boutique.'
                  : 'Configure how AI crawlers and search engines understand your store.'}
              </Text>
              <Divider />

              <BlockStack gap="300">
                <TechnicalSeoCard
                  title="llms.txt"
                  description={locale === 'fr'
                    ? 'Aidez les assistants IA à comprendre le contenu de votre boutique'
                    : 'Help AI assistants understand your store content'}
                  enabled={llmsTxtEnabled}
                  onConfigure={() => setShowLlmsTxtModal(true)}
                  lastUpdated={llmsTxtLastUpdated}
                  locale={locale}
                />

                <TechnicalSeoCard
                  title="JSON-LD"
                  description={locale === 'fr'
                    ? 'Données structurées pour de meilleurs résultats de recherche'
                    : 'Structured data for rich search results'}
                  enabled={jsonLdEnabled}
                  onConfigure={() => setShowJsonLdModal(true)}
                  lastUpdated={jsonLdLastUpdated}
                  locale={locale}
                />
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Tips Section */}
        <Layout.Section>
          <Card>
            <div style={{
              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              margin: '-16px',
              padding: '20px',
              borderRadius: '12px',
            }}>
              <BlockStack gap="300">
                <Text as="h3" variant="headingMd">{t.settings.tips}</Text>
                <BlockStack gap="200">
                  <InlineStack gap="200" blockAlign="start">
                    <span style={{ color: '#0EA5E9' }}>1.</span>
                    <Text as="p" variant="bodySm">
                      <strong>{t.settings.tip1}</strong>: {t.settings.tip1Desc}
                    </Text>
                  </InlineStack>
                  <InlineStack gap="200" blockAlign="start">
                    <span style={{ color: '#0EA5E9' }}>2.</span>
                    <Text as="p" variant="bodySm">
                      <strong>{t.settings.tip2}</strong>: {t.settings.tip2Desc}
                    </Text>
                  </InlineStack>
                  <InlineStack gap="200" blockAlign="start">
                    <span style={{ color: '#0EA5E9' }}>3.</span>
                    <Text as="p" variant="bodySm">
                      <strong>{t.settings.tip3}</strong>: {t.settings.tip3Desc}
                    </Text>
                  </InlineStack>
                </BlockStack>
              </BlockStack>
            </div>
          </Card>
        </Layout.Section>

        {/* Help */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">{t.settings.needHelp}</Text>
              <Text as="p" tone="subdued">
                {t.settings.needHelpDesc}
              </Text>
              <InlineStack gap="200">
                <Button url="mailto:support@surfaced.app">{t.settings.contactSupport}</Button>
                <Button variant="plain" url="/admin">{t.settings.backToDashboard}</Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      {/* Technical SEO Modals */}
      <LlmsTxtConfigModal
        open={showLlmsTxtModal}
        onClose={() => setShowLlmsTxtModal(false)}
        locale={locale}
        onConfigChange={(config) => {
          setLlmsTxtEnabled(config.isEnabled);
          setLlmsTxtLastUpdated(config.lastGeneratedAt);
        }}
      />

      <JsonLdConfigModal
        open={showJsonLdModal}
        onClose={() => setShowJsonLdModal(false)}
        locale={locale}
        onConfigChange={(config) => {
          setJsonLdEnabled(config.isEnabled);
          setJsonLdLastUpdated(config.lastGeneratedAt);
        }}
      />
    </Page>
  );
}
