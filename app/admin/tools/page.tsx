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
  Checkbox,
  TextField,
  Banner,
  SkeletonBodyText,
  Box,
  Divider,
  Icon,
  Modal,
} from '@shopify/polaris';
import {
  ClipboardIcon,
  RefreshIcon,
  CheckCircleIcon,
  StarFilledIcon,
} from '@shopify/polaris-icons';
import { useAuthenticatedFetch } from '@/components/providers/ShopProvider';

// AI services that can access your store
const AI_SERVICES = [
  { id: 'ChatGPT-User', name: 'ChatGPT', icon: '🤖' },
  { id: 'GPTBot', name: 'OpenAI', icon: '🧠' },
  { id: 'ClaudeBot', name: 'Claude', icon: '🎭' },
  { id: 'PerplexityBot', name: 'Perplexity', icon: '🔍' },
  { id: 'Google-Extended', name: 'Google Gemini', icon: '✨' },
  { id: 'Amazonbot', name: 'Alexa', icon: '🔊' },
  { id: 'Meta-ExternalAgent', name: 'Meta AI', icon: '📘' },
];

interface AiGuideConfig {
  isEnabled: boolean;
  allowedBots: string[];
  includeProducts: boolean;
  includeCollections: boolean;
  customInstructions: string | null;
  lastGeneratedAt: string | null;
}

interface StructuredDataConfig {
  isEnabled: boolean;
  includeOrganization: boolean;
  includeProducts: boolean;
  includeBreadcrumbs: boolean;
  lastGeneratedAt: string | null;
}

interface StructuredDataPreview {
  organization: object;
  products: object[];
  breadcrumbs: object;
}

type ToolType = 'llms' | 'jsonld';

