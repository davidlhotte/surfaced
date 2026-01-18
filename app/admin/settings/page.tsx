'use client';

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
  Icon,
} from '@shopify/polaris';
import {
  CheckCircleIcon,
  XCircleIcon,
} from '@shopify/polaris-icons';
import { useAuthenticatedFetch, useShopContext } from '@/components/providers/ShopProvider';
import { NotAuthenticated } from '@/components/admin/NotAuthenticated';

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
import { PLAN_LIMITS, PLAN_PRICES, PLAN_NAMES } from '@/lib/constants/plans';

// Real plan features matching lib/constants/plans.ts
const PLAN_FEATURES = {
  FREE: {
    name: 'Free Trial',
    price: 0,
    priceLabel: 'Free forever',
    description: 'Perfect for getting started',
    limits: {
      products: PLAN_LIMITS.FREE.productsAudited,
      visibilityChecks: PLAN_LIMITS.FREE.visibilityChecksPerMonth,
      aiOptimizations: PLAN_LIMITS.FREE.aiOptimizationsPerMonth,
      competitors: PLAN_LIMITS.FREE.competitorsTracked,
    },
    features: [
      { name: 'AI readiness audit', included: true },
      { name: `Up to ${PLAN_LIMITS.FREE.productsAudited} products`, included: true },
      { name: `${PLAN_LIMITS.FREE.visibilityChecksPerMonth} visibility checks/month`, included: true },
      { name: 'AI Guide generator', included: true },
      { name: 'Basic recommendations', included: true },
      { name: `${PLAN_LIMITS.FREE.aiOptimizationsPerMonth} AI content suggestions/month`, included: PLAN_LIMITS.FREE.aiOptimizationsPerMonth > 0 },
      { name: 'Structured data', included: false },
      { name: 'Weekly reports', included: false },
      { name: 'Competitor tracking', included: false },
      { name: 'Priority support', included: false },
    ],
  },
  BASIC: {
    name: 'Starter',
    price: PLAN_PRICES.BASIC,
    priceLabel: `$${PLAN_PRICES.BASIC}/month`,
    description: 'For growing stores',
    limits: {
      products: PLAN_LIMITS.BASIC.productsAudited,
      visibilityChecks: PLAN_LIMITS.BASIC.visibilityChecksPerMonth,
      aiOptimizations: PLAN_LIMITS.BASIC.aiOptimizationsPerMonth,
      competitors: PLAN_LIMITS.BASIC.competitorsTracked,
    },
    features: [
      { name: 'AI readiness audit', included: true },
      { name: `Up to ${PLAN_LIMITS.BASIC.productsAudited} products`, included: true },
      { name: `${PLAN_LIMITS.BASIC.visibilityChecksPerMonth} visibility checks/month`, included: true },
      { name: 'AI Guide generator', included: true },
      { name: 'Detailed recommendations', included: true },
      { name: `${PLAN_LIMITS.BASIC.aiOptimizationsPerMonth} AI content suggestions/month`, included: true },
      { name: 'Structured data export', included: true },
      { name: 'Weekly reports', included: false },
      { name: `Track ${PLAN_LIMITS.BASIC.competitorsTracked} competitor${PLAN_LIMITS.BASIC.competitorsTracked !== 1 ? 's' : ''}`, included: PLAN_LIMITS.BASIC.competitorsTracked > 0 },
      { name: 'Priority support', included: false },
    ],
  },
  PLUS: {
    name: 'Growth',
    price: PLAN_PRICES.PLUS,
    priceLabel: `$${PLAN_PRICES.PLUS}/month`,
    description: 'For serious sellers',
    popular: true,
    limits: {
      products: PLAN_LIMITS.PLUS.productsAudited,
      visibilityChecks: PLAN_LIMITS.PLUS.visibilityChecksPerMonth,
      aiOptimizations: PLAN_LIMITS.PLUS.aiOptimizationsPerMonth,
      competitors: PLAN_LIMITS.PLUS.competitorsTracked,
    },
    features: [
      { name: 'AI readiness audit', included: true },
      { name: `Up to ${PLAN_LIMITS.PLUS.productsAudited} products`, included: true },
      { name: `${PLAN_LIMITS.PLUS.visibilityChecksPerMonth} visibility checks/month`, included: true },
      { name: 'AI Guide generator', included: true },
      { name: 'Advanced recommendations', included: true },
      { name: `${PLAN_LIMITS.PLUS.aiOptimizationsPerMonth} AI content suggestions/month`, included: true },
      { name: 'Structured data export', included: true },
      { name: 'Weekly reports', included: true },
      { name: `Track ${PLAN_LIMITS.PLUS.competitorsTracked} competitors`, included: true },
      { name: 'Priority support', included: false },
    ],
  },
  PREMIUM: {
    name: 'Scale',
    price: PLAN_PRICES.PREMIUM,
    priceLabel: `$${PLAN_PRICES.PREMIUM}/month`,
    description: 'For high-volume stores',
    limits: {
      products: -1, // Infinity becomes -1 for UI
      visibilityChecks: PLAN_LIMITS.PREMIUM.visibilityChecksPerMonth,
      aiOptimizations: PLAN_LIMITS.PREMIUM.aiOptimizationsPerMonth,
      competitors: PLAN_LIMITS.PREMIUM.competitorsTracked,
    },
    features: [
      { name: 'AI readiness audit', included: true },
      { name: 'Unlimited products', included: true },
      { name: `${PLAN_LIMITS.PREMIUM.visibilityChecksPerMonth} visibility checks/month`, included: true },
      { name: 'AI Guide generator', included: true },
      { name: 'Premium recommendations', included: true },
      { name: `${PLAN_LIMITS.PREMIUM.aiOptimizationsPerMonth} AI content suggestions/month`, included: true },
      { name: 'Structured data export', included: true },
      { name: 'Daily reports', included: true },
      { name: `Track ${PLAN_LIMITS.PREMIUM.competitorsTracked} competitors`, included: true },
      { name: 'Priority support', included: true },
    ],
  },
};

