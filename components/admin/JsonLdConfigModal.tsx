'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  BlockStack,
  InlineStack,
  Text,
  Button,
  Checkbox,
  Banner,
  Box,
  Divider,
  Spinner,
  Tabs,
} from '@shopify/polaris';
import { ClipboardIcon } from '@shopify/polaris-icons';
import { useAuthenticatedFetch } from '@/components/providers/ShopProvider';

interface JsonLdConfig {
  isEnabled: boolean;
  includeOrganization: boolean;
  includeProducts: boolean;
  includeBreadcrumbs: boolean;
  excludedProductIds: string[];
  lastGeneratedAt: string | null;
}

interface JsonLdPreview {
  organization: object;
  products: object[];
  breadcrumbs: object;
}

interface JsonLdConfigModalProps {
  open: boolean;
  onClose: () => void;
  locale?: string;
  onConfigChange?: (config: JsonLdConfig) => void;
}

export function JsonLdConfigModal({
  open,
  onClose,
  locale = 'en',
  onConfigChange,
}: JsonLdConfigModalProps) {
  const { fetch } = useAuthenticatedFetch();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<JsonLdConfig | null>(null);
  const [preview, setPreview] = useState<JsonLdPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);

  // Form state
  const [isEnabled, setIsEnabled] = useState(true);
  const [includeOrganization, setIncludeOrganization] = useState(true);
  const [includeProducts, setIncludeProducts] = useState(true);
  const [includeBreadcrumbs, setIncludeBreadcrumbs] = useState(true);

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/json-ld');
      const data = await response.json();

      if (data.success) {
        setConfig(data.data.config);
        setPreview(data.data.preview);

        // Set form state
        setIsEnabled(data.data.config.isEnabled);
        setIncludeOrganization(data.data.config.includeOrganization);
        setIncludeProducts(data.data.config.includeProducts);
        setIncludeBreadcrumbs(data.data.config.includeBreadcrumbs);

        if (data.data.previewError) {
          setError(data.data.previewError);
        }
      } else {
        setError(data.error || 'Failed to load config');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [fetch]);

  useEffect(() => {
    if (open) {
      loadConfig();
    }
  }, [open, loadConfig]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/json-ld', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isEnabled,
          includeOrganization,
          includeProducts,
          includeBreadcrumbs,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setConfig(data.data.config);
        // Reload to get fresh preview
        await loadConfig();
        onConfigChange?.(data.data.config);
      } else {
        setError(data.error || 'Failed to save');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const getJsonLdScript = (schema: object) => {
    return `<script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
</script>`;
  };

  const getAllSchemas = () => {
    if (!preview) return '';
    const schemas: string[] = [];

    if (includeOrganization && preview.organization) {
      schemas.push(getJsonLdScript(preview.organization));
    }
    if (includeBreadcrumbs && preview.breadcrumbs) {
      schemas.push(getJsonLdScript(preview.breadcrumbs));
    }
    if (includeProducts && preview.products) {
      preview.products.forEach((product) => {
        schemas.push(getJsonLdScript(product));
      });
    }

    return schemas.join('\n\n');
  };

  const handleCopy = async (content?: string) => {
    try {
      const textToCopy = content || getAllSchemas();
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  };

  const handleDownload = () => {
    const content = getAllSchemas();
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'json-ld-schemas.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const tabs = [
    {
      id: 'organization',
      content: 'Organization',
      panelID: 'organization-panel',
    },
    {
      id: 'products',
      content: 'Products',
      panelID: 'products-panel',
    },
    {
      id: 'all',
      content: locale === 'fr' ? 'Tous' : 'All',
      panelID: 'all-panel',
    },
  ];

  const getTabContent = () => {
    if (!preview) return locale === 'fr'
      ? 'Cliquez sur "Sauvegarder" pour générer vos schémas'
      : 'Click "Save" to generate your schemas';

    switch (selectedTab) {
      case 0:
        return preview.organization
          ? JSON.stringify(preview.organization, null, 2)
          : locale === 'fr' ? 'Schéma désactivé' : 'Schema disabled';
      case 1:
        return preview.products && preview.products.length > 0
          ? JSON.stringify(preview.products, null, 2)
          : locale === 'fr' ? 'Pas de produits' : 'No products';
      case 2:
        return getAllSchemas() || (locale === 'fr' ? 'Aucun schéma' : 'No schemas');
      default:
        return '';
    }
  };

  const t = {
    title: locale === 'fr' ? 'Configuration JSON-LD' : 'JSON-LD Configuration',
    description: locale === 'fr'
      ? 'JSON-LD est un format de données structurées qui aide les moteurs de recherche et les IA à comprendre votre contenu.'
      : 'JSON-LD is structured data that helps search engines and AI understand your store content.',
    enable: locale === 'fr' ? 'Activer la génération JSON-LD' : 'Enable JSON-LD generation',
    enableHelp: locale === 'fr'
      ? 'Génère des schémas de données structurées pour votre boutique'
      : 'Generate structured data schemas for your store',
    schemaTypes: locale === 'fr' ? 'Types de schémas' : 'Schema Types',
    organization: locale === 'fr' ? 'Schéma Organisation' : 'Organization Schema',
    organizationHelp: locale === 'fr'
      ? 'Informations sur votre entreprise (nom, logo, contact)'
      : 'Business information including name, logo, and contact details',
    products: locale === 'fr' ? 'Schéma Produits' : 'Product Schema',
    productsHelp: locale === 'fr'
      ? 'Détails des produits avec prix, disponibilité et images'
      : 'Product details with prices, availability, and images',
    breadcrumbs: locale === 'fr' ? 'Schéma Fil d\'Ariane' : 'Breadcrumb Schema',
    breadcrumbsHelp: locale === 'fr'
      ? 'Structure de navigation pour un meilleur affichage dans les résultats'
      : 'Navigation structure for better search result display',
    preview: locale === 'fr' ? 'Aperçu' : 'Preview',
    save: locale === 'fr' ? 'Sauvegarder' : 'Save',
    saving: locale === 'fr' ? 'Sauvegarde...' : 'Saving...',
    copy: locale === 'fr' ? 'Copier tout' : 'Copy All',
    copied: locale === 'fr' ? 'Copié!' : 'Copied!',
    download: locale === 'fr' ? 'Télécharger' : 'Download',
    close: locale === 'fr' ? 'Fermer' : 'Close',
    benefits: locale === 'fr' ? 'Avantages' : 'Benefits',
    benefit1: locale === 'fr' ? 'Résultats enrichis Google' : 'Rich Search Results',
    benefit1Desc: locale === 'fr'
      ? 'Affichez prix, notes et disponibilité directement dans Google'
      : 'Display prices, ratings, and availability directly in Google',
    benefit2: locale === 'fr' ? 'Meilleure compréhension IA' : 'Better AI Understanding',
    benefit2Desc: locale === 'fr'
      ? 'Aidez ChatGPT et autres IA à décrire précisément vos produits'
      : 'Help ChatGPT and other AI tools accurately describe your products',
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t.title}
      primaryAction={{
        content: saving ? t.saving : t.save,
        onAction: handleSave,
        loading: saving,
      }}
      secondaryActions={[
        {
          content: t.close,
          onAction: onClose,
        },
      ]}
      size="large"
    >
      <Modal.Section>
        {loading ? (
          <Box padding="800">
            <BlockStack gap="400" inlineAlign="center">
              <Spinner size="large" />
            </BlockStack>
          </Box>
        ) : (
          <BlockStack gap="400">
            {error && (
              <Banner tone="warning" onDismiss={() => setError(null)}>
                {error}
              </Banner>
            )}

            {/* Description */}
            <BlockStack gap="200">
              <Text as="p" tone="subdued">{t.description}</Text>
              <Checkbox
                label={t.enable}
                helpText={t.enableHelp}
                checked={isEnabled}
                onChange={setIsEnabled}
              />
            </BlockStack>

            <Divider />

            {/* Schema Types */}
            <BlockStack gap="300">
              <Text as="h3" variant="headingSm">{t.schemaTypes}</Text>
              <BlockStack gap="200">
                <Checkbox
                  label={t.organization}
                  helpText={t.organizationHelp}
                  checked={includeOrganization}
                  onChange={setIncludeOrganization}
                  disabled={!isEnabled}
                />
                <Checkbox
                  label={t.products}
                  helpText={t.productsHelp}
                  checked={includeProducts}
                  onChange={setIncludeProducts}
                  disabled={!isEnabled}
                />
                <Checkbox
                  label={t.breadcrumbs}
                  helpText={t.breadcrumbsHelp}
                  checked={includeBreadcrumbs}
                  onChange={setIncludeBreadcrumbs}
                  disabled={!isEnabled}
                />
              </BlockStack>
            </BlockStack>

            <Divider />

            {/* Benefits */}
            <BlockStack gap="200">
              <Text as="h3" variant="headingSm">{t.benefits}</Text>
              <InlineStack gap="400">
                <Box minWidth="200px">
                  <BlockStack gap="100">
                    <Text as="p" fontWeight="semibold" variant="bodySm">{t.benefit1}</Text>
                    <Text as="p" tone="subdued" variant="bodySm">{t.benefit1Desc}</Text>
                  </BlockStack>
                </Box>
                <Box minWidth="200px">
                  <BlockStack gap="100">
                    <Text as="p" fontWeight="semibold" variant="bodySm">{t.benefit2}</Text>
                    <Text as="p" tone="subdued" variant="bodySm">{t.benefit2Desc}</Text>
                  </BlockStack>
                </Box>
              </InlineStack>
            </BlockStack>

            <Divider />

            {/* Preview */}
            <BlockStack gap="300">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h3" variant="headingSm">{t.preview}</Text>
                <InlineStack gap="200">
                  <Button
                    icon={ClipboardIcon}
                    onClick={() => handleCopy()}
                    disabled={!preview}
                    size="slim"
                  >
                    {copied ? t.copied : t.copy}
                  </Button>
                  <Button onClick={handleDownload} disabled={!preview} size="slim">
                    {t.download}
                  </Button>
                </InlineStack>
              </InlineStack>

              <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
                <Box paddingBlockStart="300">
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
                        fontSize: '10px',
                        maxHeight: '200px',
                        overflow: 'auto',
                      }}
                    >
                      {getTabContent()}
                    </pre>
                  </Box>
                </Box>
              </Tabs>

              {config?.lastGeneratedAt && (
                <Text as="p" tone="subdued" variant="bodySm">
                  {locale === 'fr' ? 'Dernière génération: ' : 'Last generated: '}
                  {new Date(config.lastGeneratedAt).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US')}
                </Text>
              )}
            </BlockStack>
          </BlockStack>
        )}
      </Modal.Section>
    </Modal>
  );
}
