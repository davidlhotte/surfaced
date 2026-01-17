'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { useAuthenticatedFetch } from '@/components/providers/ShopProvider';

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

// Plan hierarchy for comparison
const PLAN_ORDER = ['FREE', 'BASIC', 'PLUS', 'PREMIUM'] as const;

const getPlanIndex = (plan: string): number => {
  const index = PLAN_ORDER.indexOf(plan as typeof PLAN_ORDER[number]);
  return index === -1 ? 0 : index;
};

// Real plan features matching the landing page
const PLAN_FEATURES = {
  FREE: {
    name: 'Free',
    price: 0,
    priceLabel: 'Free forever',
    description: 'Perfect for getting started',
    limits: {
      products: 25,
      visibilityChecks: 5,
      aiOptimizations: 0,
      competitors: 0,
    },
    features: [
      { name: 'AI readiness audit', included: true },
      { name: 'Up to 25 products', included: true },
      { name: '5 visibility checks/month', included: true },
      { name: 'AI Guide generator', included: true },
      { name: 'Basic recommendations', included: true },
      { name: 'AI content suggestions', included: false },
      { name: 'Structured data', included: false },
      { name: 'Weekly reports', included: false },
      { name: 'Competitor tracking', included: false },
      { name: 'Priority support', included: false },
    ],
  },
  BASIC: {
    name: 'Starter',
    price: 4.99,
    priceLabel: '$4.99/month',
    description: 'For growing stores',
    limits: {
      products: 100,
      visibilityChecks: 25,
      aiOptimizations: 10,
      competitors: 0,
    },
    features: [
      { name: 'AI readiness audit', included: true },
      { name: 'Up to 100 products', included: true },
      { name: '25 visibility checks/month', included: true },
      { name: 'AI Guide generator', included: true },
      { name: 'Detailed recommendations', included: true },
      { name: '10 AI content suggestions/month', included: true },
      { name: 'Structured data export', included: true },
      { name: 'Weekly reports', included: false },
      { name: 'Competitor tracking', included: false },
      { name: 'Priority support', included: false },
    ],
  },
  PLUS: {
    name: 'Pro',
    price: 9.99,
    priceLabel: '$9.99/month',
    description: 'For serious sellers',
    popular: true,
    limits: {
      products: 500,
      visibilityChecks: 100,
      aiOptimizations: 50,
      competitors: 3,
    },
    features: [
      { name: 'AI readiness audit', included: true },
      { name: 'Up to 500 products', included: true },
      { name: '100 visibility checks/month', included: true },
      { name: 'AI Guide generator', included: true },
      { name: 'Advanced recommendations', included: true },
      { name: '50 AI content suggestions/month', included: true },
      { name: 'Structured data export', included: true },
      { name: 'Weekly reports', included: true },
      { name: 'Track 3 competitors', included: true },
      { name: 'Priority support', included: false },
    ],
  },
  PREMIUM: {
    name: 'Business',
    price: 24.99,
    priceLabel: '$24.99/month',
    description: 'For high-volume stores',
    limits: {
      products: -1, // Unlimited
      visibilityChecks: -1,
      aiOptimizations: -1,
      competitors: 10,
    },
    features: [
      { name: 'AI readiness audit', included: true },
      { name: 'Unlimited products', included: true },
      { name: 'Unlimited visibility checks', included: true },
      { name: 'AI Guide generator', included: true },
      { name: 'Premium recommendations', included: true },
      { name: 'Unlimited AI content suggestions', included: true },
      { name: 'Structured data export', included: true },
      { name: 'Daily reports', included: true },
      { name: 'Track 10 competitors', included: true },
      { name: 'Priority support', included: true },
    ],
  },
};

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { fetch: authFetch } = useAuthenticatedFetch();

  // Check if dev mode is enabled via query param ?dev=surfaced
  const isDevMode = searchParams.get('dev') === DEV_SECRET || process.env.NODE_ENV === 'development';

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

      if (response.ok) {
        setShopInfo((prev) => prev ? { ...prev, plan } : null);
      }
    } catch {
      setError('Failed to change plan');
    }
  };

  if (loading) {
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

  // Calculate usage percentages
  const productUsage = limits.products === -1 ? 0 : ((usage?.productsAudited || 0) / limits.products) * 100;
  const visibilityUsage = limits.visibilityChecks === -1 ? 0 : ((usage?.visibilityChecks || 0) / limits.visibilityChecks) * 100;
  const optimizationUsage = limits.aiOptimizations <= 0 ? 0 : ((usage?.aiOptimizations || 0) / limits.aiOptimizations) * 100;

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
                    {usage?.productsAudited || 0} / {limits.products === -1 ? '∞' : limits.products}
                  </Text>
                </InlineStack>
                {limits.products !== -1 && (
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
                    {usage?.visibilityChecks || 0} / {limits.visibilityChecks === -1 ? '∞' : limits.visibilityChecks}
                  </Text>
                </InlineStack>
                {limits.visibilityChecks !== -1 && (
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
                    {usage?.aiOptimizations || 0} / {limits.aiOptimizations === -1 ? '∞' : limits.aiOptimizations === 0 ? 'Not included' : limits.aiOptimizations}
                  </Text>
                </InlineStack>
                {limits.aiOptimizations > 0 && (
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

        {/* Compare All Plans */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Compare Plans</Text>
              <Text as="p" tone="subdued">
                Choose the plan that fits your store
              </Text>
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
                            {plan.limits.products === -1 ? 'Unlimited' : plan.limits.products} products
                          </Text>
                          <Text as="span" variant="bodySm" tone="subdued">
                            {plan.limits.visibilityChecks === -1 ? 'Unlimited' : plan.limits.visibilityChecks} checks/mo
                          </Text>
                          {plan.limits.aiOptimizations > 0 && (
                            <Text as="span" variant="bodySm" tone="subdued">
                              {plan.limits.aiOptimizations === -1 ? 'Unlimited' : plan.limits.aiOptimizations} AI suggestions/mo
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
              <Text as="h2" variant="headingMd">Your Store</Text>
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
