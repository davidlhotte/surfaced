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
  Collapsible,
  Icon,
} from '@shopify/polaris';
import { SearchIcon, ChevronDownIcon, ChevronUpIcon, ClockIcon } from '@shopify/polaris-icons';
import { useAuthenticatedFetch, useShopContext } from '@/components/providers/ShopProvider';
import { NotAuthenticated } from '@/components/admin/NotAuthenticated';
import { AdminNav } from '@/components/admin/AdminNav';
import { PageBanner } from '@/components/admin/PageBanner';
import { useAdminLanguage } from '@/lib/i18n/AdminLanguageContext';

// Helper function to highlight terms (query and brand name) in text
function highlightTerms(text: string, terms: string[]): React.ReactNode {
  if (!text || terms.length === 0) return text;

  // Filter out empty terms and create a regex pattern
  const validTerms = terms.filter(t => t && t.trim().length > 0);
  if (validTerms.length === 0) return text;

  // Escape special regex characters and join with OR
  const escapedTerms = validTerms.map(t =>
    t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );
  const pattern = new RegExp(`(${escapedTerms.join('|')})`, 'gi');

  // Split text by the pattern, keeping the matches
  const parts = text.split(pattern);

  return parts.map((part, index) => {
    // Check if this part matches any of our terms (case-insensitive)
    const isHighlighted = validTerms.some(
      term => part.toLowerCase() === term.toLowerCase()
    );

    if (isHighlighted) {
      return (
        <strong key={index} style={{
          color: '#0EA5E9',
          fontWeight: '600',
          backgroundColor: 'rgba(14, 165, 233, 0.1)',
          padding: '1px 4px',
          borderRadius: '3px'
        }}>
          {part}
        </strong>
      );
    }
    return part;
  });
}

// Types
type Platform = 'chatgpt' | 'perplexity' | 'gemini' | 'claude' | 'copilot' | 'llama' | 'deepseek' | 'mistral' | 'qwen';

type VisibilityCheck = {
  id: string;
  platform: Platform;
  query: string;
  sessionId: string | null;
  isMentioned: boolean | null;
  mentionContext: string | null;
  position: number | null;
  competitorsFound: { name: string; url?: string }[];
  responseQuality: string | null;
  rawResponse: string | null;
  checkedAt: string;
};

type HistorySession = {
  sessionId: string;
  query: string;
  checkedAt: string;
  checks: VisibilityCheck[];
  summary: {
    total: number;
    mentioned: number;
    percentage: number;
  };
};

// Platform configuration with colors
const PLATFORMS: Record<Platform, { displayName: string; icon: string; free: boolean; color: string }> = {
  chatgpt: { displayName: 'ChatGPT', icon: '🤖', free: false, color: '#10A37F' },
  perplexity: { displayName: 'Perplexity', icon: '🔍', free: false, color: '#1E88E5' },
  gemini: { displayName: 'Gemini', icon: '✨', free: false, color: '#4285F4' },
  claude: { displayName: 'Claude', icon: '🧠', free: false, color: '#D97706' },
  copilot: { displayName: 'Copilot', icon: '💻', free: true, color: '#0078D4' },
  llama: { displayName: 'Llama', icon: '🦙', free: true, color: '#7C3AED' },
  deepseek: { displayName: 'DeepSeek', icon: '🔮', free: true, color: '#059669' },
  mistral: { displayName: 'Mistral', icon: '🌪️', free: true, color: '#EA580C' },
  qwen: { displayName: 'Gemma', icon: '💎', free: true, color: '#DB2777' },
};

// Predefined query suggestions
function getQuerySuggestions(brandName: string, locale: string): { label: string; query: string }[] {
  if (locale === 'fr') {
    return [
      { label: 'Recommandation produit', query: `Quel est le meilleur produit de ${brandName} ?` },
      { label: 'Avis marque', query: `Que pensez-vous de la marque ${brandName} ?` },
      { label: 'Comparaison', query: `${brandName} vs ses concurrents, lequel choisir ?` },
      { label: 'Découverte', query: `Connaissez-vous ${brandName} ? Que vendez-ils ?` },
    ];
  }
  return [
    { label: 'Product recommendation', query: `What is the best product from ${brandName}?` },
    { label: 'Brand review', query: `What do you think about ${brandName}?` },
    { label: 'Comparison', query: `${brandName} vs competitors, which should I choose?` },
    { label: 'Discovery', query: `Do you know ${brandName}? What do they sell?` },
  ];
}

