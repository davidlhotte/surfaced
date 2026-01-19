'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  DataTable,
  Modal,
  Scrollable,
} from '@shopify/polaris';
import Link from 'next/link';
import { useAuthenticatedFetch, useShopContext } from '@/components/providers/ShopProvider';
import { NotAuthenticated } from '@/components/admin/NotAuthenticated';

type VisibilityCheck = {
  id: string;
  platform: string;
  query: string;
  isMentioned: boolean;
  mentionContext: string | null;
  position: number | null;
  competitorsFound: { name: string; url?: string }[];
  responseQuality: string | null;
  rawResponse: string | null;
  checkedAt: string;
};

type VisibilityResult = {
  shopDomain: string;
  brandName: string;
  results: VisibilityCheck[];
  summary: {
    totalChecks: number;
    mentioned: number;
    notMentioned: number;
    competitorsFound: string[];
  };
};

export default function VisibilityPage() {
  const { fetch: authenticatedFetch } = useAuthenticatedFetch();
  const { isLoading: shopLoading, shopDetectionFailed, error: shopError } = useShopContext();
  const [history, setHistory] = useState<VisibilityCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<VisibilityResult | null>(null);
  const [customQuery, setCustomQuery] = useState('');
  const [selectedCheck, setSelectedCheck] = useState<VisibilityCheck | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('/api/visibility');
      if (!response.ok) throw new Error('Impossible de charger l\'historique');
      const result = await response.json();
      if (result.success) {
        setHistory(result.data);
      } else {
        setError(result.error || 'Erreur inconnue');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger l\'historique');
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const runCheck = async (queries?: string[]) => {
    try {
      setChecking(true);
      setError(null);
      const response = await authenticatedFetch('/api/visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queries }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Vérification échouée');
      }
      const result = await response.json();
      if (result.success) {
        setLastResult(result.data);
        await fetchHistory();
      } else {
        setError(result.error || 'Erreur inconnue');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Vérification échouée');
    } finally {
      setChecking(false);
    }
  };

  const handleCustomCheck = () => {
    if (customQuery.trim()) {
      runCheck([customQuery.trim()]);
      setCustomQuery('');
    }
  };

  const getPlatformBadge = (platform: string) => {
    const colors: Record<string, 'info' | 'success' | 'warning' | 'attention'> = {
      chatgpt: 'success',
      perplexity: 'info',
      gemini: 'warning',
      copilot: 'attention',
    };
    const names: Record<string, string> = {
      chatgpt: 'ChatGPT',
      perplexity: 'Perplexity',
      gemini: 'Gemini',
      copilot: 'Copilot',
    };
    return <Badge tone={colors[platform] || 'info'}>{names[platform] || platform}</Badge>;
  };

  const getQualityBadge = (quality: string | null, isMentioned: boolean) => {
    if (!isMentioned) {
      return <Badge tone="critical">Non trouvé</Badge>;
    }
    if (quality === 'good') {
      return <Badge tone="success">Recommandé</Badge>;
    }
    if (quality === 'partial') {
      return <Badge tone="warning">Mentionné</Badge>;
    }
    return <Badge tone="info">Trouvé</Badge>;
  };

  const openResponseModal = (check: VisibilityCheck) => {
    setSelectedCheck(check);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedCheck(null);
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      chatgpt: '🤖',
      perplexity: '🔍',
      gemini: '✨',
      copilot: '💻',
    };
    return icons[platform] || '🤖';
  };

  // Calculate summary stats
  const mentionedCount = history.filter((c) => c.isMentioned).length;
  const totalChecks = history.length;
  const mentionRate = totalChecks > 0 ? Math.round((mentionedCount / totalChecks) * 100) : 0;

  // Calculate best platform
  const bestPlatform = useMemo(() => {
    if (history.length === 0) return null;
    const platformMentions: Record<string, number> = {};
    history.forEach((check) => {
      if (check.isMentioned) {
        platformMentions[check.platform] = (platformMentions[check.platform] || 0) + 1;
      }
    });
    const entries = Object.entries(platformMentions);
    if (entries.length === 0) return null;
    const best = entries.reduce((a, b) => (a[1] > b[1] ? a : b));
    const names: Record<string, string> = {
      chatgpt: 'ChatGPT',
      perplexity: 'Perplexity',
      gemini: 'Gemini',
      copilot: 'Copilot',
    };
    return names[best[0]] || best[0];
  }, [history]);

  // Show authentication error if shop detection failed
  if (shopDetectionFailed) {
    return <NotAuthenticated error={shopError} />;
  }

  if (loading || shopLoading) {
    return (
      <Page title="Visibilité IA" backAction={{ content: 'Accueil', url: '/admin' }}>
        <Layout>
          <Layout.Section>
            <Card>
              <Box padding="800">
                <BlockStack gap="400" inlineAlign="center">
                  <Spinner size="large" />
                  <Text as="p">Chargement de vos données de visibilité...</Text>
                </BlockStack>
              </Box>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  const tableRows = history.slice(0, 20).map((check) => [
    getPlatformBadge(check.platform),
    <Text key={check.id} as="p" variant="bodySm" truncate>{check.query}</Text>,
    getQualityBadge(check.responseQuality, check.isMentioned),
    check.position ? `#${check.position}` : '-',
    new Date(check.checkedAt).toLocaleDateString('fr-FR'),
    <Button
      key={`view-${check.id}`}
      size="slim"
      onClick={() => openResponseModal(check)}
      disabled={!check.rawResponse}
    >
      Voir la réponse
    </Button>,
  ]);

  return (
    <Page
      title="Visibilité IA"
      subtitle="Vérifiez si les IA recommandent votre boutique"
      backAction={{ content: 'Accueil', url: '/admin' }}
      primaryAction={{
        content: checking ? 'Vérification...' : 'Lancer une vérification',
        onAction: () => runCheck(),
        loading: checking,
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

        {lastResult && (
          <Layout.Section>
            <Banner
              tone={lastResult.summary.mentioned > 0 ? 'success' : 'warning'}
              title="Vérification terminée"
              onDismiss={() => setLastResult(null)}
            >
              <BlockStack gap="200">
                <Text as="p">
                  Votre marque a été mentionnée dans {lastResult.summary.mentioned} réponse{lastResult.summary.mentioned !== 1 ? 's' : ''} sur{' '}
                  {lastResult.summary.totalChecks}.
                </Text>
                {lastResult.summary.competitorsFound.length > 0 && (
                  <Text as="p" tone="subdued">
                    Concurrents détectés : {lastResult.summary.competitorsFound.join(', ')}
                  </Text>
                )}
              </BlockStack>
            </Banner>
          </Layout.Section>
        )}

        {/* Welcome Section for New Users */}
        {history.length === 0 && (
          <Layout.Section>
            <Card>
              <Box padding="600">
                <BlockStack gap="500">
                  <div style={{
                    background: 'linear-gradient(135deg, #00b894 0%, #00cec9 100%)',
                    padding: '24px',
                    borderRadius: '12px',
                    color: 'white',
                  }}>
                    <BlockStack gap="400">
                      <Text as="h2" variant="headingLg">
                        Vérifiez votre visibilité sur les IA
                      </Text>
                      <Text as="p">
                        Découvrez si ChatGPT, Perplexity, Gemini et les autres assistants IA
                        recommandent votre boutique quand les utilisateurs posent des questions.
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
                            background: '#00b894',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                          }}>1</div>
                          <Text as="p" fontWeight="semibold">Nous interrogeons les IA</Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            Nous posons des questions type que vos clients pourraient poser
                          </Text>
                        </BlockStack>
                      </Box>
                      <Box minWidth="200px" maxWidth="300px">
                        <BlockStack gap="200">
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#00b894',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                          }}>2</div>
                          <Text as="p" fontWeight="semibold">Analyse des réponses</Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            Nous vérifions si votre marque est mentionnée dans les recommandations
                          </Text>
                        </BlockStack>
                      </Box>
                      <Box minWidth="200px" maxWidth="300px">
                        <BlockStack gap="200">
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#00b894',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                          }}>3</div>
                          <Text as="p" fontWeight="semibold">Rapport détaillé</Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            Vous voyez exactement ce que l&apos;IA répond et où vous êtes positionné
                          </Text>
                        </BlockStack>
                      </Box>
                    </InlineStack>
                  </BlockStack>

                  <Box paddingBlockStart="200">
                    <Button variant="primary" size="large" onClick={() => runCheck()} loading={checking}>
                      Lancer ma première vérification
                    </Button>
                  </Box>
                </BlockStack>
              </Box>
            </Card>
          </Layout.Section>
        )}

        {/* Summary Stats */}
        {history.length > 0 && (
          <Layout.Section>
            <InlineStack gap="400" align="start" wrap>
              <Box minWidth="200px">
                <Card>
                  <BlockStack gap="200">
                    <Text as="h3" variant="bodySm" tone="subdued">
                      Taux de mention
                    </Text>
                    <Text as="p" variant="heading2xl" fontWeight="bold" tone={mentionRate > 30 ? 'success' : mentionRate > 0 ? 'caution' : 'critical'}>
                      {mentionRate}%
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {mentionedCount} mention{mentionedCount !== 1 ? 's' : ''} sur {totalChecks} vérifications
                    </Text>
                  </BlockStack>
                </Card>
              </Box>

              <Box minWidth="200px">
                <Card>
                  <BlockStack gap="200">
                    <Text as="h3" variant="bodySm" tone="subdued">
                      Vérifications ce mois
                    </Text>
                    <Text as="p" variant="heading2xl" fontWeight="bold">
                      {totalChecks}
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      requêtes envoyées aux IA
                    </Text>
                  </BlockStack>
                </Card>
              </Box>

              <Box minWidth="200px">
                <Card>
                  <BlockStack gap="200">
                    <Text as="h3" variant="bodySm" tone="subdued">
                      Meilleure plateforme
                    </Text>
                    <Text as="p" variant="heading2xl" fontWeight="bold">
                      {bestPlatform || '-'}
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {bestPlatform ? 'vous mentionne le plus' : 'aucune mention encore'}
                    </Text>
                  </BlockStack>
                </Card>
              </Box>
            </InlineStack>
          </Layout.Section>
        )}

        {/* Custom Query */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <BlockStack gap="200">
                <Text as="h3" variant="headingMd">Testez une question personnalisée</Text>
                <Text as="p" tone="subdued">
                  Tapez une question que vos clients pourraient poser à une IA et voyez si votre boutique est mentionnée.
                </Text>
              </BlockStack>
              <Divider />
              <InlineStack gap="200" blockAlign="end" wrap>
                <Box minWidth="300px" maxWidth="500px">
                  <TextField
                    label="Votre question"
                    labelHidden
                    placeholder="Ex: Quels sont les meilleurs sites pour acheter des chaussures de running ?"
                    value={customQuery}
                    onChange={setCustomQuery}
                    autoComplete="off"
                  />
                </Box>
                <Button
                  onClick={handleCustomCheck}
                  disabled={!customQuery.trim() || checking}
                  loading={checking}
                  variant="primary"
                >
                  Tester cette question
                </Button>
              </InlineStack>
              <Text as="p" variant="bodySm" tone="subdued">
                Conseil : Posez des questions génériques sur votre secteur, pas des questions qui mentionnent directement votre marque.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* History Table */}
        {history.length > 0 && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">Historique des vérifications</Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Consultez les réponses complètes des IA pour comprendre comment elles perçoivent votre marque.
                  </Text>
                </BlockStack>
                <Divider />
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text']}
                  headings={['Plateforme', 'Question', 'Résultat', 'Position', 'Date', 'Réponse IA']}
                  rows={tableRows}
                />
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

        {/* Tips */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <BlockStack gap="200">
                <Text as="h3" variant="headingMd">Comment être plus souvent recommandé ?</Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  Les IA apprennent de votre contenu. Plus vos produits sont bien décrits, plus vous avez de chances d&apos;être mentionné.
                </Text>
              </BlockStack>
              <Divider />
              <BlockStack gap="200">
                <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                  <InlineStack align="space-between" blockAlign="center" gap="400" wrap>
                    <InlineStack gap="200" blockAlign="start">
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: '#5c6ac4',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '14px',
                      }}>1</div>
                      <BlockStack gap="100">
                        <Text as="p" fontWeight="semibold">Optimisez vos descriptions produits</Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          Des descriptions détaillées et naturelles aident les IA à comprendre vos produits.
                        </Text>
                      </BlockStack>
                    </InlineStack>
                    <Link href="/admin/products">
                      <Button>Optimiser mes produits</Button>
                    </Link>
                  </InlineStack>
                </Box>
                <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                  <InlineStack align="space-between" blockAlign="center" gap="400" wrap>
                    <InlineStack gap="200" blockAlign="start">
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: '#5c6ac4',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '14px',
                      }}>2</div>
                      <BlockStack gap="100">
                        <Text as="p" fontWeight="semibold">Soyez cohérent avec votre nom de marque</Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          Utilisez toujours le même nom partout pour que les IA vous reconnaissent.
                        </Text>
                      </BlockStack>
                    </InlineStack>
                    <Link href="/admin/settings">
                      <Button>Vérifier mes paramètres</Button>
                    </Link>
                  </InlineStack>
                </Box>
                <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                  <InlineStack align="space-between" blockAlign="center" gap="400" wrap>
                    <InlineStack gap="200" blockAlign="start">
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: '#5c6ac4',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '14px',
                      }}>3</div>
                      <BlockStack gap="100">
                        <Text as="p" fontWeight="semibold">Configurez vos outils IA</Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          Le fichier llms.txt et les schémas JSON-LD aident les IA à mieux vous référencer.
                        </Text>
                      </BlockStack>
                    </InlineStack>
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

      {/* AI Response Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={
          selectedCheck
            ? `${getPlatformIcon(selectedCheck.platform)} Réponse de ${selectedCheck.platform.charAt(0).toUpperCase() + selectedCheck.platform.slice(1)}`
            : 'Réponse IA'
        }
        size="large"
      >
        <Modal.Section>
          {selectedCheck && (
            <BlockStack gap="400">
              {/* Query */}
              <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                <BlockStack gap="200">
                  <Text as="h4" variant="headingSm" tone="subdued">
                    Question posée
                  </Text>
                  <Text as="p" fontWeight="semibold">
                    &quot;{selectedCheck.query}&quot;
                  </Text>
                </BlockStack>
              </Box>

              {/* Result Summary */}
              <InlineStack gap="300" align="start" wrap>
                <Box>
                  <BlockStack gap="100">
                    <Text as="span" variant="bodySm" tone="subdued">Résultat</Text>
                    {getQualityBadge(selectedCheck.responseQuality, selectedCheck.isMentioned)}
                  </BlockStack>
                </Box>
                {selectedCheck.position && (
                  <Box>
                    <BlockStack gap="100">
                      <Text as="span" variant="bodySm" tone="subdued">Position</Text>
                      <Badge tone="info">{`#${selectedCheck.position}`}</Badge>
                    </BlockStack>
                  </Box>
                )}
                {selectedCheck.competitorsFound && selectedCheck.competitorsFound.length > 0 && (
                  <Box>
                    <BlockStack gap="100">
                      <Text as="span" variant="bodySm" tone="subdued">Concurrents détectés</Text>
                      <Text as="p" variant="bodySm">
                        {selectedCheck.competitorsFound.map(c => c.name).join(', ')}
                      </Text>
                    </BlockStack>
                  </Box>
                )}
              </InlineStack>

              {/* Mention Context */}
              {selectedCheck.isMentioned && selectedCheck.mentionContext && (
                <Box padding="300" background="bg-surface-success" borderRadius="200">
                  <BlockStack gap="200">
                    <InlineStack gap="200" blockAlign="center">
                      <Badge tone="success">Votre marque a été mentionnée</Badge>
                    </InlineStack>
                    <Text as="p" variant="bodySm">
                      &quot;...{selectedCheck.mentionContext}...&quot;
                    </Text>
                  </BlockStack>
                </Box>
              )}

              {!selectedCheck.isMentioned && (
                <Box padding="300" background="bg-surface-critical" borderRadius="200">
                  <BlockStack gap="200">
                    <Text as="p" fontWeight="semibold">Votre marque n&apos;a pas été mentionnée</Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      L&apos;IA n&apos;a pas recommandé votre boutique pour cette question.
                      Améliorez vos descriptions produits pour augmenter vos chances.
                    </Text>
                  </BlockStack>
                </Box>
              )}

              <Divider />

              {/* Full AI Response */}
              <BlockStack gap="200">
                <Text as="h4" variant="headingSm">
                  Réponse complète de l&apos;IA
                </Text>
                <Box
                  padding="400"
                  background="bg-surface-secondary"
                  borderRadius="200"
                  minHeight="200px"
                  maxWidth="100%"
                >
                  <Scrollable style={{ maxHeight: '400px' }}>
                    <Text as="p" variant="bodyMd">
                      {selectedCheck.rawResponse || 'Réponse non disponible'}
                    </Text>
                  </Scrollable>
                </Box>
              </BlockStack>

              {/* Timestamp */}
              <Text as="p" variant="bodySm" tone="subdued">
                Vérifié le {new Date(selectedCheck.checkedAt).toLocaleDateString('fr-FR')} à {new Date(selectedCheck.checkedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </BlockStack>
          )}
        </Modal.Section>
      </Modal>
    </Page>
  );
}
