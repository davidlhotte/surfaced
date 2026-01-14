'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

// Check if we should redirect (computed once, outside component)
function shouldRedirect(): boolean {
  if (typeof window === 'undefined') return false;
  const urlParams = new URLSearchParams(window.location.search);
  const host = urlParams.get('host');
  const embedded = urlParams.get('embedded');
  const shop = urlParams.get('shop');
  return !!(host || embedded === '1' || shop);
}

export default function Home() {
  const hasCheckedRedirect = useRef(false);

  useEffect(() => {
    // Only check once to avoid loops
    if (hasCheckedRedirect.current) return;
    hasCheckedRedirect.current = true;

    const urlParams = new URLSearchParams(window.location.search);
    const host = urlParams.get('host');
    const shop = urlParams.get('shop');
    const embedded = urlParams.get('embedded');

    if (host || embedded === '1') {
      const adminUrl = `/admin${window.location.search}`;
      window.location.href = adminUrl;
      return;
    }

    if (shop && !host) {
      window.location.href = `/api/auth?shop=${shop}`;
      return;
    }
  }, []);

  if (shouldRedirect()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
        <div className="text-white text-center">
          <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-semibold text-slate-900">Surfaced</span>
            </div>
            <nav className="flex items-center gap-6">
              <a href="#features" className="text-slate-600 hover:text-slate-900 transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-slate-600 hover:text-slate-900 transition-colors">
                Pricing
              </a>
              <a
                href="https://apps.shopify.com/surfaced"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Install Free
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl font-bold text-slate-900 mb-6">
          Your Shopify App Template
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
          A complete foundation for building Shopify apps with authentication,
          billing, webhooks, and more. Built with Next.js, Prisma, and Polaris.
        </p>
        <div className="flex items-center justify-center gap-4">
          <a
            href="https://apps.shopify.com/surfaced"
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Install on Shopify
          </a>
          <a
            href="https://github.com/davidlhotte/surfaced"
            className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
          >
            View on GitHub
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
          Built-in Features
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "Shopify OAuth",
              description: "Complete authentication flow with session management and token encryption.",
            },
            {
              title: "Billing Integration",
              description: "Ready-to-use subscription plans with Shopify billing API.",
            },
            {
              title: "Webhook Handling",
              description: "GDPR-compliant webhooks with HMAC validation.",
            },
            {
              title: "Polaris UI",
              description: "Beautiful admin interface with Shopify Polaris components.",
            },
            {
              title: "Database Ready",
              description: "Prisma ORM with PostgreSQL for reliable data storage.",
            },
            {
              title: "Error Tracking",
              description: "Sentry integration for monitoring and debugging.",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="p-6 bg-white rounded-xl border border-slate-200 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
          Simple Pricing
        </h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { name: "Free", price: "$0", features: ["Basic features", "Community support"] },
            { name: "Starter", price: "$4.99", features: ["Everything in Free", "More features"] },
            { name: "Pro", price: "$9.99", features: ["Everything in Starter", "Advanced features"], highlight: true },
            { name: "Business", price: "$24.99", features: ["Everything in Pro", "Priority support"] },
          ].map((plan, i) => (
            <div
              key={i}
              className={`p-6 rounded-xl border ${
                plan.highlight
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                {plan.name}
              </h3>
              <p className="text-2xl font-bold text-slate-900 mb-4">
                {plan.price}
                <span className="text-sm font-normal text-slate-500">/month</span>
              </p>
              <ul className="space-y-2">
                {plan.features.map((feature, j) => (
                  <li key={j} className="text-sm text-slate-600 flex items-center gap-2">
                    <span className="text-green-500">+</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">S</span>
              </div>
              <span className="text-slate-900 font-medium">Surfaced</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <Link href="/privacy" className="hover:text-slate-900">Privacy</Link>
              <Link href="/terms" className="hover:text-slate-900">Terms</Link>
              <span>&copy; {new Date().getFullYear()}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