export default function SettingsPage() {
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDevMode, setIsDevMode] = useState(false);
  const [devClicks, setDevClicks] = useState(0);
  const { fetch: authFetch } = useAuthenticatedFetch();
  const { isLoading: shopLoading, shopDetectionFailed, error: shopError } = useShopContext();

  // Check dev mode on mount (client-side only)
  useEffect(() => {
    setIsDevMode(checkDevMode());
  }, []);

  // Hidden dev mode activation: click "Your Store" 5 times
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
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

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
        setError(result.error || 'Failed to initiate upgrade');
      }
    } catch {
      setError('Failed to initiate upgrade');
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
        setError(result.error || `Failed to change plan (${response.status})`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change plan');
    }
  };

  // Show authentication error if shop detection failed
  if (shopDetectionFailed) {
    return <NotAuthenticated error={shopError} />;
  }

  if (loading || shopLoading) {
    return (
      <Page title="Your Plan" backAction={{ content: 'Dashboard', url: '/admin' }}>
        <Layout>
          <Layout.Section>
            <Card>
              <Box padding="800">
                <BlockStack gap="400" inlineAlign="center">
                  <Spinner size="large" />
                  <Text as="p">Loading your plan...</Text>
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
      title="Your Plan"
      subtitle="Manage your subscription and see what's included"
      backAction={{ content: 'Dashboard', url: '/admin' }}
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
                  Dev Mode: Test different plans (no billing)
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  Click a plan to switch instantly without being charged.
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

        {/* Current Plan Overview */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <BlockStack gap="100">
                  <InlineStack gap="200" blockAlign="center">
                    <Text as="h2" variant="headingLg">{planInfo.name}</Text>
                    {currentPlan !== 'FREE' && (
                      <Badge tone="success">Active</Badge>
                    )}
                  </InlineStack>
                  <Text as="p" tone="subdued">{planInfo.description}</Text>
                </BlockStack>
                <BlockStack gap="100" inlineAlign="end">
                  <Text as="p" variant="headingXl" fontWeight="bold">
                    {planInfo.price === 0 ? 'Free' : `$${planInfo.price}`}
                  </Text>
                  {planInfo.price > 0 && (
                    <Text as="p" variant="bodySm" tone="subdued">per month</Text>
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
              <Text as="h2" variant="headingMd">Your Usage This Month</Text>
              <Divider />

              {/* Products */}
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text as="p">Products audited</Text>
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
                  <Text as="p">Visibility checks</Text>
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
                  <Text as="p">AI content suggestions</Text>
                  <Text as="p" fontWeight="semibold">
                    {usage?.aiOptimizations || 0} / {optimizationLimit < 0 || optimizationLimit === Infinity ? '∞' : optimizationLimit === 0 ? 'Not included' : optimizationLimit}
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
                    You&apos;re approaching your plan limits. Upgrade to continue growing.
                  </Text>
                </Banner>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Features Included */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">What&apos;s Included</Text>
              <Divider />

              <BlockStack gap="300">
                {planInfo.features.map((feature, i) => (
                  <InlineStack key={i} gap="200" blockAlign="center">
                    <Box width="20px">
                      <Icon
                        source={feature.included ? CheckCircleIcon : XCircleIcon}
                        tone={feature.included ? 'success' : 'subdued'}
                      />
                    </Box>
                    <Text as="span" tone={feature.included ? undefined : 'subdued'}>
                      {feature.name}
                    </Text>
                  </InlineStack>
                ))}
              </BlockStack>

              {currentPlan !== 'PREMIUM' && (
                <Box paddingBlockStart="200">
                  <Button
                    variant="primary"
                    onClick={() => isDevMode ? handleDevPlanChange('PREMIUM') : handleUpgrade('PREMIUM')}
                  >
                    Unlock All Features
                  </Button>
                </Box>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Compare All Plans - Full Comparison Table */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Compare All Plans</Text>
              <Text as="p" tone="subdued">
                Choose the plan that fits your store
              </Text>
              <Divider />

              {/* Comparison Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--p-color-border)' }}>
                      <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 600 }}>Feature</th>
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
                              {isCurrent && <Badge tone="success" size="small">Current</Badge>}
                              {isPopular && !isCurrent && <Badge tone="attention" size="small">Popular</Badge>}
                              <Text as="span" variant="bodyLg" fontWeight="bold">
                                {plan.price === 0 ? 'Free' : `$${plan.price}`}
                              </Text>
                              {plan.price > 0 && <Text as="span" variant="bodySm" tone="subdued">/month</Text>}
                            </BlockStack>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Products */}
                    <tr style={{ borderBottom: '1px solid var(--p-color-border-subdued)' }}>
                      <td style={{ padding: '10px 8px' }}>Products Audited</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.FREE.productsAudited}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.BASIC.productsAudited}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.PLUS.productsAudited}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 600 }}>Unlimited</td>
                    </tr>
                    {/* Visibility Checks */}
                    <tr style={{ borderBottom: '1px solid var(--p-color-border-subdued)' }}>
                      <td style={{ padding: '10px 8px' }}>Visibility Checks/month</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.FREE.visibilityChecksPerMonth}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.BASIC.visibilityChecksPerMonth}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.PLUS.visibilityChecksPerMonth}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.PREMIUM.visibilityChecksPerMonth}</td>
                    </tr>
                    {/* AI Optimizations */}
                    <tr style={{ borderBottom: '1px solid var(--p-color-border-subdued)' }}>
                      <td style={{ padding: '10px 8px' }}>AI Optimizations/month</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.FREE.aiOptimizationsPerMonth}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.BASIC.aiOptimizationsPerMonth}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.PLUS.aiOptimizationsPerMonth}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.PREMIUM.aiOptimizationsPerMonth}</td>
                    </tr>
                    {/* Competitors */}
                    <tr style={{ borderBottom: '1px solid var(--p-color-border-subdued)' }}>
                      <td style={{ padding: '10px 8px' }}>Competitors Tracked</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.FREE.competitorsTracked || '-'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.BASIC.competitorsTracked}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.PLUS.competitorsTracked}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.PREMIUM.competitorsTracked}</td>
                    </tr>
                    {/* History */}
                    <tr style={{ borderBottom: '1px solid var(--p-color-border-subdued)' }}>
                      <td style={{ padding: '10px 8px' }}>History Retention</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.FREE.historyDays} days</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.BASIC.historyDays} days</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.PLUS.historyDays} days</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.PREMIUM.historyDays} days</td>
                    </tr>
                    {/* Export CSV */}
                    <tr style={{ borderBottom: '1px solid var(--p-color-border-subdued)' }}>
                      <td style={{ padding: '10px 8px' }}>Export CSV</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.FREE.exportCsv ? '✓' : '-'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.BASIC.exportCsv ? '✓' : '-'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.PLUS.exportCsv ? '✓' : '-'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.PREMIUM.exportCsv ? '✓' : '-'}</td>
                    </tr>
                    {/* API Access */}
                    <tr style={{ borderBottom: '1px solid var(--p-color-border-subdued)' }}>
                      <td style={{ padding: '10px 8px' }}>API Access</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.FREE.apiAccess ? '✓' : '-'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.BASIC.apiAccess ? '✓' : '-'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.PLUS.apiAccess ? '✓' : '-'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.PREMIUM.apiAccess ? '✓' : '-'}</td>
                    </tr>
                    {/* Priority Support */}
                    <tr style={{ borderBottom: '1px solid var(--p-color-border-subdued)' }}>
                      <td style={{ padding: '10px 8px' }}>Priority Support</td>
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
                              <Badge tone="success">Current Plan</Badge>
                            ) : planKey === 'FREE' ? null : (
                              <Button
                                size="slim"
                                variant={isUpgrade ? 'primary' : 'secondary'}
                                onClick={() => isDevMode ? handleDevPlanChange(planKey) : handleUpgrade(planKey)}
                              >
                                {isUpgrade ? 'Upgrade' : isDowngrade ? 'Downgrade' : 'Select'}
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

        {/* Quick Plan Cards for Mobile */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Quick Plan Overview</Text>
              <Divider />

              <BlockStack gap="300">
                {(Object.entries(PLAN_FEATURES) as [keyof typeof PLAN_FEATURES, typeof PLAN_FEATURES[keyof typeof PLAN_FEATURES]][]).map(([key, plan]) => {
                  const isCurrentPlan = key === currentPlan;
                  const isUpgrade = getPlanIndex(key) > getPlanIndex(currentPlan);
                  const isDowngrade = getPlanIndex(key) < getPlanIndex(currentPlan);
                  const isPopular = 'popular' in plan && plan.popular;

                  return (
                    <Box
                      key={key}
                      padding="400"
                      background={isCurrentPlan ? 'bg-surface-success' : isPopular ? 'bg-surface-warning' : 'bg-surface-secondary'}
                      borderRadius="200"
                    >
                      <InlineStack align="space-between" blockAlign="center" wrap={false}>
                        <BlockStack gap="100">
                          <InlineStack gap="200" blockAlign="center">
                            <Text as="h3" variant="headingSm" fontWeight="bold">
                              {plan.name}
                            </Text>
                            {isCurrentPlan && <Badge tone="success">Current</Badge>}
                            {isPopular && !isCurrentPlan && <Badge tone="attention">Popular</Badge>}
                          </InlineStack>
                          <Text as="p" variant="bodySm" tone="subdued">
                            {plan.description}
                          </Text>
                          <Text as="p" fontWeight="bold">
                            {plan.price === 0 ? 'Free' : `$${plan.price}/mo`}
                          </Text>
                        </BlockStack>

                        {!isCurrentPlan && key !== 'FREE' && (
                          <Button
                            variant={isUpgrade ? 'primary' : 'secondary'}
                            onClick={() => isDevMode ? handleDevPlanChange(key) : handleUpgrade(key)}
                          >
                            {isUpgrade ? 'Upgrade' : isDowngrade ? 'Downgrade' : 'Select'}
                          </Button>
                        )}
                      </InlineStack>

                      {/* Key limits summary */}
                      <Box paddingBlockStart="300">
                        <InlineStack gap="400" wrap>
                          <Text as="span" variant="bodySm" tone="subdued">
                            {(plan.limits.products as number) < 0 || plan.limits.products === Infinity ? 'Unlimited' : plan.limits.products} products
                          </Text>
                          <Text as="span" variant="bodySm" tone="subdued">
                            {(plan.limits.visibilityChecks as number) < 0 || plan.limits.visibilityChecks === Infinity ? 'Unlimited' : plan.limits.visibilityChecks} checks/mo
                          </Text>
                          {(plan.limits.aiOptimizations as number) > 0 && (
                            <Text as="span" variant="bodySm" tone="subdued">
                              {(plan.limits.aiOptimizations as number) < 0 || plan.limits.aiOptimizations === Infinity ? 'Unlimited' : plan.limits.aiOptimizations} AI suggestions/mo
                            </Text>
                          )}
                        </InlineStack>
                      </Box>
                    </Box>
                  );
                })}
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Shop Info */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <div onClick={handleDevClick} style={{ cursor: 'default' }}>
                <Text as="h2" variant="headingMd">
                  Your Store {devClicks > 0 && devClicks < 5 ? `(${5 - devClicks})` : ''}
                </Text>
              </div>
              <Divider />

              <BlockStack gap="200">
                <InlineStack gap="200">
                  <Text as="span" fontWeight="semibold" variant="bodySm">Store:</Text>
                  <Text as="span" variant="bodySm">{shopInfo?.shopDomain}</Text>
                </InlineStack>
                <InlineStack gap="200">
                  <Text as="span" fontWeight="semibold" variant="bodySm">Member since:</Text>
                  <Text as="span" variant="bodySm">
                    {shopInfo?.installedAt
                      ? new Date(shopInfo.installedAt).toLocaleDateString('en-US', {
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

        {/* Help */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Need Help?</Text>
              <Text as="p" tone="subdued">
                Questions about your plan or billing? We&apos;re here to help.
              </Text>
              <InlineStack gap="200">
                <Button url="mailto:support@surfaced.app">Contact Support</Button>
                <Button variant="plain" url="/admin">Back to Dashboard</Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
