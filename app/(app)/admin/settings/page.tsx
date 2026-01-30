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
import { NotAuthenticated } from '@/components/admin/NotAuthenticated';
import { AdminNav } from '@/components/admin/AdminNav';
import { PageBanner } from '@/components/admin/PageBanner';
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
      <Page title={t.settings.title}>
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
    >
      <AdminNav locale={locale} />
      <PageBanner pageKey="settings" />
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
              <div className="feature-grid">
                <div>
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
                <div>
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
                <div>
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
              </div>
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

        {/* Compare All Plans - Card Grid */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">{t.settings.compareAllPlans}</Text>
              <Text as="p" tone="subdued">
                {t.settings.choosePlanSubtitle}
              </Text>
              <Divider />

              {/* Plan Cards Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                padding: '8px 0'
              }}>
                {(['FREE', 'BASIC', 'PLUS', 'PREMIUM'] as const).map((planKey) => {
                  const plan = PLAN_FEATURES[planKey];
                  const isCurrent = planKey === currentPlan;
                  const isPopular = 'popular' in plan && plan.popular;
                  const isUpgrade = getPlanIndex(planKey) > getPlanIndex(currentPlan);
                  const isDowngrade = getPlanIndex(planKey) < getPlanIndex(currentPlan);
                  const limits = PLAN_LIMITS[planKey];

                  return (
                    <div
                      key={planKey}
                      style={{
                        borderRadius: '16px',
                        padding: '24px 20px',
                        position: 'relative',
                        background: isPopular
                          ? 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)'
                          : isCurrent
                            ? '#f0fdf4'
                            : '#ffffff',
                        border: isPopular
                          ? 'none'
                          : isCurrent
                            ? '2px solid #22c55e'
                            : '1px solid #e2e8f0',
                        boxShadow: isPopular
                          ? '0 10px 40px rgba(14, 165, 233, 0.3)'
                          : '0 2px 8px rgba(0,0,0,0.04)',
                        transform: isPopular ? 'scale(1.02)' : 'none',
                        color: isPopular ? 'white' : 'inherit',
                      }}
                    >
                      {/* Popular Badge */}
                      {isPopular && (
                        <div style={{
                          position: 'absolute',
                          top: '-10px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: '#fbbf24',
                          color: '#78350f',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}>
                          {t.settings.popular}
                        </div>
                      )}

                      {/* Current Badge */}
                      {isCurrent && !isPopular && (
                        <div style={{
                          position: 'absolute',
                          top: '-10px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: '#22c55e',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}>
                          {t.settings.current}
                        </div>
                      )}

                      {/* Plan Name */}
                      <div style={{
                        fontSize: '18px',
                        fontWeight: 700,
                        marginBottom: '8px',
                        marginTop: (isPopular || isCurrent) ? '8px' : '0',
                      }}>
                        {plan.name}
                      </div>

                      {/* Price */}
                      <div style={{ marginBottom: '16px' }}>
                        <span style={{ fontSize: '32px', fontWeight: 800 }}>
                          {plan.price === 0 ? t.settings.free : `$${plan.price}`}
                        </span>
                        {plan.price > 0 && (
                          <span style={{
                            fontSize: '14px',
                            opacity: isPopular ? 0.9 : 0.6,
                            marginLeft: '4px'
                          }}>
                            /{locale === 'fr' ? 'mois' : 'mo'}
                          </span>
                        )}
                      </div>

                      {/* Features List */}
                      <div style={{
                        fontSize: '13px',
                        lineHeight: '2',
                        opacity: isPopular ? 0.95 : 1,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: isPopular ? '#bae6fd' : '#22c55e' }}>✓</span>
                          <span>{limits.productsAudited === Infinity ? t.settings.unlimited : limits.productsAudited} {t.settings.productsAuditedLabel.toLowerCase()}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: isPopular ? '#bae6fd' : '#22c55e' }}>✓</span>
                          <span>{limits.visibilityChecksPerMonth} {t.settings.visibilityChecksLabel.toLowerCase()}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: isPopular ? '#bae6fd' : '#22c55e' }}>✓</span>
                          <span>{limits.aiOptimizationsPerMonth} {t.settings.aiSuggestionsLabel.toLowerCase()}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: isPopular ? '#bae6fd' : limits.competitorsTracked > 0 ? '#22c55e' : '#94a3b8' }}>
                            {limits.competitorsTracked > 0 ? '✓' : '−'}
                          </span>
                          <span style={{ opacity: limits.competitorsTracked > 0 ? 1 : 0.5 }}>
                            {limits.competitorsTracked > 0 ? `${limits.competitorsTracked} ${t.settings.competitorsTracked.toLowerCase()}` : t.settings.competitorsTracked}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: isPopular ? '#bae6fd' : limits.exportCsv ? '#22c55e' : '#94a3b8' }}>
                            {limits.exportCsv ? '✓' : '−'}
                          </span>
                          <span style={{ opacity: limits.exportCsv ? 1 : 0.5 }}>{t.settings.csvExport}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: isPopular ? '#bae6fd' : limits.apiAccess ? '#22c55e' : '#94a3b8' }}>
                            {limits.apiAccess ? '✓' : '−'}
                          </span>
                          <span style={{ opacity: limits.apiAccess ? 1 : 0.5 }}>{t.settings.apiAccess}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: isPopular ? '#bae6fd' : limits.prioritySupport ? '#22c55e' : '#94a3b8' }}>
                            {limits.prioritySupport ? '✓' : '−'}
                          </span>
                          <span style={{ opacity: limits.prioritySupport ? 1 : 0.5 }}>{t.settings.prioritySupport}</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div style={{ marginTop: '20px' }}>
                        {isCurrent ? (
                          <div style={{
                            padding: '10px 16px',
                            borderRadius: '8px',
                            textAlign: 'center',
                            fontWeight: 600,
                            fontSize: '14px',
                            background: isPopular ? 'rgba(255,255,255,0.2)' : '#dcfce7',
                            color: isPopular ? 'white' : '#16a34a',
                          }}>
                            {t.settings.currentPlan}
                          </div>
                        ) : planKey === 'FREE' ? null : (
                          <button
                            onClick={() => isDevMode ? handleDevPlanChange(planKey) : handleUpgrade(planKey)}
                            style={{
                              width: '100%',
                              padding: '10px 16px',
                              borderRadius: '8px',
                              border: 'none',
                              fontWeight: 600,
                              fontSize: '14px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              background: isPopular
                                ? 'white'
                                : isUpgrade
                                  ? 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)'
                                  : '#f1f5f9',
                              color: isPopular
                                ? '#0EA5E9'
                                : isUpgrade
                                  ? 'white'
                                  : '#64748b',
                            }}
                          >
                            {isUpgrade ? t.settings.upgrade : isDowngrade ? t.settings.downgrade : t.settings.select}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
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

    </Page>
  );
}
