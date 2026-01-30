'use client';

import { useState } from 'react';
import Link from 'next/link';

interface BotResult {
  name: string;
  userAgent: string;
  allowed: boolean;
  statusCode: number | null;
  responseTime: number | null;
  issues: string[];
}

interface CrawlerTestResult {
  domain: string;
  bots: BotResult[];
  robotsTxt: {
    exists: boolean;
    content?: string;
  };
  summary: {
    allAllowed: boolean;
    blockedBots: string[];
    recommendations: string[];
  };
}

export default function CrawlerTestPage() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CrawlerTestResult | null>(null);
  const [error, setError] = useState('');

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/universal/tools/crawler-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch {
      setError('Failed to test. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-slate-900">
            Surfaced
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/tools" className="text-slate-600 hover:text-slate-900">Tools</Link>
            <Link href="/pricing" className="text-slate-600 hover:text-slate-900">Pricing</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center text-3xl mx-auto mb-6">
            🤖
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            AI Crawler Test
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Test if major AI crawlers can access your website. We check GPTBot, ClaudeBot, PerplexityBot, and more.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleTest} className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter website URL (e.g., example.com)"
              className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:border-sky-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="px-6 py-3 bg-sky-500 text-white font-semibold rounded-lg hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Testing...' : 'Test Access'}
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Summary */}
            <div className={`rounded-xl border p-6 ${
              result.summary.allAllowed
                ? 'bg-green-50 border-green-200'
                : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">
                  {result.summary.allAllowed ? '✅' : '⚠️'}
                </span>
                <div>
                  <h2 className={`text-xl font-bold ${
                    result.summary.allAllowed ? 'text-green-900' : 'text-amber-900'
                  }`}>
                    {result.summary.allAllowed
                      ? 'All AI Crawlers Allowed!'
                      : `${result.summary.blockedBots.length} Crawler(s) Blocked`}
                  </h2>
                  <p className={result.summary.allAllowed ? 'text-green-700' : 'text-amber-700'}>
                    Domain: {result.domain}
                  </p>
                </div>
              </div>
            </div>

            {/* Bot Results */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Crawler Access Results</h2>
              <div className="space-y-4">
                {result.bots.map((bot) => (
                  <div
                    key={bot.name}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      bot.allowed ? 'bg-green-50' : 'bg-red-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-2xl ${bot.allowed ? 'text-green-500' : 'text-red-500'}`}>
                        {bot.allowed ? '✓' : '✗'}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900">{bot.name}</p>
                        <p className="text-sm text-slate-500">{bot.userAgent}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {bot.statusCode && (
                        <p className={`text-sm ${
                          bot.statusCode === 200 ? 'text-green-600' :
                          bot.statusCode === 403 ? 'text-red-600' : 'text-amber-600'
                        }`}>
                          Status: {bot.statusCode}
                        </p>
                      )}
                      {bot.responseTime && (
                        <p className="text-sm text-slate-500">
                          {bot.responseTime}ms
                        </p>
                      )}
                      {bot.issues.length > 0 && (
                        <p className="text-sm text-red-600">{bot.issues.join(', ')}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* robots.txt */}
            {result.robotsTxt.exists && result.robotsTxt.content && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">robots.txt Content</h2>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                  {result.robotsTxt.content}
                </pre>
              </div>
            )}

            {/* Recommendations */}
            {result.summary.recommendations.length > 0 && (
              <div className="bg-sky-50 rounded-xl border border-sky-200 p-6">
                <h2 className="text-xl font-bold text-sky-900 mb-4">Recommendations</h2>
                <ul className="space-y-2">
                  {result.summary.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sky-800">
                      <span className="text-sky-500">*</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 bg-slate-100 rounded-xl p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">AI Crawlers We Test</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">OpenAI</h3>
              <ul className="text-slate-600 text-sm space-y-1">
                <li>GPTBot - Training data crawler</li>
                <li>ChatGPT-User - User-triggered browsing</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Anthropic</h3>
              <ul className="text-slate-600 text-sm space-y-1">
                <li>ClaudeBot - Claude&apos;s crawler</li>
                <li>anthropic-ai - Alternative identifier</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Perplexity</h3>
              <ul className="text-slate-600 text-sm space-y-1">
                <li>PerplexityBot - Search engine crawler</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Google</h3>
              <ul className="text-slate-600 text-sm space-y-1">
                <li>Google-Extended - AI training</li>
                <li>Googlebot - Standard search</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
