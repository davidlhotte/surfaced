'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { LanguageProvider, useLanguage, LanguageSwitcher } from '@/lib/i18n';

// Check if we should redirect (computed once, outside component)
function shouldRedirect(): boolean {
  if (typeof window === 'undefined') return false;
  const urlParams = new URLSearchParams(window.location.search);
  const host = urlParams.get('host');
  const embedded = urlParams.get('embedded');
  const shop = urlParams.get('shop');
  return !!(host || embedded === '1' || shop);
}

function HomeContent() {
  const hasCheckedRedirect = useRef(false);
  const [activeTab, setActiveTab] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useLanguage();

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
          <p>{t.common.loading}</p>
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
      category: t.features.analyze.category,
      title: t.features.analyze.title,
      description: t.features.analyze.description,
      benefits: t.features.analyze.benefits,
      color: 'from-sky-500 to-cyan-600',
    },
    {
      category: t.features.optimize.category,
      title: t.features.optimize.title,
      description: t.features.optimize.description,
      benefits: t.features.optimize.benefits,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      category: t.features.measure.category,
      title: t.features.measure.title,
      description: t.features.measure.description,
      benefits: t.features.measure.benefits,
      color: 'from-amber-500 to-orange-600',
    },
    {
      category: t.features.dominate.category,
      title: t.features.dominate.title,
      description: t.features.dominate.description,
      benefits: t.features.dominate.benefits,
      color: 'from-rose-500 to-pink-600',
    },
  ];

  const useCases = [
    {
      title: t.useCases.case1.title,
      query: t.useCases.case1.query,
      without: t.useCases.case1.without,
      with: t.useCases.case1.with,
    },
    {
      title: t.useCases.case2.title,
      query: t.useCases.case2.query,
      without: t.useCases.case2.without,
      with: t.useCases.case2.with,
    },
    {
      title: t.useCases.case3.title,
      query: t.useCases.case3.query,
      without: t.useCases.case3.without,
      with: t.useCases.case3.with,
    },
  ];

  const faqs = t.faq.questions;

  // Pricing synced with lib/constants/plans.ts (PLAN_LIMITS and PLAN_PRICES)
  const pricing = [
    {
      name: 'Free Trial',
      price: '0',
      period: t.pricing.free.period,
      description: t.pricing.free.description,
      features: t.pricing.free.features,
      cta: t.pricing.free.cta,
      popular: false,
    },
    {
      name: 'Starter',
      price: '29',
      period: t.pricing.starter.period,
      description: t.pricing.starter.description,
      features: t.pricing.starter.features,
      cta: t.pricing.starter.cta,
      popular: false,
    },
    {
      name: 'Growth',
      price: '79',
      period: t.pricing.growth.period,
      description: t.pricing.growth.description,
      features: t.pricing.growth.features,
      cta: t.pricing.growth.cta,
      popular: true,
    },
    {
      name: 'Scale',
      price: '149',
      period: t.pricing.scale.period,
      description: t.pricing.scale.description,
      features: t.pricing.scale.features,
      cta: t.pricing.scale.cta,
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
                {t.header.tagline}
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#fonctionnalites" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                {t.header.features}
              </a>
              <a href="#comment-ca-marche" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                {t.header.howItWorks}
              </a>
              <a href="#tarifs" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                {t.header.pricing}
              </a>
              <a href="#faq" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                {t.header.faq}
              </a>
              <Link href="/help" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                {t.header.help}
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <LanguageSwitcher className="hidden sm:flex" />
              <a
                href="https://apps.shopify.com/surfaced"
                className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all"
                style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)', boxShadow: '0 4px 14px rgba(14, 165, 233, 0.4)' }}
              >
                {t.header.install}
              </a>
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Menu"
              >
                <svg className="w-6 h-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile menu panel */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-slate-100 py-4">
              <nav className="flex flex-col gap-2">
                <a
                  href="#fonctionnalites"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  {t.header.features}
                </a>
                <a
                  href="#comment-ca-marche"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  {t.header.howItWorks}
                </a>
                <a
                  href="#tarifs"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  {t.header.pricing}
                </a>
                <a
                  href="#faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  {t.header.faq}
                </a>
                <Link
                  href="/help"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  {t.header.help}
                </Link>
                <div className="px-4 py-3">
                  <LanguageSwitcher />
                </div>
                <a
                  href="https://apps.shopify.com/surfaced"
                  className="mx-4 mt-2 px-4 py-3 text-center font-semibold text-white rounded-lg transition-all"
                  style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)' }}
                >
                  {t.header.install}
                </a>
              </nav>
            </div>
          )}
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
              {t.hero.badge}
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6" style={{ color: '#0A1628' }}>
              {t.hero.title}{' '}
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 50%, #0EA5E9 100%)' }}>
                {t.hero.titleHighlight}
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
              {t.hero.subtitle}
              <span className="font-semibold text-slate-900"> {t.hero.subtitleHighlight}</span>
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <a
                href="https://apps.shopify.com/surfaced"
                className="w-full sm:w-auto px-8 py-4 text-lg font-semibold text-white rounded-xl transition-all hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)', boxShadow: '0 8px 24px rgba(14, 165, 233, 0.4)' }}
              >
                {t.hero.cta}
              </a>
              <a
                href="#comment-ca-marche"
                className="w-full sm:w-auto px-8 py-4 text-lg font-semibold text-slate-700 bg-white border-2 border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all"
              >
                {t.hero.ctaSecondary}
              </a>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {t.hero.trust1}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {t.hero.trust2}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {t.hero.trust3}
              </span>
            </div>
          </div>

          {/* AI Platforms */}
          <div className="mt-16 text-center">
            <p className="text-sm text-slate-500 mb-6">{t.hero.platforms}</p>
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
              {t.problem.title}
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              {t.problem.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
              <div className="text-5xl font-bold text-sky-400 mb-2">{t.problem.stats.stat1.value}</div>
              <p className="text-slate-300">{t.problem.stats.stat1.description}</p>
              <p className="text-sm text-slate-500 mt-2">{t.problem.stats.stat1.source}</p>
            </div>
            <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
              <div className="text-5xl font-bold text-emerald-400 mb-2">{t.problem.stats.stat2.value}</div>
              <p className="text-slate-300">{t.problem.stats.stat2.description}</p>
              <p className="text-sm text-slate-500 mt-2">{t.problem.stats.stat2.source}</p>
            </div>
            <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
              <div className="text-5xl font-bold text-amber-400 mb-2">{t.problem.stats.stat3.value}</div>
              <p className="text-slate-300">{t.problem.stats.stat3.description}</p>
              <p className="text-sm text-slate-500 mt-2">{t.problem.stats.stat3.source}</p>
            </div>
          </div>

          <div className="mt-16 bg-sky-500/10 rounded-2xl p-8 border border-sky-400/30">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-4">{t.problem.aeo.title}</h3>
                <p className="text-slate-300 mb-4">
                  <strong className="text-white">{t.problem.aeo.highlight}</strong> — {t.problem.aeo.description}
                </p>
                <p className="text-slate-400">
                  {t.problem.aeo.conclusion}
                </p>
              </div>
              <div className="text-center">
                <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-400">
                  AEO
                </div>
                <p className="text-sm text-slate-400 mt-2">{t.problem.aeo.badge}</p>
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
              {t.useCases.title}
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              {t.useCases.subtitle}
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
                      {t.useCases.without}
                    </div>
                    <p className="text-slate-700">{useCase.without}</p>
                  </div>

                  <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                    <div className="flex items-center gap-2 text-green-600 font-semibold mb-3">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {t.useCases.withSurfaced}
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
              {t.features.title}
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              {t.features.subtitle}
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
            {t.features.additional.map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all">
                <span className="text-3xl block mb-3">{item.icon}</span>
                <h4 className="font-semibold text-slate-900 mb-1">{item.title}</h4>
                <p className="text-sm text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Early Access / Email Capture */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          {/* Why Choose Surfaced */}
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              {t.whyChoose.title}
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              {t.whyChoose.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {t.whyChoose.reasons.map((reason, index) => (
              <div key={index} className="bg-slate-50 rounded-2xl p-8 border border-slate-200 text-center">
                <div className="text-4xl mb-4">{reason.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{reason.title}</h3>
                <p className="text-slate-600">{reason.description}</p>
              </div>
            ))}
          </div>

          {/* Email Capture */}
          <div className="bg-gradient-to-r from-sky-500 to-cyan-500 rounded-2xl p-8 md:p-12 text-white text-center">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              {t.earlyAccess.title}
            </h3>
            <p className="text-lg text-sky-100 mb-8 max-w-xl mx-auto">
              {t.earlyAccess.subtitle}
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto" action="https://formspree.io/f/your-form-id" method="POST">
              <input
                type="email"
                name="email"
                placeholder={t.earlyAccess.placeholder}
                required
                className="flex-1 px-4 py-3 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-300"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-white text-sky-600 font-bold rounded-lg hover:bg-sky-50 transition-colors"
              >
                {t.earlyAccess.button}
              </button>
            </form>
            <p className="text-sm text-sky-200 mt-4">
              {t.earlyAccess.note}
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="tarifs" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              {t.pricing.title}
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              {t.pricing.subtitle}
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
                    {t.pricing.popular}
                  </span>
                )}
                <h3 className={`text-xl font-bold ${plan.popular ? 'text-white' : 'text-slate-900'}`}>
                  {plan.name}
                </h3>
                <div className="mt-4 mb-2">
                  <span className={`text-4xl font-bold ${plan.popular ? 'text-white' : 'text-slate-900'}`}>
                    {plan.price === '0' ? t.pricing.free.free : `$${plan.price}`}
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
            {t.pricing.disclaimer}
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              {t.faq.title}
            </h2>
            <p className="text-lg text-slate-600">
              {t.faq.subtitle}
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
            <p className="text-slate-600 mb-4">{t.faq.moreQuestions}</p>
            <Link
              href="/help"
              className="inline-flex items-center gap-2 text-sky-600 font-semibold hover:text-sky-700"
            >
              {t.faq.helpCenter}
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
            {t.cta.title}
          </h2>
          <p className="text-xl text-sky-100 mb-8 max-w-2xl mx-auto">
            {t.cta.subtitle}
          </p>
          <a
            href="https://apps.shopify.com/surfaced"
            className="inline-block px-10 py-5 text-lg font-bold bg-white text-sky-600 rounded-xl hover:bg-sky-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
          >
            {t.cta.button}
          </a>
          <p className="text-sm text-sky-200 mt-4">
            {t.cta.note}
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
                {t.footer.description}
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">{t.footer.product.title}</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#fonctionnalites" className="hover:text-white transition-colors">{t.footer.product.features}</a></li>
                <li><a href="#tarifs" className="hover:text-white transition-colors">{t.footer.product.pricing}</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">{t.footer.product.faq}</a></li>
                <li><a href="https://apps.shopify.com/surfaced" className="hover:text-white transition-colors">Shopify App Store</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">{t.footer.resources.title}</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/help" className="hover:text-white transition-colors">{t.footer.resources.helpCenter}</Link></li>
                <li><Link href="/help#getting-started" className="hover:text-white transition-colors">{t.footer.resources.gettingStarted}</Link></li>
                <li><Link href="/help#api" className="hover:text-white transition-colors">{t.footer.resources.apiDocs}</Link></li>
                <li><a href="mailto:support@surfaced.app" className="hover:text-white transition-colors">{t.footer.resources.support}</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">{t.footer.legal.title}</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/privacy" className="hover:text-white transition-colors">{t.footer.legal.privacy}</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">{t.footer.legal.terms}</Link></li>
                <li><Link href="/gdpr" className="hover:text-white transition-colors">{t.footer.legal.gdpr}</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} Surfaced. {t.footer.copyright}
            </p>
            <p className="text-sm text-slate-500">
              {t.footer.tagline}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <LanguageProvider>
      <HomeContent />
    </LanguageProvider>
  );
}
