'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ValidationResult {
  exists?: boolean;
  isValid: boolean;
  score: number;
  sections: {
    name: { found: boolean; value?: string };
    description: { found: boolean; value?: string };
    contact: { found: boolean; value?: string };
    sitemap: { found: boolean; value?: string };
    topics: { found: boolean; count: number };
    links: { found: boolean; count: number };
  };
  issues: string[];
  suggestions: string[];
  content?: string;
  error?: string;
}

export default function LlmsValidatorPage() {
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [mode, setMode] = useState<'url' | 'content'>('url');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState('');

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/universal/tools/llms-validator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'url' ? { url } : { content }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch {
      setError('Failed to validate. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const exampleLlmsTxt = `# My Company Name

> A brief description of what my company does and what it's known for.

Contact: hello@mycompany.com
Sitemap: https://mycompany.com/sitemap.xml

## Products
- [Product A](https://mycompany.com/products/a) - Description
- [Product B](https://mycompany.com/products/b) - Description

## About
Learn more about us at https://mycompany.com/about`;

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
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-3xl mx-auto mb-6">
            📄
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            llms.txt Validator
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Validate your llms.txt file to ensure AI crawlers can understand your brand and content.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setMode('url')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              mode === 'url'
                ? 'bg-sky-500 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Check URL
          </button>
          <button
            onClick={() => setMode('content')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              mode === 'content'
                ? 'bg-sky-500 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Paste Content
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleValidate} className="mb-8">
          {mode === 'url' ? (
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
                {isLoading ? 'Checking...' : 'Validate'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your llms.txt content here..."
                rows={10}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-sky-500 focus:outline-none font-mono text-sm"
              />
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setContent(exampleLlmsTxt)}
                  className="text-sky-600 hover:text-sky-700 text-sm"
                >
                  Load Example
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !content.trim()}
                  className="px-6 py-3 bg-sky-500 text-white font-semibold rounded-lg hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Validating...' : 'Validate'}
                </button>
              </div>
            </div>
          )}
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
            {/* Score */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">Validation Score</h2>
                <div className={`text-3xl font-bold ${
                  result.score >= 70 ? 'text-green-600' :
                  result.score >= 40 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {result.score}/100
                </div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    result.score >= 70 ? 'bg-green-500' :
                    result.score >= 40 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${result.score}%` }}
                />
              </div>
            </div>

            {/* Sections Found */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Sections Found</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {Object.entries(result.sections).map(([key, value]) => (
                  <div key={key} className="flex items-start gap-3">
                    <span className={`text-lg ${value.found ? 'text-green-500' : 'text-slate-300'}`}>
                      {value.found ? '✓' : '○'}
                    </span>
                    <div>
                      <p className="font-medium text-slate-900 capitalize">{key}</p>
                      {'value' in value && value.value && (
                        <p className="text-sm text-slate-600 truncate max-w-xs">{value.value}</p>
                      )}
                      {'count' in value && value.count > 0 && (
                        <p className="text-sm text-slate-500">{value.count} found</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Issues */}
            {result.issues.length > 0 && (
              <div className="bg-red-50 rounded-xl border border-red-200 p-6">
                <h2 className="text-xl font-bold text-red-900 mb-4">Issues</h2>
                <ul className="space-y-2">
                  {result.issues.map((issue, i) => (
                    <li key={i} className="flex items-start gap-2 text-red-800">
                      <span className="text-red-500">!</span>
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {result.suggestions.length > 0 && (
              <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
                <h2 className="text-xl font-bold text-amber-900 mb-4">Suggestions</h2>
                <ul className="space-y-2">
                  {result.suggestions.map((suggestion, i) => (
                    <li key={i} className="flex items-start gap-2 text-amber-800">
                      <span className="text-amber-500">*</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 bg-slate-100 rounded-xl p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">What is llms.txt?</h2>
          <p className="text-slate-600 mb-4">
            llms.txt is a file that helps AI crawlers understand your website and brand.
            It&apos;s similar to robots.txt but specifically designed for large language models.
          </p>
          <h3 className="font-semibold text-slate-900 mt-6 mb-2">Recommended Sections:</h3>
          <ul className="space-y-2 text-slate-600">
            <li><strong># Name</strong> - Your brand/site name as a heading</li>
            <li><strong>&gt; Description</strong> - Brief description as a blockquote</li>
            <li><strong>Contact</strong> - How to reach you</li>
            <li><strong>Sitemap</strong> - Link to your sitemap</li>
            <li><strong>## Topics</strong> - Key content areas</li>
            <li><strong>Links</strong> - Important pages on your site</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
