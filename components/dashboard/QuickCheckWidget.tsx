'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function QuickCheckWidget() {
  const router = useRouter();
  const [brandName, setBrandName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) {
      setError('Please enter a brand name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Navigate to the check page with the brand name as a query param
      router.push(`/check?brand=${encodeURIComponent(brandName.trim())}`);
    } catch {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-sky-50 to-cyan-50 rounded-xl border border-sky-100 p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-sky-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 mb-1">Quick AI Check</h3>
          <p className="text-sm text-slate-600 mb-4">
            Check any brand&apos;s AI visibility instantly - no account required
          </p>
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={brandName}
                onChange={(e) => {
                  setBrandName(e.target.value);
                  setError('');
                }}
                placeholder="Enter brand name (e.g., Nike, Shopify)"
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 bg-white"
              />
              {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 text-white font-semibold rounded-lg disabled:opacity-50 transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)' }}
            >
              {isLoading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                'Check'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Platform Icons */}
      <div className="mt-6 pt-4 border-t border-sky-200/50">
        <p className="text-xs text-slate-500 mb-3">We check visibility across:</p>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#10a37f] rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">G</span>
            </div>
            <span className="text-xs text-slate-600">ChatGPT</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#d97757] rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">C</span>
            </div>
            <span className="text-xs text-slate-600">Claude</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#20808D] rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">P</span>
            </div>
            <span className="text-xs text-slate-600">Perplexity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#4285f4] rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">G</span>
            </div>
            <span className="text-xs text-slate-600">Gemini</span>
          </div>
        </div>
      </div>
    </div>
  );
}
