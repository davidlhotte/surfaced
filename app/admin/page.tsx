'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Button,
  Box,
  Badge,
  Spinner,
  Banner,
  Icon,
  Divider,
} from '@shopify/polaris';
import {
  CheckCircleIcon,
  AlertTriangleIcon,
  SettingsIcon,
  QuestionCircleIcon,
  ProductIcon,
  ViewIcon,
  TargetIcon,
  ReplayIcon,
  CodeIcon,
  ChartVerticalFilledIcon,
  StarFilledIcon,
} from '@shopify/polaris-icons';
import Link from 'next/link';
import { useAuthenticatedFetch, useShopContext } from '@/components/providers/ShopProvider';
import { NotAuthenticated } from '@/components/admin/NotAuthenticated';

type DashboardData = {
  shop: {
    name: string;
    domain: string;
    plan: string;
    productsCount: number;
    aiScore: number | null;
    lastAuditAt: string | null;
  };
  audit: {
    totalProducts: number;
    auditedProducts: number;
    averageScore: number;
    issues: {
      critical: number;
      warning: number;
      info: number;
    };
  };
  visibility: {
    lastCheck: string | null;
    mentionedCount: number;
    totalChecks: number;
    platforms: {
      name: string;
      mentioned: boolean;
      lastCheck: string | null;
    }[];
  };
  competitors: {
    tracked: number;
    limit: number;
    topCompetitor: string | null;
  };
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [auditing, setAuditing] = useState(false);

  const { fetch: authFetch } = useAuthenticatedFetch();
  const { isLoading: shopLoading, error: shopError, isAuthenticated, shopDetectionFailed } = useShopContext();

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authFetch('/api/dashboard');

      if (!response.ok) {
        throw new Error('Impossible de charger vos données');
      }

      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error || 'Une erreur est survenue');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger vos données');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (!shopLoading && isAuthenticated) {
      fetchDashboard();
    } else if (!shopLoading && shopError) {
      setError(shopError);
      setLoading(false);
    }
  }, [fetchDashboard, shopLoading, isAuthenticated, shopError]);

  const runAudit = async () => {
    try {
      setAuditing(true);
      const response = await authFetch('/api/audit', { method: 'POST' });
      if (!response.ok) throw new Error('Analyse échouée');
      await fetchDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analyse échouée');
    } finally {
      setAuditing(false);
    }
  };

  // Show authentication error if shop detection failed
  if (shopDetectionFailed) {
    return <NotAuthenticated error={shopError} />;
  }

  // Loading state
  if (loading || shopLoading) {
    return (
      <Page title="Accueil">
        <Layout>
          <Layout.Section>
            <Card>
              <Box padding="800">
                <BlockStack gap="400" inlineAlign="center">
                  <Spinner size="large" />
                  <Text as="p" variant="bodyLg">
                    {shopLoading ? 'Connexion à votre boutique...' : 'Chargement de votre tableau de bord...'}
                  </Text>
                </BlockStack>
              </Box>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  // Error state
  if (error) {
    return (
      <Page title="Accueil">
        <Layout>
          <Layout.Section>
            <Banner tone="critical" title="Oups, une erreur s'est produite">
              <BlockStack gap="300">
                <Text as="p">{error}</Text>
                <Button onClick={fetchDashboard}>Réessayer</Button>
              </BlockStack>
            </Banner>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  const score = data?.shop.aiScore ?? 0;
  const hasAnalyzed = (data?.audit.auditedProducts ?? 0) > 0;
  const criticalCount = data?.audit.issues.critical ?? 0;
  const warningCount = data?.audit.issues.warning ?? 0;
  const mentionRate = data?.visibility.totalChecks ? Math.round((data.visibility.mentionedCount / data.visibility.totalChecks) * 100) : 0;

  // Score interpretation
  const getScoreInfo = (s: number) => {
    if (s >= 80) return { text: 'Excellent', tone: 'success' as const, color: '#108043', emoji: '🌟' };
    if (s >= 60) return { text: 'Bon', tone: 'success' as const, color: '#108043', emoji: '👍' };
    if (s >= 40) return { text: 'À améliorer', tone: 'warning' as const, color: '#B98900', emoji: '⚠️' };
    return { text: 'Urgent', tone: 'critical' as const, color: '#D82C0D', emoji: '🚨' };
  };

  const scoreInfo = getScoreInfo(score);

  // Feature cards with clear value propositions
  const featureCards = [
    {
      title: 'Produits',
      subtitle: 'Analysez et optimisez',
      description: 'Découvrez pourquoi certains produits sont invisibles pour les IA et corrigez-les en un clic.',
      icon: ProductIcon,
      href: '/admin/products',
      gradient: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)',
      stat: hasAnalyzed ? `${data?.audit.auditedProducts} analysés` : 'Non analysé',
      statTone: hasAnalyzed ? (criticalCount > 0 ? 'critical' : 'success') : 'subdued',
    },
    {
      title: 'Visibilité',
      subtitle: 'Où vous apparaissez',
      description: 'Testez si ChatGPT, Perplexity et autres IA recommandent votre boutique.',
      icon: ViewIcon,
      href: '/admin/visibility',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      stat: data?.visibility.totalChecks ? `${mentionRate}% de mentions` : 'Aucun test',
      statTone: mentionRate > 50 ? 'success' : mentionRate > 20 ? 'warning' : 'subdued',
    },
    {
      title: 'Concurrents',
      subtitle: 'Comparez-vous',
      description: 'Voyez exactement où vos concurrents apparaissent à votre place.',
      icon: TargetIcon,
      href: '/admin/competitors',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      stat: data?.competitors.tracked ? `${data.competitors.tracked} suivis` : 'Aucun suivi',
      statTone: data?.competitors.tracked ? 'success' : 'subdued',
    },
    {
      title: 'Tests A/B',
      subtitle: 'Testez vos contenus',
      description: 'Découvrez quelle version de vos descriptions fonctionne le mieux avec les IA.',
      icon: ReplayIcon,
      href: '/admin/ab-tests',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      stat: 'Expérimentez',
      statTone: 'subdued',
    },
    {
      title: 'Statistiques',
      subtitle: 'Suivez vos progrès',
      description: 'Visualisez l\'évolution de votre score et recevez des alertes importantes.',
      icon: ChartVerticalFilledIcon,
      href: '/admin/insights',
      gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
      stat: 'Tableaux de bord',
      statTone: 'subdued',
    },
    {
      title: 'Outils IA',
      subtitle: 'llms.txt & JSON-LD',
      description: 'Créez les fichiers qui aident les IA à comprendre et recommander votre boutique.',
      icon: CodeIcon,
      href: '/admin/tools',
      gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      stat: 'Configurer',
      statTone: 'subdued',
    },
  ];

  return (
    <Page
      title={`Bonjour${data?.shop.name ? `, ${data.shop.name}` : ''} !`}
      secondaryActions={[
        {
          content: 'Paramètres',
          icon: SettingsIcon,
          url: '/admin/settings',
        },
        {
          content: 'Aide',
          icon: QuestionCircleIcon,
          url: '/help',
        },
      ]}
    >
      <BlockStack gap="600">
        {/* Welcome Banner - Only for new users */}
        {!hasAnalyzed && (
          <Card>
            <Box
              padding="500"
              background="bg-surface-info"
              borderRadius="300"
            >
              <BlockStack gap="400">
                <InlineStack gap="300" blockAlign="center">
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                    }}
                  >
                    🚀
                  </div>
                  <BlockStack gap="100">
                    <Text as="h2" variant="headingLg">Bienvenue sur Surfaced !</Text>
                    <Text as="p" tone="subdued">
                      Surfaced aide votre boutique à être recommandée par les IA comme ChatGPT, Perplexity et Gemini.
                    </Text>
                  </BlockStack>
                </InlineStack>

                <Box
                  padding="400"
                  background="bg-surface"
                  borderRadius="200"
                >
                  <BlockStack gap="300">
                    <Text as="h3" variant="headingSm">💡 Comment ça marche ?</Text>
                    <BlockStack gap="200">
                      <InlineStack gap="200" blockAlign="center">
                        <Badge tone="info">1</Badge>
                        <Text as="p" variant="bodyMd">
                          <strong>Analysez</strong> vos produits pour voir leur score IA
                        </Text>
                      </InlineStack>
                      <InlineStack gap="200" blockAlign="center">
                        <Badge tone="info">2</Badge>
                        <Text as="p" variant="bodyMd">
                          <strong>Optimisez</strong> les descriptions avec l'aide de l'IA
                        </Text>
                      </InlineStack>
                      <InlineStack gap="200" blockAlign="center">
                        <Badge tone="info">3</Badge>
                        <Text as="p" variant="bodyMd">
                          <strong>Vérifiez</strong> si les IA vous recommandent
                        </Text>
                      </InlineStack>
                    </BlockStack>
                  </BlockStack>
                </Box>

                <Button variant="primary" onClick={runAudit} loading={auditing} size="large">
                  Lancer ma première analyse
                </Button>
              </BlockStack>
            </Box>
          </Card>
        )}

        {/* AI Score Card - For returning users */}
        {hasAnalyzed && (
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <BlockStack gap="100">
                  <InlineStack gap="200" blockAlign="center">
                    <Text as="h2" variant="headingMd">Votre Score IA</Text>
                    <Badge tone={scoreInfo.tone}>{scoreInfo.text}</Badge>
                  </InlineStack>
                  <Text as="p" tone="subdued">
                    Plus votre score est élevé, plus les IA peuvent recommander vos produits
                  </Text>
                </BlockStack>
                {data?.shop.lastAuditAt && (
                  <Text as="span" variant="bodySm" tone="subdued">
                    Mis à jour le {new Date(data.shop.lastAuditAt).toLocaleDateString('fr-FR')}
                  </Text>
                )}
              </InlineStack>

              <InlineStack gap="600" align="start" blockAlign="center" wrap>
                {/* Score circle */}
                <div style={{
                  width: '140px',
                  height: '140px',
                  borderRadius: '50%',
                  background: `conic-gradient(${scoreInfo.color} ${score * 3.6}deg, #E4E5E7 0deg)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <div style={{
                    width: '115px',
                    height: '115px',
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: '14px' }}>{scoreInfo.emoji}</span>
                    <span style={{ fontSize: '36px', fontWeight: 700, color: scoreInfo.color }}>
                      {score}
                    </span>
                    <span style={{ fontSize: '12px', color: '#6D7175' }}>/ 100</span>
                  </div>
                </div>

                {/* Score breakdown */}
                <BlockStack gap="300">
                  <Text as="p" variant="bodyMd">
                    <strong>{data?.audit.auditedProducts}</strong> produits analysés
                  </Text>

                  {criticalCount > 0 && (
                    <Box padding="200" background="bg-surface-critical" borderRadius="200">
                      <InlineStack gap="200" blockAlign="center">
                        <Icon source={AlertTriangleIcon} tone="critical" />
                        <Text as="span" variant="bodySm">
                          <strong>{criticalCount}</strong> produits ont besoin d'attention urgente
                        </Text>
                      </InlineStack>
                    </Box>
                  )}

                  {warningCount > 0 && criticalCount === 0 && (
                    <Box padding="200" background="bg-surface-warning" borderRadius="200">
                      <InlineStack gap="200" blockAlign="center">
                        <Icon source={AlertTriangleIcon} tone="warning" />
                        <Text as="span" variant="bodySm">
                          <strong>{warningCount}</strong> produits peuvent être améliorés
                        </Text>
                      </InlineStack>
                    </Box>
                  )}

                  {criticalCount === 0 && warningCount === 0 && (
                    <Box padding="200" background="bg-surface-success" borderRadius="200">
                      <InlineStack gap="200" blockAlign="center">
                        <Icon source={CheckCircleIcon} tone="success" />
                        <Text as="span" variant="bodySm" tone="success">
                          Tous vos produits sont optimisés !
                        </Text>
                      </InlineStack>
                    </Box>
                  )}

                  <InlineStack gap="200">
                    <Link href="/admin/products">
                      <Button variant={criticalCount > 0 ? 'primary' : 'secondary'}>
                        {criticalCount > 0 ? 'Corriger les problèmes' : 'Voir les produits'}
                      </Button>
                    </Link>
                    <Button onClick={runAudit} loading={auditing}>
                      Relancer l'analyse
                    </Button>
                  </InlineStack>
                </BlockStack>
              </InlineStack>
            </BlockStack>
          </Card>
        )}

        {/* Quick Stats - Only for returning users */}
        {hasAnalyzed && (
          <InlineStack gap="400" wrap>
            <Box minWidth="200px" maxWidth="300px">
              <Card>
                <BlockStack gap="200">
                  <InlineStack gap="200" blockAlign="center">
                    <Icon source={ViewIcon} tone="base" />
                    <Text as="h3" variant="headingSm">Visibilité IA</Text>
                  </InlineStack>
                  <Text as="p" variant="heading2xl" fontWeight="bold">
                    {mentionRate}%
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Taux de mention dans les IA
                  </Text>
                </BlockStack>
              </Card>
            </Box>
            <Box minWidth="200px" maxWidth="300px">
              <Card>
                <BlockStack gap="200">
                  <InlineStack gap="200" blockAlign="center">
                    <Icon source={TargetIcon} tone="base" />
                    <Text as="h3" variant="headingSm">Concurrents</Text>
                  </InlineStack>
                  <Text as="p" variant="heading2xl" fontWeight="bold">
                    {data?.competitors.tracked || 0}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Concurrents suivis
                  </Text>
                </BlockStack>
              </Card>
            </Box>
            <Box minWidth="200px" maxWidth="300px">
              <Card>
                <BlockStack gap="200">
                  <InlineStack gap="200" blockAlign="center">
                    <Icon source={StarFilledIcon} tone="base" />
                    <Text as="h3" variant="headingSm">Plan actuel</Text>
                  </InlineStack>
                  <Text as="p" variant="heading2xl" fontWeight="bold">
                    {data?.shop.plan || 'FREE'}
                  </Text>
                  <Link href="/admin/settings">
                    <Text as="p" variant="bodySm" tone="subdued">
                      Voir les options →
                    </Text>
                  </Link>
                </BlockStack>
              </Card>
            </Box>
          </InlineStack>
        )}

        {/* Feature Cards */}
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">Que souhaitez-vous faire ?</Text>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px'
          }}>
            {featureCards.map((card) => (
              <Link key={card.title} href={card.href} style={{ textDecoration: 'none' }}>
                <Card>
                  <BlockStack gap="300">
                    <InlineStack gap="300" blockAlign="center">
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '10px',
                          background: card.gradient,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon source={card.icon} tone="base" />
                      </div>
                      <BlockStack gap="050">
                        <Text as="h3" variant="headingMd">{card.title}</Text>
                        <Text as="p" variant="bodySm" tone="subdued">{card.subtitle}</Text>
                      </BlockStack>
                    </InlineStack>

                    <Text as="p" variant="bodySm" tone="subdued">
                      {card.description}
                    </Text>

                    <Divider />

                    <InlineStack align="space-between" blockAlign="center">
                      <Badge tone={card.statTone as 'success' | 'warning' | 'critical' | undefined}>
                        {card.stat}
                      </Badge>
                      <Button variant="plain">Ouvrir →</Button>
                    </InlineStack>
                  </BlockStack>
                </Card>
              </Link>
            ))}
          </div>
        </BlockStack>

        {/* Tips - Only if needed */}
        {hasAnalyzed && score < 70 && (
          <Card>
            <BlockStack gap="400">
              <InlineStack gap="200" blockAlign="center">
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                  }}
                >
                  💡
                </div>
                <Text as="h3" variant="headingMd">Conseils pour améliorer votre score</Text>
              </InlineStack>

              <Divider />

              <BlockStack gap="300">
                {criticalCount > 0 && (
                  <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                    <InlineStack align="space-between" blockAlign="center" gap="400">
                      <BlockStack gap="100">
                        <Text as="p" fontWeight="semibold">Ajoutez des images à vos produits</Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          Les produits sans images sont rarement recommandés par les IA.
                        </Text>
                      </BlockStack>
                      <Link href="/admin/products">
                        <Button size="slim">Corriger</Button>
                      </Link>
                    </InlineStack>
                  </Box>
                )}

                {score < 60 && (
                  <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                    <InlineStack align="space-between" blockAlign="center" gap="400">
                      <BlockStack gap="100">
                        <Text as="p" fontWeight="semibold">Rédigez des descriptions détaillées</Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          Les IA ont besoin de texte pour comprendre vos produits. Visez 150+ mots.
                        </Text>
                      </BlockStack>
                      <Link href="/admin/products">
                        <Button size="slim">Optimiser</Button>
                      </Link>
                    </InlineStack>
                  </Box>
                )}

                <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                  <InlineStack align="space-between" blockAlign="center" gap="400">
                    <BlockStack gap="100">
                      <Text as="p" fontWeight="semibold">Configurez votre fichier llms.txt</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Ce fichier aide les IA à comprendre et recommander votre boutique.
                      </Text>
                    </BlockStack>
                    <Link href="/admin/tools">
                      <Button size="slim" variant="primary">Configurer</Button>
                    </Link>
                  </InlineStack>
                </Box>
              </BlockStack>
            </BlockStack>
          </Card>
        )}
      </BlockStack>
    </Page>
  );
}
