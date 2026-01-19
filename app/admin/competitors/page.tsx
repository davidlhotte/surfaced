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
  Divider,
  TextField,
  ResourceList,
  ResourceItem,
  Avatar,
  Modal,
  ProgressBar,
} from '@shopify/polaris';
import { PlusCircleIcon } from '@shopify/polaris-icons';
import { useAuthenticatedFetch, useShopContext } from '@/components/providers/ShopProvider';
import { NotAuthenticated } from '@/components/admin/NotAuthenticated';

type Competitor = {
  id: string;
  domain: string;
  name: string | null;
  isActive: boolean;
  createdAt: string;
};

type CompetitorsData = {
  competitors: Competitor[];
  limit: number;
  remaining: number;
};

type CompetitorAnalysis = {
  shopDomain: string;
  brandName: string;
  competitors: {
    domain: string;
    name: string | null;
    mentionRate: number;
    averagePosition: number | null;
  }[];
  comparisons: {
    query: string;
    yourBrand: {
      isMentioned: boolean;
      position: number | null;
      context: string | null;
    };
    competitors: {
      domain: string;
      name: string | null;
      isMentioned: boolean;
      mentionContext: string | null;
      position: number | null;
    }[];
    winner: string | null;
    gap: string;
  }[];
  insights: {
    type: 'danger' | 'warning' | 'opportunity';
    title: string;
    description: string;
  }[];
  summary: {
    yourMentionRate: number;
    bestCompetitorMentionRate: number;
    gapPercentage: number;
  };
};

