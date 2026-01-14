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
} from '@shopify/polaris';
import { useAuthenticatedFetch } from '@/components/providers/ShopProvider';

interface ShopInfo {
  shopDomain: string;
  plan: string;
  installedAt: string;
}

const isDev = process.env.NODE_ENV === 'development';

// Plan hierarchy for comparison (lower index = lower tier)
const PLAN_ORDER = ['FREE', 'BASIC', 'PLUS', 'PREMIUM'] as const;

const getPlanIndex = (plan: string): number => {
  const index = PLAN_ORDER.indexOf(plan as typeof PLAN_ORDER[number]);
  return index === -1 ? 0 : index;
};

// TODO: Customize these plan features for your app
const PLAN_FEATURES = {
  FREE: {
    name: 'Free',
    price: '$0/month',
    features: [
      'Basic features',
      // Add your free tier features
    ],
    limitations: [
      // Add features not included in free tier
    ],
  },
  BASIC: {
    name: 'Starter',
    price: '$4.99/month',
    features: [
      'Everything in Free',
      // Add your starter tier features
    ],
    limitations: [
      // Add features not included
    ],
  },
  PLUS: {
    name: 'Pro',
    price: '$9.99/month',
    features: [
      'Everything in Starter',
      // Add your pro tier features
    ],
    limitations: [
      // Add features not included
    ],
  },
  PREMIUM: {
    name: 'Business',
    price: '$24.99/month',
    features: [
      'Everything in Pro',
      'Priority support',
      // Add your business tier features
    ],
    limitations: [],
  },
};

export default function SettingsPage() {
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { fetch: authFetch } = useAuthenticatedFetch();

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
        }
      } else {
        // Fallback for development
        setShopInfo({
          shopDomain: 'your-store.myshopify.com',
          plan: 'FREE',
          installedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shop info');
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
        // Redirect to Shopify's billing confirmation page
        window.open(result.data.confirmationUrl, '_top');
      } else {
        setError(result.error || 'Failed to initiate upgrade. Please try reinstalling the app.');
      }
    } catch {
      setError('Failed to initiate upgrade');
    }
  };

  // DEV ONLY: Change plan directly in database for testing
  const handleDevPlanChange = async (plan: string) => {
    try {
      const response = await authFetch('/api/dev/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      if (response.ok) {
        setShopInfo((prev) => prev ? { ...prev, plan } : null);
        alert(`Plan changed to ${plan} for testing!`);
      }
    } catch {
      setError('Failed to change plan');
    }
  };

  if (loading) {
    return (
      <Page title="Settings" backAction={{ content: 'Dashboard', url: '/admin' }}>
        <Layout>
          <Layout.Section>
            <Card>
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <Spinner size="large" />
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  const currentPlan = shopInfo?.plan || 'FREE';
  const planInfo = PLAN_FEATURES[currentPlan as keyof typeof PLAN_FEATURES];

  return (
    <Page title="Settings" backAction={{ content: 'Dashboard', url: '/admin' }}>
      <Layout>
        {error && (
          <Layout.Section>
            <Banner tone="critical" onDismiss={() => setError(null)}>
              {error}
            </Banner>
          </Layout.Section>
        )}

        {isDev && (
          <Layout.Section>
            <Banner tone="warning">
              <BlockStack gap="300">
                <Text as="p" fontWeight="bold">
                  DEV MODE: Simulate different plans
                </Text>
                <InlineStack gap="200">
                  {['FREE', 'BASIC', 'PLUS', 'PREMIUM'].map((plan) => (
                    <Button
                      key={plan}
                      size="slim"
                      variant={currentPlan === plan ? 'primary' : 'secondary'}
                      onClick={() => handleDevPlanChange(plan)}
                    >
                      {plan}
                    </Button>
                  ))}
                </InlineStack>
                <Text as="p" variant="bodySm" tone="subdued">
                  Click a plan to test its features. This only works in development mode.
                </Text>
              </BlockStack>
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text as="h2" variant="headingMd">
                  Current Plan
                </Text>
                <Badge tone={currentPlan === 'FREE' ? 'info' : 'success'}>
                  {planInfo.name}
                </Badge>
              </InlineStack>

              <Text as="p" variant="bodyLg" fontWeight="bold">
                {planInfo.price}
              </Text>

              <Divider />

              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">
                  Included features:
                </Text>
                {planInfo.features.map((feature, i) => (
                  <InlineStack key={i} gap="200">
                    <Text as="span" tone="success">
                      +
                    </Text>
                    <Text as="span">{feature}</Text>
                  </InlineStack>
                ))}
              </BlockStack>

              {planInfo.limitations.length > 0 && (
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm">
                    Not included:
                  </Text>
                  {planInfo.limitations.map((limitation, i) => (
                    <InlineStack key={i} gap="200">
                      <Text as="span" tone="subdued">
                        -
                      </Text>
                      <Text as="span" tone="subdued">
                        {limitation}
                      </Text>
                    </InlineStack>
                  ))}
                </BlockStack>
              )}

              {currentPlan !== 'PREMIUM' && (
                <Box paddingBlockStart="400">
                  <Button
                    variant="primary"
                    onClick={() => isDev ? handleDevPlanChange('PREMIUM') : handleUpgrade('PREMIUM')}
                  >
                    Upgrade Plan
                  </Button>
                </Box>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                All Plans
              </Text>

              <BlockStack gap="400">
                {Object.entries(PLAN_FEATURES).map(([key, plan]) => (
                  <Box
                    key={key}
                    padding="400"
                    background={key === currentPlan ? 'bg-surface-secondary' : 'bg-surface'}
                    borderRadius="200"
                    borderWidth="025"
                    borderColor="border"
                  >
                    <InlineStack align="space-between" blockAlign="center">
                      <BlockStack gap="100">
                        <InlineStack gap="200" blockAlign="center">
                          <Text as="h3" variant="headingSm">{plan.name}</Text>
                          {key === currentPlan && <Badge tone="success">Current</Badge>}
                        </InlineStack>
                        <Text as="p" variant="bodyMd" fontWeight="bold">{plan.price}</Text>
                      </BlockStack>
                      {key !== currentPlan && key !== 'FREE' && (
                        <Button
                          variant={getPlanIndex(key) > getPlanIndex(currentPlan) ? 'primary' : 'secondary'}
                          onClick={() => isDev ? handleDevPlanChange(key) : handleUpgrade(key)}
                        >
                          {getPlanIndex(key) > getPlanIndex(currentPlan) ? 'Upgrade' : 'Downgrade'}
                        </Button>
                      )}
                    </InlineStack>
                  </Box>
                ))}
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Shop Information
              </Text>

              <BlockStack gap="200">
                <InlineStack gap="200">
                  <Text as="span" fontWeight="bold">
                    Shop:
                  </Text>
                  <Text as="span">{shopInfo?.shopDomain}</Text>
                </InlineStack>
                <InlineStack gap="200">
                  <Text as="span" fontWeight="bold">
                    Installed:
                  </Text>
                  <Text as="span">
                    {shopInfo?.installedAt
                      ? new Date(shopInfo.installedAt).toLocaleDateString()
                      : 'N/A'}
                  </Text>
                </InlineStack>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Support
              </Text>

              <Text as="p">
                Need help? Contact our support team.
              </Text>

              <InlineStack gap="200">
                <Button variant="plain" url="mailto:support@example.com">
                  Contact Support
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
