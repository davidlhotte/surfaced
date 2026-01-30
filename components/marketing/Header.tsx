'use client';

import { useState } from 'react';
import Link from 'next/link';

export function MarketingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#0A1628', boxShadow: '0 4px 14px rgba(14, 165, 233, 0.25)' }}>
              <svg viewBox="0 0 64 64" width="28" height="28" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="headerGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0EA5E9"/>
                    <stop offset="100%" stopColor="#38BDF8"/>
                  </linearGradient>
                </defs>
                <path d="M10 46 Q20 38 32 38 Q44 38 54 46 Q44 30 32 30 Q20 30 10 46 Z" fill="url(#headerGrad)" opacity="0.3"/>
                <path d="M8 40 Q18 28 32 28 Q46 28 56 40 Q46 20 32 20 Q18 20 8 40 Z" fill="url(#headerGrad)" opacity="0.5"/>
                <path d="M6 34 Q16 18 32 18 Q48 18 58 34 Q48 12 32 12 Q16 12 6 34 Z" fill="url(#headerGrad)"/>
                <circle cx="32" cy="16" r="4" fill="#38BDF8"/>
              </svg>
            </div>
            <span className="text-xl font-bold" style={{ color: '#0A1628' }}>surfaced</span>
            <span className="hidden sm:inline-flex ml-2 px-2 py-0.5 text-xs font-medium rounded-full" style={{ background: '#E0F2FE', color: '#0EA5E9' }}>
              AEO Platform
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/check" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
              AI Checker
            </Link>
            <Link href="/score" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
              AEO Score
            </Link>
            <Link href="/compare" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
              Compare
            </Link>
            <Link href="/pricing" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
              Pricing
            </Link>
            <Link href="/blog" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
              Blog
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Link
              href="/shopify"
              className="hidden sm:inline-flex text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              For Shopify
            </Link>
            <Link
              href="/login"
              className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all"
              style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)', boxShadow: '0 4px 14px rgba(14, 165, 233, 0.4)' }}
            >
              Get Started Free
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Menu"
            >
              <svg className="w-6 h-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu panel */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 py-4">
            <nav className="flex flex-col gap-2">
              <Link
                href="/check"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
              >
                AI Visibility Checker
              </Link>
              <Link
                href="/score"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
              >
                AEO Score
              </Link>
              <Link
                href="/compare"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Compare
              </Link>
              <Link
                href="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/blog"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Blog
              </Link>
              <div className="border-t border-slate-100 mt-2 pt-2">
                <Link
                  href="/shopify"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors block"
                >
                  For Shopify Merchants
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors block"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="mx-4 mt-2 px-4 py-3 text-center font-semibold text-white rounded-lg transition-all block"
                  style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)' }}
                >
                  Get Started Free
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
