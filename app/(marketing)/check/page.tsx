'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CheckPage() {
  const router = useRouter();
  const [brandInput, setBrandInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandInput.trim()) return;

    setIsLoading(true);
    const encoded = encodeURIComponent(brandInput.trim());
    router.push(`/check/${encoded}`);
  };

  const examples = [
    { name: 'Nike', category: 'Sportswear' },
    { name: 'Notion', category: 'Productivity' },
    { name: 'Shopify', category: 'E-commerce' },
    { name: 'Stripe', category: 'Payments' },
    { name: 'Airbnb', category: 'Travel' },
    { name: 'Slack', category: 'Communication' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-sky-50 border border-sky-200 rounded-full text-sky-800 text-sm font-medium mb-6">
            <span className="text-lg">🔍</span>
            Free AI Visibility Checker
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            What Does AI Say About Your Brand?
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            See what ChatGPT, Claude, Perplexity, and Gemini say when users ask about your brand or competitors.
          </p>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 mb-12">
          <form onSubmit={handleCheck}>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Enter your brand name or website URL
            </label>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                value={brandInput}
                onChange={(e) => setBrandInput(e.target.value)}
                placeholder="e.g., Nike, notion.so, or yourwebsite.com"
                className="flex-1 px-6 py-4 text-lg border-2 border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none transition-colors"
                disabled={isLoading}
              />
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
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-500 mb-3">Try these examples:</p>
            <div className="flex flex-wrap gap-2">
              {examples.map((example) => (
                <button
                  key={example.name}
                  onClick={() => setBrandInput(example.name)}
                  className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                >
                  {example.name}
                  <span className="text-slate-400 ml-1">({example.category})</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* What We Check */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">What We Check</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🤖</span>
                <h3 className="font-semibold text-slate-900">ChatGPT</h3>
              </div>
              <p className="text-slate-600 text-sm">
                What does GPT-4 say when users ask about your brand or products?
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🧠</span>
                <h3 className="font-semibold text-slate-900">Claude</h3>
              </div>
              <p className="text-slate-600 text-sm">
                How does Anthropic&apos;s Claude describe and recommend your brand?
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🔍</span>
                <h3 className="font-semibold text-slate-900">Perplexity</h3>
              </div>
              <p className="text-slate-600 text-sm">
                Does Perplexity cite your website and recommend you with sources?
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">✨</span>
                <h3 className="font-semibold text-slate-900">Gemini</h3>
              </div>
              <p className="text-slate-600 text-sm">
                What does Google&apos;s Gemini say about your brand and products?
              </p>
            </div>
          </div>
        </div>

        {/* Why It Matters */}
        <div className="bg-slate-900 text-white rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-4">Why AI Visibility Matters</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div>
              <div className="text-3xl font-bold text-sky-400 mb-2">45%</div>
              <p className="text-slate-300 text-sm">of Gen Z use AI for product research</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-400 mb-2">80%</div>
              <p className="text-slate-300 text-sm">growth in AI-assisted searches yearly</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-400 mb-2">3x</div>
              <p className="text-slate-300 text-sm">higher conversion from AI recommendations</p>
            </div>
          </div>
        </div>

        {/* Related Tools */}
        <div className="mt-12 text-center">
          <p className="text-slate-600 mb-4">Need more insights?</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/score"
              className="px-6 py-3 bg-white border border-slate-200 rounded-lg text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors"
            >
              Get AEO Score
            </Link>
            <Link
              href="/compare"
              className="px-6 py-3 bg-white border border-slate-200 rounded-lg text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors"
            >
              Compare vs Competitor
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
