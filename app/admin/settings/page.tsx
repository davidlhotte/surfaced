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
} from '@shopify/polaris';
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
import { PLAN_LIMITS, PLAN_PRICES } from '@/lib/constants/plans';

// Plan features with French labels
const PLAN_FEATURES = {
  FREE: {
    name: 'Gratuit',
    price: 0,
    priceLabel: 'Gratuit',
    description: 'Parfait pour commencer',
    limits: {
      products: PLAN_LIMITS.FREE.productsAudited,
      visibilityChecks: PLAN_LIMITS.FREE.visibilityChecksPerMonth,
      aiOptimizations: PLAN_LIMITS.FREE.aiOptimizationsPerMonth,
      competitors: PLAN_LIMITS.FREE.competitorsTracked,
    },
    features: [
      { name: 'Audit de visibilité IA', included: true },
      { name: `Jusqu'à ${PLAN_LIMITS.FREE.productsAudited} produits`, included: true },
      { name: `${PLAN_LIMITS.FREE.visibilityChecksPerMonth} vérifications/mois`, included: true },
      { name: 'Générateur AI Guide', included: true },
      { name: 'Recommandations de base', included: true },
      { name: `${PLAN_LIMITS.FREE.aiOptimizationsPerMonth} suggestions IA/mois`, included: PLAN_LIMITS.FREE.aiOptimizationsPerMonth > 0 },
      { name: 'Données structurées', included: false },
      { name: 'Rapports hebdomadaires', included: false },
      { name: 'Suivi concurrents', included: false },
      { name: 'Support prioritaire', included: false },
    ],
  },
  BASIC: {
    name: 'Starter',
    price: PLAN_PRICES.BASIC,
    priceLabel: `${PLAN_PRICES.BASIC}$/mois`,
    description: 'Pour les boutiques en croissance',
    limits: {
      products: PLAN_LIMITS.BASIC.productsAudited,
      visibilityChecks: PLAN_LIMITS.BASIC.visibilityChecksPerMonth,
      aiOptimizations: PLAN_LIMITS.BASIC.aiOptimizationsPerMonth,
      competitors: PLAN_LIMITS.BASIC.competitorsTracked,
    },
    features: [
      { name: 'Audit de visibilité IA', included: true },
      { name: `Jusqu'à ${PLAN_LIMITS.BASIC.productsAudited} produits`, included: true },
      { name: `${PLAN_LIMITS.BASIC.visibilityChecksPerMonth} vérifications/mois`, included: true },
      { name: 'Générateur AI Guide', included: true },
      { name: 'Recommandations détaillées', included: true },
      { name: `${PLAN_LIMITS.BASIC.aiOptimizationsPerMonth} suggestions IA/mois`, included: true },
      { name: 'Export données structurées', included: true },
      { name: 'Rapports hebdomadaires', included: false },
      { name: `Suivi de ${PLAN_LIMITS.BASIC.competitorsTracked} concurrent${PLAN_LIMITS.BASIC.competitorsTracked !== 1 ? 's' : ''}`, included: PLAN_LIMITS.BASIC.competitorsTracked > 0 },
      { name: 'Support prioritaire', included: false },
    ],
  },
  PLUS: {
    name: 'Growth',
    price: PLAN_PRICES.PLUS,
    priceLabel: `${PLAN_PRICES.PLUS}$/mois`,
    description: 'Pour les vendeurs sérieux',
    popular: true,
    limits: {
      products: PLAN_LIMITS.PLUS.productsAudited,
      visibilityChecks: PLAN_LIMITS.PLUS.visibilityChecksPerMonth,
      aiOptimizations: PLAN_LIMITS.PLUS.aiOptimizationsPerMonth,
      competitors: PLAN_LIMITS.PLUS.competitorsTracked,
    },
    features: [
      { name: 'Audit de visibilité IA', included: true },
      { name: `Jusqu'à ${PLAN_LIMITS.PLUS.productsAudited} produits`, included: true },
      { name: `${PLAN_LIMITS.PLUS.visibilityChecksPerMonth} vérifications/mois`, included: true },
      { name: 'Générateur AI Guide', included: true },
      { name: 'Recommandations avancées', included: true },
      { name: `${PLAN_LIMITS.PLUS.aiOptimizationsPerMonth} suggestions IA/mois`, included: true },
      { name: 'Export données structurées', included: true },
      { name: 'Rapports hebdomadaires', included: true },
      { name: `Suivi de ${PLAN_LIMITS.PLUS.competitorsTracked} concurrents`, included: true },
      { name: 'Support prioritaire', included: false },
    ],
  },
  PREMIUM: {
    name: 'Scale',
    price: PLAN_PRICES.PREMIUM,
    priceLabel: `${PLAN_PRICES.PREMIUM}$/mois`,
    description: 'Pour les gros volumes',
    limits: {
      products: -1, // Infinity becomes -1 for UI
      visibilityChecks: PLAN_LIMITS.PREMIUM.visibilityChecksPerMonth,
      aiOptimizations: PLAN_LIMITS.PREMIUM.aiOptimizationsPerMonth,
      competitors: PLAN_LIMITS.PREMIUM.competitorsTracked,
    },
    features: [
      { name: 'Audit de visibilité IA', included: true },
      { name: 'Produits illimités', included: true },
      { name: `${PLAN_LIMITS.PREMIUM.visibilityChecksPerMonth} vérifications/mois`, included: true },
      { name: 'Générateur AI Guide', included: true },
      { name: 'Recommandations premium', included: true },
      { name: `${PLAN_LIMITS.PREMIUM.aiOptimizationsPerMonth} suggestions IA/mois`, included: true },
      { name: 'Export données structurées', included: true },
      { name: 'Rapports quotidiens', included: true },
      { name: `Suivi de ${PLAN_LIMITS.PREMIUM.competitorsTracked} concurrents`, included: true },
      { name: 'Support prioritaire', included: true },
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

  // Hidden dev mode activation: click "Votre boutique" 5 times
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
      setError(err instanceof Error ? err.message : 'Échec du chargement');
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
        setError(result.error || 'Échec de la mise à niveau');
      }
    } catch {
      setError('Échec de la mise à niveau');
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
        setError(result.error || `Échec du changement de plan (${response.status})`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec du changement de plan');
    }
  };

  // Show authentication error if shop detection failed
  if (shopDetectionFailed) {
    return <NotAuthenticated error={shopError} />;
  }

  if (loading || shopLoading) {
    return (
      <Page title="Votre abonnement" backAction={{ content: 'Tableau de bord', url: '/admin' }}>
        <Layout>
          <Layout.Section>
            <Card>
              <Box padding="800">
                <BlockStack gap="400" inlineAlign="center">
                  <Spinner size="large" />
                  <Text as="p">Chargement de votre abonnement...</Text>
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
      title="Votre abonnement"
      subtitle="Gérez votre forfait et découvrez ce qui est inclus"
      backAction={{ content: 'Tableau de bord', url: '/admin' }}
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
                  Mode développeur : Testez différents plans (sans facturation)
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  Cliquez sur un plan pour basculer instantanément sans être facturé.
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
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              margin: '-16px -16px 16px -16px',
              padding: '24px',
              borderRadius: '12px 12px 0 0',
            }}>
              <BlockStack gap="200">
                <Text as="h2" variant="headingLg" fontWeight="bold">
                  <span style={{ color: 'white' }}>Choisissez le plan adapté à votre croissance</span>
                </Text>
                <Text as="p" variant="bodyMd">
                  <span style={{ color: 'rgba(255,255,255,0.9)' }}>
                    Plus vous investissez dans votre visibilité IA, plus vous attirez de clients via ChatGPT, Perplexity et autres.
                  </span>
                </Text>
              </BlockStack>
            </div>

            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">Pourquoi mettre à niveau ?</Text>
              <InlineStack gap="400" wrap>
                <div style={{ flex: '1', minWidth: '200px' }}>
                  <BlockStack gap="200">
                    <InlineStack gap="200" blockAlign="center">
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '14px',
                      }}>1</div>
                      <Text as="p" fontWeight="semibold">Plus de produits analysés</Text>
                    </InlineStack>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Auditez tous vos produits pour maximiser votre visibilité sur toutes les IA.
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
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '14px',
                      }}>2</div>
                      <Text as="p" fontWeight="semibold">Suivi des concurrents</Text>
                    </InlineStack>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Surveillez vos concurrents et comparez votre visibilité IA à la leur.
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
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '14px',
                      }}>3</div>
                      <Text as="p" fontWeight="semibold">Rapports détaillés</Text>
                    </InlineStack>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Recevez des rapports hebdomadaires ou quotidiens sur votre progression.
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
                      <Badge tone="success">Actif</Badge>
                    )}
                    {currentPlan === 'FREE' && (
                      <Badge tone="info">Plan actuel</Badge>
                    )}
                  </InlineStack>
                  <Text as="p" tone="subdued">{planInfo.description}</Text>
                </BlockStack>
                <BlockStack gap="100" inlineAlign="end">
                  <Text as="p" variant="headingXl" fontWeight="bold">
                    {planInfo.price === 0 ? 'Gratuit' : `${planInfo.price}$`}
                  </Text>
                  {planInfo.price > 0 && (
                    <Text as="p" variant="bodySm" tone="subdued">par mois</Text>
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
              <Text as="h2" variant="headingMd">Votre utilisation ce mois-ci</Text>
              <Divider />

              {/* Products */}
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text as="p">Produits audités</Text>
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
                  <Text as="p">Vérifications de visibilité</Text>
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
                  <Text as="p">Suggestions IA</Text>
                  <Text as="p" fontWeight="semibold">
                    {usage?.aiOptimizations || 0} / {optimizationLimit < 0 || optimizationLimit === Infinity ? '∞' : optimizationLimit === 0 ? 'Non inclus' : optimizationLimit}
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
                    Vous approchez de vos limites. Passez au niveau supérieur pour continuer à développer votre visibilité.
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
              <Text as="h2" variant="headingMd">Comparer tous les plans</Text>
              <Text as="p" tone="subdued">
                Choisissez le forfait qui correspond à votre boutique
              </Text>
              <Divider />

              {/* Comparison Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--p-color-border)' }}>
                      <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 600 }}>Fonctionnalité</th>
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
                              {isCurrent && <Badge tone="success" size="small">Actuel</Badge>}
                              {isPopular && !isCurrent && <Badge tone="attention" size="small">Populaire</Badge>}
                              <Text as="span" variant="bodyLg" fontWeight="bold">
                                {plan.price === 0 ? 'Gratuit' : `${plan.price}$`}
                              </Text>
                              {plan.price > 0 && <Text as="span" variant="bodySm" tone="subdued">/mois</Text>}
                            </BlockStack>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Products */}
                    <tr style={{ borderBottom: '1px solid var(--p-color-border-subdued)' }}>
                      <td style={{ padding: '10px 8px' }}>Produits audités</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.FREE.productsAudited}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.BASIC.productsAudited}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.PLUS.productsAudited}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 600 }}>Illimité</td>
                    </tr>
                    {/* Visibility Checks */}
                    <tr style={{ borderBottom: '1px solid var(--p-color-border-subdued)' }}>
                      <td style={{ padding: '10px 8px' }}>Vérifications visibilité/mois</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.FREE.visibilityChecksPerMonth}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.BASIC.visibilityChecksPerMonth}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.PLUS.visibilityChecksPerMonth}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.PREMIUM.visibilityChecksPerMonth}</td>
                    </tr>
                    {/* AI Optimizations */}
                    <tr style={{ borderBottom: '1px solid var(--p-color-border-subdued)' }}>
                      <td style={{ padding: '10px 8px' }}>Suggestions IA/mois</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.FREE.aiOptimizationsPerMonth}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.BASIC.aiOptimizationsPerMonth}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.PLUS.aiOptimizationsPerMonth}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.PREMIUM.aiOptimizationsPerMonth}</td>
                    </tr>
                    {/* Competitors */}
                    <tr style={{ borderBottom: '1px solid var(--p-color-border-subdued)' }}>
                      <td style={{ padding: '10px 8px' }}>Concurrents suivis</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.FREE.competitorsTracked || '-'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.BASIC.competitorsTracked}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.PLUS.competitorsTracked}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.PREMIUM.competitorsTracked}</td>
                    </tr>
                    {/* History */}
                    <tr style={{ borderBottom: '1px solid var(--p-color-border-subdued)' }}>
                      <td style={{ padding: '10px 8px' }}>Historique conservé</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.FREE.historyDays} jours</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.BASIC.historyDays} jours</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.PLUS.historyDays} jours</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.PREMIUM.historyDays} jours</td>
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
                      <td style={{ padding: '10px 8px' }}>Accès API</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.FREE.apiAccess ? '✓' : '-'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.BASIC.apiAccess ? '✓' : '-'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.PLUS.apiAccess ? '✓' : '-'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{PLAN_LIMITS.PREMIUM.apiAccess ? '✓' : '-'}</td>
                    </tr>
                    {/* Priority Support */}
                    <tr style={{ borderBottom: '1px solid var(--p-color-border-subdued)' }}>
                      <td style={{ padding: '10px 8px' }}>Support prioritaire</td>
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
                              <Badge tone="success">Plan actuel</Badge>
                            ) : planKey === 'FREE' ? null : (
                              <Button
                                size="slim"
                                variant={isUpgrade ? 'primary' : 'secondary'}
                                onClick={() => isDevMode ? handleDevPlanChange(planKey) : handleUpgrade(planKey)}
                              >
                                {isUpgrade ? 'Passer au supérieur' : isDowngrade ? 'Rétrograder' : 'Sélectionner'}
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
                  Votre boutique {devClicks > 0 && devClicks < 5 ? `(${5 - devClicks})` : ''}
                </Text>
              </div>
              <Divider />

              <BlockStack gap="200">
                <InlineStack gap="200">
                  <Text as="span" fontWeight="semibold" variant="bodySm">Domaine :</Text>
                  <Text as="span" variant="bodySm">{shopInfo?.shopDomain}</Text>
                </InlineStack>
                <InlineStack gap="200">
                  <Text as="span" fontWeight="semibold" variant="bodySm">Membre depuis :</Text>
                  <Text as="span" variant="bodySm">
                    {shopInfo?.installedAt
                      ? new Date(shopInfo.installedAt).toLocaleDateString('fr-FR', {
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
                <Text as="h3" variant="headingMd">Conseils pour maximiser votre investissement</Text>
                <BlockStack gap="200">
                  <InlineStack gap="200" blockAlign="start">
                    <span style={{ color: '#667eea' }}>1.</span>
                    <Text as="p" variant="bodySm">
                      <strong>Commencez petit</strong> : Le plan gratuit vous permet de tester la valeur de Surfaced avant de vous engager.
                    </Text>
                  </InlineStack>
                  <InlineStack gap="200" blockAlign="start">
                    <span style={{ color: '#667eea' }}>2.</span>
                    <Text as="p" variant="bodySm">
                      <strong>Surveillez vos métriques</strong> : Utilisez les insights pour voir l&apos;impact réel sur votre visibilité IA.
                    </Text>
                  </InlineStack>
                  <InlineStack gap="200" blockAlign="start">
                    <span style={{ color: '#667eea' }}>3.</span>
                    <Text as="p" variant="bodySm">
                      <strong>Passez au supérieur quand c&apos;est nécessaire</strong> : Quand vous atteignez vos limites, c&apos;est le signe que ça fonctionne !
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
              <Text as="h2" variant="headingMd">Besoin d&apos;aide ?</Text>
              <Text as="p" tone="subdued">
                Questions sur votre abonnement ou la facturation ? Nous sommes là pour vous aider.
              </Text>
              <InlineStack gap="200">
                <Button url="mailto:support@surfaced.app">Contacter le support</Button>
                <Button variant="plain" url="/admin">Retour au tableau de bord</Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
