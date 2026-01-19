'use client';

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
  Checkbox,
  ProgressBar,
  Select,
  Tabs,
} from '@shopify/polaris';
import {
  RefreshIcon,
  AlertTriangleIcon,
} from '@shopify/polaris-icons';
import Link from 'next/link';
import { useAuthenticatedFetch } from '@/components/providers/ShopProvider';

type TimePeriod = '7d' | '30d' | '90d' | '365d';

interface TrendDataPoint {
  date: string;
  value: number;
}

interface ScoreDistribution {
  excellent: number;
  good: number;
  needsWork: number;
  critical: number;
}

interface VisibilityMetrics {
  totalChecks: number;
  mentioned: number;
  mentionRate: number;
  byPlatform: {
    platform: string;
    checks: number;
    mentioned: number;
    rate: number;
  }[];
}

interface ROIMetrics {
  currentScore: number;
  scoreAtPeriodStart: number;
  scoreImprovement: number;
  scoreImprovementPercent: number;
  totalProducts: number;
  productsImproved: number;
  productsWithCriticalIssues: number;
  visibility: VisibilityMetrics;
  optimizationsUsed: number;
  scoreTrend: TrendDataPoint[];
  visibilityTrend: TrendDataPoint[];
  scoreDistribution: ScoreDistribution;
}

interface Alert {
  id: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: string;
}

interface AlertPreferences {
  emailAlerts: boolean;
  weeklyReport: boolean;
}

interface WeeklyReport {
  period: { start: string; end: string };
  metrics: {
    aiScore: number;
    scoreChange: number;
    productsAudited: number;
    criticalIssues: number;
    visibilityChecks: number;
    mentionRate: number;
  };
  topIssues: { code: string; count: number }[];
  recommendations: string[];
}

