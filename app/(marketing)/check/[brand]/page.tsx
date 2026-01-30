'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface AIResult {
  platform: string;
  logo: string;
  mentioned: boolean;
  position: number | null;
  snippet: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export default function CheckResultsPage() {
  const params = useParams();
  const brand = decodeURIComponent(params.brand as string);
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<AIResult[]>([]);
  const [aeoScore, setAeoScore] = useState(0);
  const [email, setEmail] = useState('');
  const [showEmailCapture, setShowEmailCapture] = useState(false);

  useEffect(() => {
    // Simulate API call - in production, this would call the actual API
    const checkVisibility = async () => {
      setIsLoading(true);

      // Simulate loading time
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock results - in production, this would come from the API
      const mockResults: AIResult[] = [
        {
          platform: 'ChatGPT',
          logo: '🤖',
          mentioned: Math.random() > 0.3,
          position: Math.random() > 0.3 ? Math.floor(Math.random() * 5) + 1 : null,
          snippet: `${brand} is known for its innovative approach to...`,
          sentiment: 'positive',
        },
        {
          platform: 'Claude',
          logo: '🧠',
          mentioned: Math.random() > 0.4,
          position: Math.random() > 0.4 ? Math.floor(Math.random() * 5) + 1 : null,
          snippet: `Based on my knowledge, ${brand} offers...`,
          sentiment: 'neutral',
        },
        {
          platform: 'Perplexity',
          logo: '🔍',
          mentioned: Math.random() > 0.3,
          position: Math.random() > 0.3 ? Math.floor(Math.random() * 5) + 1 : null,
          snippet: `According to sources, ${brand} is a leading...`,
          sentiment: 'positive',
        },
        {
          platform: 'Gemini',
          logo: '✨',
          mentioned: Math.random() > 0.5,
          position: Math.random() > 0.5 ? Math.floor(Math.random() * 5) + 1 : null,
          snippet: `${brand} has been recognized for...`,
          sentiment: 'neutral',
        },
      ];

      setResults(mockResults);

      // Calculate AEO score based on results
      const mentionedCount = mockResults.filter(r => r.mentioned).length;
      const avgPosition = mockResults
        .filter(r => r.position)
        .reduce((acc, r) => acc + (r.position || 0), 0) / Math.max(mockResults.filter(r => r.position).length, 1);

      const score = Math.round(
        (mentionedCount / mockResults.length) * 50 +
        (avgPosition ? (6 - avgPosition) / 5 * 50 : 0)
      );

      setAeoScore(score);
      setIsLoading(false);

      // Show email capture after a delay
      setTimeout(() => setShowEmailCapture(true), 3000);
    };

    checkVisibility();
  }, [brand]);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Submit email to API
    alert('Thanks! We\'ll send you the full report.');
    setShowEmailCapture(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-500';
    if (score >= 40) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return 'Excellent';
    if (score >= 40) return 'Needs Improvement';
    return 'Critical';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Checking AI Visibility</h2>
          <p className="text-slate-600">Querying ChatGPT, Claude, Perplexity, and Gemini...</p>
          <p className="text-sm text-slate-500 mt-4">Analyzing: <strong>{brand}</strong></p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
            AI Visibility Report
          </h1>
          <p className="text-xl text-slate-600">
            Results for: <strong className="text-slate-900">{brand}</strong>
          </p>
        </div>

        {/* AEO Score Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="text-center">
              <div className={`text-7xl font-bold ${getScoreColor(aeoScore)}`}>
                {aeoScore}
              </div>
              <p className="text-slate-500 mt-1">AEO Score</p>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  aeoScore >= 70 ? 'bg-emerald-100 text-emerald-700' :
                  aeoScore >= 40 ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {getScoreLabel(aeoScore)}
                </span>
              </div>
              <p className="text-slate-600">
                {aeoScore >= 70
                  ? `Great news! ${brand} has strong AI visibility. Keep monitoring to maintain your position.`
                  : aeoScore >= 40
                  ? `${brand} has moderate AI visibility. There's room for improvement.`
                  : `${brand} needs significant AEO work. AI assistants aren't recommending you consistently.`
                }
              </p>
              <div className="mt-4 h-3 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    aeoScore >= 70 ? 'bg-emerald-500' :
                    aeoScore >= 40 ? 'bg-amber-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${aeoScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          {results.map((result) => (
            <div
              key={result.platform}
              className={`bg-white rounded-xl p-6 border-2 ${
                result.mentioned ? 'border-emerald-200' : 'border-red-200'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{result.logo}</span>
                  <h3 className="font-bold text-slate-900">{result.platform}</h3>
                </div>
                {result.mentioned ? (
                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Mentioned
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-600 font-medium">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Not Mentioned
                  </span>
                )}
              </div>

              {result.mentioned && (
                <>
                  {result.position && (
                    <div className="mb-3">
                      <span className="text-sm text-slate-500">Position in response: </span>
                      <span className="font-semibold text-slate-900">#{result.position}</span>
                    </div>
                  )}
                  <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600 italic">
                    &quot;{result.snippet}&quot;
                  </div>
                </>
              )}

              {!result.mentioned && (
                <p className="text-sm text-slate-500">
                  {result.platform} did not mention {brand} in relevant queries. This is an opportunity for improvement.
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Recommendations */}
        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-8 mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Recommendations</h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center text-sm flex-shrink-0">1</span>
              <span className="text-slate-700">Add an <strong>llms.txt</strong> file to help AI crawlers understand your brand</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center text-sm flex-shrink-0">2</span>
              <span className="text-slate-700">Ensure your <strong>robots.txt</strong> allows GPTBot and ClaudeBot access</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center text-sm flex-shrink-0">3</span>
              <span className="text-slate-700">Add <strong>JSON-LD structured data</strong> to your key pages</span>
            </li>
          </ul>
        </div>

        {/* Email Capture */}
        {showEmailCapture && (
          <div className="bg-gradient-to-r from-sky-500 to-cyan-500 rounded-2xl p-8 text-white mb-8">
            <h3 className="text-xl font-bold mb-2">Get the Full Report</h3>
            <p className="text-sky-100 mb-4">
              Receive detailed recommendations and weekly updates on your AI visibility.
            </p>
            <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="flex-1 px-4 py-3 rounded-lg text-slate-900 placeholder-slate-500"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-white text-sky-600 font-bold rounded-lg hover:bg-sky-50 transition-colors"
              >
                Get Full Report
              </button>
            </form>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/check"
            className="px-6 py-3 bg-white border border-slate-200 rounded-lg text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors"
          >
            Check Another Brand
          </Link>
          <Link
            href="/score"
            className="px-6 py-3 bg-white border border-slate-200 rounded-lg text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors"
          >
            Get Full AEO Score
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
  );
}
