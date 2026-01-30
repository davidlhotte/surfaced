'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ScorePage() {
  const router = useRouter();
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setIsLoading(true);
    // Clean up URL for routing
    let domain = urlInput.trim();
    domain = domain.replace(/^https?:\/\//, '');
    domain = domain.replace(/\/.*$/, '');

    const encoded = encodeURIComponent(domain);
    router.push(`/score/${encoded}`);
  };

  const checks = [
    {
      name: 'llms.txt',
      description: 'A file that tells AI crawlers what your site is about',
      importance: 'High',
      points: '+15',
    },
    {
      name: 'JSON-LD Schema',
      description: 'Structured data that helps AI understand your content',
      importance: 'High',
      points: '+20',
    },
    {
      name: 'AI Crawler Access',
      description: 'Whether GPTBot, ClaudeBot can access your site',
      importance: 'Critical',
      points: '+25',
    },
    {
      name: 'Sitemap',
      description: 'Valid XML sitemap for comprehensive crawling',
      importance: 'Medium',
      points: '+10',
    },
    {
      name: 'Content Structure',
      description: 'Clear headings, FAQ sections, and structured content',
      importance: 'High',
      points: '+15',
    },
    {
      name: 'Page Speed',
      description: 'Fast loading improves crawl success rate',
      importance: 'Medium',
      points: '+15',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-800 text-sm font-medium mb-6">
            <span className="text-lg">📊</span>
            Free AEO Score Grader
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            How AI-Ready is Your Website?
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Get a comprehensive score (0-100) measuring how well your website is optimized for AI discovery and recommendations.
          </p>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 mb-12">
          <form onSubmit={handleCheck}>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Enter your website URL
            </label>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com"
                className="flex-1 px-6 py-4 text-lg border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !urlInput.trim()}
                className="px-8 py-4 text-lg font-semibold text-white rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)' }}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span>
                    Analyzing...
                  </span>
                ) : (
                  'Get AEO Score'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* What We Check */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">What We Analyze</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {checks.map((check) => (
              <div key={check.name} className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-900">{check.name}</h3>
                  <span className="text-emerald-600 font-bold text-sm">{check.points}</span>
                </div>
                <p className="text-slate-600 text-sm mb-2">{check.description}</p>
                <span className={`text-xs font-medium px-2 py-1 rounded ${
                  check.importance === 'Critical' ? 'bg-red-100 text-red-700' :
                  check.importance === 'High' ? 'bg-amber-100 text-amber-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {check.importance} Impact
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Score Explanation */}
        <div className="bg-slate-900 text-white rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6">Understanding Your AEO Score</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 text-2xl font-bold flex items-center justify-center mx-auto mb-3">
                70+
              </div>
              <h3 className="font-semibold text-emerald-400 mb-1">Excellent</h3>
              <p className="text-slate-400 text-sm">
                Your site is well-optimized for AI discovery. Keep monitoring!
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 text-2xl font-bold flex items-center justify-center mx-auto mb-3">
                40-69
              </div>
              <h3 className="font-semibold text-amber-400 mb-1">Needs Work</h3>
              <p className="text-slate-400 text-sm">
                Some opportunities for improvement. Quick wins available.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 text-2xl font-bold flex items-center justify-center mx-auto mb-3">
                0-39
              </div>
              <h3 className="font-semibold text-red-400 mb-1">Critical</h3>
              <p className="text-slate-400 text-sm">
                AI assistants likely aren&apos;t finding or recommending you.
              </p>
            </div>
          </div>
        </div>

        {/* Related Tools */}
        <div className="text-center">
          <p className="text-slate-600 mb-4">Want more insights?</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/check"
              className="px-6 py-3 bg-white border border-slate-200 rounded-lg text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors"
            >
              Check AI Visibility
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
