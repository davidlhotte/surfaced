'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewBrandPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [industry, setIndustry] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const industries = [
    'Technology',
    'E-commerce',
    'Fashion',
    'Health & Wellness',
    'Food & Beverage',
    'Travel',
    'Finance',
    'Education',
    'Entertainment',
    'Other',
  ];

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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href="/dashboard/brands" className="text-sky-600 hover:text-sky-700 text-sm mb-2 inline-block">
          ← Back to Brands
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Add New Brand</h1>
        <p className="text-slate-600">Enter your brand details to start monitoring AI visibility</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
              Brand Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:border-sky-500 focus:outline-none"
              placeholder="e.g., My Awesome Brand"
            />
          </div>

          <div>
            <label htmlFor="domain" className="block text-sm font-medium text-slate-700 mb-2">
              Website URL
            </label>
            <input
              id="domain"
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:border-sky-500 focus:outline-none"
              placeholder="e.g., example.com"
            />
            <p className="text-sm text-slate-500 mt-1">Optional. Used for AEO score analysis.</p>
          </div>

          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-slate-700 mb-2">
              Industry
            </label>
            <select
              id="industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:border-sky-500 focus:outline-none"
            >
              <option value="">Select an industry</option>
              {industries.map((ind) => (
                <option key={ind} value={ind.toLowerCase()}>{ind}</option>
              ))}
            </select>
            <p className="text-sm text-slate-500 mt-1">Helps us generate better AI prompts for checking.</p>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
              Brand Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:border-sky-500 focus:outline-none resize-none"
              placeholder="Describe what your brand does..."
            />
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 text-white font-semibold rounded-lg disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)' }}
            >
              {isLoading ? 'Creating...' : 'Create Brand'}
            </button>
            <Link
              href="/dashboard/brands"
              className="px-6 py-3 text-slate-600 font-medium hover:text-slate-900"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
