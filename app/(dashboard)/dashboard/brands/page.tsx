import { getUniversalUser } from '@/lib/auth/universal';
import prisma from '@/lib/db/client';
import Link from 'next/link';

// Plan limits for reference
const PLAN_LIMITS = {
  FREE: { checks: 3, brands: 1, competitors: 1 },
  STARTER: { checks: 30, brands: 1, competitors: 3 },
  GROWTH: { checks: 100, brands: 3, competitors: 10 },
  SCALE: { checks: 500, brands: 10, competitors: 25 },
};

export default async function BrandsPage() {
  const user = await getUniversalUser();
  if (!user) return null;

  const brands = await prisma.brand.findMany({
    where: { userId: user.userId },
    include: {
      _count: {
        select: {
          visibilityChecks: true,
          competitors: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const planLimits = PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.FREE;
  const canAddMore = brands.length < planLimits.brands;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Brands</h1>
          <p className="text-slate-600">Manage and monitor your brands</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Plan Limit Indicator */}
          <div className="text-right">
            <p className="text-sm text-slate-500">
              {brands.length} / {planLimits.brands} brands
            </p>
            <div className="w-24 h-1.5 bg-slate-200 rounded-full mt-1">
              <div
                className={`h-full rounded-full ${
                  brands.length >= planLimits.brands ? 'bg-amber-500' : 'bg-sky-500'
                }`}
                style={{ width: `${Math.min((brands.length / planLimits.brands) * 100, 100)}%` }}
              />
            </div>
          </div>
          {canAddMore ? (
            <Link
              href="/dashboard/brands/new"
              className="inline-flex items-center gap-2 px-4 py-2 text-white font-semibold rounded-lg transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)' }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Brand
            </Link>
          ) : (
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 font-semibold rounded-lg hover:bg-amber-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Upgrade for More
            </Link>
          )}
        </div>
      </div>

      {brands.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-slate-200">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Start Tracking Your Brand</h2>
            <p className="text-slate-600 mb-8">
              Add your first brand to start monitoring AI visibility across ChatGPT, Claude, Perplexity, and Gemini.
              See how AI assistants talk about your brand and get recommendations to improve.
            </p>

            {/* Value Props */}
            <div className="grid sm:grid-cols-3 gap-4 mb-8 text-left">
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mb-2">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-slate-900 text-sm">Real-time Monitoring</h3>
                <p className="text-xs text-slate-500 mt-1">Track mentions across 4 major AI platforms</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center mb-2">
                  <svg className="w-4 h-4 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-slate-900 text-sm">AEO Score</h3>
                <p className="text-xs text-slate-500 mt-1">Get a 0-100 visibility score</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
                  <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="font-semibold text-slate-900 text-sm">Track Progress</h3>
                <p className="text-xs text-slate-500 mt-1">See improvements over time</p>
              </div>
            </div>

            <Link
              href="/dashboard/brands/new"
              className="inline-flex items-center gap-2 px-8 py-4 text-white font-semibold rounded-lg transition-all hover:scale-105 shadow-lg shadow-sky-500/25"
              style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)' }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Your First Brand
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/dashboard/brands/${brand.id}`}
              className="block bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg hover:border-sky-200 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Brand Icon */}
                  <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center group-hover:bg-sky-200 transition-colors">
                    <span className="text-lg font-bold text-sky-600">{brand.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                      {brand.name}
                    </h3>
                    {brand.domain && (
                      <p className="text-slate-500 text-sm">{brand.domain}</p>
                    )}
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        {brand._count.visibilityChecks} checks
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {brand._count.competitors} competitors
                      </span>
                      {brand.industry && (
                        <span className="px-2 py-0.5 bg-slate-100 rounded-full capitalize">
                          {brand.industry}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  {/* AEO Score */}
                  <div className="text-right">
                    {brand.aeoScore !== null ? (
                      <>
                        <div className={`text-3xl font-bold ${
                          brand.aeoScore >= 70 ? 'text-emerald-600' :
                          brand.aeoScore >= 40 ? 'text-amber-600' :
                          'text-red-600'
                        }`}>
                          {brand.aeoScore}
                        </div>
                        <p className="text-xs text-slate-500">AEO Score</p>
                      </>
                    ) : (
                      <div>
                        <span className="text-slate-400 text-sm">Not checked</span>
                        <p className="text-xs text-sky-500 mt-1">Run first check</p>
                      </div>
                    )}
                  </div>
                  {/* Arrow */}
                  <svg className="w-5 h-5 text-slate-300 group-hover:text-sky-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}

          {/* Add More Card */}
          {canAddMore && (
            <Link
              href="/dashboard/brands/new"
              className="block bg-slate-50 rounded-xl p-6 border-2 border-dashed border-slate-200 hover:border-sky-300 hover:bg-sky-50 transition-all group text-center"
            >
              <div className="flex items-center justify-center gap-2 text-slate-500 group-hover:text-sky-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="font-medium">Add another brand</span>
                <span className="text-sm text-slate-400">({brands.length}/{planLimits.brands})</span>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Pro Tip */}
      <div className="mt-8 bg-gradient-to-r from-sky-500 to-cyan-500 rounded-xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Pro Tip: Add Your Website Domain</h3>
            <p className="text-sky-100 text-sm">
              Brands with a website domain get more accurate AI visibility tracking. We can detect when AI platforms cite your site directly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
