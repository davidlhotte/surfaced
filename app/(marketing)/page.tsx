'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UniversalLanding() {
  const router = useRouter();
  const [brandInput, setBrandInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandInput.trim()) return;

    setIsLoading(true);
    // Encode the brand/URL for the route
    const encoded = encodeURIComponent(brandInput.trim());
    router.push(`/check/${encoded}`);
  };

  const platforms = [
    { name: 'ChatGPT', logo: '🤖', users: '200M+' },
    { name: 'Perplexity', logo: '🔍', users: '10M+' },
    { name: 'Claude', logo: '🧠', users: '50M+' },
    { name: 'Gemini', logo: '✨', users: '100M+' },
    { name: 'Copilot', logo: '💡', users: '50M+' },
  ];

  const freeTools = [
    {
      title: 'AI Visibility Checker',
      description: 'See what ChatGPT, Claude & Perplexity say about your brand right now.',
      href: '/check',
      icon: '🔍',
      color: 'from-sky-500 to-cyan-600',
    },
    {
      title: 'AEO Score Grader',
      description: 'Get your website scored for AI readiness. Check llms.txt, schema, and more.',
      href: '/score',
      icon: '📊',
      color: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'Competitor Comparison',
      description: 'Compare your brand vs competitors in AI search results.',
      href: '/compare',
      icon: '⚔️',
      color: 'from-amber-500 to-orange-600',
    },
  ];

  const stats = [
    { value: '45%', label: 'of Gen Z use AI for product discovery', source: 'Gartner 2024' },
    { value: '80%', label: 'increase in AI-driven searches year-over-year', source: 'Google AI Overview' },
    { value: '3x', label: 'higher conversion from AI recommendations', source: 'Industry Reports' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 via-white to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full text-amber-800 text-sm font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              Free AI Visibility Check - No signup required
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6" style={{ color: '#0A1628' }}>
              What Does AI Say About{' '}
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 50%, #0EA5E9 100%)' }}>
                Your Brand?
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
              ChatGPT, Claude, and Perplexity are how millions discover products.
              <span className="font-semibold text-slate-900"> See if you&apos;re being recommended.</span>
            </p>

            {/* Main Input Form */}
            <form onSubmit={handleCheck} className="max-w-2xl mx-auto mb-8">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={brandInput}
                    onChange={(e) => setBrandInput(e.target.value)}
                    placeholder="Enter your brand name or website URL"
                    className="w-full px-6 py-4 text-lg border-2 border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none transition-colors"
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !brandInput.trim()}
                  className="px-8 py-4 text-lg font-semibold text-white rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)', boxShadow: '0 8px 24px rgba(14, 165, 233, 0.4)' }}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span>
                      Checking...
                    </span>
                  ) : (
                    'Check AI Visibility'
                  )}
                </button>
              </div>
              <p className="text-sm text-slate-500 mt-3">
                Try: &quot;Nike&quot;, &quot;notion.so&quot;, or your own brand
              </p>
            </form>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                100% Free
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                No signup required
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Instant results
              </span>
            </div>
          </div>

          {/* AI Platforms */}
          <div className="mt-16 text-center">
            <p className="text-sm text-slate-500 mb-6">We check your visibility across:</p>
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

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              AI Search is the New SEO
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Consumers are shifting from Google to AI assistants for product discovery. Is your brand visible?
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
                <div className="text-5xl font-bold text-sky-400 mb-2">{stat.value}</div>
                <p className="text-slate-300">{stat.label}</p>
                <p className="text-sm text-slate-500 mt-2">{stat.source}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 bg-sky-500/10 rounded-2xl p-8 border border-sky-400/30">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-4">What is AEO?</h3>
                <p className="text-slate-300 mb-4">
                  <strong className="text-white">Answer Engine Optimization (AEO)</strong> is the practice of optimizing your brand and content to be recommended by AI assistants like ChatGPT, Claude, and Perplexity.
                </p>
                <p className="text-slate-400">
                  Unlike traditional SEO, AEO focuses on being the answer AI gives, not just ranking in search results.
                </p>
              </div>
              <div className="text-center">
                <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-400">
                  AEO
                </div>
                <p className="text-sm text-slate-400 mt-2">Answer Engine Optimization</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Free Tools Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Free AEO Tools
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Start optimizing your AI visibility today with our free tools. No signup required.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {freeTools.map((tool, i) => (
              <Link
                key={i}
                href={tool.href}
                className="group bg-white rounded-2xl p-8 border border-slate-200 hover:shadow-xl hover:border-slate-300 transition-all"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-2xl mb-6`}>
                  {tool.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-sky-600 transition-colors">
                  {tool.title}
                </h3>
                <p className="text-slate-600 mb-4">{tool.description}</p>
                <span className="text-sky-600 font-semibold flex items-center gap-1">
                  Try it free
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              How Surfaced Works
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Three steps to dominate AI search results
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-sky-100 text-sky-600 text-2xl font-bold flex items-center justify-center mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Check Your Visibility</h3>
              <p className="text-slate-600">
                Enter your brand or URL to see what AI assistants currently say about you.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 text-2xl font-bold flex items-center justify-center mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Get Your AEO Score</h3>
              <p className="text-slate-600">
                Understand how AI-ready your website is with technical checks and recommendations.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 text-2xl font-bold flex items-center justify-center mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Optimize & Monitor</h3>
              <p className="text-slate-600">
                Follow recommendations to improve visibility and track your progress over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ background: 'linear-gradient(135deg, #0A1628 0%, #1E3A5F 50%, #0EA5E9 100%)' }}>
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Get Discovered by AI?
          </h2>
          <p className="text-xl text-sky-100 mb-8 max-w-2xl mx-auto">
            Join thousands of brands optimizing for the AI-first future. Start with a free visibility check.
          </p>
          <form onSubmit={handleCheck} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
            <input
              type="text"
              value={brandInput}
              onChange={(e) => setBrandInput(e.target.value)}
              placeholder="Enter your brand or URL"
              className="flex-1 px-6 py-4 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-300"
            />
            <button
              type="submit"
              disabled={isLoading || !brandInput.trim()}
              className="px-8 py-4 bg-white text-sky-600 font-bold rounded-xl hover:bg-sky-50 transition-colors disabled:opacity-50"
            >
              Check Now
            </button>
          </form>
          <p className="text-sm text-sky-200 mt-4">
            Free forever. No credit card required.
          </p>
        </div>
      </section>
    </div>
  );
}
