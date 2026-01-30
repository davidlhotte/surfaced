'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  const plans = [
    {
      name: 'Free',
      price: 0,
      annualPrice: 0,
      description: 'For exploring AI visibility',
      features: [
        '3 AI visibility checks/month',
        '1 AEO score analysis',
        '1 competitor comparison',
        'Basic recommendations',
        'Email support',
      ],
      limitations: [
        'No historical tracking',
        'No alerts',
        'No API access',
      ],
      cta: 'Get Started Free',
      ctaLink: '/signup',
      popular: false,
    },
    {
      name: 'Starter',
      price: 29,
      annualPrice: 24,
      description: 'For small brands & startups',
      features: [
        '30 AI visibility checks/month',
        'Unlimited AEO score analyses',
        '3 competitors tracked',
        '1 brand monitored',
        'Weekly email reports',
        'llms.txt generator',
        'JSON-LD templates',
        'Priority email support',
      ],
      limitations: [],
      cta: 'Start Free Trial',
      ctaLink: '/signup?plan=starter',
      popular: false,
    },
    {
      name: 'Growth',
      price: 79,
      annualPrice: 66,
      description: 'For growing businesses',
      features: [
        '100 AI visibility checks/month',
        'Unlimited AEO score analyses',
        '10 competitors tracked',
        '3 brands monitored',
        'Daily monitoring & alerts',
        'Historical trend data',
        'Custom JSON-LD schemas',
        'Share of Voice reports',
        'Slack notifications',
        'Priority support',
      ],
      limitations: [],
      cta: 'Start Free Trial',
      ctaLink: '/signup?plan=growth',
      popular: true,
    },
    {
      name: 'Scale',
      price: 149,
      annualPrice: 124,
      description: 'For agencies & enterprises',
      features: [
        '500 AI visibility checks/month',
        'Unlimited everything',
        '25 competitors tracked',
        '10 brands monitored',
        'Real-time monitoring',
        'API access',
        'White-label reports',
        'Custom integrations',
        'Dedicated account manager',
        'SLA guarantee',
      ],
      limitations: [],
      cta: 'Contact Sales',
      ctaLink: '/contact',
      popular: false,
    },
  ];

  const faqs = [
    {
      q: 'What counts as an AI visibility check?',
      a: 'One AI visibility check queries all four AI platforms (ChatGPT, Claude, Perplexity, Gemini) for a single brand or product. Each query to all platforms counts as one check.',
    },
    {
      q: 'Can I upgrade or downgrade my plan?',
      a: 'Yes! You can upgrade anytime and get prorated access to new features. Downgrading takes effect at your next billing cycle.',
    },
    {
      q: 'Is there a free trial?',
      a: 'Yes, all paid plans include a 14-day free trial with full access to features. No credit card required to start.',
    },
    {
      q: 'What payment methods do you accept?',
      a: 'We accept all major credit cards (Visa, Mastercard, Amex) via Stripe. Enterprise customers can also pay by invoice.',
    },
    {
      q: 'Do you offer refunds?',
      a: 'Yes, we offer a 30-day money-back guarantee if you\'re not satisfied with our service.',
    },
    {
      q: 'What\'s the difference between Universal and Shopify plans?',
      a: 'Universal plans work with any website. Shopify plans include additional features like product catalog sync, automatic JSON-LD injection, and Shopify billing integration. Check out our Shopify-specific pricing at /shopify.',
    },
  ];

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
            Start free, upgrade as you grow. All plans include a 14-day free trial.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm ${!annual ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                annual ? 'bg-sky-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  annual ? 'left-8' : 'left-1'
                }`}
              />
            </button>
            <span className={`text-sm ${annual ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
              Annual
              <span className="ml-1 text-emerald-600 font-medium">(Save 20%)</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-6 ${
                plan.popular
                  ? 'bg-gradient-to-b from-sky-500 to-cyan-500 text-white ring-4 ring-sky-500 ring-offset-4 scale-105'
                  : 'bg-white border border-slate-200'
              }`}
            >
              {plan.popular && (
                <span className="inline-block px-3 py-1 text-xs font-bold bg-amber-400 text-amber-900 rounded-full mb-4">
                  Most Popular
                </span>
              )}
              <h3 className={`text-xl font-bold ${plan.popular ? 'text-white' : 'text-slate-900'}`}>
                {plan.name}
              </h3>
              <div className="mt-4 mb-2">
                <span className={`text-4xl font-bold ${plan.popular ? 'text-white' : 'text-slate-900'}`}>
                  ${annual ? plan.annualPrice : plan.price}
                </span>
                {plan.price > 0 && (
                  <span className={plan.popular ? 'text-sky-200' : 'text-slate-500'}>/month</span>
                )}
              </div>
              <p className={`text-sm ${plan.popular ? 'text-sky-200' : 'text-slate-500'} mb-6`}>
                {plan.description}
              </p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className={`flex items-start gap-2 text-sm ${plan.popular ? 'text-sky-100' : 'text-slate-600'}`}>
                    <svg className={`w-5 h-5 flex-shrink-0 ${plan.popular ? 'text-sky-300' : 'text-emerald-500'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
                {plan.limitations.map((limitation, i) => (
                  <li key={i} className={`flex items-start gap-2 text-sm ${plan.popular ? 'text-sky-300/70' : 'text-slate-400'}`}>
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    {limitation}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.ctaLink}
                className={`block w-full py-3 text-center font-semibold rounded-xl transition-all ${
                  plan.popular
                    ? 'bg-white text-sky-600 hover:bg-sky-50'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Enterprise CTA */}
        <div className="bg-slate-900 rounded-2xl p-8 md:p-12 text-white text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Need more?</h2>
          <p className="text-slate-400 mb-6 max-w-2xl mx-auto">
            For agencies, large enterprises, or custom requirements, we offer tailored solutions with unlimited checks, dedicated support, and custom integrations.
          </p>
          <Link
            href="/contact"
            className="inline-block px-8 py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-colors"
          >
            Contact Sales
          </Link>
        </div>

        {/* Shopify Merchants */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8 text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <svg className="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <h2 className="text-2xl font-bold text-slate-900">Shopify Merchant?</h2>
          </div>
          <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
            Get additional features like automatic product sync, theme integration, and Shopify billing.
          </p>
          <Link
            href="/shopify"
            className="inline-block px-8 py-4 font-bold rounded-xl transition-colors text-white"
            style={{ background: 'linear-gradient(135deg, #95BF47 0%, #5E8E3E 100%)' }}
          >
            View Shopify Plans
          </Link>
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <span className="font-semibold text-slate-900">{faq.q}</span>
                  <svg
                    className={`w-5 h-5 text-slate-500 transition-transform ${openFaq === index ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === index && (
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                    <p className="text-slate-600 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center mt-16">
          <p className="text-slate-600 mb-4">Ready to get started?</p>
          <Link
            href="/signup"
            className="inline-block px-8 py-4 text-lg font-semibold text-white rounded-xl transition-all hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)', boxShadow: '0 8px 24px rgba(14, 165, 233, 0.4)' }}
          >
            Start Your Free Trial
          </Link>
          <p className="text-sm text-slate-500 mt-3">No credit card required</p>
        </div>
      </div>
    </div>
  );
}