export default function VisibilityPage() {
  const { fetch: authenticatedFetch } = useAuthenticatedFetch();
  const { isLoading: shopLoading, shopDetectionFailed, error: shopError } = useShopContext();
  const { locale } = useAdminLanguage();

  // State
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [currentResults, setCurrentResults] = useState<VisibilityCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [checkingPlatforms, setCheckingPlatforms] = useState<Set<Platform>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [customQuery, setCustomQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); // What we're looking for in responses
  const [selectedCheck, setSelectedCheck] = useState<VisibilityCheck | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [brandName, setBrandName] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<HistorySession | null>(null);
  const [historyOpen, setHistoryOpen] = useState(true); // Collapsible history

  // Translations
  const t = {
    title: locale === 'fr' ? 'Visibilité IA' : 'AI Visibility',
    subtitle: locale === 'fr'
      ? 'Votre marque est-elle recommandée par les assistants IA ?'
      : 'Is your brand recommended by AI assistants?',
    score: locale === 'fr' ? 'Score de Visibilité' : 'Visibility Score',
    brand: locale === 'fr' ? 'Marque' : 'Brand',
    query: locale === 'fr' ? 'Question à tester' : 'Question to test',
    searchTermLabel: locale === 'fr' ? 'Terme recherché' : 'Search term',
    searchTermHelp: locale === 'fr'
      ? 'Marque ou produit à rechercher dans les réponses IA'
      : 'Brand or product to look for in AI responses',
    searchTermPlaceholder: locale === 'fr' ? 'Ex: EcoSoap, Savon bio...' : 'E.g.: EcoSoap, Organic soap...',
    suggestions: locale === 'fr' ? 'Idées de questions' : 'Question ideas',
    test: locale === 'fr' ? 'Lancer le test' : 'Run test',
    testing: locale === 'fr' ? 'Test en cours...' : 'Testing...',
    lookingFor: locale === 'fr' ? 'On recherche' : 'Looking for',
    results: locale === 'fr' ? 'Résultats par Plateforme' : 'Results by Platform',
    platform: locale === 'fr' ? 'Plateforme' : 'Platform',
    status: locale === 'fr' ? 'Statut' : 'Status',
    position: 'Position',
    sentiment: locale === 'fr' ? 'Sentiment' : 'Sentiment',
    action: 'Action',
    details: locale === 'fr' ? 'Voir' : 'View',
    history: locale === 'fr' ? 'Historique des tests' : 'Test History',
    noHistory: locale === 'fr' ? 'Aucun test effectué' : 'No tests yet',
    competitors: locale === 'fr' ? 'Concurrents détectés' : 'Competitors detected',
    competitorsDesc: locale === 'fr'
      ? 'Ces marques sont mentionnées à votre place'
      : 'These brands are mentioned instead of yours',
    mentioned: locale === 'fr' ? 'Mentionné' : 'Mentioned',
    absent: locale === 'fr' ? 'Non mentionné' : 'Not mentioned',
    recommended: locale === 'fr' ? 'Recommandé' : 'Recommended',
    notChecked: locale === 'fr' ? 'Non testé' : 'Not tested',
    positive: locale === 'fr' ? 'Positif' : 'Positive',
    neutral: locale === 'fr' ? 'Neutre' : 'Neutral',
    negative: locale === 'fr' ? 'Négatif' : 'Negative',
    fullResponse: locale === 'fr' ? 'Réponse complète' : 'Full Response',
    checkedOn: locale === 'fr' ? 'Vérifié le' : 'Checked on',
    platforms: locale === 'fr' ? 'plateformes' : 'platforms',
    loading: locale === 'fr' ? 'Chargement...' : 'Loading...',
  };

  // Fetch history
  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('/api/visibility');
      if (!response.ok) throw new Error('Failed to load');
      const result = await response.json();
      if (result.success) {
        setSessions(result.sessions || []);
        if (result.brandName) {
          setBrandName(result.brandName);
          // Initialize searchTerm with brandName if not already set
          if (!searchTerm) setSearchTerm(result.brandName);
        }
        // Set current results from the most recent session
        if (result.sessions && result.sessions.length > 0) {
          setCurrentResults(result.sessions[0].checks);
        }
      } else {
        setError(result.error || 'Error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Run visibility check
  const runCheck = async (query: string) => {
    if (!query.trim() || !searchTerm.trim()) return;

    try {
      setChecking(true);
      setError(null);
      setCurrentResults([]);
      setSelectedSession(null);
      // Mark all platforms as checking
      setCheckingPlatforms(new Set(Object.keys(PLATFORMS) as Platform[]));

      const response = await authenticatedFetch('/api/visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queries: [query],
          searchTerm: searchTerm.trim(), // Pass the term to search for
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error');
      }

      const result = await response.json();
      if (result.success) {
        if (result.data.brandName) setBrandName(result.data.brandName);
        // Refresh to get updated history
        await fetchHistory();
      } else {
        setError(result.error || 'Error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setChecking(false);
      setCheckingPlatforms(new Set());
    }
  };

  // Get results by platform (from current results)
  const resultsByPlatform = useMemo(() => {
    const map: Record<Platform, VisibilityCheck | null> = {} as Record<Platform, VisibilityCheck | null>;
    for (const platform of Object.keys(PLATFORMS) as Platform[]) {
      map[platform] = currentResults.find(c => c.platform === platform) || null;
    }
    return map;
  }, [currentResults]);

  // Calculate score
  const score = useMemo(() => {
    const checked = currentResults.length;
    const mentioned = currentResults.filter(c => c.isMentioned).length;
    return {
      mentioned,
      total: checked,
      percentage: checked > 0 ? Math.round((mentioned / checked) * 100) : 0,
    };
  }, [currentResults]);

  // Get all competitors from current results
  const allCompetitors = useMemo(() => {
    const competitors: Record<string, number> = {};
    for (const check of currentResults) {
      if (check.competitorsFound) {
        for (const comp of check.competitorsFound) {
          competitors[comp.name] = (competitors[comp.name] || 0) + 1;
        }
      }
    }
    return Object.entries(competitors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [currentResults]);

  // Query suggestions
  const suggestions = useMemo(() => getQuerySuggestions(brandName || 'YourBrand', locale), [brandName, locale]);

  // Get status badge
  const getStatusBadge = (check: VisibilityCheck | null) => {
    if (!check) return <Badge tone="info">{t.notChecked}</Badge>;
    if (!check.isMentioned) return <Badge tone="critical">{t.absent}</Badge>;
    if (check.responseQuality === 'good') return <Badge tone="success">{t.recommended}</Badge>;
    return <Badge tone="success">{t.mentioned}</Badge>;
  };

  // Get sentiment badge
  const getSentimentBadge = (check: VisibilityCheck | null) => {
    if (!check || !check.isMentioned) return <Text as="span" tone="subdued">-</Text>;
    if (check.responseQuality === 'good') return <Badge tone="success">{t.positive}</Badge>;
    if (check.responseQuality === 'partial') return <Badge tone="attention">{t.neutral}</Badge>;
    return <Badge tone="info">{t.neutral}</Badge>;
  };

  // View session from history
  const viewSession = (session: HistorySession) => {
    setSelectedSession(session);
    setCurrentResults(session.checks);
    setCustomQuery(session.query);
  };

  // Show authentication error
  if (shopDetectionFailed) {
    return <NotAuthenticated error={shopError} />;
  }

  // Loading state
  if (loading || shopLoading) {
    return (
      <Page title={t.title}>
        <Layout>
          <Layout.Section>
            <Card>
              <Box padding="600">
                <BlockStack gap="400" inlineAlign="center">
                  <Spinner size="large" />
                  <Text as="p">{t.loading}</Text>
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
      title={t.title}
      subtitle={t.subtitle}
    >
      <AdminNav locale={locale} />
      <PageBanner pageKey="visibility" />
      <Layout>
        {/* Error Banner */}
        {error && (
          <Layout.Section>
            <Banner tone="critical" onDismiss={() => setError(null)}>
              <p>{error}</p>
            </Banner>
          </Layout.Section>
        )}

        {/* Query Input Section */}
        <Layout.Section>
          <Card>
            <BlockStack gap="500">
              {/* Search term - what are we looking for? */}
              <BlockStack gap="300">
                <InlineStack gap="200" blockAlign="center">
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Text as="span" variant="headingSm">🎯</Text>
                  </div>
                  <Text as="h2" variant="headingMd">{t.searchTermLabel}</Text>
                </InlineStack>
                <Text as="p" variant="bodySm" tone="subdued">{t.searchTermHelp}</Text>
                <Box maxWidth="400px">
                  <TextField
                    label=""
                    labelHidden
                    placeholder={t.searchTermPlaceholder}
                    value={searchTerm || brandName}
                    onChange={setSearchTerm}
                    autoComplete="off"
                    connectedLeft={
                      <div style={{
                        padding: '8px 12px',
                        background: '#F0F9FF',
                        borderRadius: '8px 0 0 8px',
                        color: '#0EA5E9',
                        fontWeight: '600',
                        fontSize: '14px'
                      }}>
                        {t.lookingFor}
                      </div>
                    }
                  />
                </Box>
              </BlockStack>

              <Divider />

              {/* Query input */}
              <BlockStack gap="300">
                <InlineStack gap="200" blockAlign="center">
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #0A1628 0%, #1E3A5F 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Text as="span" variant="headingSm">💬</Text>
                  </div>
                  <Text as="h2" variant="headingMd">{t.query}</Text>
                </InlineStack>
                <Box maxWidth="700px">
                  <TextField
                    label=""
                    labelHidden
                    placeholder={locale === 'fr'
                      ? 'Ex: Quel est le meilleur savon bio ?'
                      : 'E.g.: What is the best organic soap?'}
                    value={customQuery}
                    onChange={setCustomQuery}
                    autoComplete="off"
                    multiline={2}
                  />
                </Box>
                <div style={{ display: 'inline-block' }}>
                  <button
                    onClick={() => runCheck(customQuery)}
                    disabled={!customQuery.trim() || !searchTerm.trim() || checking}
                    style={{
                      background: (!customQuery.trim() || !searchTerm.trim() || checking)
                        ? '#E0F2FE'
                        : 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)',
                      color: (!customQuery.trim() || !searchTerm.trim() || checking)
                        ? '#64748B'
                        : 'white',
                      border: 'none',
                      padding: '14px 28px',
                      borderRadius: '10px',
                      fontWeight: '600',
                      fontSize: '16px',
                      cursor: (!customQuery.trim() || !searchTerm.trim() || checking) ? 'not-allowed' : 'pointer',
                      boxShadow: (!customQuery.trim() || !searchTerm.trim() || checking)
                        ? 'none'
                        : '0 4px 14px rgba(14, 165, 233, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {checking ? (
                      <>
                        <Spinner size="small" />
                        {t.testing}
                      </>
                    ) : (
                      <>
                        <Icon source={SearchIcon} />
                        {t.test}
                      </>
                    )}
                  </button>
                </div>
              </BlockStack>

              <Divider />

              {/* Query suggestions - click to fill, not to run */}
              <BlockStack gap="200">
                <Text as="span" variant="bodySm" tone="subdued">💡 {t.suggestions}:</Text>
                <InlineStack gap="200" wrap>
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setCustomQuery(s.query)}
                      disabled={checking}
                      style={{
                        background: '#F0F9FF',
                        color: '#0A1628',
                        border: '1px solid #E0F2FE',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        cursor: checking ? 'not-allowed' : 'pointer',
                        opacity: checking ? 0.5 : 1,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </InlineStack>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Score Card - Only show if we have results */}
        {currentResults.length > 0 && (
          <Layout.Section>
            <Card>
              <div style={{
                background: score.percentage >= 50
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(14, 165, 233, 0.1) 100%)'
                  : score.percentage > 0
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(14, 165, 233, 0.1) 100%)'
                    : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(14, 165, 233, 0.1) 100%)',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <BlockStack gap="300">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="h2" variant="headingMd">{t.score}</Text>
                    <InlineStack gap="300" blockAlign="center">
                      {/* Large Score Display */}
                      <div style={{
                        fontFamily: 'monospace',
                        fontSize: '48px',
                        fontWeight: '700',
                        background: score.percentage >= 50
                          ? 'linear-gradient(135deg, #10B981 0%, #0EA5E9 100%)'
                          : score.percentage > 0
                            ? 'linear-gradient(135deg, #F59E0B 0%, #0EA5E9 100%)'
                            : 'linear-gradient(135deg, #EF4444 0%, #0EA5E9 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        lineHeight: '1'
                      }}>
                        {score.mentioned}/{score.total}
                      </div>
                      <Badge
                        tone={score.percentage >= 50 ? 'success' : score.percentage > 0 ? 'warning' : 'critical'}
                        size="large"
                      >
                        {`${score.percentage}%`}
                      </Badge>
                    </InlineStack>
                  </InlineStack>
                  <ProgressBar
                    progress={score.percentage}
                    tone={score.percentage >= 50 ? 'success' : score.percentage > 0 ? 'highlight' : 'critical'}
                    size="medium"
                  />
                  <Text as="p" variant="bodySm" tone="subdued">
                    {locale === 'fr'
                      ? `Votre marque "${searchTerm || brandName}" a été mentionnée par ${score.mentioned} plateformes IA sur ${score.total} testées.`
                      : `Your brand "${searchTerm || brandName}" was mentioned by ${score.mentioned} out of ${score.total} AI platforms tested.`}
                  </Text>
                </BlockStack>
              </div>
            </Card>
          </Layout.Section>
        )}

        {/* Results Table */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <BlockStack gap="200">
                <InlineStack align="space-between" blockAlign="center">
                  <InlineStack gap="200" blockAlign="center">
                    <Text as="h2" variant="headingMd">{t.results}</Text>
                    {/* Show session ID when viewing from history */}
                    {selectedSession && sessions.length > 0 && (
                      <Badge tone="success">
                        {`#${sessions.length - sessions.findIndex(s => s.sessionId === selectedSession.sessionId)}`}
                      </Badge>
                    )}
                  </InlineStack>
                  {/* Show date when viewing from history */}
                  {selectedSession && (
                    <Badge tone="info">
                      {new Date(selectedSession.checkedAt).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Badge>
                  )}
                </InlineStack>
                {/* Show what we're looking for */}
                {(searchTerm || brandName) && (
                  <InlineStack gap="200" blockAlign="center">
                    <Text as="span" tone="subdued">{t.lookingFor}:</Text>
                    <Badge tone="info">{searchTerm || brandName}</Badge>
                  </InlineStack>
                )}
                {currentResults.length > 0 && currentResults[0]?.query && (
                  <Text as="p" variant="bodySm" tone="subdued">
                    Question: &quot;{currentResults[0].query.substring(0, 80)}{currentResults[0].query.length > 80 ? '...' : ''}&quot;
                  </Text>
                )}
              </BlockStack>
              <Divider />

              {/* Table Header - Hidden on mobile via CSS */}
              <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                <div className="platform-grid platform-grid-header">
                  <Text as="span" variant="bodySm" fontWeight="bold">{t.platform}</Text>
                  <Text as="span" variant="bodySm" fontWeight="bold">{t.status}</Text>
                  <Text as="span" variant="bodySm" fontWeight="bold">{t.position}</Text>
                  <Text as="span" variant="bodySm" fontWeight="bold">{t.sentiment}</Text>
                  <Text as="span" variant="bodySm" fontWeight="bold">{t.action}</Text>
                </div>
              </Box>

              {/* Platform rows */}
              <BlockStack gap="100">
                {(Object.entries(PLATFORMS) as [Platform, typeof PLATFORMS[Platform]][]).map(([key, platform]) => {
                  const check = resultsByPlatform[key];
                  const isChecking = checkingPlatforms.has(key);
                  const isMentioned = check?.isMentioned === true;

                  return (
                    <Box
                      key={key}
                      padding="300"
                      borderWidth="025"
                      borderColor={isMentioned ? 'border-success' : check && !isMentioned ? 'border-critical' : 'border'}
                      borderRadius="200"
                      background={isMentioned ? 'bg-surface-success' : check && !isMentioned ? 'bg-surface-critical' : 'bg-surface'}
                    >
                      <div className="platform-grid">
                        {/* Platform */}
                        <InlineStack gap="200" blockAlign="center">
                          <Text as="span" variant="headingMd">{platform.icon}</Text>
                          <BlockStack gap="0">
                            <Text as="span" fontWeight="semibold">{platform.displayName}</Text>
                            {platform.free && <Badge tone="success" size="small">Free</Badge>}
                          </BlockStack>
                        </InlineStack>

                        {/* Status */}
                        <div>
                          {isChecking ? (
                            <InlineStack gap="100" blockAlign="center">
                              <Spinner size="small" />
                              <Text as="span" variant="bodySm" tone="subdued">...</Text>
                            </InlineStack>
                          ) : (
                            getStatusBadge(check)
                          )}
                        </div>

                        {/* Position */}
                        <div>
                          {check?.position ? (
                            <Badge tone="info">{`#${check.position}`}</Badge>
                          ) : (
                            <Text as="span" tone="subdued">-</Text>
                          )}
                        </div>

                        {/* Sentiment */}
                        <div>
                          {getSentimentBadge(check)}
                        </div>

                        {/* Action */}
                        <div>
                          <Button
                            size="slim"
                            onClick={() => {
                              if (check) {
                                setSelectedCheck(check);
                                setModalOpen(true);
                              }
                            }}
                            disabled={!check || isChecking}
                          >
                            {t.details}
                          </Button>
                        </div>
                      </div>
                    </Box>
                  );
                })}
              </BlockStack>

              {/* Checking indicator */}
              {checking && (
                <Banner tone="info">
                  <InlineStack gap="200" blockAlign="center">
                    <Spinner size="small" />
                    <Text as="span">
                      {locale === 'fr'
                        ? `Test en cours sur ${Object.keys(PLATFORMS).length} plateformes...`
                        : `Testing on ${Object.keys(PLATFORMS).length} platforms...`}
                    </Text>
                  </InlineStack>
                </Banner>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Competitors Section */}
        {allCompetitors.length > 0 && (
          <Layout.Section>
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">{t.competitors}</Text>
                <InlineStack gap="200" wrap>
                  {allCompetitors.map(([name, count]) => (
                    <Badge key={name} tone="attention">
                      {`${name} (${count}x)`}
                    </Badge>
                  ))}
                </InlineStack>
                <Text as="p" variant="bodySm" tone="subdued">{t.competitorsDesc}</Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

        {/* History Section with Collapsible */}
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              {/* Collapsible Header */}
              <InlineStack align="space-between" blockAlign="center">
                <InlineStack gap="200" blockAlign="center">
                  <Icon source={ClockIcon} tone="subdued" />
                  <Text as="h2" variant="headingMd">{t.history}</Text>
                  {sessions.length > 0 && (
                    <Badge tone="info" size="small">{`${sessions.length}`}</Badge>
                  )}
                </InlineStack>
                <Button
                  variant="plain"
                  onClick={() => setHistoryOpen(!historyOpen)}
                  icon={historyOpen ? ChevronUpIcon : ChevronDownIcon}
                  accessibilityLabel={historyOpen ? 'Collapse' : 'Expand'}
                />
              </InlineStack>

              <Collapsible
                open={historyOpen}
                id="history-collapsible"
                transition={{ duration: '200ms', timingFunction: 'ease-in-out' }}
              >
                <BlockStack gap="300">
                  <Divider />
                  {sessions.length === 0 ? (
                    <Box padding="400">
                      <Text as="p" tone="subdued" alignment="center">{t.noHistory}</Text>
                    </Box>
                  ) : (
                    <BlockStack gap="200">
                      {sessions.map((session, index) => {
                        const isSelected = selectedSession?.sessionId === session.sessionId;
                        const isLatest = index === 0 && !selectedSession;
                        const date = new Date(session.checkedAt);
                        const formattedDate = date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                          day: 'numeric',
                          month: 'short',
                        });
                        const formattedTime = date.toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        return (
                          <Box
                            key={session.sessionId}
                            padding="300"
                            background={isSelected ? 'bg-surface-selected' : isLatest ? 'bg-surface-info' : 'bg-surface-secondary'}
                            borderRadius="200"
                            borderWidth="025"
                            borderColor={isSelected ? 'border-success' : isLatest ? 'border-info' : 'border'}
                          >
                            <InlineStack align="space-between" blockAlign="center">
                              <BlockStack gap="100">
                                {/* Session ID badge for reference */}
                                <InlineStack gap="200" blockAlign="center">
                                  <Badge tone={isLatest ? 'info' : undefined} size="small">
                                    {`#${sessions.length - index}`}
                                  </Badge>
                                  {isLatest && (
                                    <Badge tone="success" size="small">
                                      {locale === 'fr' ? 'Dernier' : 'Latest'}
                                    </Badge>
                                  )}
                                </InlineStack>
                                <Text as="span" variant="bodyMd" fontWeight="semibold">
                                  &quot;{session.query.length > 50 ? session.query.substring(0, 50) + '...' : session.query}&quot;
                                </Text>
                                <InlineStack gap="200" blockAlign="center">
                                  <Text as="span" variant="bodySm" tone="subdued">
                                    {formattedDate} • {formattedTime}
                                  </Text>
                                  <Badge
                                    tone={session.summary.percentage >= 50 ? 'success' : session.summary.percentage > 0 ? 'warning' : 'critical'}
                                    size="small"
                                  >
                                    {`${session.summary.mentioned}/${session.summary.total} (${session.summary.percentage}%)`}
                                  </Badge>
                                </InlineStack>
                              </BlockStack>
                              <Button
                                size="slim"
                                onClick={() => viewSession(session)}
                                variant={isSelected ? 'primary' : undefined}
                              >
                                {isSelected
                                  ? (locale === 'fr' ? 'Sélectionné' : 'Selected')
                                  : (locale === 'fr' ? 'Voir' : 'View')}
                              </Button>
                            </InlineStack>
                          </Box>
                        );
                      })}
                    </BlockStack>
                  )}
                </BlockStack>
              </Collapsible>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      {/* Detail Modal */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedCheck(null);
        }}
        title={selectedCheck ? `${PLATFORMS[selectedCheck.platform]?.icon} ${PLATFORMS[selectedCheck.platform]?.displayName}` : 'Details'}
        size="large"
      >
        <Modal.Section>
          {selectedCheck && (
            <BlockStack gap="400">
              {/* Query */}
              <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                <BlockStack gap="100">
                  <Text as="span" variant="bodySm" tone="subdued">{t.query}:</Text>
                  <Text as="p" fontWeight="semibold">&quot;{selectedCheck.query}&quot;</Text>
                </BlockStack>
              </Box>

              {/* Result Summary */}
              <InlineStack gap="400" wrap>
                <BlockStack gap="100">
                  <Text as="span" variant="bodySm" tone="subdued">{t.status}</Text>
                  {getStatusBadge(selectedCheck)}
                </BlockStack>
                {selectedCheck.position && (
                  <BlockStack gap="100">
                    <Text as="span" variant="bodySm" tone="subdued">{t.position}</Text>
                    <Badge tone="info">{`#${selectedCheck.position}`}</Badge>
                  </BlockStack>
                )}
                <BlockStack gap="100">
                  <Text as="span" variant="bodySm" tone="subdued">{t.sentiment}</Text>
                  {getSentimentBadge(selectedCheck)}
                </BlockStack>
                <BlockStack gap="100">
                  <Text as="span" variant="bodySm" tone="subdued">{t.checkedOn}</Text>
                  <Text as="p" variant="bodySm">
                    {new Date(selectedCheck.checkedAt).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US')}
                  </Text>
                </BlockStack>
              </InlineStack>

              {/* Mention Context */}
              {selectedCheck.isMentioned && selectedCheck.mentionContext && (
                <Box padding="300" background="bg-surface-success" borderRadius="200">
                  <BlockStack gap="200">
                    <Badge tone="success">{t.mentioned}</Badge>
                    <Text as="p" variant="bodySm">
                      &quot;...{highlightTerms(selectedCheck.mentionContext, [searchTerm || brandName, selectedCheck.query])}...&quot;
                    </Text>
                  </BlockStack>
                </Box>
              )}

              {!selectedCheck.isMentioned && (
                <Box padding="300" background="bg-surface-critical" borderRadius="200">
                  <Text as="p" fontWeight="semibold">{t.absent}</Text>
                </Box>
              )}

              {/* Competitors */}
              {selectedCheck.competitorsFound && selectedCheck.competitorsFound.length > 0 && (
                <BlockStack gap="200">
                  <Text as="span" variant="bodySm" tone="subdued">{t.competitors}:</Text>
                  <InlineStack gap="100" wrap>
                    {selectedCheck.competitorsFound.map((c) => (
                      <Badge key={c.name} tone="attention">{c.name}</Badge>
                    ))}
                  </InlineStack>
                </BlockStack>
              )}

              <Divider />

              {/* Full Response */}
              <BlockStack gap="200">
                <Text as="h4" variant="headingSm">{t.fullResponse}</Text>
                <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                  <Scrollable style={{ maxHeight: '300px' }}>
                    <Text as="p" variant="bodyMd">
                      {selectedCheck.rawResponse
                        ? highlightTerms(selectedCheck.rawResponse, [searchTerm || brandName, selectedCheck.query])
                        : (locale === 'fr' ? 'Réponse non disponible' : 'Response not available')}
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