export default function CompetitorsPage() {
  const { fetch: authenticatedFetch } = useAuthenticatedFetch();
  const { isLoading: shopLoading, shopDetectionFailed, error: shopError } = useShopContext();
  const [data, setData] = useState<CompetitorsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<CompetitorAnalysis | null>(null);

  // Add competitor form
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchCompetitors = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('/api/competitors');
      if (!response.ok) throw new Error('Impossible de charger les concurrents');
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Erreur inconnue');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les concurrents');
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    fetchCompetitors();
  }, [fetchCompetitors]);

  const addCompetitor = async () => {
    if (!newDomain.trim()) return;

    try {
      setAdding(true);
      setError(null);
      const response = await authenticatedFetch('/api/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: newDomain.trim(),
          name: newName.trim() || undefined,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Impossible d\'ajouter le concurrent');
      }
      const result = await response.json();
      if (result.success) {
        setData(result.data);
        setNewDomain('');
        setNewName('');
        setShowAddModal(false);
      } else {
        setError(result.error || 'Erreur inconnue');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible d\'ajouter le concurrent');
    } finally {
      setAdding(false);
    }
  };

  const removeCompetitor = async (id: string) => {
    try {
      setError(null);
      const response = await authenticatedFetch(`/api/competitors?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Impossible de supprimer le concurrent');
      }
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Erreur inconnue');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de supprimer le concurrent');
    }
  };

  const runAnalysis = async () => {
    try {
      setAnalyzing(true);
      setError(null);
      const response = await authenticatedFetch('/api/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze' }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analyse échouée');
      }
      const result = await response.json();
      if (result.success) {
        setAnalysis(result.data);
      } else {
        setError(result.error || 'Erreur inconnue');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analyse échouée');
    } finally {
      setAnalyzing(false);
    }
  };

  const getInsightBadge = (type: string) => {
    const tones: Record<string, 'critical' | 'warning' | 'success'> = {
      danger: 'critical',
      warning: 'warning',
      opportunity: 'success',
    };
    return tones[type] || 'info';
  };

  const getInsightLabel = (type: string) => {
    const labels: Record<string, string> = {
      danger: 'Action requise',
      warning: 'Attention',
      opportunity: 'Opportunité',
    };
    return labels[type] || type;
  };

  // Show authentication error if shop detection failed
  if (shopDetectionFailed) {
    return <NotAuthenticated error={shopError} />;
  }

  if (loading || shopLoading) {
    return (
      <Page title="Veille concurrentielle" backAction={{ content: 'Accueil', url: '/admin' }}>
        <Layout>
          <Layout.Section>
            <Card>
              <Box padding="800">
                <BlockStack gap="400" inlineAlign="center">
                  <Spinner size="large" />
                  <Text as="p">Chargement de vos concurrents...</Text>
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
      title="Veille concurrentielle"
      subtitle="Comparez votre visibilité IA à celle de vos concurrents"
      backAction={{ content: 'Accueil', url: '/admin' }}
      primaryAction={{
        content: analyzing ? 'Analyse...' : 'Lancer l\'analyse',
        onAction: runAnalysis,
        loading: analyzing,
        disabled: !data?.competitors.length,
      }}
      secondaryActions={[
        {
          content: 'Ajouter un concurrent',
          icon: PlusCircleIcon,
          onAction: () => setShowAddModal(true),
          disabled: data?.remaining === 0,
        },
      ]}
    >
      <Layout>
        {error && (
          <Layout.Section>
            <Banner tone="critical" title="Erreur" onDismiss={() => setError(null)}>
              <p>{error}</p>
            </Banner>
          </Layout.Section>
        )}

        {/* Welcome Section for New Users */}
        {!data?.competitors.length && !analysis && (
          <Layout.Section>
            <Card>
              <Box padding="600">
                <BlockStack gap="500">
                  <div style={{
                    background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
                    padding: '24px',
                    borderRadius: '12px',
                    color: 'white',
                  }}>
                    <BlockStack gap="400">
                      <Text as="h2" variant="headingLg">
                        Surveillez vos concurrents
                      </Text>
                      <Text as="p">
                        Découvrez où vos concurrents apparaissent dans les recommandations IA
                        et identifiez les opportunités pour les dépasser.
                      </Text>
                    </BlockStack>
                  </div>

                  <BlockStack gap="300">
                    <Text as="h3" variant="headingMd">Comment ça marche ?</Text>
                    <InlineStack gap="400" wrap>
                      <Box minWidth="200px" maxWidth="300px">
                        <BlockStack gap="200">
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#F59E0B',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                          }}>1</div>
                          <Text as="p" fontWeight="semibold">Ajoutez vos concurrents</Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            Entrez le domaine des boutiques que vous voulez surveiller
                          </Text>
                        </BlockStack>
                      </Box>
                      <Box minWidth="200px" maxWidth="300px">
                        <BlockStack gap="200">
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#F59E0B',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                          }}>2</div>
                          <Text as="p" fontWeight="semibold">Analyse comparative</Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            Nous interrogeons les IA et comparons qui est le plus recommandé
                          </Text>
                        </BlockStack>
                      </Box>
                      <Box minWidth="200px" maxWidth="300px">
                        <BlockStack gap="200">
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#F59E0B',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                          }}>3</div>
                          <Text as="p" fontWeight="semibold">Insights actionnables</Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            Recevez des recommandations pour améliorer votre positionnement
                          </Text>
                        </BlockStack>
                      </Box>
                    </InlineStack>
                  </BlockStack>

                  <Box paddingBlockStart="200">
                    <Button variant="primary" size="large" onClick={() => setShowAddModal(true)}>
                      Ajouter mon premier concurrent
                    </Button>
                  </Box>
                </BlockStack>
              </Box>
            </Card>
          </Layout.Section>
        )}

        {/* Analysis Results */}
        {analysis && (
          <>
            <Layout.Section>
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="h2" variant="headingLg">Résultats de l&apos;analyse</Text>
                    <Button variant="plain" onClick={() => setAnalysis(null)}>
                      Fermer
                    </Button>
                  </InlineStack>
                  <Divider />

                  {/* Summary */}
                  <InlineStack gap="400" align="start" wrap>
                    <Box minWidth="180px">
                      <Card>
                        <BlockStack gap="200">
                          <Text as="p" variant="bodySm" tone="subdued">Votre taux de mention</Text>
                          <Text as="p" variant="heading2xl" fontWeight="bold" tone={analysis.summary.yourMentionRate > 30 ? 'success' : 'critical'}>
                            {analysis.summary.yourMentionRate}%
                          </Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            Fréquence de recommandation par les IA
                          </Text>
                        </BlockStack>
                      </Card>
                    </Box>
                    <Box minWidth="180px">
                      <Card>
                        <BlockStack gap="200">
                          <Text as="p" variant="bodySm" tone="subdued">Meilleur concurrent</Text>
                          <Text as="p" variant="heading2xl" fontWeight="bold">
                            {analysis.summary.bestCompetitorMentionRate}%
                          </Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            Le concurrent le plus mentionné
                          </Text>
                        </BlockStack>
                      </Card>
                    </Box>
                    <Box minWidth="180px">
                      <Card>
                        <BlockStack gap="200">
                          <Text as="p" variant="bodySm" tone="subdued">Écart</Text>
                          <Text
                            as="p"
                            variant="heading2xl"
                            fontWeight="bold"
                            tone={analysis.summary.gapPercentage > 0 ? 'critical' : 'success'}
                          >
                            {analysis.summary.gapPercentage > 0 ? '-' : '+'}{Math.abs(analysis.summary.gapPercentage)}%
                          </Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            {analysis.summary.gapPercentage > 0 ? 'Vous êtes en retard' : 'Vous êtes en avance'}
                          </Text>
                        </BlockStack>
                      </Card>
                    </Box>
                  </InlineStack>
                </BlockStack>
              </Card>
            </Layout.Section>

            {/* Insights */}
            {analysis.insights.length > 0 && (
              <Layout.Section>
                <Card>
                  <BlockStack gap="400">
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingMd">Insights clés</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Actions recommandées basées sur l&apos;analyse comparative
                      </Text>
                    </BlockStack>
                    <Divider />
                    <BlockStack gap="300">
                      {analysis.insights.map((insight, index) => (
                        <Box
                          key={index}
                          padding="300"
                          background={
                            insight.type === 'danger'
                              ? 'bg-surface-critical'
                              : insight.type === 'warning'
                              ? 'bg-surface-warning'
                              : 'bg-surface-success'
                          }
                          borderRadius="200"
                        >
                          <InlineStack gap="300" blockAlign="start">
                            <Badge tone={getInsightBadge(insight.type)}>
                              {getInsightLabel(insight.type)}
                            </Badge>
                            <BlockStack gap="100">
                              <Text as="p" fontWeight="semibold">{insight.title}</Text>
                              <Text as="p" variant="bodySm" tone="subdued">
                                {insight.description}
                              </Text>
                            </BlockStack>
                          </InlineStack>
                        </Box>
                      ))}
                    </BlockStack>
                  </BlockStack>
                </Card>
              </Layout.Section>
            )}

            {/* Competitor Comparison */}
            <Layout.Section>
              <Card>
                <BlockStack gap="400">
                  <BlockStack gap="200">
                    <Text as="h3" variant="headingMd">Comparaison des taux de mention</Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Plus la barre est longue, plus la marque est recommandée par les IA
                    </Text>
                  </BlockStack>
                  <Divider />
                  <BlockStack gap="300">
                    <Box padding="300" background="bg-surface-success" borderRadius="200">
                      <InlineStack align="space-between" blockAlign="center">
                        <InlineStack gap="200" blockAlign="center">
                          <Badge tone="success">Vous</Badge>
                          <Text as="p" fontWeight="semibold">{analysis.brandName}</Text>
                        </InlineStack>
                        <InlineStack gap="200" blockAlign="center">
                          <Box minWidth="120px">
                            <ProgressBar
                              progress={analysis.summary.yourMentionRate}
                              tone="success"
                              size="small"
                            />
                          </Box>
                          <Text as="p" fontWeight="bold">{analysis.summary.yourMentionRate}%</Text>
                        </InlineStack>
                      </InlineStack>
                    </Box>
                    {analysis.competitors.map((comp) => (
                      <Box key={comp.domain} padding="300" background="bg-surface-secondary" borderRadius="200">
                        <InlineStack align="space-between" blockAlign="center">
                          <Text as="p">{comp.name || comp.domain}</Text>
                          <InlineStack gap="200" blockAlign="center">
                            <Box minWidth="120px">
                              <ProgressBar
                                progress={comp.mentionRate}
                                tone={comp.mentionRate > analysis.summary.yourMentionRate ? 'critical' : 'primary'}
                                size="small"
                              />
                            </Box>
                            <Text as="p" fontWeight="semibold" tone={comp.mentionRate > analysis.summary.yourMentionRate ? 'critical' : undefined}>
                              {comp.mentionRate}%
                            </Text>
                          </InlineStack>
                        </InlineStack>
                      </Box>
                    ))}
                  </BlockStack>
                </BlockStack>
              </Card>
            </Layout.Section>

            {/* Query Results */}
            <Layout.Section>
              <Card>
                <BlockStack gap="400">
                  <BlockStack gap="200">
                    <Text as="h3" variant="headingMd">Résultats par question</Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Voyez qui gagne sur chaque requête type
                    </Text>
                  </BlockStack>
                  <Divider />
                  <BlockStack gap="400">
                    {analysis.comparisons.map((comp, index) => (
                      <Box key={index} padding="300" background="bg-surface-secondary" borderRadius="200">
                        <BlockStack gap="200">
                          <InlineStack align="space-between" blockAlign="center" wrap>
                            <Text as="p" fontWeight="semibold">
                              &ldquo;{comp.query}&rdquo;
                            </Text>
                            {comp.winner && (
                              <Badge tone={comp.winner === analysis.brandName ? 'success' : 'critical'}>
                                Gagnant : {comp.winner}
                              </Badge>
                            )}
                          </InlineStack>
                          <Text as="p" variant="bodySm" tone="subdued">
                            {comp.gap}
                          </Text>
                          <InlineStack gap="200" wrap>
                            <Badge tone={comp.yourBrand.isMentioned ? 'success' : 'critical'}>
                              Vous : {comp.yourBrand.isMentioned ? `#${comp.yourBrand.position || '?'}` : 'Non trouvé'}
                            </Badge>
                            {comp.competitors.slice(0, 3).map((c) => (
                              <Badge key={c.domain} tone={c.isMentioned ? 'attention' : 'new'}>
                                {c.name || c.domain} : {c.isMentioned ? `#${c.position || '?'}` : 'Non trouvé'}
                              </Badge>
                            ))}
                          </InlineStack>
                        </BlockStack>
                      </Box>
                    ))}
                  </BlockStack>
                </BlockStack>
              </Card>
            </Layout.Section>
          </>
        )}

        {/* Competitors List */}
        {data?.competitors && data.competitors.length > 0 && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="100">
                    <Text as="h3" variant="headingMd">Concurrents suivis</Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Les marques que vous surveillez dans les recommandations IA
                    </Text>
                  </BlockStack>
                  <Badge tone={data.remaining > 0 ? 'info' : 'warning'}>
                    {data.competitors.length} / {data.limit}
                  </Badge>
                </InlineStack>
                <Divider />

                <ResourceList
                  items={data.competitors}
                  renderItem={(item) => (
                    <ResourceItem
                      id={item.id}
                      accessibilityLabel={`Voir les détails de ${item.name || item.domain}`}
                      onClick={() => {}}
                      media={
                        <Avatar
                          customer
                          size="md"
                          name={item.name || item.domain}
                        />
                      }
                      shortcutActions={[
                        {
                          content: 'Supprimer',
                          onAction: () => removeCompetitor(item.id),
                        },
                      ]}
                    >
                      <BlockStack gap="100">
                        <Text as="p" fontWeight="semibold">
                          {item.name || item.domain}
                        </Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          {item.domain}
                        </Text>
                      </BlockStack>
                    </ResourceItem>
                  )}
                />

                {data.remaining > 0 && (
                  <Box paddingBlockStart="200">
                    <Button onClick={() => setShowAddModal(true)} icon={PlusCircleIcon}>
                      Ajouter un concurrent ({data.remaining} restant{data.remaining > 1 ? 's' : ''})
                    </Button>
                  </Box>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

        {/* Value Proposition */}
        {data?.competitors && data.competitors.length > 0 && !analysis && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">Pourquoi surveiller vos concurrents ?</Text>
                <Divider />
                <BlockStack gap="200">
                  <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                    <BlockStack gap="100">
                      <Text as="p" fontWeight="semibold">Identifiez les opportunités</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Découvrez les requêtes où vos concurrents apparaissent mais pas vous.
                        Ce sont des opportunités d&apos;amélioration de votre contenu.
                      </Text>
                    </BlockStack>
                  </Box>
                  <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                    <BlockStack gap="100">
                      <Text as="p" fontWeight="semibold">Comprenez votre positionnement</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Voyez exactement où vous vous situez par rapport à vos concurrents
                        dans les recommandations IA.
                      </Text>
                    </BlockStack>
                  </Box>
                  <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                    <BlockStack gap="100">
                      <Text as="p" fontWeight="semibold">Améliorez votre stratégie</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Recevez des recommandations concrètes pour dépasser vos concurrents
                        dans les résultats IA.
                      </Text>
                    </BlockStack>
                  </Box>
                </BlockStack>

                <Box paddingBlockStart="200">
                  <Button variant="primary" onClick={runAnalysis} loading={analyzing}>
                    Lancer l&apos;analyse comparative
                  </Button>
                </Box>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}
      </Layout>

      {/* Add Competitor Modal */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Ajouter un concurrent"
        primaryAction={{
          content: 'Ajouter',
          onAction: addCompetitor,
          loading: adding,
          disabled: !newDomain.trim(),
        }}
        secondaryActions={[
          {
            content: 'Annuler',
            onAction: () => setShowAddModal(false),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Banner tone="info">
              <Text as="p" variant="bodySm">
                Ajoutez le domaine d&apos;un concurrent pour voir comment il se positionne
                par rapport à vous dans les recommandations des IA.
              </Text>
            </Banner>
            <TextField
              label="Domaine du concurrent"
              placeholder="concurrent.com ou concurrent.myshopify.com"
              value={newDomain}
              onChange={setNewDomain}
              autoComplete="off"
              helpText="L'adresse du site web de votre concurrent"
            />
            <TextField
              label="Nom du concurrent (optionnel)"
              placeholder="Nom de la marque"
              value={newName}
              onChange={setNewName}
              autoComplete="off"
              helpText="Un nom convivial pour identifier ce concurrent"
            />
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
