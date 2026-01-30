'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function ShopifyLanding() {
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
    }
  }, []);

  // Auto-rotate tabs
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % 4);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const platforms = [
    { name: 'ChatGPT', logo: '🤖', users: '200M+' },
    { name: 'Perplexity', logo: '🔍', users: '10M+' },
    { name: 'Claude', logo: '🧠', users: '50M+' },
    { name: 'Gemini', logo: '✨', users: '100M+' },
    { name: 'Copilot', logo: '💡', users: '50M+' },
  ];

  const features = [
    {
      category: 'Analyze',
      title: 'See AI Visibility in Real-Time',
      description: 'Track how your products appear in ChatGPT, Claude, and Perplexity responses.',
      benefits: [
        'Product-level visibility tracking',
        'Multi-LLM monitoring',
        'Competitor comparison',
      ],
      color: 'from-sky-500 to-cyan-600',
    },
    {
      category: 'Optimize',
      title: 'AI-Ready Product Descriptions',
      description: 'Optimize your Shopify products for AI discovery with one click.',
      benefits: [
        'Bulk product optimization',
        'Auto-generated llms.txt',
        'JSON-LD schema injection',
      ],
      color: 'from-emerald-500 to-teal-600',
    },
    {
      category: 'Measure',
      title: 'Track AI-Driven Traffic',
      description: 'Understand how much revenue comes from AI recommendations.',
      benefits: [
        'AI traffic attribution',
        'Conversion tracking',
        'ROI calculator',
      ],
      color: 'from-amber-500 to-orange-600',
    },
    {
      category: 'Dominate',
      title: 'Outrank Competitors',
      description: 'Get recommended before your competitors in AI search.',
      benefits: [
        'Share of Voice metrics',
        'Competitor alerts',
        'Category leadership',
      ],
      color: 'from-rose-500 to-pink-600',
    },
  ];

  const pricing = [
    {
      name: 'Free Trial',
      price: '0',
      period: '/14 days',
      description: 'Try all features free',
      features: [
        '10 products tracked',
        '3 visibility checks/month',
        'Basic AEO recommendations',
        'Email support',
      ],
      cta: 'Start Free Trial',
      popular: false,
    },
    {
      name: 'Starter',
      price: '29',
      period: '/month',
      description: 'For small stores',
      features: [
        '100 products tracked',
        '10 visibility checks/month',
        '1 competitor',
        'llms.txt generator',
        'Email support',
      ],
      cta: 'Get Started',
      popular: false,
    },
    {
      name: 'Growth',
      price: '79',
      period: '/month',
      description: 'For growing stores',
      features: [
        '500 products tracked',
        '50 visibility checks/month',
        '3 competitors',
        'JSON-LD automation',
        'Weekly reports',
        'Priority support',
      ],
      cta: 'Get Started',
      popular: true,
    },
    {
      name: 'Scale',
      price: '149',
      period: '/month',
      description: 'For large stores',
      features: [
        'Unlimited products',
        '200 visibility checks/month',
        '10 competitors',
        'API access',
        'Custom reports',
        'Dedicated support',
      ],
      cta: 'Get Started',
      popular: false,
    },
  ];

  const faqs = [
    {
      q: 'How does Surfaced integrate with my Shopify store?',
      a: 'Surfaced installs as a native Shopify app. We automatically sync your product catalog and can inject AEO optimizations directly into your store theme.',
    },
    {
      q: 'What AI platforms do you track?',
      a: 'We track visibility across ChatGPT, Claude, Perplexity, Gemini, and Microsoft Copilot - covering 90%+ of AI-assisted shopping queries.',
    },
    {
      q: 'How quickly will I see results?',
      a: 'Most stores see improved AI visibility within 2-4 weeks after implementing our recommendations. Tracking data is available immediately.',
    },
    {
      q: 'Can I use Surfaced with my current Shopify apps?',
      a: 'Yes! Surfaced works alongside all Shopify apps. We don\'t modify your theme code unless you enable our JSON-LD automation.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 via-white to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full text-green-800 text-sm font-medium mb-8">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              Built for Shopify Merchants
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6" style={{ color: '#0A1628' }}>
              Get Your Products{' '}
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #95BF47 0%, #5E8E3E 100%)' }}>
                Recommended by AI
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
              Shopify merchants are losing sales to AI-savvy competitors.
              <span className="font-semibold text-slate-900"> Make ChatGPT & Claude recommend your products.</span>
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <a
                href="https://apps.shopify.com/surfaced"
                className="w-full sm:w-auto px-8 py-4 text-lg font-semibold text-white rounded-xl transition-all hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #95BF47 0%, #5E8E3E 100%)', boxShadow: '0 8px 24px rgba(94, 142, 62, 0.4)' }}
              >
                Install on Shopify - Free
              </a>
              <Link
                href="/check"
                className="w-full sm:w-auto px-8 py-4 text-lg font-semibold text-slate-700 bg-white border-2 border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all"
              >
                Check My Store First
              </Link>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                14-day free trial
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                No credit card required
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                1-click install
              </span>
            </div>
          </div>

          {/* AI Platforms */}
          <div className="mt-16 text-center">
            <p className="text-sm text-slate-500 mb-6">Get recommended across:</p>
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

      {/* Shopify-specific Problem */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Your Shopify Store is Invisible to AI
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              When customers ask ChatGPT for product recommendations, are your products showing up?
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-red-400 mb-4">Without Surfaced</h3>
                <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm">
                  <p className="text-slate-400 mb-2">&quot;Best sustainable sneakers?&quot;</p>
                  <p className="text-slate-300">
                    AI recommends: Allbirds, Veja, Cariuma...
                    <br />
                    <span className="text-red-400">Your store: Not mentioned</span>
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-400 mb-4">With Surfaced</h3>
                <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm">
                  <p className="text-slate-400 mb-2">&quot;Best sustainable sneakers?&quot;</p>
                  <p className="text-slate-300">
                    AI recommends: Allbirds, Veja,{' '}
                    <span className="text-green-400 font-bold">Your Store</span>...
                    <br />
                    <span className="text-green-400">&quot;Known for eco-friendly materials...&quot;</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Complete AEO Toolkit for Shopify
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Everything you need to dominate AI search results
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
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
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
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Start free, upgrade as you grow. Billed through Shopify.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricing.map((plan, index) => (
              <div
                key={index}
                className={`rounded-2xl p-6 ${
                  plan.popular
                    ? 'bg-gradient-to-b from-green-500 to-green-600 text-white ring-4 ring-green-500 ring-offset-4 scale-105'
                    : 'bg-white border border-slate-200'
                }`}
              >
                {plan.popular && (
                  <span className="inline-block px-3 py-1 text-xs font-bold bg-amber-400 text-amber-900 rounded-full mb-4">
                    Most Popular
                  </span>
                )}
                <h3 className={`text-xl font-bold ${plan.popular ? 'text-white' : 'text-slate-900'}`}>
                  {plan.name}
                </h3>
                <div className="mt-4 mb-2">
                  <span className={`text-4xl font-bold ${plan.popular ? 'text-white' : 'text-slate-900'}`}>
                    {plan.price === '0' ? 'Free' : `$${plan.price}`}
                  </span>
                  {plan.price !== '0' && (
                    <span className={plan.popular ? 'text-green-200' : 'text-slate-500'}>{plan.period}</span>
                  )}
                </div>
                <p className={`text-sm ${plan.popular ? 'text-green-200' : 'text-slate-500'} mb-6`}>
                  {plan.description}
                </p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className={`flex items-start gap-2 text-sm ${plan.popular ? 'text-green-100' : 'text-slate-600'}`}>
                      <svg className={`w-5 h-5 flex-shrink-0 ${plan.popular ? 'text-green-300' : 'text-green-500'}`} fill="currentColor" viewBox="0 0 20 20">
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
                      ? 'bg-white text-green-600 hover:bg-green-50'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
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
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ background: 'linear-gradient(135deg, #5E8E3E 0%, #95BF47 100%)' }}>
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Get Recommended by AI?
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Join thousands of Shopify merchants already using Surfaced to dominate AI search.
          </p>
          <a
            href="https://apps.shopify.com/surfaced"
            className="inline-block px-10 py-5 text-lg font-bold bg-white text-green-600 rounded-xl hover:bg-green-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
          >
            Install Free on Shopify
          </a>
          <p className="text-sm text-green-200 mt-4">
            14-day free trial. No credit card required.
          </p>
        </div>
      </section>
    </div>
  );
}
