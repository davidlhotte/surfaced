'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  BlockStack,
  InlineStack,
  Text,
  Badge,
  Button,
  Checkbox,
  TextField,
  Banner,
  Box,
  Divider,
  Spinner,
} from '@shopify/polaris';
import { ClipboardIcon } from '@shopify/polaris-icons';
import { useAuthenticatedFetch } from '@/components/providers/ShopProvider';

// Available AI bots
const AI_BOTS = [
  { id: 'ChatGPT-User', name: 'ChatGPT', description: 'OpenAI ChatGPT users' },
  { id: 'GPTBot', name: 'GPT Crawler', description: 'OpenAI web crawler' },
  { id: 'ClaudeBot', name: 'Claude', description: 'Anthropic Claude crawler' },
  { id: 'PerplexityBot', name: 'Perplexity', description: 'Perplexity AI crawler' },
  { id: 'Google-Extended', name: 'Gemini', description: 'Google Gemini crawler' },
  { id: 'cohere-ai', name: 'Cohere', description: 'Cohere AI crawler' },
];

interface LlmsTxtConfig {
  isEnabled: boolean;
  allowedBots: string[];
  includeProducts: boolean;
  includeCollections: boolean;
  includeBlog: boolean;
  excludedProductIds: string[];
  customInstructions: string | null;
  lastGeneratedAt: string | null;
}

interface LlmsTxtConfigModalProps {
  open: boolean;
  onClose: () => void;
  locale?: string;
  onConfigChange?: (config: LlmsTxtConfig) => void;
}

export function LlmsTxtConfigModal({
  open,
  onClose,
  locale = 'en',
  onConfigChange,
}: LlmsTxtConfigModalProps) {
  const { fetch } = useAuthenticatedFetch();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<LlmsTxtConfig | null>(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Form state
  const [isEnabled, setIsEnabled] = useState(true);
  const [allowedBots, setAllowedBots] = useState<string[]>([]);
  const [includeProducts, setIncludeProducts] = useState(true);
  const [includeCollections, setIncludeCollections] = useState(true);
  const [customInstructions, setCustomInstructions] = useState('');

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/llms-txt');
      const data = await response.json();

      if (data.success) {
        setConfig(data.data.config);
        setPreview(data.data.preview || '');

        // Set form state
        setIsEnabled(data.data.config.isEnabled);
        setAllowedBots(data.data.config.allowedBots || []);
        setIncludeProducts(data.data.config.includeProducts);
        setIncludeCollections(data.data.config.includeCollections);
        setCustomInstructions(data.data.config.customInstructions || '');

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

      const response = await fetch('/api/llms-txt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isEnabled,
          allowedBots,
          includeProducts,
          includeCollections,
          customInstructions: customInstructions || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setConfig(data.data.config);
        setPreview(data.data.content || '');
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(preview);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([preview], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'llms.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleBot = (botId: string) => {
    setAllowedBots((prev) =>
      prev.includes(botId)
        ? prev.filter((b) => b !== botId)
        : [...prev, botId]
    );
  };

  const t = {
    title: locale === 'fr' ? 'Configuration llms.txt' : 'llms.txt Configuration',
    description: locale === 'fr'
      ? 'llms.txt aide les assistants IA comme ChatGPT, Claude et Perplexity à comprendre le contenu de votre boutique.'
      : 'llms.txt helps AI assistants like ChatGPT, Claude, and Perplexity understand your store content.',
    enable: locale === 'fr' ? 'Activer la génération llms.txt' : 'Enable llms.txt generation',
    enableHelp: locale === 'fr'
      ? 'Quand activé, un fichier llms.txt sera disponible pour les crawlers IA'
      : 'When enabled, a llms.txt file will be available for AI crawlers',
    aiCrawlers: locale === 'fr' ? 'Crawlers IA' : 'AI Crawlers',
    aiCrawlersHelp: locale === 'fr'
      ? 'Sélectionnez quels services IA peuvent accéder à votre contenu'
      : 'Select which AI services can access your content',
    content: locale === 'fr' ? 'Contenu' : 'Content Settings',
    includeProducts: locale === 'fr' ? 'Inclure les produits' : 'Include Products',
    includeProductsHelp: locale === 'fr'
      ? 'Liste vos produits avec titres, descriptions et prix'
      : 'List your products with titles, descriptions, and prices',
    includeCollections: locale === 'fr' ? 'Inclure les collections' : 'Include Collections',
    includeCollectionsHelp: locale === 'fr'
      ? 'Liste vos collections de produits'
      : 'List your product collections',
    customInstructions: locale === 'fr' ? 'Instructions personnalisées' : 'Custom Instructions',
    customInstructionsHelp: locale === 'fr'
      ? 'Ajoutez des informations supplémentaires pour les assistants IA'
      : 'Add any additional information for AI assistants',
    preview: locale === 'fr' ? 'Aperçu' : 'Preview',
    save: locale === 'fr' ? 'Sauvegarder' : 'Save',
    saving: locale === 'fr' ? 'Sauvegarde...' : 'Saving...',
    copy: locale === 'fr' ? 'Copier' : 'Copy',
    copied: locale === 'fr' ? 'Copié!' : 'Copied!',
    download: locale === 'fr' ? 'Télécharger' : 'Download',
    close: locale === 'fr' ? 'Fermer' : 'Close',
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

            {/* AI Crawlers */}
            <BlockStack gap="300">
              <Text as="h3" variant="headingSm">{t.aiCrawlers}</Text>
              <Text as="p" variant="bodySm" tone="subdued">{t.aiCrawlersHelp}</Text>
              <BlockStack gap="200">
                {AI_BOTS.map((bot) => (
                  <Checkbox
                    key={bot.id}
                    label={bot.name}
                    helpText={bot.description}
                    checked={allowedBots.includes(bot.id)}
                    onChange={() => toggleBot(bot.id)}
                    disabled={!isEnabled}
                  />
                ))}
              </BlockStack>
            </BlockStack>

            <Divider />

            {/* Content Settings */}
            <BlockStack gap="300">
              <Text as="h3" variant="headingSm">{t.content}</Text>
              <BlockStack gap="200">
                <Checkbox
                  label={t.includeProducts}
                  helpText={t.includeProductsHelp}
                  checked={includeProducts}
                  onChange={setIncludeProducts}
                  disabled={!isEnabled}
                />
                <Checkbox
                  label={t.includeCollections}
                  helpText={t.includeCollectionsHelp}
                  checked={includeCollections}
                  onChange={setIncludeCollections}
                  disabled={!isEnabled}
                />
              </BlockStack>

              <TextField
                label={t.customInstructions}
                helpText={t.customInstructionsHelp}
                value={customInstructions}
                onChange={setCustomInstructions}
                multiline={3}
                autoComplete="off"
                disabled={!isEnabled}
                placeholder={locale === 'fr'
                  ? 'Exemple: Nous offrons la livraison gratuite à partir de 50€.'
                  : 'Example: We offer free shipping on orders over $50.'}
              />
            </BlockStack>

            <Divider />

            {/* Preview */}
            <BlockStack gap="300">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h3" variant="headingSm">{t.preview}</Text>
                <InlineStack gap="200">
                  <Button
                    icon={ClipboardIcon}
                    onClick={handleCopy}
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
                    fontSize: '11px',
                    maxHeight: '200px',
                    overflow: 'auto',
                  }}
                >
                  {preview || (locale === 'fr'
                    ? 'Cliquez sur "Sauvegarder" pour générer votre llms.txt'
                    : 'Click "Save" to generate your llms.txt')}
                </pre>
              </Box>

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