export default function ToolsPage() {
  const { fetch } = useAuthenticatedFetch();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedTool, setSelectedTool] = useState<ToolType>('llms');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // AI Guide (llms.txt) state
  const [, setAiGuideConfig] = useState<AiGuideConfig | null>(null);
  const [aiGuidePreview, setAiGuidePreview] = useState('');
  const [aiGuideEnabled, setAiGuideEnabled] = useState(true);
  const [allowedServices, setAllowedServices] = useState<string[]>([]);
  const [includeProducts, setIncludeProducts] = useState(true);
  const [includeCollections, setIncludeCollections] = useState(true);
  const [customInstructions, setCustomInstructions] = useState('');

  // Structured Data (JSON-LD) state
  const [, setStructuredDataConfig] = useState<StructuredDataConfig | null>(null);
  const [structuredDataPreview, setStructuredDataPreview] = useState<StructuredDataPreview | null>(null);
  const [structuredDataEnabled, setStructuredDataEnabled] = useState(true);
  const [includeOrganization, setIncludeOrganization] = useState(true);
  const [includeProductSchema, setIncludeProductSchema] = useState(true);
  const [includeBreadcrumbs, setIncludeBreadcrumbs] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [aiGuideRes, structuredDataRes] = await Promise.all([
        fetch('/api/llms-txt'),
        fetch('/api/json-ld'),
      ]);

      const aiGuideData = await aiGuideRes.json();
      if (aiGuideData.success) {
        setAiGuideConfig(aiGuideData.data.config);
        setAiGuidePreview(aiGuideData.data.preview || '');
        setAiGuideEnabled(aiGuideData.data.config.isEnabled);
        setAllowedServices(aiGuideData.data.config.allowedBots || []);
        setIncludeProducts(aiGuideData.data.config.includeProducts);
        setIncludeCollections(aiGuideData.data.config.includeCollections);
        setCustomInstructions(aiGuideData.data.config.customInstructions || '');
      }

      const structuredDataData = await structuredDataRes.json();
      if (structuredDataData.success) {
        setStructuredDataConfig(structuredDataData.data.config);
        setStructuredDataPreview(structuredDataData.data.preview);
        setStructuredDataEnabled(structuredDataData.data.config.isEnabled);
        setIncludeOrganization(structuredDataData.data.config.includeOrganization);
        setIncludeProductSchema(structuredDataData.data.config.includeProducts);
        setIncludeBreadcrumbs(structuredDataData.data.config.includeBreadcrumbs);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [fetch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveAiGuide = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/llms-txt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isEnabled: aiGuideEnabled,
          allowedBots: allowedServices,
          includeProducts,
          includeCollections,
          customInstructions: customInstructions || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAiGuideConfig(data.data.config);
        setAiGuidePreview(data.data.content || '');
        setSuccess('Fichier llms.txt généré avec succès !');
      } else {
        setError(data.error || 'Failed to save');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStructuredData = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/json-ld', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isEnabled: structuredDataEnabled,
          includeOrganization,
          includeProducts: includeProductSchema,
          includeBreadcrumbs,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStructuredDataConfig(data.data.config);
        await loadData();
        setSuccess('Schémas JSON-LD générés avec succès !');
      } else {
        setError(data.error || 'Failed to save');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy');
    }
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleService = (serviceId: string) => {
    setAllowedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((s) => s !== serviceId)
        : [...prev, serviceId]
    );
  };

  const getStructuredDataContent = () => {
    if (!structuredDataPreview) return '';
    const schemas: string[] = [];

    if (includeOrganization && structuredDataPreview.organization) {
      schemas.push(`<script type="application/ld+json">\n${JSON.stringify(structuredDataPreview.organization, null, 2)}\n</script>`);
    }
    if (includeBreadcrumbs && structuredDataPreview.breadcrumbs) {
      schemas.push(`<script type="application/ld+json">\n${JSON.stringify(structuredDataPreview.breadcrumbs, null, 2)}\n</script>`);
    }
    if (includeProductSchema && structuredDataPreview.products) {
      structuredDataPreview.products.forEach((product) => {
        schemas.push(`<script type="application/ld+json">\n${JSON.stringify(product, null, 2)}\n</script>`);
      });
    }

    return schemas.join('\n\n');
  };

  if (loading) {
    return (
      <Page title="Outils IA" backAction={{ content: 'Accueil', url: '/admin' }}>
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

  return (
    <Page
      title="Outils IA"
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

        {success && (
          <Layout.Section>
            <Banner tone="success" onDismiss={() => setSuccess(null)}>
              {success}
            </Banner>
          </Layout.Section>
        )}

        {/* Tool Selection Cards */}
        <Layout.Section>
          <BlockStack gap="400">
            {/* Tool Selector */}
            <InlineStack gap="400" wrap>
              {/* llms.txt Card */}
              <div style={{ flex: 1, minWidth: '280px' }}>
                <div
                  onClick={() => setSelectedTool('llms')}
                  style={{
                    cursor: 'pointer',
                    border: selectedTool === 'llms' ? '2px solid #5c6ac4' : '2px solid transparent',
                    borderRadius: '12px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Card>
                    <BlockStack gap="400">
                      <InlineStack align="space-between" blockAlign="start">
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px',
                          }}
                        >
                          📄
                        </div>
                        {selectedTool === 'llms' && (
                          <Badge tone="info">Sélectionné</Badge>
                        )}
                      </InlineStack>
                      <BlockStack gap="200">
                        <Text as="h2" variant="headingMd">Fichier llms.txt</Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          Dites aux IA qui vous êtes et ce que vous vendez
                        </Text>
                      </BlockStack>
                      <Box
                        padding="300"
                        background="bg-surface-secondary"
                        borderRadius="200"
                      >
                        <BlockStack gap="100">
                          <InlineStack gap="100" blockAlign="center">
                            <Icon source={StarFilledIcon} tone="warning" />
                            <Text as="p" variant="bodySm" fontWeight="semibold">
                              Pourquoi c&apos;est important
                            </Text>
                          </InlineStack>
                          <Text as="p" variant="bodySm" tone="subdued">
                            Quand un client demande à ChatGPT &quot;où acheter X ?&quot;,
                            ce fichier aide l&apos;IA à recommander votre boutique.
                          </Text>
                        </BlockStack>
                      </Box>
                    </BlockStack>
                  </Card>
                </div>
              </div>

              {/* JSON-LD Card */}
              <div style={{ flex: 1, minWidth: '280px' }}>
                <div
                  onClick={() => setSelectedTool('jsonld')}
                  style={{
                    cursor: 'pointer',
                    border: selectedTool === 'jsonld' ? '2px solid #5c6ac4' : '2px solid transparent',
                    borderRadius: '12px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Card>
                    <BlockStack gap="400">
                      <InlineStack align="space-between" blockAlign="start">
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px',
                          }}
                        >
                          🏷️
                        </div>
                        {selectedTool === 'jsonld' && (
                          <Badge tone="info">Sélectionné</Badge>
                        )}
                      </InlineStack>
                      <BlockStack gap="200">
                        <Text as="h2" variant="headingMd">Schémas JSON-LD</Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          Affichez prix et avis directement dans Google
                        </Text>
                      </BlockStack>
                      <Box
                        padding="300"
                        background="bg-surface-secondary"
                        borderRadius="200"
                      >
                        <BlockStack gap="100">
                          <InlineStack gap="100" blockAlign="center">
                            <Icon source={StarFilledIcon} tone="warning" />
                            <Text as="p" variant="bodySm" fontWeight="semibold">
                              Pourquoi c&apos;est important
                            </Text>
                          </InlineStack>
                          <Text as="p" variant="bodySm" tone="subdued">
                            Vos produits apparaissent avec prix, stock et étoiles
                            directement dans les résultats Google.
                          </Text>
                        </BlockStack>
                      </Box>
                    </BlockStack>
                  </Card>
                </div>
              </div>
            </InlineStack>
          </BlockStack>
        </Layout.Section>

        {/* Configuration Section */}
        <Layout.Section>
          {selectedTool === 'llms' ? (
            <Card>
              <BlockStack gap="600">
                {/* Header with value proposition */}
                <BlockStack gap="300">
                  <InlineStack align="space-between" blockAlign="center">
                    <InlineStack gap="300" blockAlign="center">
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                        }}
                      >
                        📄
                      </div>
                      <BlockStack gap="100">
                        <Text as="h2" variant="headingLg">Générateur llms.txt</Text>
                        <Text as="p" tone="subdued">
                          Créez votre carte de visite pour les intelligences artificielles
                        </Text>
                      </BlockStack>
                    </InlineStack>
                    <Badge tone={aiGuideEnabled ? 'success' : 'attention'}>
                      {aiGuideEnabled ? 'Actif' : 'Inactif'}
                    </Badge>
                  </InlineStack>
                </BlockStack>

                {/* What is it - Simple explanation */}
                <Box
                  padding="400"
                  background="bg-surface-secondary"
                  borderRadius="300"
                >
                  <BlockStack gap="300">
                    <Text as="h3" variant="headingSm">
                      💡 Comment ça marche ?
                    </Text>
                    <Text as="p" variant="bodyMd">
                      Le fichier <strong>llms.txt</strong> est comme un CV pour votre boutique.
                      Quand quelqu&apos;un demande à une IA &quot;où acheter des chaussures de running ?&quot;,
                      l&apos;IA consulte ce fichier pour savoir si vous êtes pertinent et comment vous présenter.
                    </Text>
                    <InlineStack gap="400" wrap>
                      <InlineStack gap="100" blockAlign="center">
                        <Icon source={CheckCircleIcon} tone="success" />
                        <Text as="span" variant="bodySm">Plus de recommandations IA</Text>
                      </InlineStack>
                      <InlineStack gap="100" blockAlign="center">
                        <Icon source={CheckCircleIcon} tone="success" />
                        <Text as="span" variant="bodySm">Trafic gratuit et qualifié</Text>
                      </InlineStack>
                      <InlineStack gap="100" blockAlign="center">
                        <Icon source={CheckCircleIcon} tone="success" />
                        <Text as="span" variant="bodySm">Contrôle de votre image</Text>
                      </InlineStack>
                    </InlineStack>
                  </BlockStack>
                </Box>

                <Divider />

                {/* Enable toggle */}
                <Checkbox
                  label="Activer le fichier llms.txt"
                  helpText="Les IA pourront découvrir et recommander votre boutique"
                  checked={aiGuideEnabled}
                  onChange={setAiGuideEnabled}
                />

                {/* AI Services - Simplified */}
                <BlockStack gap="300">
                  <Text as="h3" variant="headingSm">
                    Quelles IA peuvent vous recommander ?
                  </Text>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: '8px'
                  }}>
                    {AI_SERVICES.map((service) => (
                      <div
                        key={service.id}
                        onClick={() => aiGuideEnabled && toggleService(service.id)}
                        style={{
                          padding: '12px',
                          borderRadius: '8px',
                          border: allowedServices.includes(service.id)
                            ? '2px solid #5c6ac4'
                            : '2px solid #e1e3e5',
                          background: allowedServices.includes(service.id)
                            ? '#f4f5fa'
                            : 'white',
                          cursor: aiGuideEnabled ? 'pointer' : 'not-allowed',
                          opacity: aiGuideEnabled ? 1 : 0.5,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <InlineStack gap="200" blockAlign="center">
                          <span style={{ fontSize: '18px' }}>{service.icon}</span>
                          <Text as="span" variant="bodySm" fontWeight={allowedServices.includes(service.id) ? 'semibold' : 'regular'}>
                            {service.name}
                          </Text>
                        </InlineStack>
                      </div>
                    ))}
                  </div>
                </BlockStack>

                <Divider />

                {/* Content Settings - Simplified */}
                <BlockStack gap="300">
                  <Text as="h3" variant="headingSm">Que partager avec les IA ?</Text>
                  <InlineStack gap="400" wrap>
                    <Checkbox
                      label="Vos produits"
                      checked={includeProducts}
                      onChange={setIncludeProducts}
                      disabled={!aiGuideEnabled}
                    />
                    <Checkbox
                      label="Vos collections"
                      checked={includeCollections}
                      onChange={setIncludeCollections}
                      disabled={!aiGuideEnabled}
                    />
                  </InlineStack>
                </BlockStack>

                {/* Custom Instructions */}
                <TextField
                  label="Message personnalisé (optionnel)"
                  helpText="Ajoutez ce qui vous rend unique : livraison gratuite, fait main, made in France..."
                  value={customInstructions}
                  onChange={setCustomInstructions}
                  multiline={2}
                  autoComplete="off"
                  disabled={!aiGuideEnabled}
                  placeholder="Ex: Livraison gratuite dès 50€. Tous nos produits sont fabriqués en France."
                />

                <Divider />

                {/* Preview */}
                <BlockStack gap="300">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="h3" variant="headingSm">Aperçu du fichier</Text>
                    <InlineStack gap="200">
                      <Button
                        icon={ClipboardIcon}
                        onClick={() => handleCopy(aiGuidePreview)}
                        disabled={!aiGuidePreview}
                        size="slim"
                      >
                        {copied ? 'Copié !' : 'Copier'}
                      </Button>
                      <Button
                        onClick={() => handleDownload(aiGuidePreview, 'llms.txt')}
                        disabled={!aiGuidePreview}
                        size="slim"
                        variant="primary"
                      >
                        Télécharger
                      </Button>
                    </InlineStack>
                  </InlineStack>
                  <Box
                    padding="400"
                    background="bg-surface-secondary"
                    borderRadius="200"
                  >
                    <pre
                      style={{
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        maxHeight: '200px',
                        overflow: 'auto',
                        color: '#374151',
                      }}
                    >
                      {aiGuidePreview || 'Cliquez sur "Générer" pour créer votre fichier'}
                    </pre>
                  </Box>
                </BlockStack>

                {/* Generate Button */}
                <Button
                  variant="primary"
                  onClick={handleSaveAiGuide}
                  loading={saving}
                  size="large"
                >
                  Générer mon fichier llms.txt
                </Button>

                {/* Installation Steps - Clean and clear */}
                <Box
                  padding="400"
                  background="bg-surface-info"
                  borderRadius="300"
                >
                  <BlockStack gap="300">
                    <Text as="h3" variant="headingSm">
                      📥 Installation en 3 étapes
                    </Text>
                    <BlockStack gap="200">
                      <InlineStack gap="300" blockAlign="start">
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: '#5c6ac4',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          flexShrink: 0,
                        }}>1</div>
                        <Text as="p" variant="bodyMd">Téléchargez le fichier ci-dessus</Text>
                      </InlineStack>
                      <InlineStack gap="300" blockAlign="start">
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: '#5c6ac4',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          flexShrink: 0,
                        }}>2</div>
                        <Text as="p" variant="bodyMd">
                          Allez dans <strong>Shopify → Boutique en ligne → Thèmes → Modifier le code</strong>
                        </Text>
                      </InlineStack>
                      <InlineStack gap="300" blockAlign="start">
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: '#5c6ac4',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          flexShrink: 0,
                        }}>3</div>
                        <Text as="p" variant="bodyMd">
                          Uploadez dans le dossier <strong>Assets</strong> sous le nom <strong>llms.txt</strong>
                        </Text>
                      </InlineStack>
                    </BlockStack>
                  </BlockStack>
                </Box>
              </BlockStack>
            </Card>
          ) : (
            <Card>
              <BlockStack gap="600">
                {/* Header with value proposition */}
                <BlockStack gap="300">
                  <InlineStack align="space-between" blockAlign="center">
                    <InlineStack gap="300" blockAlign="center">
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                        }}
                      >
                        🏷️
                      </div>
                      <BlockStack gap="100">
                        <Text as="h2" variant="headingLg">Générateur JSON-LD</Text>
                        <Text as="p" tone="subdued">
                          Faites briller vos produits dans les résultats Google
                        </Text>
                      </BlockStack>
                    </InlineStack>
                    <Badge tone={structuredDataEnabled ? 'success' : 'attention'}>
                      {structuredDataEnabled ? 'Actif' : 'Inactif'}
                    </Badge>
                  </InlineStack>
                </BlockStack>

                {/* What is it - Visual example */}
                <Box
                  padding="400"
                  background="bg-surface-secondary"
                  borderRadius="300"
                >
                  <BlockStack gap="300">
                    <Text as="h3" variant="headingSm">
                      💡 Qu&apos;est-ce que ça change ?
                    </Text>
                    <Text as="p" variant="bodyMd">
                      Les <strong>schémas JSON-LD</strong> transforment vos résultats Google.
                      Au lieu d&apos;un simple lien, vos produits affichent le prix, la disponibilité et les avis clients
                      directement dans la recherche.
                    </Text>

                    {/* Visual comparison */}
                    <InlineStack gap="400" wrap>
                      <Box
                        padding="300"
                        background="bg-surface"
                        borderRadius="200"
                        minWidth="200px"
                      >
                        <BlockStack gap="100">
                          <Text as="p" variant="bodySm" tone="subdued">❌ Sans JSON-LD</Text>
                          <Text as="p" variant="bodySm" fontWeight="semibold">Chaussures Running - Ma Boutique</Text>
                          <Text as="p" variant="bodySm" tone="subdued">www.maboutique.com/chaussures</Text>
                        </BlockStack>
                      </Box>
                      <Box
                        padding="300"
                        background="bg-surface"
                        borderRadius="200"
                        minWidth="200px"
                      >
                        <BlockStack gap="100">
                          <Text as="p" variant="bodySm" tone="success">✅ Avec JSON-LD</Text>
                          <Text as="p" variant="bodySm" fontWeight="semibold">Chaussures Running - Ma Boutique</Text>
                          <Text as="p" variant="bodySm">⭐⭐⭐⭐⭐ (127 avis) · 89,00 € · En stock</Text>
                          <Text as="p" variant="bodySm" tone="subdued">www.maboutique.com/chaussures</Text>
                        </BlockStack>
                      </Box>
                    </InlineStack>
                  </BlockStack>
                </Box>

                <Divider />

                {/* Enable toggle */}
                <Checkbox
                  label="Activer les schémas JSON-LD"
                  helpText="Vos produits apparaîtront avec plus de détails dans Google"
                  checked={structuredDataEnabled}
                  onChange={setStructuredDataEnabled}
                />

                {/* Schema Types - Simplified with benefits */}
                <BlockStack gap="300">
                  <Text as="h3" variant="headingSm">Que voulez-vous afficher dans Google ?</Text>
                  <BlockStack gap="200">
                    <Checkbox
                      label="Informations de votre entreprise"
                      helpText="Nom, logo, coordonnées → Renforce la confiance"
                      checked={includeOrganization}
                      onChange={setIncludeOrganization}
                      disabled={!structuredDataEnabled}
                    />
                    <Checkbox
                      label="Détails des produits"
                      helpText="Prix, stock, images → Augmente les clics"
                      checked={includeProductSchema}
                      onChange={setIncludeProductSchema}
                      disabled={!structuredDataEnabled}
                    />
                    <Checkbox
                      label="Fil d'Ariane (breadcrumbs)"
                      helpText="Navigation claire → Meilleur référencement"
                      checked={includeBreadcrumbs}
                      onChange={setIncludeBreadcrumbs}
                      disabled={!structuredDataEnabled}
                    />
                  </BlockStack>
                </BlockStack>

                <Divider />

                {/* Preview */}
                <BlockStack gap="300">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="h3" variant="headingSm">Aperçu du code</Text>
                    <InlineStack gap="200">
                      <Button
                        icon={ClipboardIcon}
                        onClick={() => handleCopy(getStructuredDataContent())}
                        disabled={!structuredDataPreview}
                        size="slim"
                      >
                        {copied ? 'Copié !' : 'Copier'}
                      </Button>
                      <Button
                        onClick={() => setShowPreviewModal(true)}
                        disabled={!structuredDataPreview}
                        size="slim"
                        variant="primary"
                      >
                        Voir le code complet
                      </Button>
                    </InlineStack>
                  </InlineStack>
                  <Box
                    padding="400"
                    background="bg-surface-secondary"
                    borderRadius="200"
                  >
                    <pre
                      style={{
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        maxHeight: '150px',
                        overflow: 'auto',
                        color: '#374151',
                      }}
                    >
                      {structuredDataPreview
                        ? JSON.stringify(structuredDataPreview.organization, null, 2).substring(0, 300) + '...'
                        : 'Cliquez sur "Générer" pour créer vos schémas'}
                    </pre>
                  </Box>
                </BlockStack>

                {/* Generate Button */}
                <Button
                  variant="primary"
                  onClick={handleSaveStructuredData}
                  loading={saving}
                  size="large"
                >
                  Générer mes schémas JSON-LD
                </Button>

                {/* Installation Steps */}
                <Box
                  padding="400"
                  background="bg-surface-info"
                  borderRadius="300"
                >
                  <BlockStack gap="300">
                    <Text as="h3" variant="headingSm">
                      📥 Installation en 3 étapes
                    </Text>
                    <BlockStack gap="200">
                      <InlineStack gap="300" blockAlign="start">
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: '#5c6ac4',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          flexShrink: 0,
                        }}>1</div>
                        <Text as="p" variant="bodyMd">Copiez le code généré</Text>
                      </InlineStack>
                      <InlineStack gap="300" blockAlign="start">
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: '#5c6ac4',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          flexShrink: 0,
                        }}>2</div>
                        <Text as="p" variant="bodyMd">
                          Allez dans <strong>Shopify → Thèmes → Modifier le code → theme.liquid</strong>
                        </Text>
                      </InlineStack>
                      <InlineStack gap="300" blockAlign="start">
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: '#5c6ac4',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          flexShrink: 0,
                        }}>3</div>
                        <Text as="p" variant="bodyMd">
                          Collez juste avant <strong>&lt;/head&gt;</strong>
                        </Text>
                      </InlineStack>
                    </BlockStack>
                    <Banner tone="info">
                      Testez votre code sur <a href="https://search.google.com/test/rich-results" target="_blank" rel="noopener noreferrer" style={{ color: '#5c6ac4' }}>Google Rich Results Test</a>
                    </Banner>
                  </BlockStack>
                </Box>
              </BlockStack>
            </Card>
          )}
        </Layout.Section>
      </Layout>

      {/* Full Preview Modal */}
      <Modal
        open={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="Code JSON-LD complet"
        primaryAction={{
          content: 'Copier tout',
          onAction: () => handleCopy(getStructuredDataContent()),
        }}
        secondaryActions={[
          {
            content: 'Télécharger',
            onAction: () => handleDownload(getStructuredDataContent(), 'structured-data.html'),
          },
        ]}
      >
        <Modal.Section>
          <Box padding="400" background="bg-surface-secondary" borderRadius="200">
            <pre
              style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: 'monospace',
                fontSize: '12px',
                maxHeight: '500px',
                overflow: 'auto',
              }}
            >
              {getStructuredDataContent()}
            </pre>
          </Box>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
