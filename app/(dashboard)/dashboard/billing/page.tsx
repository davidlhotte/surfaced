'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface BillingInfo {
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

interface UsageInfo {
  checks: { used: number; limit: number };
  brands: { used: number; limit: number };
  competitors: { used: number; limit: number };
}

// Plan configuration
const PLANS = [
  {
    id: 'FREE',
    name: 'Free',
    price: 0,
    description: 'Get started with basic AI visibility tracking',
    features: [
      '3 checks per month',
      '1 brand',
      '1 competitor',
      'Basic AEO score',
      'Email support',
    ],
    limits: { checks: 3, brands: 1, competitors: 1 },
    cta: 'Current Plan',
    popular: false,
  },
  {
    id: 'STARTER',
    name: 'Starter',
    price: 29,
    description: 'For individuals getting serious about AEO',
    features: [
      '30 checks per month',
      '1 brand',
      '3 competitors',
      'Platform breakdown',
      'Weekly email reports',
      'Priority support',
    ],
    limits: { checks: 30, brands: 1, competitors: 3 },
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    id: 'GROWTH',
    name: 'Growth',
    price: 79,
    description: 'For growing teams tracking multiple brands',
    features: [
      '100 checks per month',
      '3 brands',
      '10 competitors',
      'All platform analytics',
      'Weekly & monthly reports',
      'Share of voice tracking',
      'Team collaboration',
      'Priority support',
    ],
    limits: { checks: 100, brands: 3, competitors: 10 },
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    id: 'SCALE',
    name: 'Scale',
    price: 199,
    description: 'For agencies and enterprises',
    features: [
      '500 checks per month',
      '10 brands',
      '25 competitors',
      'Full analytics suite',
      'Custom reports',
      'API access',
      'White-label reports',
      'Dedicated support',
      'Custom integrations',
    ],
    limits: { checks: 500, brands: 10, competitors: 25 },
    cta: 'Start Free Trial',
    popular: false,
  },
];

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBilling();
  }, []);

  const fetchBilling = async () => {
    try {
      const res = await fetch('/api/auth/universal/me');
      const data = await res.json();
      if (data.user) {
        setBilling({
          plan: data.user.plan,
          status: 'active',
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
        });

        // Set usage from the plan limits (in a real app, fetch actual usage)
        const planLimits = PLANS.find(p => p.id === data.user.plan)?.limits || PLANS[0].limits;
        setUsage({
          checks: { used: 0, limit: planLimits.checks },
          brands: { used: 0, limit: planLimits.brands },
          competitors: { used: 0, limit: planLimits.competitors },
        });
      }
    } catch (error) {
      console.error('Failed to fetch billing:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const currentPlan = PLANS.find(p => p.id === billing?.plan) || PLANS[0];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Billing & Plans</h1>
        <p className="text-slate-600">Manage your subscription and view usage</p>
      </div>

      {/* Current Plan Card */}
      <div className="bg-gradient-to-r from-sky-500 to-cyan-500 rounded-xl p-8 text-white mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sky-100 text-sm mb-1">Current Plan</p>
            <h2 className="text-3xl font-bold">{currentPlan.name}</h2>
            <p className="text-sky-100 mt-2">{currentPlan.description}</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold">
              ${currentPlan.price}
              <span className="text-lg font-normal text-sky-100">/month</span>
            </p>
            {billing?.plan !== 'FREE' && (
              <p className="text-sky-100 text-sm mt-1">
                Next billing: Feb 1, 2025
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Usage Meters */}
      {usage && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Usage This Month</h2>
          <div className="space-y-6">
            {/* Checks Usage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="font-medium text-slate-900">AI Checks</span>
                </div>
                <span className={`font-bold ${
                  usage.checks.used >= usage.checks.limit * 0.9 ? 'text-red-600' :
                  usage.checks.used >= usage.checks.limit * 0.7 ? 'text-amber-600' :
                  'text-slate-700'
                }`}>
                  {usage.checks.used} / {usage.checks.limit}
                </span>
              </div>
              <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    usage.checks.used >= usage.checks.limit * 0.9 ? 'bg-red-500' :
                    usage.checks.used >= usage.checks.limit * 0.7 ? 'bg-amber-500' :
                    'bg-sky-500'
                  }`}
                  style={{ width: `${Math.min((usage.checks.used / usage.checks.limit) * 100, 100)}%` }}
                />
              </div>
              {usage.checks.used >= usage.checks.limit * 0.8 && (
                <p className="text-sm text-amber-600 mt-1">
                  {usage.checks.limit - usage.checks.used} checks remaining
                </p>
              )}
            </div>

            {/* Brands Usage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="font-medium text-slate-900">Brands</span>
                </div>
                <span className={`font-bold ${
                  usage.brands.used >= usage.brands.limit ? 'text-amber-600' : 'text-slate-700'
                }`}>
                  {usage.brands.used} / {usage.brands.limit}
                </span>
              </div>
              <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    usage.brands.used >= usage.brands.limit ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min((usage.brands.used / usage.brands.limit) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Competitors Usage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="font-medium text-slate-900">Competitors</span>
                </div>
                <span className={`font-bold ${
                  usage.competitors.used >= usage.competitors.limit ? 'text-amber-600' : 'text-slate-700'
                }`}>
                  {usage.competitors.used} / {usage.competitors.limit}
                </span>
              </div>
              <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    usage.competitors.used >= usage.competitors.limit ? 'bg-amber-500' : 'bg-purple-500'
                  }`}
                  style={{ width: `${Math.min((usage.competitors.used / usage.competitors.limit) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <p className="text-sm text-slate-500 mt-6 pt-4 border-t border-slate-200">
            Usage resets on the 1st of each month. Upgrade your plan to get more checks and features.
          </p>
        </div>
      )}

      {/* Plans Grid */}
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Available Plans</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {PLANS.map((plan) => {
          const isCurrentPlan = plan.id === billing?.plan;
          const planIndex = PLANS.findIndex(p => p.id === plan.id);
          const currentPlanIndex = PLANS.findIndex(p => p.id === billing?.plan);
          const isDowngrade = planIndex < currentPlanIndex;

          return (
            <div
              key={plan.id}
              className={`bg-white rounded-xl border-2 p-6 relative ${
                plan.popular ? 'border-sky-500 shadow-lg' : 'border-slate-200'
              } ${isCurrentPlan ? 'ring-2 ring-sky-500 ring-offset-2' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-sky-500 text-white text-xs font-semibold rounded-full">
                  Most Popular
                </div>
              )}
              {isCurrentPlan && (
                <div className="absolute -top-3 right-4 px-3 py-1 bg-emerald-500 text-white text-xs font-semibold rounded-full">
                  Current
                </div>
              )}

              <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
              <p className="text-sm text-slate-500 mt-1 h-10">{plan.description}</p>

              <div className="mt-4 mb-6">
                <span className="text-3xl font-bold text-slate-900">${plan.price}</span>
                <span className="text-slate-500">/month</span>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.slice(0, 5).map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-600">{feature}</span>
                  </li>
                ))}
                {plan.features.length > 5 && (
                  <li className="text-sm text-sky-600 font-medium pl-7">
                    +{plan.features.length - 5} more features
                  </li>
                )}
              </ul>

              {isCurrentPlan ? (
                <button
                  disabled
                  className="w-full py-3 px-4 bg-slate-100 text-slate-400 font-semibold rounded-lg cursor-not-allowed"
                >
                  Current Plan
                </button>
              ) : isDowngrade ? (
                <button
                  className="w-full py-3 px-4 border border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Downgrade
                </button>
              ) : (
                <button
                  className={`w-full py-3 px-4 font-semibold rounded-lg transition-all hover:scale-105 ${
                    plan.popular
                      ? 'text-white'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                  style={plan.popular ? { background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)' } : undefined}
                >
                  {plan.cta}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Payment Methods & Invoice History */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Payment Method</h2>
          {billing?.plan === 'FREE' ? (
            <div className="text-center py-8 text-slate-500">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <p className="font-medium">No payment method</p>
              <p className="text-sm mt-1">Add a payment method when you upgrade</p>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-6 bg-slate-800 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">VISA</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">**** **** **** 4242</p>
                  <p className="text-sm text-slate-500">Expires 12/26</p>
                </div>
              </div>
              <button className="text-sky-600 hover:text-sky-700 text-sm font-medium">
                Change
              </button>
            </div>
          )}
        </div>

        {/* Invoice History */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Invoice History</h2>
          {billing?.plan === 'FREE' ? (
            <div className="text-center py-8 text-slate-500">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="font-medium">No invoices</p>
              <p className="text-sm mt-1">Invoices will appear here when you upgrade</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">Jan 2025</p>
                  <p className="text-sm text-slate-500">Growth Plan</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-slate-900">$79.00</span>
                  <button className="text-sky-600 hover:text-sky-700 text-sm">
                    Download
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-8 bg-slate-50 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Frequently Asked Questions</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-slate-900">Can I change plans anytime?</h3>
            <p className="text-sm text-slate-500 mt-1">
              Yes! Upgrade anytime and your billing will be prorated. Downgrade at the end of your billing cycle.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-slate-900">What happens if I exceed my limits?</h3>
            <p className="text-sm text-slate-500 mt-1">
              You won&apos;t be able to run more checks until your cycle resets or you upgrade your plan.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-slate-900">Is there a free trial?</h3>
            <p className="text-sm text-slate-500 mt-1">
              All paid plans include a 14-day free trial. No credit card required to start.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-slate-900">Can I cancel anytime?</h3>
            <p className="text-sm text-slate-500 mt-1">
              Absolutely. Cancel anytime with no questions asked. Your data is kept for 30 days.
            </p>
          </div>
        </div>
      </div>

      {/* Shopify Link */}
      <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">Shopify Merchant?</h3>
            <p className="text-sm text-slate-600">Get product-level optimization with our Shopify app</p>
          </div>
          <Link
            href="/shopify"
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Learn More
          </Link>
        </div>
      </div>

      {/* Support Link */}
      <div className="mt-6 text-center">
        <p className="text-slate-500">
          Have questions about billing?{' '}
          <Link href="/support" className="text-sky-600 hover:text-sky-700 font-medium">
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  );
}
