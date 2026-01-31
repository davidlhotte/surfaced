'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const INDUSTRIES = [
  { value: 'technology', label: 'Technology', icon: '💻' },
  { value: 'e-commerce', label: 'E-commerce', icon: '🛒' },
  { value: 'fashion', label: 'Fashion & Apparel', icon: '👕' },
  { value: 'health', label: 'Health & Wellness', icon: '💪' },
  { value: 'food', label: 'Food & Beverage', icon: '🍕' },
  { value: 'travel', label: 'Travel & Hospitality', icon: '✈️' },
  { value: 'finance', label: 'Finance & Banking', icon: '💰' },
  { value: 'education', label: 'Education', icon: '📚' },
  { value: 'entertainment', label: 'Entertainment', icon: '🎬' },
  { value: 'real-estate', label: 'Real Estate', icon: '🏠' },
  { value: 'automotive', label: 'Automotive', icon: '🚗' },
  { value: 'saas', label: 'SaaS / Software', icon: '☁️' },
  { value: 'agency', label: 'Agency / Services', icon: '🏢' },
  { value: 'other', label: 'Other', icon: '📦' },
];

export default function NewBrandPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [industry, setIndustry] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Brand name is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/universal/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, domain, industry, description }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create brand');
        setIsLoading(false);
        return;
      }

      router.push(`/dashboard/brands/${data.brand.id}`);
    } catch {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const isStep1Valid = name.trim().length > 0;
  const isStep2Valid = true; // Industry is optional

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href="/dashboard/brands" className="text-sky-600 hover:text-sky-700 text-sm mb-2 inline-flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Brands
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Add New Brand</h1>
        <p className="text-slate-600">Enter your brand details to start monitoring AI visibility</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4 mb-8">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-sky-600' : 'text-slate-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
            step > 1 ? 'bg-sky-500 text-white' : step === 1 ? 'bg-sky-100 text-sky-600' : 'bg-slate-100'
          }`}>
            {step > 1 ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : '1'}
          </div>
          <span className="text-sm font-medium">Basic Info</span>
        </div>
        <div className={`flex-1 h-1 rounded ${step > 1 ? 'bg-sky-500' : 'bg-slate-200'}`} />
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-sky-600' : 'text-slate-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
            step > 2 ? 'bg-sky-500 text-white' : step === 2 ? 'bg-sky-100 text-sky-600' : 'bg-slate-100'
          }`}>
            {step > 2 ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : '2'}
          </div>
          <span className="text-sm font-medium">Details</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-600 text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                  Brand Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError('');
                  }}
                  required
                  autoFocus
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  placeholder="e.g., My Awesome Brand"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Enter your brand name exactly as you want it tracked in AI responses
                </p>
              </div>

              <div>
                <label htmlFor="domain" className="block text-sm font-medium text-slate-700 mb-2">
                  Website URL
                  <span className="text-slate-400 font-normal ml-2">(Recommended)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">https://</span>
                  <input
                    id="domain"
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value.replace(/^https?:\/\//, ''))}
                    className="w-full pl-[72px] pr-4 py-3 border border-slate-200 rounded-lg focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    placeholder="example.com"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Adding your website helps us detect when AI platforms cite your site
                </p>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => isStep1Valid && setStep(2)}
                  disabled={!isStep1Valid}
                  className="flex-1 px-6 py-3 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)' }}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Industry
                  <span className="text-slate-400 font-normal ml-2">(Helps improve AI prompts)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {INDUSTRIES.map((ind) => (
                    <button
                      key={ind.value}
                      type="button"
                      onClick={() => setIndustry(industry === ind.value ? '' : ind.value)}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-all ${
                        industry === ind.value
                          ? 'border-sky-500 bg-sky-50 text-sky-700'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-lg">{ind.icon}</span>
                      <span className="text-sm font-medium">{ind.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
                  Brand Description
                  <span className="text-slate-400 font-normal ml-2">(Optional)</span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 resize-none"
                  placeholder="Tell us what your brand does. This helps us generate better AI prompts for checking visibility..."
                />
                <p className="text-xs text-slate-500 mt-2">
                  {description.length}/500 characters
                </p>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-3 text-slate-600 font-medium hover:text-slate-900 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !isStep2Valid}
                  className="flex-1 px-6 py-3 text-white font-semibold rounded-lg disabled:opacity-50 transition-all hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)' }}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating Brand...
                    </span>
                  ) : (
                    'Create Brand'
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Tips Section */}
      <div className="mt-6 bg-slate-50 rounded-xl p-6 border border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Tips for Better Tracking
        </h3>
        <ul className="space-y-2">
          <li className="flex items-start gap-2 text-sm text-slate-600">
            <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Use your brand&apos;s exact name as it appears on your website
          </li>
          <li className="flex items-start gap-2 text-sm text-slate-600">
            <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Include your website domain for more accurate citation tracking
          </li>
          <li className="flex items-start gap-2 text-sm text-slate-600">
            <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Select your industry to get more relevant AI prompts
          </li>
          <li className="flex items-start gap-2 text-sm text-slate-600">
            <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Add a description to help us understand your brand&apos;s unique value proposition
          </li>
        </ul>
      </div>
    </div>
  );
}
