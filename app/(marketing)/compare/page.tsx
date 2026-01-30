'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ComparisonResult {
  query: string;
  yourBrand: { position: number | null; mentioned: boolean };
  competitor: { position: number | null; mentioned: boolean };
  platform: string;
}

export default function ComparePage() {
  const [yourBrand, setYourBrand] = useState('');
  const [competitor, setCompetitor] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ComparisonResult[] | null>(null);
  const [yourScore, setYourScore] = useState(0);
  const [competitorScore, setCompetitorScore] = useState(0);

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yourBrand.trim() || !competitor.trim()) return;

    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Mock results
    const queries = [
      `Best ${yourBrand.toLowerCase()} alternatives`,
      `${yourBrand} vs ${competitor}`,
      `Top brands in this category`,
      `Which is better ${yourBrand} or ${competitor}`,
    ];

    const platforms = ['ChatGPT', 'Claude', 'Perplexity', 'Gemini'];

    const mockResults: ComparisonResult[] = [];
    let yourTotal = 0;
    let compTotal = 0;

    queries.forEach(query => {
      platforms.forEach(platform => {
        const yourMentioned = Math.random() > 0.3;
        const compMentioned = Math.random() > 0.3;
        const yourPos = yourMentioned ? Math.floor(Math.random() * 5) + 1 : null;
        const compPos = compMentioned ? Math.floor(Math.random() * 5) + 1 : null;

        mockResults.push({
          query,
          platform,
          yourBrand: { position: yourPos, mentioned: yourMentioned },
          competitor: { position: compPos, mentioned: compMentioned },
        });

        if (yourMentioned) yourTotal += (6 - (yourPos || 5));
        if (compMentioned) compTotal += (6 - (compPos || 5));
      });
    });

    const maxScore = queries.length * platforms.length * 5;
    setYourScore(Math.round((yourTotal / maxScore) * 100));
    setCompetitorScore(Math.round((compTotal / maxScore) * 100));
    setResults(mockResults);
    setIsLoading(false);
  };

  const getWinner = () => {
    if (yourScore > competitorScore) return 'you';
    if (competitorScore > yourScore) return 'competitor';
    return 'tie';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full text-amber-800 text-sm font-medium mb-6">
            <span className="text-lg">⚔️</span>
            Free AI Visibility Battle
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            Compare Your AI Visibility
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            See how your brand stacks up against a competitor in AI search results.
          </p>
        </div>

        {/* Comparison Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 mb-12">
          <form onSubmit={handleCompare}>
            <div className="grid md:grid-cols-2 gap-8 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Your Brand
                </label>
                <input
                  type="text"
                  value={yourBrand}
                  onChange={(e) => setYourBrand(e.target.value)}
                  placeholder="e.g., Nike"
                  className="w-full px-6 py-4 text-lg border-2 border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none transition-colors"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Competitor
                </label>
                <input
                  type="text"
                  value={competitor}
                  onChange={(e) => setCompetitor(e.target.value)}
                  placeholder="e.g., Adidas"
                  className="w-full px-6 py-4 text-lg border-2 border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none transition-colors"
                  disabled={isLoading}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading || !yourBrand.trim() || !competitor.trim()}
              className="w-full px-8 py-4 text-lg font-semibold text-white rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', boxShadow: '0 8px 24px rgba(245, 158, 11, 0.4)' }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span>
                  Comparing across AI platforms...
                </span>
              ) : (
                'Compare AI Visibility'
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        {results && (
          <>
            {/* Score Summary */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 mb-8">
              <div className="grid md:grid-cols-3 gap-8 items-center">
                <div className="text-center">
                  <p className="text-sm text-slate-500 mb-2">Your Brand</p>
                  <p className="text-2xl font-bold text-slate-900 mb-2">{yourBrand}</p>
                  <div className={`text-5xl font-bold ${
                    getWinner() === 'you' ? 'text-emerald-500' : 'text-slate-400'
                  }`}>
                    {yourScore}
                  </div>
                  <p className="text-sm text-slate-500">AI Score</p>
                </div>

                <div className="text-center">
                  <div className="text-6xl mb-2">⚔️</div>
                  <p className={`text-lg font-bold ${
                    getWinner() === 'you' ? 'text-emerald-600' :
                    getWinner() === 'competitor' ? 'text-red-600' :
                    'text-amber-600'
                  }`}>
                    {getWinner() === 'you' ? 'You Win!' :
                     getWinner() === 'competitor' ? `${competitor} Wins` :
                     'It\'s a Tie!'}
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-sm text-slate-500 mb-2">Competitor</p>
                  <p className="text-2xl font-bold text-slate-900 mb-2">{competitor}</p>
                  <div className={`text-5xl font-bold ${
                    getWinner() === 'competitor' ? 'text-red-500' : 'text-slate-400'
                  }`}>
                    {competitorScore}
                  </div>
                  <p className="text-sm text-slate-500">AI Score</p>
                </div>
              </div>
            </div>

            {/* Detailed Results */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-8">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900">Query-by-Query Breakdown</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Query</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Platform</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">{yourBrand}</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">{competitor}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {results.slice(0, 8).map((result, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm text-slate-900">{result.query}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{result.platform}</td>
                        <td className="px-6 py-4 text-center">
                          {result.yourBrand.mentioned ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              #{result.yourBrand.position}
                            </span>
                          ) : (
                            <span className="text-red-500">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {result.competitor.mentioned ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              #{result.competitor.position}
                            </span>
                          ) : (
                            <span className="text-red-500">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Insights */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 mb-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Key Insights</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm flex-shrink-0">1</span>
                  <span className="text-slate-700">
                    {getWinner() === 'you'
                      ? `${yourBrand} has stronger AI visibility than ${competitor}. Focus on maintaining your lead.`
                      : getWinner() === 'competitor'
                      ? `${competitor} currently outranks ${yourBrand} in AI recommendations. Consider improving your AEO strategy.`
                      : `Both brands have similar AI visibility. Small improvements could give you the edge.`
                    }
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm flex-shrink-0">2</span>
                  <span className="text-slate-700">
                    Track these comparisons weekly to monitor competitive shifts in AI recommendations.
                  </span>
                </li>
              </ul>
            </div>
          </>
        )}

        {/* Related Tools */}
        <div className="text-center">
          <p className="text-slate-600 mb-4">Want deeper insights?</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/check"
              className="px-6 py-3 bg-white border border-slate-200 rounded-lg text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors"
            >
              Check AI Visibility
            </Link>
            <Link
              href="/score"
              className="px-6 py-3 bg-white border border-slate-200 rounded-lg text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors"
            >
              Get AEO Score
            </Link>
            <Link
              href="/signup"
              className="px-6 py-3 text-white font-semibold rounded-lg transition-colors"
              style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)' }}
            >
              Track Competitors Weekly
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
