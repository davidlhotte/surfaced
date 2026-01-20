'use client';

export const dynamic = 'force-dynamic';

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
  Modal,
  Scrollable,
  ProgressBar,
} from '@shopify/polaris';
import { useAuthenticatedFetch, useShopContext } from '@/components/providers/ShopProvider';
import { NotAuthenticated } from '@/components/admin/NotAuthenticated';
import { useAdminLanguage } from '@/lib/i18n/AdminLanguageContext';

// Types
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

// Platform configuration
const PLATFORMS: Record<string, { displayName: string; icon: string; free: boolean }> = {
  chatgpt: { displayName: 'ChatGPT', icon: '🤖', free: false },
  perplexity: { displayName: 'Perplexity', icon: '🔍', free: false },
  gemini: { displayName: 'Gemini', icon: '✨', free: false },
  claude: { displayName: 'Claude', icon: '🧠', free: false },
  copilot: { displayName: 'Copilot', icon: '💻', free: true },
  llama: { displayName: 'Llama 3.3', icon: '🦙', free: true },
  deepseek: { displayName: 'DeepSeek', icon: '🔮', free: true },
  mistral: { displayName: 'Mistral', icon: '🌪️', free: true },
  qwen: { displayName: 'Gemma 12B', icon: '🐼', free: true },
};

// Get status badge
function getStatusBadge(check: VisibilityCheck | null, t: Record<string, string>) {
  if (!check) {
    return <Badge tone="info">{t.notChecked || 'Not checked'}</Badge>;
  }
  if (!check.isMentioned) {
    return <Badge tone="critical">{t.absent || 'Absent'}</Badge>;
  }
  if (check.responseQuality === 'good') {
    return <Badge tone="success">{t.recommended || 'Recommended'}</Badge>;
  }
  if (check.responseQuality === 'partial') {
    return <Badge tone="warning">{t.mentioned || 'Mentioned'}</Badge>;
  }
  return <Badge tone="success">{t.mentioned || 'Mentioned'}</Badge>;
}

// Get sentiment badge
function getSentimentBadge(check: VisibilityCheck | null) {
  if (!check || !check.isMentioned) {
    return <Text as="span" tone="subdued">-</Text>;
  }
  if (check.responseQuality === 'good') {
    return <Badge tone="success">Positif</Badge>;
  }
  if (check.responseQuality === 'partial') {
    return <Badge tone="attention">Neutre</Badge>;
  }
  return <Badge tone="info">Neutre</Badge>;
}

