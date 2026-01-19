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
  Select,
  ResourceList,
  ResourceItem,
  ProgressBar,
  Modal,
} from '@shopify/polaris';
import { PlusCircleIcon } from '@shopify/polaris-icons';
import { useAuthenticatedFetch, useShopContext } from '@/components/providers/ShopProvider';
import { NotAuthenticated } from '@/components/admin/NotAuthenticated';

type ABTest = {
  id: string;
  name: string;
  productTitle: string;
  field: string;
  status: 'draft' | 'running' | 'completed' | 'cancelled';
  winner: 'A' | 'B' | 'tie' | null;
  winnerApplied: boolean;
  variantAMentions: number;
  variantBMentions: number;
  totalChecks: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
};

type Quota = {
  canCreate: boolean;
  used: number;
  limit: number;
  remaining: number;
};

export default function ABTestsPage() {
  const { fetch: authenticatedFetch } = useAuthenticatedFetch();
  const { isLoading: shopLoading, shopDetectionFailed, error: shopError } = useShopContext();
  const [tests, setTests] = useState<ABTest[]>([]);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create test form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTest, setNewTest] = useState({
    name: '',
    productId: '',
    field: 'description',
    variantB: '',
  });

  const fetchTests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('/api/ab-tests');
      if (!response.ok) throw new Error('Impossible de charger les tests');
      const result = await response.json();
      if (result.success) {
        setTests(result.data.tests);
        setQuota(result.data.quota);
      } else {
        setError(result.error || 'Erreur inconnue');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les tests');
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const createTest = async () => {
    if (!newTest.name || !newTest.productId || !newTest.variantB) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setCreating(true);
      setError(null);
      const response = await authenticatedFetch('/api/ab-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTest),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Impossible de créer le test');
      }
      await fetchTests();
      setShowCreateModal(false);
      setNewTest({ name: '', productId: '', field: 'description', variantB: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de créer le test');
    } finally {
      setCreating(false);
    }
  };

  const startTest = async (testId: string) => {
    try {
      setError(null);
      const response = await authenticatedFetch('/api/ab-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', testId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Impossible de démarrer le test');
      }
      await fetchTests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de démarrer le test');
    }
  };

  const cancelTest = async (testId: string) => {
    try {
      setError(null);
      const response = await authenticatedFetch('/api/ab-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', testId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Impossible d\'annuler le test');
      }
      await fetchTests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible d\'annuler le test');
    }
  };

  const applyWinner = async (testId: string) => {
    try {
      setError(null);
      const response = await authenticatedFetch('/api/ab-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'apply', testId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Impossible d\'appliquer le gagnant');
      }
      await fetchTests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible d\'appliquer le gagnant');
    }
  };

  const deleteTest = async (testId: string) => {
    try {
      setError(null);
      const response = await authenticatedFetch(`/api/ab-tests?id=${testId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Impossible de supprimer le test');
      }
      await fetchTests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de supprimer le test');
    }
  };

  const getStatusBadge = (status: ABTest['status']) => {
    const tones: Record<string, 'info' | 'attention' | 'success' | 'critical'> = {
      draft: 'info',
      running: 'attention',
      completed: 'success',
      cancelled: 'critical',
    };
    const labels: Record<string, string> = {
      draft: 'Brouillon',
      running: 'En cours',
      completed: 'Terminé',
      cancelled: 'Annulé',
    };
    return <Badge tone={tones[status]}>{labels[status]}</Badge>;
  };

  const getWinnerBadge = (test: ABTest) => {
    if (!test.winner) return null;
    if (test.winner === 'tie') {
      return <Badge>Égalité</Badge>;
    }
    return (
      <Badge tone="success">Variante {test.winner} gagne</Badge>
    );
  };

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      description: 'Description',
      seo_title: 'Titre SEO',
      seo_description: 'Description SEO',
      tags: 'Tags',
    };
    return labels[field] || field;
  };

  // Show authentication error if shop detection failed
  if (shopDetectionFailed) {
    return <NotAuthenticated error={shopError} />;
  }

  if (loading || shopLoading) {
    return (
      <Page title="Tests A/B" backAction={{ content: 'Accueil', url: '/admin' }}>
        <Layout>
          <Layout.Section>
            <Card>
              <Box padding="800">
                <BlockStack gap="400" inlineAlign="center">
                  <Spinner size="large" />
                  <Text as="p">Chargement des tests A/B...</Text>
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
      title="Tests A/B"
      subtitle="Testez différentes versions de vos contenus pour optimiser votre visibilité IA"
      backAction={{ content: 'Accueil', url: '/admin' }}
      primaryAction={{
        content: 'Créer un test',
        icon: PlusCircleIcon,
        onAction: () => setShowCreateModal(true),
        disabled: !quota?.canCreate,
      }}
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
        {tests.length === 0 && (
          <Layout.Section>
            <Card>
              <Box padding="600">
                <BlockStack gap="500">
                  <div style={{
                    background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)',
                    padding: '24px',
                    borderRadius: '12px',
                    color: 'white',
                  }}>
                    <BlockStack gap="400">
                      <Text as="h2" variant="headingLg">
                        Optimisez vos contenus avec des tests A/B
                      </Text>
                      <Text as="p">
                        Comparez deux versions d&apos;un contenu produit pour découvrir laquelle
                        est la plus recommandée par les IA. Data-driven marketing pour votre boutique.
                      </Text>
                    </BlockStack>
                  </div>

                  <BlockStack gap="300">
                    <Text as="h3" variant="headingMd">Comment ça marche ?</Text>
                    <InlineStack gap="400" wrap>
                      <Box minWidth="200px" maxWidth="280px">
                        <BlockStack gap="200">
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#0EA5E9',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                          }}>1</div>
                          <Text as="p" fontWeight="semibold">Créez un test</Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            Choisissez un produit et écrivez une version alternative du contenu
                          </Text>
                        </BlockStack>
                      </Box>
                      <Box minWidth="200px" maxWidth="280px">
                        <BlockStack gap="200">
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#0EA5E9',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                          }}>2</div>
                          <Text as="p" fontWeight="semibold">Lancez le test</Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            Nous simulons des requêtes IA avec les deux versions
                          </Text>
                        </BlockStack>
                      </Box>
                      <Box minWidth="200px" maxWidth="280px">
                        <BlockStack gap="200">
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#0EA5E9',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                          }}>3</div>
                          <Text as="p" fontWeight="semibold">Appliquez le gagnant</Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            La version la plus mentionnée peut être appliquée en 1 clic
                          </Text>
                        </BlockStack>
                      </Box>
                    </InlineStack>
                  </BlockStack>

                  <Box paddingBlockStart="200">
                    <Button variant="primary" size="large" onClick={() => setShowCreateModal(true)}>
                      Créer mon premier test A/B
                    </Button>
                  </Box>
                </BlockStack>
              </Box>
            </Card>
          </Layout.Section>
        )}

        {/* Quota Info */}
        {tests.length > 0 && (
          <Layout.Section>
            <Card>
              <InlineStack align="space-between" blockAlign="center">
                <BlockStack gap="100">
                  <Text as="h3" variant="headingMd">Tests actifs</Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    {quota?.used || 0} sur {quota?.limit || 0} tests utilisés
                  </Text>
                </BlockStack>
                <Box minWidth="200px">
                  <ProgressBar
                    progress={quota ? (quota.used / quota.limit) * 100 : 0}
                    tone={quota?.canCreate ? 'primary' : 'critical'}
                    size="small"
                  />
                </Box>
              </InlineStack>
            </Card>
          </Layout.Section>
        )}

        {/* Tests List */}
        {tests.length > 0 && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">Vos tests</Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Gérez vos tests A/B et appliquez les versions gagnantes
                  </Text>
                </BlockStack>
                <Divider />

                <ResourceList
                  items={tests}
                  renderItem={(test) => (
                    <ResourceItem
                      id={test.id}
                      accessibilityLabel={`Voir les détails de ${test.name}`}
                      onClick={() => {}}
                    >
                      <BlockStack gap="300">
                        <InlineStack align="space-between" blockAlign="center" wrap>
                          <BlockStack gap="100">
                            <Text as="p" fontWeight="semibold">{test.name}</Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                              {test.productTitle} - {getFieldLabel(test.field)}
                            </Text>
                          </BlockStack>
                          <InlineStack gap="200">
                            {getStatusBadge(test.status)}
                            {getWinnerBadge(test)}
                          </InlineStack>
                        </InlineStack>

                        {test.status === 'completed' && (
                          <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                            <InlineStack gap="400" align="space-between" wrap>
                              <BlockStack gap="100">
                                <Text as="p" variant="bodySm">Variante A (actuelle)</Text>
                                <Text as="p" fontWeight="semibold">
                                  {test.variantAMentions} mention{test.variantAMentions !== 1 ? 's' : ''}
                                </Text>
                              </BlockStack>
                              <BlockStack gap="100">
                                <Text as="p" variant="bodySm">Variante B (test)</Text>
                                <Text as="p" fontWeight="semibold">
                                  {test.variantBMentions} mention{test.variantBMentions !== 1 ? 's' : ''}
                                </Text>
                              </BlockStack>
                              <BlockStack gap="100">
                                <Text as="p" variant="bodySm">Vérifications totales</Text>
                                <Text as="p" fontWeight="semibold">{test.totalChecks}</Text>
                              </BlockStack>
                            </InlineStack>
                          </Box>
                        )}

                        <InlineStack gap="200">
                          {test.status === 'draft' && (
                            <>
                              <Button size="slim" variant="primary" onClick={() => startTest(test.id)}>
                                Démarrer
                              </Button>
                              <Button
                                size="slim"
                                tone="critical"
                                onClick={() => deleteTest(test.id)}
                              >
                                Supprimer
                              </Button>
                            </>
                          )}
                          {test.status === 'running' && (
                            <Button size="slim" onClick={() => cancelTest(test.id)}>
                              Annuler
                            </Button>
                          )}
                          {test.status === 'completed' && !test.winnerApplied && test.winner !== 'tie' && (
                            <Button
                              size="slim"
                              variant="primary"
                              onClick={() => applyWinner(test.id)}
                            >
                              Appliquer le gagnant
                            </Button>
                          )}
                          {test.status === 'completed' && test.winnerApplied && (
                            <Badge tone="success">Gagnant appliqué</Badge>
                          )}
                          {(test.status === 'completed' || test.status === 'cancelled') && (
                            <Button
                              size="slim"
                              tone="critical"
                              onClick={() => deleteTest(test.id)}
                            >
                              Supprimer
                            </Button>
                          )}
                        </InlineStack>
                      </BlockStack>
                    </ResourceItem>
                  )}
                />
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

        {/* Tips */}
        {tests.length > 0 && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">Conseils pour des tests efficaces</Text>
                <Divider />
                <BlockStack gap="200">
                  <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                    <BlockStack gap="100">
                      <Text as="p" fontWeight="semibold">Testez une seule variable à la fois</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Pour des résultats fiables, ne changez qu&apos;un seul élément entre les deux versions.
                      </Text>
                    </BlockStack>
                  </Box>
                  <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                    <BlockStack gap="100">
                      <Text as="p" fontWeight="semibold">Laissez le test tourner suffisamment</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Plus vous avez de vérifications, plus les résultats sont statistiquement fiables.
                      </Text>
                    </BlockStack>
                  </Box>
                  <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                    <BlockStack gap="100">
                      <Text as="p" fontWeight="semibold">Utilisez un langage naturel</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Les IA préfèrent des descriptions fluides plutôt que des listes de mots-clés.
                      </Text>
                    </BlockStack>
                  </Box>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}
      </Layout>

      {/* Create Test Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Créer un test A/B"
        primaryAction={{
          content: 'Créer le test',
          onAction: createTest,
          loading: creating,
          disabled: !newTest.name || !newTest.productId || !newTest.variantB,
        }}
        secondaryActions={[
          {
            content: 'Annuler',
            onAction: () => setShowCreateModal(false),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Banner tone="info">
              <Text as="p" variant="bodySm">
                Créez une version alternative du contenu de votre produit.
                Nous testerons les deux versions auprès des IA pour voir laquelle est la plus recommandée.
              </Text>
            </Banner>
            <TextField
              label="Nom du test"
              placeholder="Ex: Test description Premium Widget v1"
              value={newTest.name}
              onChange={(value) => setNewTest({ ...newTest, name: value })}
              autoComplete="off"
              helpText="Un nom pour identifier facilement ce test"
            />
            <TextField
              label="ID du produit Shopify"
              placeholder="123456789"
              value={newTest.productId}
              onChange={(value) => setNewTest({ ...newTest, productId: value })}
              autoComplete="off"
              helpText="L'ID numérique de votre produit (visible dans l'URL du produit dans Shopify)"
            />
            <Select
              label="Champ à tester"
              options={[
                { label: 'Description', value: 'description' },
                { label: 'Titre SEO', value: 'seo_title' },
                { label: 'Description SEO', value: 'seo_description' },
                { label: 'Tags', value: 'tags' },
              ]}
              value={newTest.field}
              onChange={(value) => setNewTest({ ...newTest, field: value })}
            />
            <TextField
              label="Variante B (contenu alternatif)"
              placeholder="Écrivez ici la version alternative que vous voulez tester..."
              value={newTest.variantB}
              onChange={(value) => setNewTest({ ...newTest, variantB: value })}
              multiline={4}
              autoComplete="off"
              helpText="Ce contenu sera comparé au contenu actuel (Variante A)"
            />
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
