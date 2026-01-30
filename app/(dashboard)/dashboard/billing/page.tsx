'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface BillingInfo {
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingInfo | null>(null);
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
      }
    } catch (error) {
      console.error('Failed to fetch billing:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const plans = [
    {
      name: 'Free',
      value: 'FREE',
      price: 0,
      features: ['3 AI checks/month', '1 brand', 'Basic recommendations'],
    },
    {
      name: 'Starter',
      value: 'STARTER',
      price: 29,
      features: ['30 AI checks/month', '1 brand', '3 competitors', 'llms.txt generator'],
    },
    {
      name: 'Growth',
      value: 'GROWTH',
      price: 79,
      features: ['100 AI checks/month', '3 brands', '10 competitors', 'Weekly reports'],
      popular: true,
    },
    {
      name: 'Scale',
      value: 'SCALE',
      price: 149,
      features: ['500 AI checks/month', '10 brands', '25 competitors', 'API access'],
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const currentPlan = plans.find(p => p.value === billing?.plan) || plans[0];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Billing</h1>
        <p className="text-slate-600">Manage your subscription and billing</p>
      </div>

      {/* Current Plan */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Current Plan</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-slate-900">{currentPlan.name}</p>
            <p className="text-slate-600">
              {currentPlan.price === 0 ? 'Free forever' : `$${currentPlan.price}/month`}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            billing?.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
          }`}>
            {billing?.status || 'active'}
          </span>
        </div>
        <ul className="mt-4 space-y-2">
          {currentPlan.features.map((feature, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
              <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {/* Upgrade Options */}
      {billing?.plan === 'FREE' && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Upgrade Your Plan</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.filter(p => p.value !== 'FREE').map((plan) => (
              <div
                key={plan.value}
                className={`bg-white rounded-xl border p-6 ${
                  plan.popular ? 'border-sky-500 ring-2 ring-sky-500' : 'border-slate-200'
                }`}
              >
                {plan.popular && (
                  <span className="inline-block px-2 py-1 text-xs font-bold bg-sky-500 text-white rounded mb-3">
                    Popular
                  </span>
                )}
                <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  ${plan.price}<span className="text-sm text-slate-500 font-normal">/mo</span>
                </p>
                <ul className="mt-4 space-y-2 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-2 rounded-lg font-semibold transition-colors ${
                    plan.popular
                      ? 'bg-sky-500 text-white hover:bg-sky-600'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Upgrade to {plan.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Methods */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Payment Method</h2>
        {billing?.plan === 'FREE' ? (
          <p className="text-slate-600">No payment method on file. Add one when you upgrade.</p>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-8 bg-slate-100 rounded flex items-center justify-center">
                <span className="text-xs font-bold text-slate-600">VISA</span>
              </div>
              <div>
                <p className="font-medium text-slate-900">•••• •••• •••• 4242</p>
                <p className="text-sm text-slate-500">Expires 12/25</p>
              </div>
            </div>
            <button className="text-sky-600 hover:text-sky-700 text-sm font-medium">
              Update
            </button>
          </div>
        )}
      </div>

      {/* Billing History */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Billing History</h2>
        {billing?.plan === 'FREE' ? (
          <p className="text-slate-600">No billing history. Upgrade to see invoices here.</p>
        ) : (
          <p className="text-slate-600">No invoices yet.</p>
        )}
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
    </div>
  );
}
