'use client';

export const dynamic = 'force-dynamic';

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
  TextField,
  Checkbox,
  Box,
  Divider,
  Tag,
} from '@shopify/polaris';
import { ClipboardIcon } from '@shopify/polaris-icons';
import { useAuthenticatedFetch } from '@/components/providers/ShopProvider';
import { AdminNav } from '@/components/admin/AdminNav';
import { PageBanner } from '@/components/admin/PageBanner';
import { useAdminLanguage } from '@/lib/i18n/AdminLanguageContext';

const DEFAULT_AI_BOTS = [
  'GPTBot',
  'ChatGPT-User',
  'Google-Extended',
  'anthropic-ai',
  'ClaudeBot',
  'Claude-Web',
  'PerplexityBot',
  'cohere-ai',
  'Bytespider',
  'CCBot',
];

export default function RobotsTxtPage() {
  const { fetch } = useAuthenticatedFetch();
  const { locale } = useAdminLanguage();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Configuration
  const [allowAllBots, setAllowAllBots] = useState(true);
  const [allowAiBots, setAllowAiBots] = useState(true);
  const [selectedAiBots, setSelectedAiBots] = useState<string[]>(DEFAULT_AI_BOTS);
  const [disallowedPaths, setDisallowedPaths] = useState<string[]>(['/admin', '/checkout', '/cart']);
  const [crawlDelay, setCrawlDelay] = useState<string>('');
  const [sitemapUrl, setSitemapUrl] = useState<string>('');

  const tr = {
    en: {
      title: 'Robots.txt Manager',
      subtitle: 'Control how search engines and AI bots crawl your store',
      back: 'AEO Tools',
      save: 'Save Configuration',
      saving: 'Saving...',
      preview: 'Preview',
      copy: 'Copy',
      copied: 'Copied!',
      download: 'Download',
      generalSettings: 'General Settings',
      allowAllBots: 'Allow all bots to crawl',
      allowAllBotsHelp: 'When enabled, all search engines can access your store',
      aiBotsSection: 'AI Bot Settings',
      allowAiBots: 'Allow AI bots to crawl',
      allowAiBotsHelp: 'Control whether AI assistants like ChatGPT can learn about your products',
      selectAiBots: 'Select AI bots to allow/block',
      disallowedPaths: 'Blocked Paths',
      disallowedPathsHelp: 'Paths that bots should not crawl (one per line)',
      crawlDelay: 'Crawl Delay (seconds)',
      crawlDelayHelp: 'Optional delay between requests (leave empty for no delay)',
      sitemapUrl: 'Sitemap URL',
      sitemapUrlHelp: 'URL to your sitemap.xml file',
      benefits: 'Why Manage Robots.txt?',
      benefit1: 'Control AI bot access to your content',
      benefit2: 'Protect sensitive pages from crawling',
      benefit3: 'Optimize crawl budget for important pages',
      benefit4: 'Direct bots to your sitemap',
      successMsg: 'Configuration saved successfully!',
      errorMsg: 'Failed to save configuration',
      howToInstall: 'Installation',
      step1: 'Copy or download the generated robots.txt',
      step2: 'Place it in your store\'s root directory',
      step3: 'Test with Google Search Console',
    },
    fr: {
      title: 'Gestionnaire Robots.txt',
      subtitle: 'Controlez comment les moteurs de recherche et bots IA explorent votre boutique',
      back: 'Outils AEO',
      save: 'Sauvegarder',
      saving: 'Sauvegarde...',
      preview: 'Apercu',
      copy: 'Copier',
      copied: 'Copie!',
      download: 'Telecharger',
      generalSettings: 'Parametres Generaux',
      allowAllBots: 'Autoriser tous les bots',
      allowAllBotsHelp: 'Quand active, tous les moteurs de recherche peuvent acceder a votre boutique',
      aiBotsSection: 'Parametres des Bots IA',
      allowAiBots: 'Autoriser les bots IA',
      allowAiBotsHelp: 'Controlez si les assistants IA comme ChatGPT peuvent apprendre de vos produits',
      selectAiBots: 'Selectionnez les bots IA a autoriser/bloquer',
      disallowedPaths: 'Chemins Bloques',
      disallowedPathsHelp: 'Chemins que les bots ne doivent pas explorer (un par ligne)',
      crawlDelay: 'Delai d\'Exploration (secondes)',
      crawlDelayHelp: 'Delai optionnel entre les requetes (laissez vide pour aucun delai)',
      sitemapUrl: 'URL du Sitemap',
      sitemapUrlHelp: 'URL vers votre fichier sitemap.xml',
      benefits: 'Pourquoi Gerer Robots.txt?',
      benefit1: 'Controlez l\'acces des bots IA a votre contenu',
      benefit2: 'Protegez les pages sensibles de l\'exploration',
      benefit3: 'Optimisez le budget d\'exploration pour les pages importantes',
      benefit4: 'Dirigez les bots vers votre sitemap',
      successMsg: 'Configuration sauvegardee avec succes!',
      errorMsg: 'Echec de la sauvegarde',
      howToInstall: 'Installation',
      step1: 'Copiez ou telechargez le robots.txt genere',
      step2: 'Placez-le dans le repertoire racine de votre boutique',
      step3: 'Testez avec Google Search Console',
    },
  };

  const t = tr[locale] || tr.en;

  const generatePreview = useCallback(() => {
    let content = '# Generated by Surfaced\n\n';

    content += 'User-agent: *\n';
    if (allowAllBots) {
      content += 'Allow: /\n';
    } else {
      content += 'Disallow: /\n';
    }

    disallowedPaths.forEach((path) => {
      if (path.trim()) {
        content += `Disallow: ${path.trim()}\n`;
      }
    });

    if (crawlDelay && parseInt(crawlDelay) > 0) {
      content += `Crawl-delay: ${crawlDelay}\n`;
    }

    content += '\n';

    // AI bots section
    if (!allowAiBots) {
      content += '# AI Bots - Blocked\n';
      selectedAiBots.forEach((bot) => {
        content += `User-agent: ${bot}\n`;
        content += 'Disallow: /\n\n';
      });
    } else {
      content += '# AI Bots - Allowed\n';
      selectedAiBots.forEach((bot) => {
        content += `User-agent: ${bot}\n`;
        content += 'Allow: /\n\n';
      });
    }

    if (sitemapUrl) {
      content += `\nSitemap: ${sitemapUrl}\n`;
    }

    setPreview(content);
  }, [allowAllBots, allowAiBots, selectedAiBots, disallowedPaths, crawlDelay, sitemapUrl]);

  useEffect(() => {
    generatePreview();
  }, [generatePreview]);

  const toggleAiBot = (bot: string) => {
    setSelectedAiBots((prev) =>
      prev.includes(bot) ? prev.filter((b) => b !== bot) : [...prev, bot]
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/robots-txt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allowAllBots,
          allowAiBots,
          aiBots: selectedAiBots,
          disallowedPaths,
          crawlDelay: crawlDelay ? parseInt(crawlDelay) : null,
          sitemapUrl: sitemapUrl || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(t.successMsg);
      } else {
        setError(data.error || t.errorMsg);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t.errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(preview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([preview], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'robots.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Page
      title={t.title}
      backAction={{ content: t.back, url: '/admin/aeo-tools' }}
    >
      <AdminNav locale={locale} />
      <PageBanner pageKey="robotsTxt" />
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

        <Layout.Section>
          <Card>
            <BlockStack gap="500">
              <InlineStack gap="300" blockAlign="center">
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                  }}
                >
                  🤖
                </div>
                <BlockStack gap="050">
                  <Text as="h2" variant="headingLg">{t.title}</Text>
                  <Text as="p" tone="subdued">{t.subtitle}</Text>
                </BlockStack>
              </InlineStack>

              <Divider />

              <Text as="h3" variant="headingSm">{t.generalSettings}</Text>

              <Checkbox
                label={t.allowAllBots}
                helpText={t.allowAllBotsHelp}
                checked={allowAllBots}
                onChange={setAllowAllBots}
              />

              <TextField
                label={t.disallowedPaths}
                helpText={t.disallowedPathsHelp}
                value={disallowedPaths.join('\n')}
                onChange={(value) => setDisallowedPaths(value.split('\n'))}
                multiline={3}
                autoComplete="off"
              />

              <InlineStack gap="400">
                <TextField
                  label={t.crawlDelay}
                  helpText={t.crawlDelayHelp}
                  value={crawlDelay}
                  onChange={setCrawlDelay}
                  type="number"
                  autoComplete="off"
                />
                <TextField
                  label={t.sitemapUrl}
                  helpText={t.sitemapUrlHelp}
                  value={sitemapUrl}
                  onChange={setSitemapUrl}
                  autoComplete="off"
                  placeholder="https://yourstore.com/sitemap.xml"
                />
              </InlineStack>

              <Divider />

              <Text as="h3" variant="headingSm">{t.aiBotsSection}</Text>

              <Checkbox
                label={t.allowAiBots}
                helpText={t.allowAiBotsHelp}
                checked={allowAiBots}
                onChange={setAllowAiBots}
              />

              <Text as="p" variant="bodySm" tone="subdued">{t.selectAiBots}</Text>
              <InlineStack gap="200" wrap>
                {DEFAULT_AI_BOTS.map((bot) => (
                  <Tag
                    key={bot}
                    onClick={() => toggleAiBot(bot)}
                  >
                    {selectedAiBots.includes(bot) ? '✓ ' : ''}{bot}
                  </Tag>
                ))}
              </InlineStack>

              <Divider />

              <Button
                variant="primary"
                onClick={handleSave}
                loading={saving}
                size="large"
              >
                {saving ? t.saving : t.save}
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h3" variant="headingSm">{t.preview}</Text>
                <InlineStack gap="200">
                  <Button icon={ClipboardIcon} onClick={handleCopy} size="slim">
                    {copied ? t.copied : t.copy}
                  </Button>
                  <Button onClick={handleDownload} size="slim" variant="primary">
                    {t.download}
                  </Button>
                </InlineStack>
              </InlineStack>
              <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    maxHeight: '300px',
                    overflow: 'auto',
                    color: '#374151',
                  }}
                >
                  {preview}
                </pre>
              </Box>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <Text as="h3" variant="headingSm">{t.benefits}</Text>
              <BlockStack gap="200">
                <Text as="p" variant="bodySm">✅ {t.benefit1}</Text>
                <Text as="p" variant="bodySm">✅ {t.benefit2}</Text>
                <Text as="p" variant="bodySm">✅ {t.benefit3}</Text>
                <Text as="p" variant="bodySm">✅ {t.benefit4}</Text>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
