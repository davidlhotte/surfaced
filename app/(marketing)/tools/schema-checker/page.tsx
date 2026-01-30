'use client';

import { useState } from 'react';
import Link from 'next/link';

interface SchemaValidation {
  type: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface SchemaCheckResult {
  domain: string;
  hasSchema: boolean;
  schemas: SchemaValidation[];
  score: number;
  aeoRelevant: {
    hasOrganization: boolean;
    hasProduct: boolean;
    hasWebSite: boolean;
    hasFAQPage: boolean;
    hasBreadcrumb: boolean;
    hasArticle: boolean;
    hasLocalBusiness: boolean;
    hasHowTo: boolean;
  };
  recommendations: string[];
}

export default function SchemaCheckerPage() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SchemaCheckResult | null>(null);
  const [error, setError] = useState('');

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/universal/tools/schema-checker', {
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
      setError('Failed to check. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const schemaTypes = [
    { key: 'hasOrganization', label: 'Organization', description: 'Brand identity' },
    { key: 'hasLocalBusiness', label: 'LocalBusiness', description: 'Physical locations' },
    { key: 'hasProduct', label: 'Product', description: 'E-commerce products' },
    { key: 'hasWebSite', label: 'WebSite', description: 'Site-wide info' },
    { key: 'hasFAQPage', label: 'FAQPage', description: 'Q&A content' },
    { key: 'hasArticle', label: 'Article', description: 'Blog/news' },
    { key: 'hasBreadcrumb', label: 'BreadcrumbList', description: 'Navigation' },
    { key: 'hasHowTo', label: 'HowTo', description: 'Guides' },
  ];

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
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-3xl mx-auto mb-6">
            🔗
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            JSON-LD Schema Checker
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Validate your structured data to improve AI understanding and visibility in search results.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleCheck} className="mb-8">
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
              {isLoading ? 'Checking...' : 'Check Schema'}
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
            {/* Score */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Schema Score</h2>
                  <p className="text-slate-500">{result.domain}</p>
                </div>
                <div className={`text-4xl font-bold ${
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

            {/* AEO Relevant Schemas */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">AEO-Relevant Schemas</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {schemaTypes.map((schema) => {
                  const hasSchema = result.aeoRelevant[schema.key as keyof typeof result.aeoRelevant];
                  return (
                    <div
                      key={schema.key}
                      className={`p-4 rounded-lg border ${
                        hasSchema
                          ? 'bg-green-50 border-green-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={hasSchema ? 'text-green-500' : 'text-slate-300'}>
                          {hasSchema ? '✓' : '○'}
                        </span>
                        <span className="font-semibold text-slate-900">{schema.label}</span>
                      </div>
                      <p className="text-sm text-slate-500">{schema.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Schemas Found */}
            {result.schemas.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">
                  Schemas Found ({result.schemas.length})
                </h2>
                <div className="space-y-4">
                  {result.schemas.map((schema, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-lg ${
                        schema.isValid ? 'bg-green-50' : 'bg-red-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className={schema.isValid ? 'text-green-500' : 'text-red-500'}>
                          {schema.isValid ? '✓' : '✗'}
                        </span>
                        <span className="font-semibold text-slate-900">{schema.type}</span>
                      </div>
                      {schema.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-red-700">Errors:</p>
                          <ul className="text-sm text-red-600 list-disc list-inside">
                            {schema.errors.map((err, j) => (
                              <li key={j}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {schema.warnings.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-amber-700">Warnings:</p>
                          <ul className="text-sm text-amber-600 list-disc list-inside">
                            {schema.warnings.map((warn, j) => (
                              <li key={j}>{warn}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Schema Found */}
            {!result.hasSchema && (
              <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">⚠️</span>
                  <div>
                    <h2 className="text-xl font-bold text-amber-900">No JSON-LD Schema Found</h2>
                    <p className="text-amber-700">
                      Adding structured data will significantly improve your AI visibility.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div className="bg-sky-50 rounded-xl border border-sky-200 p-6">
              <h2 className="text-xl font-bold text-sky-900 mb-4">Recommendations</h2>
              <ul className="space-y-2">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sky-800">
                    <span className="text-sky-500">*</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 bg-slate-100 rounded-xl p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Why JSON-LD Matters for AI</h2>
          <p className="text-slate-600 mb-6">
            JSON-LD structured data helps AI assistants understand your content better.
            It provides explicit information about your organization, products, and content that AI can use to give accurate recommendations.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Most Important for AEO</h3>
              <ul className="text-slate-600 text-sm space-y-1">
                <li><strong>Organization</strong> - Your brand identity</li>
                <li><strong>FAQPage</strong> - Q&A for AI assistants</li>
                <li><strong>Product</strong> - Product information</li>
                <li><strong>WebSite</strong> - Site search integration</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Also Valuable</h3>
              <ul className="text-slate-600 text-sm space-y-1">
                <li><strong>Article</strong> - Blog and news content</li>
                <li><strong>HowTo</strong> - Step-by-step guides</li>
                <li><strong>BreadcrumbList</strong> - Site navigation</li>
                <li><strong>LocalBusiness</strong> - Physical locations</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
