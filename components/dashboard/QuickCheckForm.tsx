'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Brand {
  id: string;
  name: string;
  domain: string | null;
}

interface QuickCheckFormProps {
  brands: Brand[];
}

const PLATFORMS = [
  { id: 'chatgpt', name: 'ChatGPT', color: '#10a37f', enabled: true },
  { id: 'claude', name: 'Claude', color: '#d97757', enabled: true },
  { id: 'perplexity', name: 'Perplexity', color: '#20808D', enabled: true },
  { id: 'gemini', name: 'Gemini', color: '#4285f4', enabled: true },
];

export function QuickCheckForm({ brands }: QuickCheckFormProps) {
  const router = useRouter();
  const [selectedBrand, setSelectedBrand] = useState(brands[0]?.id || '');
  const [customBrand, setCustomBrand] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['chatgpt', 'claude', 'perplexity', 'gemini']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  const handlePlatformToggle = (platformId: string) => {
    if (selectedPlatforms.includes(platformId)) {
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter(p => p !== platformId));
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, platformId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const brandToCheck = useCustom ? customBrand : brands.find(b => b.id === selectedBrand)?.name;

    if (!brandToCheck?.trim()) {
      setError('Please enter a brand name');
      return;
    }

    if (selectedPlatforms.length === 0) {
      setError('Please select at least one platform');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Navigate to check page with params
      const params = new URLSearchParams({
        brand: brandToCheck,
        platforms: selectedPlatforms.join(','),
        ...(selectedBrand && !useCustom ? { brandId: selectedBrand } : {}),
      });

      router.push(`/check?${params.toString()}`);
    } catch {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
      <h2 className="font-semibold text-slate-900 mb-4">Quick Check</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Brand Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select Brand
          </label>

          {brands.length > 0 && !useCustom ? (
            <div className="space-y-2">
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              >
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name} {brand.domain ? `(${brand.domain})` : ''}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setUseCustom(true)}
                className="text-sm text-sky-600 hover:text-sky-700"
              >
                Or check a different brand
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                value={customBrand}
                onChange={(e) => {
                  setCustomBrand(e.target.value);
                  setError('');
                }}
                placeholder="Enter brand name..."
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
              {brands.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setUseCustom(false);
                    setCustomBrand('');
                  }}
                  className="text-sm text-sky-600 hover:text-sky-700"
                >
                  Select from my brands
                </button>
              )}
            </div>
          )}
        </div>

        {/* Platform Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Platforms to Check
          </label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((platform) => (
              <button
                key={platform.id}
                type="button"
                onClick={() => handlePlatformToggle(platform.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  selectedPlatforms.includes(platform.id)
                    ? 'border-sky-500 bg-sky-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div
                  className="w-5 h-5 rounded flex items-center justify-center"
                  style={{ backgroundColor: platform.color }}
                >
                  <span className="text-white text-xs font-bold">
                    {platform.name.charAt(0)}
                  </span>
                </div>
                <span className={`text-sm font-medium ${
                  selectedPlatforms.includes(platform.id) ? 'text-sky-700' : 'text-slate-600'
                }`}>
                  {platform.name}
                </span>
                {selectedPlatforms.includes(platform.id) && (
                  <svg className="w-4 h-4 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
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
          style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)' }}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Running Check...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Run AI Check
            </span>
          )}
        </button>
      </form>
    </div>
  );
}
