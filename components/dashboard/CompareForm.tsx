'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Brand {
  id: string;
  name: string;
  domain: string | null;
}

interface CompareFormProps {
  brands: Brand[];
}

export function CompareForm({ brands }: CompareFormProps) {
  const router = useRouter();
  const [yourBrand, setYourBrand] = useState(brands[0]?.id || '');
  const [competitorName, setCompetitorName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [useCustomBrand, setUseCustomBrand] = useState(false);
  const [customYourBrand, setCustomYourBrand] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const yourBrandName = useCustomBrand
      ? customYourBrand
      : brands.find(b => b.id === yourBrand)?.name;

    if (!yourBrandName?.trim()) {
      setError('Please enter your brand name');
      return;
    }

    if (!competitorName.trim()) {
      setError('Please enter a competitor name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Navigate to compare page with params
      const params = new URLSearchParams({
        brand1: yourBrandName,
        brand2: competitorName,
      });

      router.push(`/compare?${params.toString()}`);
    } catch {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
      <h2 className="font-semibold text-slate-900 mb-4">Quick Compare</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Your Brand */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Your Brand
            </label>
            {brands.length > 0 && !useCustomBrand ? (
              <div className="space-y-2">
                <select
                  value={yourBrand}
                  onChange={(e) => setYourBrand(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                >
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setUseCustomBrand(true)}
                  className="text-xs text-sky-600 hover:text-sky-700"
                >
                  Or enter a different brand
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={customYourBrand}
                  onChange={(e) => {
                    setCustomYourBrand(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter your brand name..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
                {brands.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setUseCustomBrand(false);
                      setCustomYourBrand('');
                    }}
                    className="text-xs text-sky-600 hover:text-sky-700"
                  >
                    Select from my brands
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Competitor */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Competitor
            </label>
            <input
              type="text"
              value={competitorName}
              onChange={(e) => {
                setCompetitorName(e.target.value);
                setError('');
              }}
              placeholder="Enter competitor name..."
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-6 py-3 text-white font-semibold rounded-lg disabled:opacity-50 transition-all hover:scale-[1.02]"
          style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)' }}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Comparing...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Compare AI Visibility
            </span>
          )}
        </button>
      </form>
    </div>
  );
}