export default function InsightsPage() {
  const { fetch } = useAuthenticatedFetch();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [period, setPeriod] = useState<TimePeriod>('30d');

  // ROI state
  const [metrics, setMetrics] = useState<ROIMetrics | null>(null);

  // Alerts state
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [preferences, setPreferences] = useState<AlertPreferences | null>(null);
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [roiResponse, alertsResponse] = await Promise.all([
        fetch(`/api/roi?period=${period}`),
        fetch('/api/alerts?report=true'),
      ]);

      // Load ROI data
      const roiData = await roiResponse.json();
      if (roiData.success) {
        setMetrics(roiData.data.metrics);
      }

      // Load alerts data
      const alertsData = await alertsResponse.json();
      if (alertsData.success) {
        setAlerts(alertsData.data.alerts);
        setPreferences(alertsData.data.preferences);
        setReport(alertsData.data.report);
        setEmailAlerts(alertsData.data.preferences?.emailAlerts ?? true);
        setWeeklyReport(alertsData.data.preferences?.weeklyReport ?? true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  }, [fetch, period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailAlerts, weeklyReport }),
      });

      const data = await response.json();
      if (data.success) {
        setPreferences(data.data.preferences);
      } else {
        setError(data.error || 'Échec de la sauvegarde');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Échec de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const getScoreColor = (score: number): "success" | "highlight" | "critical" => {
    if (score >= 70) return 'success';
    if (score >= 40) return 'highlight';
    return 'critical';
  };

  const getPlatformLabel = (platform: string): string => {
    const labels: Record<string, string> = {
      chatgpt: 'ChatGPT',
      perplexity: 'Perplexity',
      gemini: 'Gemini',
      copilot: 'Copilot',
    };
    return labels[platform] || platform;
  };

  const getPriorityBadge = (priority: Alert['priority']) => {
    const tones: Record<Alert['priority'], 'critical' | 'warning' | 'info' | 'success'> = {
      critical: 'critical',
      high: 'warning',
      medium: 'info',
      low: 'success',
    };
    const labels: Record<Alert['priority'], string> = {
      critical: 'Urgent',
      high: 'Important',
      medium: 'Info',
      low: 'Conseil',
    };
    return <Badge tone={tones[priority]}>{labels[priority]}</Badge>;
  };

  const getIssueLabel = (code: string): string => {
    const labels: Record<string, string> = {
      NO_DESCRIPTION: 'Description manquante',
      SHORT_DESCRIPTION: 'Description trop courte',
      BRIEF_DESCRIPTION: 'Description insuffisante',
      NO_IMAGES: 'Images manquantes',
      MISSING_ALT_TEXT: 'Texte alt manquant',
      NO_SEO_TITLE: 'Titre SEO manquant',
      NO_SEO_DESCRIPTION: 'Description SEO manquante',
      NO_PRODUCT_TYPE: 'Type de produit manquant',
      NO_TAGS: 'Tags manquants',
      NO_METAFIELDS: 'Métadonnées manquantes',
      NO_VENDOR: 'Marque manquante',
    };
    return labels[code] || code;
  };

  const periodOptions = [
    { label: '7 derniers jours', value: '7d' },
    { label: '30 derniers jours', value: '30d' },
    { label: '90 derniers jours', value: '90d' },
    { label: 'Cette année', value: '365d' },
  ];

  if (loading) {
    return (
      <Page title="Tableau de bord" backAction={{ content: 'Accueil', url: '/admin' }}>
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

  const tabs = [
    { id: 'progress', content: 'Votre progression' },
    { id: 'alerts', content: `Alertes (${alerts.length})` },
    { id: 'report', content: 'Rapport hebdo' },
  ];

  const hasAlerts = alerts.length > 0;
  const criticalAlerts = alerts.filter(a => a.priority === 'critical' || a.priority === 'high');

  return (
    <Page
      title="Tableau de bord"
      subtitle="Suivez votre progression et restez informé"
      backAction={{ content: 'Accueil', url: '/admin' }}
      secondaryActions={[
        {
          content: 'Actualiser',
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

        {/* Alert Banner if there are critical alerts */}
        {criticalAlerts.length > 0 && selectedTab !== 1 && (
          <Layout.Section>
            <Banner
              tone="warning"
              title={`Vous avez ${criticalAlerts.length} alerte${criticalAlerts.length > 1 ? 's' : ''} importante${criticalAlerts.length > 1 ? 's' : ''}`}
              action={{ content: 'Voir les alertes', onAction: () => setSelectedTab(1) }}
            >
              {criticalAlerts[0].message}
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
              <Box paddingBlockStart="400">
                {/* Progress Tab */}
                {selectedTab === 0 && (
                  <BlockStack gap="600">
                    {/* Period Selector */}
                    <InlineStack align="space-between" blockAlign="center">
                      <Text as="h2" variant="headingMd">Votre progression IA</Text>
                      <Box minWidth="150px">
                        <Select
                          label="Période"
                          labelHidden
                          options={periodOptions}
                          value={period}
                          onChange={(value) => setPeriod(value as TimePeriod)}
                        />
                      </Box>
                    </InlineStack>

                    {/* Key Metrics */}
                    <InlineStack gap="400" align="start" wrap>
                      {/* Current Score */}
                      <Box minWidth="180px">
                        <Card>
                          <BlockStack gap="200">
                            <Text as="h3" variant="bodySm" tone="subdued">Score IA</Text>
                            <InlineStack gap="200" blockAlign="center">
                              <Text as="p" variant="heading2xl" fontWeight="bold">
                                {metrics?.currentScore ?? 0}
                              </Text>
                              {metrics && metrics.scoreImprovement !== 0 && (
                                <Badge tone={metrics.scoreImprovement > 0 ? 'success' : 'critical'}>
                                  {(metrics.scoreImprovement > 0 ? '+' : '') + metrics.scoreImprovement}
                                </Badge>
                              )}
                            </InlineStack>
                            <Box width="100%">
                              <ProgressBar
                                progress={metrics?.currentScore ?? 0}
                                tone={getScoreColor(metrics?.currentScore ?? 0)}
                                size="small"
                              />
                            </Box>
                          </BlockStack>
                        </Card>
                      </Box>

                      {/* Visibility Rate */}
                      <Box minWidth="180px">
                        <Card>
                          <BlockStack gap="200">
                            <Text as="h3" variant="bodySm" tone="subdued">Taux de mention</Text>
                            <Text as="p" variant="heading2xl" fontWeight="bold">
                              {metrics?.visibility.mentionRate ?? 0}%
                            </Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                              {metrics?.visibility.mentioned ?? 0} sur {metrics?.visibility.totalChecks ?? 0}
                            </Text>
                          </BlockStack>
                        </Card>
                      </Box>

                      {/* Products Improved */}
                      <Box minWidth="180px">
                        <Card>
                          <BlockStack gap="200">
                            <Text as="h3" variant="bodySm" tone="subdued">Produits améliorés</Text>
                            <Text as="p" variant="heading2xl" fontWeight="bold">
                              {metrics?.productsImproved ?? 0}
                            </Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                              sur {metrics?.totalProducts ?? 0} au total
                            </Text>
                          </BlockStack>
                        </Card>
                      </Box>

                      {/* AI Optimizations */}
                      <Box minWidth="180px">
                        <Card>
                          <BlockStack gap="200">
                            <Text as="h3" variant="bodySm" tone="subdued">Suggestions IA utilisées</Text>
                            <Text as="p" variant="heading2xl" fontWeight="bold">
                              {metrics?.optimizationsUsed ?? 0}
                            </Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                              cette période
                            </Text>
                          </BlockStack>
                        </Card>
                      </Box>
                    </InlineStack>

                    <Divider />

                    {/* Next Steps - More actionable than vague impact metrics */}
                    <BlockStack gap="300">
                      <Text as="h3" variant="headingSm">Actions recommandées</Text>
                      <BlockStack gap="200">
                        {(metrics?.productsWithCriticalIssues ?? 0) > 0 && (
                          <Box padding="300" background="bg-surface-critical" borderRadius="200">
                            <InlineStack align="space-between" blockAlign="center" wrap>
                              <BlockStack gap="100">
                                <Text as="p" fontWeight="semibold">
                                  {metrics?.productsWithCriticalIssues} produit{(metrics?.productsWithCriticalIssues ?? 0) > 1 ? 's' : ''} nécessite{(metrics?.productsWithCriticalIssues ?? 0) > 1 ? 'nt' : ''} une action urgente
                                </Text>
                                <Text as="p" variant="bodySm" tone="subdued">
                                  Les images ou descriptions manquantes nuisent à votre visibilité IA
                                </Text>
                              </BlockStack>
                              <Link href="/admin/products">
                                <Button variant="primary">Corriger maintenant</Button>
                              </Link>
                            </InlineStack>
                          </Box>
                        )}

                        {(metrics?.visibility.totalChecks ?? 0) === 0 && (
                          <Box padding="300" background="bg-surface-warning" borderRadius="200">
                            <InlineStack align="space-between" blockAlign="center" wrap>
                              <BlockStack gap="100">
                                <Text as="p" fontWeight="semibold">
                                  Vérifiez si les IA vous mentionnent
                                </Text>
                                <Text as="p" variant="bodySm" tone="subdued">
                                  Découvrez quels assistants IA recommandent vos produits
                                </Text>
                              </BlockStack>
                              <Link href="/admin/visibility">
                                <Button>Vérifier ma visibilité</Button>
                              </Link>
                            </InlineStack>
                          </Box>
                        )}

                        {(metrics?.currentScore ?? 0) < 70 && (
                          <Box padding="300" background="bg-surface-info" borderRadius="200">
                            <InlineStack align="space-between" blockAlign="center" wrap>
                              <BlockStack gap="100">
                                <Text as="p" fontWeight="semibold">
                                  Améliorez vos contenus produits
                                </Text>
                                <Text as="p" variant="bodySm" tone="subdued">
                                  Utilisez l&apos;IA pour suggérer de meilleures descriptions et SEO
                                </Text>
                              </BlockStack>
                              <Link href="/admin/products">
                                <Button>Optimiser mes produits</Button>
                              </Link>
                            </InlineStack>
                          </Box>
                        )}

                        {(metrics?.currentScore ?? 0) >= 70 && (metrics?.productsWithCriticalIssues ?? 0) === 0 && (
                          <Box padding="300" background="bg-surface-success" borderRadius="200">
                            <BlockStack gap="100">
                              <Text as="p" fontWeight="semibold">
                                Votre boutique est en bonne forme !
                              </Text>
                              <Text as="p" variant="bodySm" tone="subdued">
                                Continuez à surveiller votre visibilité et à améliorer vos contenus
                              </Text>
                            </BlockStack>
                          </Box>
                        )}
                      </BlockStack>
                    </BlockStack>

                    <Divider />

                    {/* Product Quality Distribution */}
                    <BlockStack gap="300">
                      <Text as="h3" variant="headingSm">Répartition de la qualité des produits</Text>
                      <BlockStack gap="200">
                        <InlineStack align="space-between">
                          <InlineStack gap="200" blockAlign="center">
                            <Box width="12px" minHeight="12px" background="bg-fill-success" borderRadius="full" />
                            <Text as="p">Excellent (90+)</Text>
                          </InlineStack>
                          <Text as="p" fontWeight="semibold">{metrics?.scoreDistribution.excellent ?? 0}</Text>
                        </InlineStack>

                        <InlineStack align="space-between">
                          <InlineStack gap="200" blockAlign="center">
                            <Box width="12px" minHeight="12px" background="bg-fill-success" borderRadius="full" />
                            <Text as="p">Bon (70-89)</Text>
                          </InlineStack>
                          <Text as="p" fontWeight="semibold">{metrics?.scoreDistribution.good ?? 0}</Text>
                        </InlineStack>

                        <InlineStack align="space-between">
                          <InlineStack gap="200" blockAlign="center">
                            <Box width="12px" minHeight="12px" background="bg-fill-warning" borderRadius="full" />
                            <Text as="p">À améliorer (40-69)</Text>
                          </InlineStack>
                          <Text as="p" fontWeight="semibold">{metrics?.scoreDistribution.needsWork ?? 0}</Text>
                        </InlineStack>

                        <InlineStack align="space-between">
                          <InlineStack gap="200" blockAlign="center">
                            <Box width="12px" minHeight="12px" background="bg-fill-critical" borderRadius="full" />
                            <Text as="p">Urgent (&lt;40)</Text>
                          </InlineStack>
                          <Text as="p" fontWeight="semibold">{metrics?.scoreDistribution.critical ?? 0}</Text>
                        </InlineStack>
                      </BlockStack>
                    </BlockStack>

                    {/* Visibility by Platform */}
                    {metrics?.visibility.byPlatform && metrics.visibility.byPlatform.length > 0 && (
                      <>
                        <Divider />
                        <BlockStack gap="300">
                          <Text as="h3" variant="headingSm">Où apparaissez-vous ?</Text>
                          <BlockStack gap="300">
                            {metrics.visibility.byPlatform.map((platform) => (
                              <BlockStack key={platform.platform} gap="100">
                                <InlineStack align="space-between">
                                  <Text as="p">{getPlatformLabel(platform.platform)}</Text>
                                  <Badge tone={platform.rate >= 50 ? 'success' : platform.rate >= 30 ? 'warning' : 'critical'}>
                                    {`${platform.rate}%`}
                                  </Badge>
                                </InlineStack>
                                <Box width="100%">
                                  <ProgressBar
                                    progress={platform.rate}
                                    tone={platform.rate >= 50 ? 'success' : platform.rate >= 30 ? 'highlight' : 'critical'}
                                    size="small"
                                  />
                                </Box>
                              </BlockStack>
                            ))}
                          </BlockStack>
                        </BlockStack>
                      </>
                    )}
                  </BlockStack>
                )}

                {/* Alerts Tab */}
                {selectedTab === 1 && (
                  <BlockStack gap="600">
                    <InlineStack align="space-between" blockAlign="center">
                      <InlineStack gap="200" blockAlign="center">
                        <AlertTriangleIcon />
                        <Text as="h2" variant="headingMd">Alertes actives</Text>
                      </InlineStack>
                      <Badge>{String(alerts.length)}</Badge>
                    </InlineStack>

                    <Divider />

                    {!hasAlerts ? (
                      <Box padding="600">
                        <BlockStack gap="200" inlineAlign="center">
                          <Text as="p" variant="headingMd" tone="success">Tout va bien !</Text>
                          <Text as="p" tone="subdued">
                            Aucun problème détecté. Continuez comme ça !
                          </Text>
                        </BlockStack>
                      </Box>
                    ) : (
                      <BlockStack gap="300">
                        {alerts.map((alert) => (
                          <Box
                            key={alert.id}
                            padding="400"
                            background={
                              alert.priority === 'critical'
                                ? 'bg-surface-critical'
                                : alert.priority === 'high'
                                ? 'bg-surface-warning'
                                : 'bg-surface-secondary'
                            }
                            borderRadius="200"
                          >
                            <BlockStack gap="200">
                              <InlineStack align="space-between" blockAlign="center">
                                <Text as="p" fontWeight="semibold">{alert.title}</Text>
                                {getPriorityBadge(alert.priority)}
                              </InlineStack>
                              <Text as="p" tone="subdued" variant="bodySm">
                                {alert.message}
                              </Text>
                              {alert.actionUrl && (
                                <Box paddingBlockStart="200">
                                  <Link href={alert.actionUrl}>
                                    <Button size="slim">{alert.actionLabel || 'Corriger'}</Button>
                                  </Link>
                                </Box>
                              )}
                            </BlockStack>
                          </Box>
                        ))}
                      </BlockStack>
                    )}

                    <Divider />

                    {/* Notification Preferences */}
                    <BlockStack gap="300">
                      <Text as="h3" variant="headingSm">Paramètres de notification</Text>
                      <BlockStack gap="200">
                        <Checkbox
                          label="M'envoyer un email pour les problèmes importants"
                          helpText="Recevez une notification quand quelque chose nécessite votre attention"
                          checked={emailAlerts}
                          onChange={setEmailAlerts}
                        />
                        <Checkbox
                          label="Envoyer un résumé hebdomadaire"
                          helpText="Recevez un rapport de votre progression chaque semaine"
                          checked={weeklyReport}
                          onChange={setWeeklyReport}
                        />
                      </BlockStack>
                      <Box>
                        <Button
                          onClick={handleSavePreferences}
                          loading={saving}
                          disabled={
                            preferences?.emailAlerts === emailAlerts &&
                            preferences?.weeklyReport === weeklyReport
                          }
                        >
                          Enregistrer
                        </Button>
                      </Box>
                    </BlockStack>
                  </BlockStack>
                )}

                {/* Weekly Report Tab */}
                {selectedTab === 2 && (
                  <BlockStack gap="600">
                    <Text as="h2" variant="headingMd">
                      Résumé hebdomadaire
                    </Text>
                    {report && (
                      <Text as="p" tone="subdued" variant="bodySm">
                        Du {new Date(report.period.start).toLocaleDateString('fr-FR')} au {new Date(report.period.end).toLocaleDateString('fr-FR')}
                      </Text>
                    )}

                    <Divider />

                    {!report ? (
                      <Box padding="600">
                        <BlockStack gap="200" inlineAlign="center">
                          <Text as="p" tone="subdued">
                            Pas encore de rapport disponible. Revenez après votre première semaine d&apos;utilisation.
                          </Text>
                        </BlockStack>
                      </Box>
                    ) : (
                      <>
                        {/* Report Metrics */}
                        <InlineStack gap="400" align="start" wrap>
                          <Box minWidth="140px">
                            <Card>
                              <BlockStack gap="100">
                                <Text as="p" variant="bodySm" tone="subdued">Score IA</Text>
                                <InlineStack gap="100" blockAlign="center">
                                  <Text as="p" variant="headingLg" fontWeight="bold">
                                    {report.metrics.aiScore}
                                  </Text>
                                  {report.metrics.scoreChange !== 0 && (
                                    <Badge tone={report.metrics.scoreChange > 0 ? 'success' : 'critical'}>
                                      {(report.metrics.scoreChange > 0 ? '+' : '') + report.metrics.scoreChange}
                                    </Badge>
                                  )}
                                </InlineStack>
                              </BlockStack>
                            </Card>
                          </Box>

                          <Box minWidth="140px">
                            <Card>
                              <BlockStack gap="100">
                                <Text as="p" variant="bodySm" tone="subdued">Produits</Text>
                                <Text as="p" variant="headingLg" fontWeight="bold">
                                  {report.metrics.productsAudited}
                                </Text>
                              </BlockStack>
                            </Card>
                          </Box>

                          <Box minWidth="140px">
                            <Card>
                              <BlockStack gap="100">
                                <Text as="p" variant="bodySm" tone="subdued">Problèmes</Text>
                                <Text as="p" variant="headingLg" fontWeight="bold" tone={report.metrics.criticalIssues > 0 ? 'critical' : undefined}>
                                  {report.metrics.criticalIssues}
                                </Text>
                              </BlockStack>
                            </Card>
                          </Box>

                          <Box minWidth="140px">
                            <Card>
                              <BlockStack gap="100">
                                <Text as="p" variant="bodySm" tone="subdued">Taux de mention</Text>
                                <Text as="p" variant="headingLg" fontWeight="bold">
                                  {Math.round(report.metrics.mentionRate)}%
                                </Text>
                              </BlockStack>
                            </Card>
                          </Box>
                        </InlineStack>

                        {/* Top Issues */}
                        {report.topIssues.length > 0 && (
                          <>
                            <Divider />
                            <BlockStack gap="300">
                              <Text as="h3" variant="headingSm">Problèmes les plus fréquents</Text>
                              <BlockStack gap="200">
                                {report.topIssues.map((issue) => (
                                  <InlineStack key={issue.code} align="space-between">
                                    <Text as="p">{getIssueLabel(issue.code)}</Text>
                                    <Badge>{`${issue.count} produit${issue.count > 1 ? 's' : ''}`}</Badge>
                                  </InlineStack>
                                ))}
                              </BlockStack>
                            </BlockStack>
                          </>
                        )}

                        {/* Recommendations */}
                        {report.recommendations.length > 0 && (
                          <>
                            <Divider />
                            <BlockStack gap="300">
                              <Text as="h3" variant="headingSm">Prochaines étapes suggérées</Text>
                              <BlockStack gap="200">
                                {report.recommendations.map((rec, index) => (
                                  <Box key={index} padding="300" background="bg-surface-info" borderRadius="200">
                                    <Text as="p" variant="bodySm">{rec}</Text>
                                  </Box>
                                ))}
                              </BlockStack>
                            </BlockStack>
                          </>
                        )}
                      </>
                    )}
                  </BlockStack>
                )}
              </Box>
            </Tabs>
          </Card>
        </Layout.Section>

        {/* Quick Tips with Action Buttons */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Comment s&apos;améliorer</Text>
              <Divider />
              <BlockStack gap="300">
                <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                  <InlineStack align="space-between" blockAlign="center" gap="400" wrap>
                    <BlockStack gap="100">
                      <Text as="p" fontWeight="semibold">Vérifiez vos produits régulièrement</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Lancez une analyse pour détecter les nouveaux problèmes rapidement
                      </Text>
                    </BlockStack>
                    <Link href="/admin/products">
                      <Button>Voir les produits</Button>
                    </Link>
                  </InlineStack>
                </Box>
                <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                  <InlineStack align="space-between" blockAlign="center" gap="400" wrap>
                    <BlockStack gap="100">
                      <Text as="p" fontWeight="semibold">Utilisez les suggestions IA</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Laissez l&apos;IA vous aider à écrire de meilleures descriptions
                      </Text>
                    </BlockStack>
                    <Link href="/admin/products">
                      <Button>Optimiser maintenant</Button>
                    </Link>
                  </InlineStack>
                </Box>
                <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                  <InlineStack align="space-between" blockAlign="center" gap="400" wrap>
                    <BlockStack gap="100">
                      <Text as="p" fontWeight="semibold">Surveillez votre visibilité</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Vérifiez si les assistants IA recommandent votre boutique
                      </Text>
                    </BlockStack>
                    <Link href="/admin/visibility">
                      <Button>Vérifier la visibilité</Button>
                    </Link>
                  </InlineStack>
                </Box>
                <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                  <InlineStack align="space-between" blockAlign="center" gap="400" wrap>
                    <BlockStack gap="100">
                      <Text as="p" fontWeight="semibold">Configurez vos outils IA</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Aidez les crawlers IA à mieux comprendre votre boutique
                      </Text>
                    </BlockStack>
                    <Link href="/admin/tools">
                      <Button variant="primary">Configurer les outils</Button>
                    </Link>
                  </InlineStack>
                </Box>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
