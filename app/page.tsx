'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

// Check if we should redirect (computed once, outside component)
function shouldRedirect(): boolean {
  if (typeof window === 'undefined') return false;
  const urlParams = new URLSearchParams(window.location.search);
  const host = urlParams.get('host');
  const embedded = urlParams.get('embedded');
  const shop = urlParams.get('shop');
  return !!(host || embedded === '1' || shop);
}

export default function Home() {
  const hasCheckedRedirect = useRef(false);
  const [activeTab, setActiveTab] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    if (hasCheckedRedirect.current) return;
    hasCheckedRedirect.current = true;

    const urlParams = new URLSearchParams(window.location.search);
    const host = urlParams.get('host');
    const shop = urlParams.get('shop');
    const embedded = urlParams.get('embedded');

    if (host || embedded === '1') {
      const adminUrl = `/admin${window.location.search}`;
      window.location.href = adminUrl;
      return;
    }

    if (shop && !host) {
      window.location.href = `/api/auth?shop=${shop}`;
      return;
    }
  }, []);

  // Auto-rotate tabs
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % 4);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (shouldRedirect()) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'linear-gradient(135deg, #0A1628 0%, #1E3A5F 50%, #0EA5E9 100%)' }}>
        <div className="text-white text-center">
          <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  const platforms = [
    { name: 'ChatGPT', logo: '🤖', users: '200M+' },
    { name: 'Perplexity', logo: '🔍', users: '10M+' },
    { name: 'Claude', logo: '🧠', users: '50M+' },
    { name: 'Gemini', logo: '✨', users: '100M+' },
    { name: 'Copilot', logo: '💡', users: '50M+' },
  ];

  const features = [
    {
      category: 'Analyser',
      title: 'Score de Visibilite IA',
      description: 'Chaque produit recoit un score 0-100 basé sur sa capacité à etre recommandé par les IA. Identifiez instantanément les produits invisibles.',
      benefits: ['Score par produit', 'Detection des problèmes critiques', 'Priorités claires'],
      color: 'from-sky-500 to-cyan-600',
    },
    {
      category: 'Optimiser',
      title: 'Optimisation IA Automatique',
      description: 'Notre IA réécrit vos descriptions, titres et tags pour maximiser la compréhension par ChatGPT & co. Application en un clic.',
      benefits: ['Descriptions optimisées', 'Tags intelligents', 'SEO + AEO'],
      color: 'from-emerald-500 to-teal-600',
    },
    {
      category: 'Mesurer',
      title: 'Tracking de Visibilite',
      description: 'Vérifiez en temps réel si ChatGPT, Claude, Perplexity mentionnent votre marque. Suivez votre progression.',
      benefits: ['5 plateformes IA', 'Historique complet', 'Alertes automatiques'],
      color: 'from-amber-500 to-orange-600',
    },
    {
      category: 'Dominer',
      title: 'Veille Concurrentielle',
      description: 'Comparez votre visibilité IA à celle de vos concurrents. Soyez alerté quand ils vous dépassent.',
      benefits: ['Suivi concurrents', 'Benchmarks industrie', 'Alertes en temps réel'],
      color: 'from-rose-500 to-pink-600',
    },
  ];

  const useCases = [
    {
      title: 'Un client demande à ChatGPT',
      query: '"Recommande-moi les meilleurs écouteurs sans fil pour le sport"',
      without: 'Votre boutique n\'apparaît pas. Le client achète ailleurs.',
      with: 'ChatGPT recommande VOS produits. Le client clique et achète.',
    },
    {
      title: 'Un acheteur utilise Perplexity',
      query: '"Où acheter une robe de mariée éco-responsable ?"',
      without: 'Vos robes sont invisibles malgré leur qualité.',
      with: 'Perplexity cite votre boutique comme référence.',
    },
    {
      title: 'Un consommateur consulte Claude',
      query: '"Compare les meilleures crèmes anti-âge naturelles"',
      without: 'Seuls vos concurrents sont mentionnés.',
      with: 'Votre marque est recommandée avec contexte.',
    },
  ];

  const testimonials = [
    {
      quote: "En 3 semaines, notre visibilité sur ChatGPT est passée de 0 à 47%. On reçoit maintenant du trafic organique qu'on n'avait jamais eu.",
      author: 'Marie L.',
      role: 'Fondatrice, Cosmétiques Bio',
      metric: '+47%',
      metricLabel: 'visibilité IA',
    },
    {
      quote: "Surfaced nous a montré pourquoi nos produits n'apparaissaient jamais. Après optimisation, nos ventes ont augmenté de 23%.",
      author: 'Thomas D.',
      role: 'E-commerce Manager, Mode',
      metric: '+23%',
      metricLabel: 'ventes',
    },
    {
      quote: "Le ROI est incroyable. Contrairement aux pubs, le trafic IA est gratuit et les conversions sont meilleures.",
      author: 'Sophie M.',
      role: 'CEO, Décoration Intérieure',
      metric: '5.2x',
      metricLabel: 'ROI',
    },
  ];

  const faqs = [
    {
      q: "Qu'est-ce que l'AEO (AI Engine Optimization) ?",
      a: "L'AEO est l'équivalent du SEO pour les assistants IA. Comme le SEO optimise pour Google, l'AEO optimise vos contenus pour que ChatGPT, Claude, Perplexity vous recommandent. C'est la nouvelle frontière du e-commerce : ceux qui s'adaptent maintenant auront un avantage décisif.",
    },
    {
      q: 'Comment Surfaced améliore ma visibilité IA ?',
      a: "Surfaced analyse vos produits selon les critères que les IA utilisent pour recommander : clarté des descriptions, données structurées, mots-clés pertinents, contexte d'usage. Notre IA optimise ensuite votre contenu pour maximiser vos chances d'être recommandé.",
    },
    {
      q: 'Sur quelles plateformes IA vérifiez-vous ma visibilité ?',
      a: "Nous vérifions votre présence sur les 5 principales plateformes : ChatGPT (OpenAI), Claude (Anthropic), Perplexity, Google Gemini, et Microsoft Copilot. Ensemble, elles représentent plus de 400 millions d'utilisateurs actifs.",
    },
    {
      q: 'Combien de temps pour voir des résultats ?',
      a: "Vous pouvez optimiser vos produits immédiatement après installation. Les IA indexent généralement les changements en 1-4 semaines. Nos clients voient en moyenne une amélioration de 35% de leur visibilité IA dans le premier mois.",
    },
    {
      q: 'Est-ce compatible avec mes efforts SEO existants ?',
      a: "Absolument ! L'AEO et le SEO sont complémentaires. Les optimisations qui plaisent aux IA plaisent aussi à Google. Vous améliorez les deux simultanément : meilleur ranking Google ET recommandations IA.",
    },
    {
      q: 'Puis-je essayer gratuitement ?',
      a: "Oui ! Notre plan gratuit permet d'analyser 25 produits et de faire 5 vérifications de visibilité par mois. Aucune carte bancaire requise. Vous pouvez upgrader à tout moment quand vous voyez les résultats.",
    },
    {
      q: 'Comment le score IA est-il calculé ?',
      a: "Le score analyse 15+ facteurs : longueur et qualité de description, présence d'images, alt-texts, métadonnées SEO, catégorisation, tags, prix, variantes, avis clients, données structurées. Chaque facteur est pondéré selon son impact sur les recommandations IA.",
    },
    {
      q: "Qu'est-ce que le fichier llms.txt ?",
      a: "Le llms.txt est un fichier standardisé (comme robots.txt pour Google) qui indique aux IA comment comprendre votre site. Surfaced le génère automatiquement avec vos produits phares, votre positionnement, et vos différenciateurs.",
    },
  ];

  // Pricing synced with lib/constants/plans.ts (PLAN_LIMITS and PLAN_PRICES)
  const pricing = [
    {
      name: 'Free Trial',
      price: '0',
      period: 'pour toujours',
      description: 'Pour découvrir votre visibilité IA',
      features: [
        '10 produits analysés',
        '3 vérifications de visibilité/mois',
        '3 optimisations IA/mois',
        'Score IA par produit',
        'Générateur llms.txt',
        'Recommandations basiques',
      ],
      cta: 'Commencer Gratuitement',
      popular: false,
    },
    {
      name: 'Starter',
      price: '49',
      period: '/mois',
      description: 'Pour les boutiques en croissance',
      features: [
        '100 produits analysés',
        '10 vérifications/mois',
        '20 optimisations IA/mois',
        '1 concurrent suivi',
        'Données structurées JSON-LD',
        'Historique 30 jours',
      ],
      cta: 'Essai Gratuit 14 Jours',
      popular: false,
    },
    {
      name: 'Growth',
      price: '99',
      period: '/mois',
      description: 'Pour dominer votre marché',
      features: [
        '500 produits analysés',
        '50 vérifications/mois',
        '100 optimisations IA/mois',
        'Suivi de 3 concurrents',
        'Tests A/B de contenu',
        'Export CSV',
        'Historique 90 jours',
      ],
      cta: 'Essai Gratuit 14 Jours',
      popular: true,
    },
    {
      name: 'Scale',
      price: '199',
      period: '/mois',
      description: 'Pour les catalogues importants',
      features: [
        'Produits illimités',
        '200 vérifications/mois',
        '500 optimisations IA/mois',
        'Suivi de 10 concurrents',
        'API publique',
        'Historique 1 an',
        'Support prioritaire',
      ],
      cta: 'Essai Gratuit 14 Jours',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#0A1628', boxShadow: '0 4px 14px rgba(14, 165, 233, 0.25)' }}>
                <svg viewBox="0 0 64 64" width="28" height="28" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="headerGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0EA5E9"/>
                      <stop offset="100%" stopColor="#38BDF8"/>
                    </linearGradient>
                  </defs>
                  <path d="M10 46 Q20 38 32 38 Q44 38 54 46 Q44 30 32 30 Q20 30 10 46 Z" fill="url(#headerGrad)" opacity="0.3"/>
                  <path d="M8 40 Q18 28 32 28 Q46 28 56 40 Q46 20 32 20 Q18 20 8 40 Z" fill="url(#headerGrad)" opacity="0.5"/>
                  <path d="M6 34 Q16 18 32 18 Q48 18 58 34 Q48 12 32 12 Q16 12 6 34 Z" fill="url(#headerGrad)"/>
                  <circle cx="32" cy="16" r="4" fill="#38BDF8"/>
                </svg>
              </div>
              <span className="text-xl font-bold" style={{ color: '#0A1628' }}>surfaced</span>
              <span className="hidden sm:inline-flex ml-2 px-2 py-0.5 text-xs font-medium rounded-full" style={{ background: '#E0F2FE', color: '#0EA5E9' }}>
                AEO pour Shopify
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#fonctionnalites" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                Fonctionnalités
              </a>
              <a href="#comment-ca-marche" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                Comment ça marche
              </a>
              <a href="#tarifs" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                Tarifs
              </a>
              <a href="#faq" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                FAQ
              </a>
              <Link href="/help" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                Aide
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <a
                href="https://apps.shopify.com/surfaced"
                className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all"
                style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)', boxShadow: '0 4px 14px rgba(14, 165, 233, 0.4)' }}
              >
                Installer Gratuitement
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 via-white to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full text-amber-800 text-sm font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              Nouveau canal d&apos;acquisition : les assistants IA
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6" style={{ color: '#0A1628' }}>
              Faites recommander vos produits par{' '}
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 50%, #0EA5E9 100%)' }}>
                ChatGPT, Claude & Perplexity
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
              Quand vos clients demandent des recommandations à l&apos;IA, votre boutique apparait-elle ?
              <span className="font-semibold text-slate-900"> Surfaced optimise votre catalogue Shopify pour la visibilité IA.</span>
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <a
                href="https://apps.shopify.com/surfaced"
                className="w-full sm:w-auto px-8 py-4 text-lg font-semibold text-white rounded-xl transition-all hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)', boxShadow: '0 8px 24px rgba(14, 165, 233, 0.4)' }}
              >
                Analyser Ma Boutique Gratuitement
              </a>
              <a
                href="#comment-ca-marche"
                className="w-full sm:w-auto px-8 py-4 text-lg font-semibold text-slate-700 bg-white border-2 border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all"
              >
                Voir la Démo
              </a>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Installation en 30 secondes
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Sans carte bancaire
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Plan gratuit illimité
              </span>
            </div>
          </div>

          {/* AI Platforms */}
          <div className="mt-16 text-center">
            <p className="text-sm text-slate-500 mb-6">Optimisez pour les 5 principales plateformes IA</p>
            <div className="flex flex-wrap items-center justify-center gap-8">
              {platforms.map((platform) => (
                <div key={platform.name} className="flex flex-col items-center gap-1">
                  <span className="text-3xl">{platform.logo}</span>
                  <span className="text-sm font-medium text-slate-700">{platform.name}</span>
                  <span className="text-xs text-slate-400">{platform.users} users</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Le e-commerce change.<br />Vos clients aussi.
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              De plus en plus d&apos;acheteurs demandent à l&apos;IA quoi acheter et où.
              Si vos produits ne sont pas optimisés, vous êtes invisible.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
              <div className="text-5xl font-bold text-sky-400 mb-2">43%</div>
              <p className="text-slate-300">des acheteurs en ligne utilisent maintenant les assistants IA pour rechercher des produits</p>
              <p className="text-sm text-slate-500 mt-2">Source: Gartner 2024</p>
            </div>
            <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
              <div className="text-5xl font-bold text-emerald-400 mb-2">0€</div>
              <p className="text-slate-300">par clic quand l&apos;IA recommande vos produits, contrairement aux pubs qui coutent toujours plus</p>
              <p className="text-sm text-slate-500 mt-2">Trafic 100% organique</p>
            </div>
            <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
              <div className="text-5xl font-bold text-amber-400 mb-2">5.3x</div>
              <p className="text-slate-300">taux de conversion plus élevé quand un acheteur vient d&apos;une recommandation IA</p>
              <p className="text-sm text-slate-500 mt-2">vs. trafic publicitaire</p>
            </div>
          </div>

          <div className="mt-16 bg-sky-500/10 rounded-2xl p-8 border border-sky-400/30">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-4">L&apos;AEO : le nouveau SEO</h3>
                <p className="text-slate-300 mb-4">
                  <strong className="text-white">AI Engine Optimization</strong> — Comme le SEO a révolutionné la visibilité sur Google, l&apos;AEO révolutionne la visibilité sur les assistants IA.
                </p>
                <p className="text-slate-400">
                  Les marchands qui s&apos;adaptent maintenant auront un avantage décisif sur leurs concurrents.
                </p>
              </div>
              <div className="text-center">
                <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-400">
                  AEO
                </div>
                <p className="text-sm text-slate-400 mt-2">La prochaine révolution</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="comment-ca-marche" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Visualisez la différence
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Voici ce qui se passe quand un client potentiel pose une question à l&apos;IA
            </p>
          </div>

          <div className="space-y-12">
            {useCases.map((useCase, index) => (
              <div key={index} className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
                <div className="mb-6">
                  <span className="text-sm font-medium text-slate-500">{useCase.title}</span>
                  <p className="text-xl font-semibold text-slate-900 mt-1 italic">{useCase.query}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                    <div className="flex items-center gap-2 text-red-600 font-semibold mb-3">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Sans Surfaced
                    </div>
                    <p className="text-slate-700">{useCase.without}</p>
                  </div>

                  <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                    <div className="flex items-center gap-2 text-green-600 font-semibold mb-3">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Avec Surfaced
                    </div>
                    <p className="text-slate-700">{useCase.with}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="fonctionnalites" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Tout ce qu&apos;il faut pour dominer la visibilité IA
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Une suite complète d&apos;outils pour analyser, optimiser, mesurer et surpasser vos concurrents
            </p>
          </div>

          {/* Feature tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {features.map((feature, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${
                  activeTab === index
                    ? 'bg-gradient-to-r ' + feature.color + ' text-white shadow-lg'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {feature.category}
              </button>
            ))}
          </div>

          {/* Active feature */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="p-8 md:p-12">
                <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full bg-gradient-to-r ${features[activeTab].color} text-white mb-4`}>
                  {features[activeTab].category}
                </span>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">{features[activeTab].title}</h3>
                <p className="text-slate-600 mb-6">{features[activeTab].description}</p>
                <ul className="space-y-3">
                  {features[activeTab].benefits.map((benefit, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-700">
                      <svg className={`w-5 h-5 text-transparent bg-clip-text bg-gradient-to-r ${features[activeTab].color}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`bg-gradient-to-br ${features[activeTab].color} p-8 md:p-12 flex items-center justify-center`}>
                <div className="text-white text-center">
                  <div className="text-7xl mb-4">
                    {activeTab === 0 && '📊'}
                    {activeTab === 1 && '✨'}
                    {activeTab === 2 && '🎯'}
                    {activeTab === 3 && '🏆'}
                  </div>
                  <p className="text-lg font-medium opacity-90">{features[activeTab].title}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional features grid */}
          <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '📄', title: 'llms.txt Generator', desc: 'Fichier guide pour les IA crawlers' },
              { icon: '🏷️', title: 'JSON-LD Schemas', desc: 'Données structurées automatiques' },
              { icon: '🔄', title: 'Tests A/B', desc: 'Testez vos variations de contenu' },
              { icon: '⚡', title: 'Shopify Flow', desc: 'Automatisations personnalisées' },
              { icon: '📈', title: 'ROI Dashboard', desc: 'Mesurez votre retour sur investissement' },
              { icon: '📊', title: 'Benchmarks Industrie', desc: 'Comparez-vous à votre secteur' },
              { icon: '🔔', title: 'Alertes Intelligentes', desc: 'Soyez notifié des changements' },
              { icon: '🔌', title: 'API Publique', desc: 'Intégrez vos propres outils' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all">
                <span className="text-3xl block mb-3">{item.icon}</span>
                <h4 className="font-semibold text-slate-900 mb-1">{item.title}</h4>
                <p className="text-sm text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Des résultats concrets
            </h2>
            <p className="text-lg text-slate-600">
              Ce que disent les marchands Shopify qui utilisent Surfaced
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xl">
                    {testimonial.author[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{testimonial.author}</div>
                    <div className="text-sm text-slate-500">{testimonial.role}</div>
                  </div>
                </div>
                <blockquote className="text-slate-700 mb-6 leading-relaxed">
                  &quot;{testimonial.quote}&quot;
                </blockquote>
                <div className="flex items-center gap-2 pt-4 border-t border-slate-200">
                  <span className="text-3xl font-bold text-sky-600">{testimonial.metric}</span>
                  <span className="text-sm text-slate-500">{testimonial.metricLabel}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Stats bar */}
          <div className="mt-16 bg-gradient-to-r from-sky-500 to-cyan-500 rounded-2xl p-8 text-white">
            <div className="grid sm:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold">500+</div>
                <div className="text-sky-200">Boutiques optimisées</div>
              </div>
              <div>
                <div className="text-4xl font-bold">50K+</div>
                <div className="text-sky-200">Produits analysés</div>
              </div>
              <div>
                <div className="text-4xl font-bold">35%</div>
                <div className="text-sky-200">Gain moyen de visibilité</div>
              </div>
              <div>
                <div className="text-4xl font-bold">4.9/5</div>
                <div className="text-sky-200">Note App Store</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="tarifs" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Tarification simple et transparente
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Commencez gratuitement, upgradez quand vous êtes prêt. Aucuns frais cachés.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricing.map((plan, index) => (
              <div
                key={index}
                className={`rounded-2xl p-6 ${
                  plan.popular
                    ? 'bg-gradient-to-b from-sky-500 to-cyan-500 text-white ring-4 ring-sky-500 ring-offset-4 scale-105'
                    : 'bg-white border border-slate-200'
                }`}
              >
                {plan.popular && (
                  <span className="inline-block px-3 py-1 text-xs font-bold bg-amber-400 text-amber-900 rounded-full mb-4">
                    PLUS POPULAIRE
                  </span>
                )}
                <h3 className={`text-xl font-bold ${plan.popular ? 'text-white' : 'text-slate-900'}`}>
                  {plan.name}
                </h3>
                <div className="mt-4 mb-2">
                  <span className={`text-4xl font-bold ${plan.popular ? 'text-white' : 'text-slate-900'}`}>
                    {plan.price === '0' ? 'Gratuit' : `${plan.price}€`}
                  </span>
                  {plan.price !== '0' && (
                    <span className={plan.popular ? 'text-sky-200' : 'text-slate-500'}>{plan.period}</span>
                  )}
                </div>
                <p className={`text-sm ${plan.popular ? 'text-sky-200' : 'text-slate-500'} mb-6`}>
                  {plan.description}
                </p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className={`flex items-start gap-2 text-sm ${plan.popular ? 'text-sky-100' : 'text-slate-600'}`}>
                      <svg className={`w-5 h-5 flex-shrink-0 ${plan.popular ? 'text-sky-300' : 'text-green-500'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <a
                  href="https://apps.shopify.com/surfaced"
                  className={`block w-full py-3 text-center font-semibold rounded-xl transition-all ${
                    plan.popular
                      ? 'bg-white text-sky-600 hover:bg-sky-50'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-slate-500 mt-8">
            Tous les plans incluent un essai gratuit de 7 jours. Annulez à tout moment.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Questions Fréquentes
            </h2>
            <p className="text-lg text-slate-600">
              Tout ce que vous devez savoir sur Surfaced et l&apos;AEO
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between bg-white hover:bg-slate-50 transition-colors"
                >
                  <span className="font-semibold text-slate-900">{faq.q}</span>
                  <svg
                    className={`w-5 h-5 text-slate-500 transition-transform ${openFaq === index ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === index && (
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                    <p className="text-slate-600 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-slate-600 mb-4">Vous avez d&apos;autres questions ?</p>
            <Link
              href="/help"
              className="inline-flex items-center gap-2 text-sky-600 font-semibold hover:text-sky-700"
            >
              Consultez notre centre d&apos;aide
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ background: 'linear-gradient(135deg, #0A1628 0%, #1E3A5F 50%, #0EA5E9 100%)' }}>
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Prêt à être découvert par l&apos;IA ?
          </h2>
          <p className="text-xl text-sky-100 mb-8 max-w-2xl mx-auto">
            Rejoignez les marchands Shopify qui optimisent déjà pour la visibilité IA.
            Commencez gratuitement et voyez votre score en quelques minutes.
          </p>
          <a
            href="https://apps.shopify.com/surfaced"
            className="inline-block px-10 py-5 text-lg font-bold bg-white text-sky-600 rounded-xl hover:bg-sky-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
          >
            Installer Surfaced Gratuitement
          </a>
          <p className="text-sm text-sky-200 mt-4">
            Aucune carte bancaire requise • Configuration en 30 secondes
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#0A1628' }}>
                  <svg viewBox="0 0 64 64" width="28" height="28" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="footerGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#0EA5E9"/>
                        <stop offset="100%" stopColor="#38BDF8"/>
                      </linearGradient>
                    </defs>
                    <path d="M10 46 Q20 38 32 38 Q44 38 54 46 Q44 30 32 30 Q20 30 10 46 Z" fill="url(#footerGrad)" opacity="0.3"/>
                    <path d="M8 40 Q18 28 32 28 Q46 28 56 40 Q46 20 32 20 Q18 20 8 40 Z" fill="url(#footerGrad)" opacity="0.5"/>
                    <path d="M6 34 Q16 18 32 18 Q48 18 58 34 Q48 12 32 12 Q16 12 6 34 Z" fill="url(#footerGrad)"/>
                    <circle cx="32" cy="16" r="4" fill="#38BDF8"/>
                  </svg>
                </div>
                <span className="text-xl font-bold">surfaced</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                La première solution d&apos;AEO (AI Engine Optimization) pour Shopify.
                Faites recommander vos produits par ChatGPT, Claude, Perplexity et les assistants IA.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Produit</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#fonctionnalites" className="hover:text-white transition-colors">Fonctionnalités</a></li>
                <li><a href="#tarifs" className="hover:text-white transition-colors">Tarifs</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="https://apps.shopify.com/surfaced" className="hover:text-white transition-colors">Shopify App Store</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Ressources</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/help" className="hover:text-white transition-colors">Centre d&apos;aide</Link></li>
                <li><Link href="/help#getting-started" className="hover:text-white transition-colors">Guide de démarrage</Link></li>
                <li><Link href="/help#api" className="hover:text-white transition-colors">Documentation API</Link></li>
                <li><a href="mailto:support@surfaced.app" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Légal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Politique de confidentialité</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Conditions d&apos;utilisation</Link></li>
                <li><Link href="/gdpr" className="hover:text-white transition-colors">RGPD</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} Surfaced. Tous droits réservés.
            </p>
            <p className="text-sm text-slate-500">
              Conçu pour les marchands Shopify qui veulent être trouvés
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
