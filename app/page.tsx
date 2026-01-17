'use client';

import { useEffect, useRef } from 'react';
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

  if (shouldRedirect()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
        <div className="text-white text-center">
          <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-semibold text-slate-900">Surfaced</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#how-it-works" className="text-slate-600 hover:text-slate-900 transition-colors">
                How It Works
              </a>
              <a href="#features" className="text-slate-600 hover:text-slate-900 transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-slate-600 hover:text-slate-900 transition-colors">
                Pricing
              </a>
              <a href="#faq" className="text-slate-600 hover:text-slate-900 transition-colors">
                FAQ
              </a>
              <a
                href="https://apps.shopify.com/surfaced"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Install Free
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-20 md:py-28">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full text-indigo-700 text-sm font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
            </span>
            AI is changing how shoppers discover products
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Get Your Products Recommended by{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              ChatGPT, Claude & AI Assistants
            </span>
          </h1>

          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
            When shoppers ask AI for product recommendations, will your store show up?
            Surfaced helps you optimize your Shopify store for AI visibility.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://apps.shopify.com/surfaced"
              className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors text-lg"
            >
              Start Free Trial
            </a>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto px-8 py-4 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors text-lg"
            >
              See How It Works
            </a>
          </div>

          <p className="text-sm text-slate-500 mt-4">
            No credit card required. Free plan available forever.
          </p>
        </div>
      </section>

      {/* Social Proof */}
      <section className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-wrap items-center justify-center gap-8 text-slate-400">
          <div className="text-center">
            <div className="text-3xl font-bold text-slate-900">500+</div>
            <div className="text-sm">Stores Optimized</div>
          </div>
          <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
          <div className="text-center">
            <div className="text-3xl font-bold text-slate-900">50K+</div>
            <div className="text-sm">Products Analyzed</div>
          </div>
          <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
          <div className="text-center">
            <div className="text-3xl font-bold text-slate-900">4.9/5</div>
            <div className="text-sm">App Store Rating</div>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="bg-slate-900 text-white py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              The Way People Shop is Changing
            </h2>
            <p className="text-lg text-slate-300 mb-8">
              More and more shoppers are asking AI assistants like ChatGPT for product recommendations.
              If your products aren&apos;t optimized for AI, you&apos;re becoming invisible to these customers.
            </p>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="bg-slate-800 rounded-xl p-6">
                <div className="text-4xl font-bold text-indigo-400 mb-2">43%</div>
                <p className="text-slate-300">of online shoppers now use AI assistants for product research</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-6">
                <div className="text-4xl font-bold text-indigo-400 mb-2">$0</div>
                <p className="text-slate-300">cost per click when AI recommends your products</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-6">
                <div className="text-4xl font-bold text-indigo-400 mb-2">5x</div>
                <p className="text-slate-300">higher conversion when recommended by AI</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center mb-4">
          How Surfaced Works
        </h2>
        <p className="text-lg text-slate-600 text-center max-w-2xl mx-auto mb-12">
          Three simple steps to make your store visible to AI assistants
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-indigo-600">1</span>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Analyze Your Store</h3>
            <p className="text-slate-600">
              We scan your products and score them on AI-readiness. See exactly which products need improvement.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-indigo-600">2</span>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Optimize Content</h3>
            <p className="text-slate-600">
              Get AI-powered suggestions to improve your descriptions. Our tools help AI understand your products better.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-indigo-600">3</span>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Track Visibility</h3>
            <p className="text-slate-600">
              Monitor if ChatGPT and other AI assistants are recommending your store. See your progress over time.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-slate-50 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center mb-4">
            Everything You Need
          </h2>
          <p className="text-lg text-slate-600 text-center max-w-2xl mx-auto mb-12">
            Comprehensive tools to maximize your AI visibility
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: '🎯',
                title: 'AI Readiness Score',
                description: 'Get a score for each product showing how likely AI is to recommend it. Prioritize what to fix first.',
              },
              {
                icon: '✨',
                title: 'Smart Suggestions',
                description: 'AI-powered content improvements for your descriptions, titles, and tags. Copy with one click.',
              },
              {
                icon: '📊',
                title: 'Visibility Tracking',
                description: 'Check if ChatGPT, Claude, and Perplexity mention your store. Monitor your progress.',
              },
              {
                icon: '🤖',
                title: 'AI Guide File',
                description: 'Generate an llms.txt file that tells AI crawlers about your store, products, and unique value.',
              },
              {
                icon: '📋',
                title: 'Structured Data',
                description: 'Create JSON-LD schemas that help Google and AI understand your products with rich details.',
              },
              {
                icon: '📈',
                title: 'Weekly Reports',
                description: 'Get email summaries of your AI visibility progress, issues found, and recommended actions.',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-6 bg-white rounded-xl border border-slate-200 hover:shadow-lg transition-shadow"
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center mb-4">
          Simple, Transparent Pricing
        </h2>
        <p className="text-lg text-slate-600 text-center max-w-2xl mx-auto mb-12">
          Start free and upgrade as you grow. No hidden fees.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Free */}
          <div className="p-6 rounded-2xl border border-slate-200 bg-white">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Free</h3>
            <p className="text-3xl font-bold text-slate-900 mb-1">
              $0
              <span className="text-sm font-normal text-slate-500">/month</span>
            </p>
            <p className="text-sm text-slate-500 mb-6">Perfect to get started</p>
            <ul className="space-y-3 mb-6">
              {[
                'Analyze up to 25 products',
                'Basic AI readiness score',
                '5 visibility checks/month',
                'AI guide file generator',
              ].map((feature, j) => (
                <li key={j} className="text-sm text-slate-600 flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            <a
              href="https://apps.shopify.com/surfaced"
              className="block w-full py-2 text-center border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Get Started
            </a>
          </div>

          {/* Starter */}
          <div className="p-6 rounded-2xl border border-slate-200 bg-white">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Starter</h3>
            <p className="text-3xl font-bold text-slate-900 mb-1">
              $4.99
              <span className="text-sm font-normal text-slate-500">/month</span>
            </p>
            <p className="text-sm text-slate-500 mb-6">For small stores</p>
            <ul className="space-y-3 mb-6">
              {[
                'Analyze up to 100 products',
                'Detailed issue reports',
                '25 visibility checks/month',
                '10 AI suggestions/month',
                'Structured data generator',
              ].map((feature, j) => (
                <li key={j} className="text-sm text-slate-600 flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            <a
              href="https://apps.shopify.com/surfaced"
              className="block w-full py-2 text-center border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Start Trial
            </a>
          </div>

          {/* Pro - Highlighted */}
          <div className="p-6 rounded-2xl border-2 border-indigo-500 bg-indigo-50 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-full">
              Most Popular
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Pro</h3>
            <p className="text-3xl font-bold text-slate-900 mb-1">
              $9.99
              <span className="text-sm font-normal text-slate-500">/month</span>
            </p>
            <p className="text-sm text-slate-500 mb-6">For growing stores</p>
            <ul className="space-y-3 mb-6">
              {[
                'Analyze up to 500 products',
                'Priority analysis queue',
                '100 visibility checks/month',
                '50 AI suggestions/month',
                'Weekly email reports',
                'Competitor tracking (3)',
              ].map((feature, j) => (
                <li key={j} className="text-sm text-slate-600 flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            <a
              href="https://apps.shopify.com/surfaced"
              className="block w-full py-2 text-center bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Start Trial
            </a>
          </div>

          {/* Business */}
          <div className="p-6 rounded-2xl border border-slate-200 bg-white">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Business</h3>
            <p className="text-3xl font-bold text-slate-900 mb-1">
              $24.99
              <span className="text-sm font-normal text-slate-500">/month</span>
            </p>
            <p className="text-sm text-slate-500 mb-6">For large catalogs</p>
            <ul className="space-y-3 mb-6">
              {[
                'Unlimited products',
                'Fastest analysis speed',
                'Unlimited visibility checks',
                'Unlimited AI suggestions',
                'Daily email reports',
                'Competitor tracking (10)',
                'Priority support',
              ].map((feature, j) => (
                <li key={j} className="text-sm text-slate-600 flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            <a
              href="https://apps.shopify.com/surfaced"
              className="block w-full py-2 text-center border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Start Trial
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-slate-50 py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            {[
              {
                q: 'How does Surfaced help AI assistants find my products?',
                a: 'We optimize your product content with detailed descriptions, structured data, and special files (like llms.txt) that AI assistants use to understand and recommend products. The better your content, the more likely you are to be recommended.',
              },
              {
                q: 'Which AI assistants does this work with?',
                a: 'Surfaced helps you get visibility on ChatGPT, Claude, Perplexity, Google Gemini, Microsoft Copilot, and other AI assistants. We track your visibility across all major platforms.',
              },
              {
                q: 'How is the AI readiness score calculated?',
                a: 'We analyze multiple factors: description quality and length, image availability and alt text, SEO metadata, product categorization, pricing information, and more. Each factor contributes to your overall score.',
              },
              {
                q: 'Can I try before I buy?',
                a: 'Yes! Our Free plan lets you analyze up to 25 products and check your visibility 5 times per month. No credit card required. Upgrade anytime when you need more.',
              },
              {
                q: 'How long does it take to see results?',
                a: 'You can start optimizing immediately after installing. AI assistants may take a few days to weeks to index your improvements, depending on how often they crawl your store.',
              },
              {
                q: 'Will this affect my SEO or search rankings?',
                a: 'Yes, positively! The optimizations that help AI assistants also help search engines. Better descriptions, structured data, and content quality improve both AI and traditional SEO.',
              },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{item.q}</h3>
                <p className="text-slate-600">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-8 md:p-16 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Discovered by AI?
          </h2>
          <p className="text-lg text-indigo-100 max-w-2xl mx-auto mb-8">
            Join thousands of Shopify stores already optimizing for AI visibility.
            Start free and see your score in minutes.
          </p>
          <a
            href="https://apps.shopify.com/surfaced"
            className="inline-block px-8 py-4 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-colors text-lg"
          >
            Install Surfaced Free
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <span className="text-xl font-semibold text-slate-900">Surfaced</span>
              </div>
              <p className="text-sm text-slate-600">
                Get your Shopify store recommended by AI assistants like ChatGPT, Claude, and Perplexity.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#features" className="hover:text-indigo-600">Features</a></li>
                <li><a href="#pricing" className="hover:text-indigo-600">Pricing</a></li>
                <li><a href="#faq" className="hover:text-indigo-600">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="mailto:support@surfaced.app" className="hover:text-indigo-600">Support</a></li>
                <li><a href="https://apps.shopify.com/surfaced" className="hover:text-indigo-600">Shopify App Store</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><Link href="/privacy" className="hover:text-indigo-600">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-indigo-600">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} Surfaced. All rights reserved.
            </p>
            <p className="text-sm text-slate-500">
              Made for Shopify merchants who want to be found
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
