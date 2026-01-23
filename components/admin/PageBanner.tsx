'use client';

import { Banner, Text, InlineStack, Box } from '@shopify/polaris';
import { useAdminLanguage } from '@/lib/i18n/AdminLanguageContext';

interface PageBannerProps {
  pageKey: 'dashboard' | 'products' | 'visibility' | 'competitors' | 'insights' | 'aeoTools' | 'abTests' | 'settings' | 'llmsTxt' | 'jsonLd' | 'robotsTxt' | 'aiTraffic' | 'sitemap' | 'duplicateContent' | 'bulkEdit' | 'reports';
}

type BannerContent = {
  icon: string;
  titleEn: string;
  titleFr: string;
  descEn: string;
  descFr: string;
};

const BANNER_CONTENT: Record<PageBannerProps['pageKey'], BannerContent> = {
  dashboard: {
    icon: '📊',
    titleEn: 'Welcome to Surfaced',
    titleFr: 'Bienvenue sur Surfaced',
    descEn: 'Your AI visibility command center. Monitor how AI assistants see and recommend your brand. Track your presence across ChatGPT, Perplexity, Claude, and more.',
    descFr: 'Votre centre de contrôle de visibilité IA. Surveillez comment les assistants IA voient et recommandent votre marque sur ChatGPT, Perplexity, Claude et plus.',
  },
  products: {
    icon: '🛍️',
    titleEn: 'AI-Optimized Products',
    titleFr: 'Produits Optimisés pour l\'IA',
    descEn: 'Optimize your product titles, descriptions, and metadata to be better understood by AI assistants. Higher AI scores mean better visibility in AI-powered search.',
    descFr: 'Optimisez vos titres, descriptions et métadonnées pour être mieux compris par les assistants IA. Des scores plus élevés signifient une meilleure visibilité.',
  },
  visibility: {
    icon: '🔍',
    titleEn: 'AI Visibility Testing',
    titleFr: 'Test de Visibilité IA',
    descEn: 'Test how AI assistants respond when customers ask about your products or industry. See if you are mentioned, track competitor mentions, and monitor sentiment.',
    descFr: 'Testez les réponses des assistants IA quand les clients posent des questions sur vos produits. Voyez si vous êtes mentionné et suivez les concurrents.',
  },
  competitors: {
    icon: '🎯',
    titleEn: 'Competitive Intelligence',
    titleFr: 'Intelligence Concurrentielle',
    descEn: 'Analyze how you compare to competitors in AI responses. Understand your share of AI recommendations and identify opportunities to improve your positioning.',
    descFr: 'Analysez votre position face aux concurrents dans les réponses IA. Comprenez votre part de recommandations et identifiez les opportunités d\'amélioration.',
  },
  insights: {
    icon: '📈',
    titleEn: 'Analytics & Insights',
    titleFr: 'Statistiques & Analyses',
    descEn: 'Deep dive into your AI visibility metrics. Track trends over time, analyze performance by platform, and get actionable insights to improve your AI presence.',
    descFr: 'Plongez dans vos métriques de visibilité IA. Suivez les tendances, analysez les performances par plateforme et obtenez des insights actionnables.',
  },
  aeoTools: {
    icon: '🛠️',
    titleEn: 'AEO Tools Suite',
    titleFr: 'Suite d\'Outils AEO',
    descEn: 'AI Engine Optimization tools to make your store more discoverable by AI. Configure llms.txt, structured data, and analyze your technical SEO for AI crawlers.',
    descFr: 'Outils d\'optimisation pour moteurs IA pour rendre votre boutique plus découvrable. Configurez llms.txt, données structurées et analysez votre SEO technique.',
  },
  abTests: {
    icon: '🔬',
    titleEn: 'A/B Testing',
    titleFr: 'Tests A/B',
    descEn: 'Test different product content variations to see which performs better in AI responses. Optimize your content based on real AI visibility data.',
    descFr: 'Testez différentes variations de contenu pour voir lesquelles performent mieux dans les réponses IA. Optimisez basé sur des données réelles.',
  },
  settings: {
    icon: '⚙️',
    titleEn: 'App Settings',
    titleFr: 'Paramètres',
    descEn: 'Configure your Surfaced experience. Set your brand name, manage notifications, view your plan, and customize how the app works for your store.',
    descFr: 'Configurez votre expérience Surfaced. Définissez votre marque, gérez les notifications, consultez votre plan et personnalisez l\'application.',
  },
  llmsTxt: {
    icon: '📄',
    titleEn: 'llms.txt Configuration',
    titleFr: 'Configuration llms.txt',
    descEn: 'llms.txt is a new standard that tells AI assistants what your site is about. Like robots.txt for search engines, but designed specifically for AI crawlers.',
    descFr: 'llms.txt est un nouveau standard qui indique aux assistants IA ce que contient votre site. Comme robots.txt mais conçu pour les crawlers IA.',
  },
  jsonLd: {
    icon: '🏷️',
    titleEn: 'JSON-LD Structured Data',
    titleFr: 'Données Structurées JSON-LD',
    descEn: 'JSON-LD markup helps AI understand your products, organization, and content. Better structured data means more accurate AI recommendations.',
    descFr: 'Le balisage JSON-LD aide l\'IA à comprendre vos produits et contenu. De meilleures données structurées signifient des recommandations IA plus précises.',
  },
  robotsTxt: {
    icon: '🤖',
    titleEn: 'Robots.txt Analysis',
    titleFr: 'Analyse Robots.txt',
    descEn: 'Check if your robots.txt allows AI crawlers to access your content. Some AI assistants use web crawlers to gather information about your store.',
    descFr: 'Vérifiez si votre robots.txt autorise les crawlers IA à accéder à votre contenu. Certains assistants IA utilisent des crawlers web.',
  },
  aiTraffic: {
    icon: '📊',
    titleEn: 'AI Traffic Estimation',
    titleFr: 'Estimation du Trafic IA',
    descEn: 'Estimate how much of your traffic comes from AI assistant referrals. Understand the impact of AI visibility on your store performance.',
    descFr: 'Estimez quelle part de votre trafic provient des assistants IA. Comprenez l\'impact de la visibilité IA sur les performances de votre boutique.',
  },
  sitemap: {
    icon: '🗺️',
    titleEn: 'Sitemap Analysis',
    titleFr: 'Analyse du Sitemap',
    descEn: 'Analyze your sitemap to ensure all important pages are discoverable by AI crawlers. A complete sitemap helps AI understand your store structure.',
    descFr: 'Analysez votre sitemap pour vous assurer que toutes les pages importantes sont découvrables par les crawlers IA.',
  },
  duplicateContent: {
    icon: '📋',
    titleEn: 'Duplicate Content Check',
    titleFr: 'Vérification de Contenu Dupliqué',
    descEn: 'Find duplicate product descriptions and content that may confuse AI assistants. Unique content helps AI recommend the right products.',
    descFr: 'Trouvez les descriptions produits et contenus dupliqués qui peuvent confondre les assistants IA. Un contenu unique aide l\'IA à recommander les bons produits.',
  },
  bulkEdit: {
    icon: '✏️',
    titleEn: 'Bulk Product Editor',
    titleFr: 'Éditeur de Produits en Masse',
    descEn: 'Edit multiple product titles and descriptions at once. Apply AI-optimized changes across your entire catalog efficiently.',
    descFr: 'Modifiez plusieurs titres et descriptions de produits à la fois. Appliquez des modifications optimisées pour l\'IA sur tout votre catalogue.',
  },
  reports: {
    icon: '📊',
    titleEn: 'AEO Reports',
    titleFr: 'Rapports AEO',
    descEn: 'Get comprehensive reports on your AI Engine Optimization status. Track progress and identify areas for improvement.',
    descFr: 'Obtenez des rapports complets sur votre statut d\'optimisation pour moteurs IA. Suivez les progrès et identifiez les domaines à améliorer.',
  },
};

export function PageBanner({ pageKey }: PageBannerProps) {
  const { locale } = useAdminLanguage();
  const content = BANNER_CONTENT[pageKey];

  if (!content) return null;

  return (
    <Box paddingBlockEnd="400">
      <div style={{
        background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(56, 189, 248, 0.08) 100%)',
        borderRadius: '12px',
        border: '1px solid rgba(14, 165, 233, 0.2)',
        padding: '16px 20px',
      }}>
        <InlineStack gap="300" blockAlign="start" wrap={false}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: '20px',
          }}>
            {content.icon}
          </div>
          <div style={{ flex: 1 }}>
            <Text as="h3" variant="headingSm" fontWeight="semibold">
              {locale === 'fr' ? content.titleFr : content.titleEn}
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              {locale === 'fr' ? content.descFr : content.descEn}
            </Text>
          </div>
        </InlineStack>
      </div>
    </Box>
  );
}