export default function VisibilityPage() {
  const { fetch: authenticatedFetch } = useAuthenticatedFetch();
  const { isLoading: shopLoading, shopDetectionFailed, error: shopError } = useShopContext();
  const { t, locale } = useAdminLanguage();

  // State
  const [history, setHistory] = useState<VisibilityCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customQuery, setCustomQuery] = useState('');
  const [selectedCheck, setSelectedCheck] = useState<VisibilityCheck | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [brandName, setBrandName] = useState<string>('');

  // Fetch history
  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('/api/visibility');
      if (!response.ok) throw new Error(t.common.error);
      const result = await response.json();
      if (result.success) {
        setHistory(result.data);
        if (result.brandName) setBrandName(result.brandName);
      } else {
        setError(result.error || t.common.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch, t.common.error]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Run visibility check
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
        throw new Error(errorData.error || t.common.error);
      }
      const result = await response.json();
      if (result.success) {
        if (result.data.brandName) setBrandName(result.data.brandName);
        await fetchHistory();
      } else {
        setError(result.error || t.common.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setChecking(false);
    }
  };

  const handleCustomCheck = () => {
    if (customQuery.trim()) {
      runCheck([customQuery.trim()]);
    }
  };

  // Get latest check for each platform
  const latestByPlatform = useMemo(() => {
    const latest: Record<string, VisibilityCheck> = {};
    for (const check of history) {
      if (!latest[check.platform] || new Date(check.checkedAt) > new Date(latest[check.platform].checkedAt)) {
        latest[check.platform] = check;
      }
    }
    return latest;
  }, [history]);

  // Calculate score
  const score = useMemo(() => {
    const platforms = Object.keys(PLATFORMS);
    let mentioned = 0;
    let checked = 0;

    for (const platform of platforms) {
      const check = latestByPlatform[platform];
      if (check) {
        checked++;
        if (check.isMentioned) mentioned++;
      }
    }

    return {
      mentioned,
      total: checked,
      percentage: checked > 0 ? Math.round((mentioned / checked) * 100) : 0,
    };
  }, [latestByPlatform]);

  // Get all competitors from latest checks
  const allCompetitors = useMemo(() => {
    const competitors: Record<string, number> = {};
    for (const check of Object.values(latestByPlatform)) {
      if (check.competitorsFound) {
        for (const comp of check.competitorsFound) {
          competitors[comp.name] = (competitors[comp.name] || 0) + 1;
        }
      }
    }
    return Object.entries(competitors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [latestByPlatform]);

  // Get last query used
  const lastQuery = useMemo(() => {
    if (history.length === 0) return '';
    return history[0].query;
  }, [history]);

  // Show authentication error
  if (shopDetectionFailed) {
    return <NotAuthenticated error={shopError} />;
  }

  // Loading state
  if (loading || shopLoading) {
    return (
      <Page title={locale === 'fr' ? 'Visibilit\u00e9 AI' : 'AI Visibility'} backAction={{ content: 'Dashboard', url: '/admin' }}>
        <Layout>
          <Layout.Section>
            <Card>
              <Box padding="800">
                <BlockStack gap="400" inlineAlign="center">
                  <Spinner size="large" />
                  <Text as="p">{locale === 'fr' ? 'Chargement...' : 'Loading...'}</Text>
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
      title={locale === 'fr' ? 'Visibilit\u00e9 AI' : 'AI Visibility'}
      subtitle={locale === 'fr'
        ? 'Est-ce que les IA recommandent votre marque ?'
        : 'Is your brand recommended by AI assistants?'}
      backAction={{ content: 'Dashboard', url: '/admin' }}
      primaryAction={{
        content: checking
          ? (locale === 'fr' ? 'V\u00e9rification...' : 'Checking...')
          : (locale === 'fr' ? 'Lancer le check' : 'Run Check'),
        onAction: () => runCheck(),
        loading: checking,
      }}
    >
      <Layout>
        {/* Error Banner */}
        {error && (
          <Layout.Section>
            <Banner tone="critical" title={t.common.error} onDismiss={() => setError(null)}>
              <p>{error}</p>
            </Banner>
          </Layout.Section>
        )}

        {/* Score Card */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <BlockStack gap="100">
                  <Text as="h2" variant="headingMd">
                    {locale === 'fr' ? 'Score de Visibilit\u00e9' : 'Visibility Score'}
                  </Text>
                  <Text as="p" tone="subdued">
                    {brandName && (
                      <>{locale === 'fr' ? 'Marque:' : 'Brand:'} <strong>{brandName}</strong></>
                    )}
                  </Text>
                </BlockStack>
                <BlockStack gap="100" inlineAlign="end">
                  <Text as="p" variant="heading2xl" fontWeight="bold">
                    {score.mentioned}/{score.total}
                  </Text>
                  <Badge tone={score.percentage >= 50 ? 'success' : score.percentage > 0 ? 'warning' : 'critical'}>
                    {`${score.percentage}%`}
                  </Badge>
                </BlockStack>
              </InlineStack>
              <ProgressBar
                progress={score.percentage}
                tone={score.percentage >= 50 ? 'success' : score.percentage > 0 ? 'highlight' : 'critical'}
                size="small"
              />
              <Text as="p" variant="bodySm" tone="subdued">
                {locale === 'fr'
                  ? `Votre marque est mentionn\u00e9e dans ${score.mentioned} plateforme(s) sur ${score.total} v\u00e9rifi\u00e9e(s).`
                  : `Your brand is mentioned in ${score.mentioned} out of ${score.total} checked platform(s).`}
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Query Input */}
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="h3" variant="headingMd">
                {locale === 'fr' ? 'Requ\u00eate \u00e0 tester' : 'Query to Test'}
              </Text>
              <InlineStack gap="200" blockAlign="end" wrap>
                <Box minWidth="400px">
                  <TextField
                    label={locale === 'fr' ? 'Question' : 'Question'}
                    labelHidden
                    placeholder={lastQuery || (locale === 'fr'
                      ? 'Ex: Quel est le meilleur savon bio ?'
                      : 'E.g.: What is the best organic soap?')}
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
                  {locale === 'fr' ? 'Tester' : 'Test'}
                </Button>
              </InlineStack>
              {lastQuery && (
                <Text as="p" variant="bodySm" tone="subdued">
                  {locale === 'fr' ? 'Derni\u00e8re requ\u00eate:' : 'Last query:'} &quot;{lastQuery}&quot;
                </Text>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Results Table */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">
                {locale === 'fr' ? 'R\u00e9sultats par Plateforme' : 'Results by Platform'}
              </Text>
              <Divider />

              {/* Table Header */}
              <Box padding="200" background="bg-surface-secondary" borderRadius="200">
                <InlineStack align="space-between">
                  <Box width="25%"><Text as="span" variant="bodySm" fontWeight="semibold">{locale === 'fr' ? 'Plateforme' : 'Platform'}</Text></Box>
                  <Box width="20%"><Text as="span" variant="bodySm" fontWeight="semibold">{locale === 'fr' ? 'Statut' : 'Status'}</Text></Box>
                  <Box width="15%"><Text as="span" variant="bodySm" fontWeight="semibold">Position</Text></Box>
                  <Box width="20%"><Text as="span" variant="bodySm" fontWeight="semibold">{locale === 'fr' ? 'Contexte' : 'Sentiment'}</Text></Box>
                  <Box width="20%"><Text as="span" variant="bodySm" fontWeight="semibold">Action</Text></Box>
                </InlineStack>
              </Box>

              {/* Table Rows */}
              <BlockStack gap="200">
                {Object.entries(PLATFORMS).map(([key, platform]) => {
                  const check = latestByPlatform[key];
                  return (
                    <Box
                      key={key}
                      padding="300"
                      borderWidth="025"
                      borderColor="border"
                      borderRadius="200"
                      background={check?.isMentioned ? 'bg-surface-success' : 'bg-surface'}
                    >
                      <InlineStack align="space-between" blockAlign="center">
                        {/* Platform */}
                        <Box width="25%">
                          <InlineStack gap="200" blockAlign="center">
                            <Text as="span" variant="headingMd">{platform.icon}</Text>
                            <BlockStack gap="050">
                              <Text as="span" fontWeight="semibold">{platform.displayName}</Text>
                              {platform.free && <Badge tone="success" size="small">Free</Badge>}
                            </BlockStack>
                          </InlineStack>
                        </Box>

                        {/* Status */}
                        <Box width="20%">
                          {getStatusBadge(check, {
                            notChecked: locale === 'fr' ? 'Non v\u00e9rifi\u00e9' : 'Not checked',
                            absent: locale === 'fr' ? 'Absent' : 'Absent',
                            recommended: locale === 'fr' ? 'Recommand\u00e9' : 'Recommended',
                            mentioned: locale === 'fr' ? 'Mentionn\u00e9' : 'Mentioned',
                          })}
                        </Box>

                        {/* Position */}
                        <Box width="15%">
                          {check?.position ? (
                            <Badge tone="info">{`#${check.position}`}</Badge>
                          ) : (
                            <Text as="span" tone="subdued">-</Text>
                          )}
                        </Box>

                        {/* Sentiment */}
                        <Box width="20%">
                          {getSentimentBadge(check)}
                        </Box>

                        {/* Action */}
                        <Box width="20%">
                          <Button
                            size="slim"
                            onClick={() => {
                              if (check) {
                                setSelectedCheck(check);
                                setModalOpen(true);
                              }
                            }}
                            disabled={!check}
                          >
                            {locale === 'fr' ? 'D\u00e9tails' : 'Details'}
                          </Button>
                        </Box>
                      </InlineStack>
                    </Box>
                  );
                })}
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Competitors Section */}
        {allCompetitors.length > 0 && (
          <Layout.Section>
            <Card>
              <BlockStack gap="300">
                <Text as="h3" variant="headingMd">
                  {locale === 'fr' ? 'Concurrents D\u00e9tect\u00e9s' : 'Competitors Detected'}
                </Text>
                <InlineStack gap="200" wrap>
                  {allCompetitors.map(([name, count]) => (
                    <Badge key={name} tone="info">
                      {`${name} (${count}x)`}
                    </Badge>
                  ))}
                </InlineStack>
                <Text as="p" variant="bodySm" tone="subdued">
                  {locale === 'fr'
                    ? 'Ces marques sont mentionn\u00e9es dans les r\u00e9ponses AI \u00e0 la place de la v\u00f4tre.'
                    : 'These brands are mentioned in AI responses instead of yours.'}
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

        {/* History Section */}
        {history.length > 0 && (
          <Layout.Section>
            <Card>
              <BlockStack gap="300">
                <Text as="h3" variant="headingMd">
                  {locale === 'fr' ? 'Historique (10 derniers)' : 'History (last 10)'}
                </Text>
                <Divider />
                <BlockStack gap="100">
                  {history.slice(0, 10).map((check) => (
                    <Box key={check.id} padding="200" background="bg-surface-secondary" borderRadius="100">
                      <InlineStack align="space-between" blockAlign="center">
                        <InlineStack gap="200">
                          <Text as="span">{PLATFORMS[check.platform]?.icon || '🤖'}</Text>
                          <Text as="span" variant="bodySm" truncate>
                            {check.query.length > 40 ? check.query.substring(0, 40) + '...' : check.query}
                          </Text>
                        </InlineStack>
                        <InlineStack gap="200">
                          <Badge tone={check.isMentioned ? 'success' : 'critical'} size="small">
                            {check.isMentioned ? '✓' : '✗'}
                          </Badge>
                          <Text as="span" variant="bodySm" tone="subdued">
                            {new Date(check.checkedAt).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}
                          </Text>
                        </InlineStack>
                      </InlineStack>
                    </Box>
                  ))}
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}
      </Layout>

      {/* Detail Modal */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedCheck(null);
        }}
        title={selectedCheck ? `${PLATFORMS[selectedCheck.platform]?.icon} ${PLATFORMS[selectedCheck.platform]?.displayName || selectedCheck.platform}` : 'Details'}
        size="large"
      >
        <Modal.Section>
          {selectedCheck && (
            <BlockStack gap="400">
              {/* Query */}
              <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                <BlockStack gap="100">
                  <Text as="span" variant="bodySm" tone="subdued">
                    {locale === 'fr' ? 'Requ\u00eate:' : 'Query:'}
                  </Text>
                  <Text as="p" fontWeight="semibold">&quot;{selectedCheck.query}&quot;</Text>
                </BlockStack>
              </Box>

              {/* Result Summary */}
              <InlineStack gap="400" wrap>
                <BlockStack gap="100">
                  <Text as="span" variant="bodySm" tone="subdued">{locale === 'fr' ? 'Statut' : 'Status'}</Text>
                  {getStatusBadge(selectedCheck, {
                    notChecked: locale === 'fr' ? 'Non v\u00e9rifi\u00e9' : 'Not checked',
                    absent: locale === 'fr' ? 'Absent' : 'Absent',
                    recommended: locale === 'fr' ? 'Recommand\u00e9' : 'Recommended',
                    mentioned: locale === 'fr' ? 'Mentionn\u00e9' : 'Mentioned',
                  })}
                </BlockStack>
                {selectedCheck.position && (
                  <BlockStack gap="100">
                    <Text as="span" variant="bodySm" tone="subdued">Position</Text>
                    <Badge tone="info">{`#${selectedCheck.position}`}</Badge>
                  </BlockStack>
                )}
                <BlockStack gap="100">
                  <Text as="span" variant="bodySm" tone="subdued">{locale === 'fr' ? 'V\u00e9rifi\u00e9 le' : 'Checked on'}</Text>
                  <Text as="p" variant="bodySm">
                    {new Date(selectedCheck.checkedAt).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}
                  </Text>
                </BlockStack>
              </InlineStack>

              {/* Mention Context */}
              {selectedCheck.isMentioned && selectedCheck.mentionContext && (
                <Box padding="300" background="bg-surface-success" borderRadius="200">
                  <BlockStack gap="200">
                    <Badge tone="success">{locale === 'fr' ? 'Votre marque est mentionn\u00e9e' : 'Your brand is mentioned'}</Badge>
                    <Text as="p" variant="bodySm">&quot;...{selectedCheck.mentionContext}...&quot;</Text>
                  </BlockStack>
                </Box>
              )}

              {!selectedCheck.isMentioned && (
                <Box padding="300" background="bg-surface-critical" borderRadius="200">
                  <BlockStack gap="100">
                    <Text as="p" fontWeight="semibold">{locale === 'fr' ? 'Marque non mentionn\u00e9e' : 'Brand not mentioned'}</Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {locale === 'fr'
                        ? 'Optimisez vos descriptions produits et votre contenu pour am\u00e9liorer votre visibilit\u00e9.'
                        : 'Optimize your product descriptions and content to improve visibility.'}
                    </Text>
                  </BlockStack>
                </Box>
              )}

              {/* Competitors */}
              {selectedCheck.competitorsFound && selectedCheck.competitorsFound.length > 0 && (
                <BlockStack gap="200">
                  <Text as="span" variant="bodySm" tone="subdued">
                    {locale === 'fr' ? 'Concurrents mentionn\u00e9s:' : 'Competitors mentioned:'}
                  </Text>
                  <InlineStack gap="100">
                    {selectedCheck.competitorsFound.map((c) => (
                      <Badge key={c.name} tone="attention">{c.name}</Badge>
                    ))}
                  </InlineStack>
                </BlockStack>
              )}

              <Divider />

              {/* Full Response */}
              <BlockStack gap="200">
                <Text as="h4" variant="headingSm">
                  {locale === 'fr' ? 'R\u00e9ponse compl\u00e8te de l\'AI' : 'Full AI Response'}
                </Text>
                <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                  <Scrollable style={{ maxHeight: '300px' }}>
                    <Text as="p" variant="bodyMd">
                      {selectedCheck.rawResponse || (locale === 'fr' ? 'R\u00e9ponse non disponible' : 'Response not available')}
                    </Text>
                  </Scrollable>
                </Box>
              </BlockStack>
            </BlockStack>
          )}
        </Modal.Section>
      </Modal>
    </Page>
  );
}
