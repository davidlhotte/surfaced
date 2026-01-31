import { getUniversalUser } from '@/lib/auth/universal';
import prisma from '@/lib/db/client';
import Link from 'next/link';
import { CompareForm } from '@/components/dashboard/CompareForm';

// Plan limits for reference
const PLAN_LIMITS = {
  FREE: { checks: 3, brands: 1, competitors: 1 },
  STARTER: { checks: 30, brands: 1, competitors: 3 },
  GROWTH: { checks: 100, brands: 3, competitors: 10 },
  SCALE: { checks: 500, brands: 10, competitors: 25 },
};

export default async function CompetitorsPage() {
  const user = await getUniversalUser();
  if (!user) return null;

  // Get user's brands
  const brands = await prisma.brand.findMany({
    where: { userId: user.userId },
    select: { id: true, name: true, domain: true },
    orderBy: { createdAt: 'desc' },
  });

  // Get all competitors across all user's brands
  const competitors = await prisma.brandCompetitor.findMany({
    where: {
      brand: { userId: user.userId },
    },
    include: {
      brand: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Group by brand
  const competitorsByBrand = competitors.reduce((acc, comp) => {
    const brandName = comp.brand.name;
    if (!acc[brandName]) {
      acc[brandName] = [];
    }
    acc[brandName].push(comp);
    return acc;
  }, {} as Record<string, typeof competitors>);

  const planLimits = PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.FREE;
  const totalCompetitors = competitors.length;
  const canAddMore = totalCompetitors < planLimits.competitors;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Competitors</h1>
          <p className="text-slate-600">Track and compare against your competitors</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Plan Limit Indicator */}
          <div className="text-right">
            <p className="text-sm text-slate-500">
              {totalCompetitors} / {planLimits.competitors} competitors
            </p>
            <div className="w-24 h-1.5 bg-slate-200 rounded-full mt-1">
              <div
                className={`h-full rounded-full ${
                  totalCompetitors >= planLimits.competitors ? 'bg-amber-500' : 'bg-sky-500'
                }`}
                style={{ width: `${Math.min((totalCompetitors / planLimits.competitors) * 100, 100)}%` }}
              />
            </div>
          </div>
          {canAddMore && brands.length > 0 ? (
            <Link
              href="/dashboard/competitors/add"
              className="inline-flex items-center gap-2 px-4 py-2 text-white font-semibold rounded-lg transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)' }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Competitor
            </Link>
          ) : !canAddMore ? (
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 font-semibold rounded-lg hover:bg-amber-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Upgrade for More
            </Link>
          ) : null}
        </div>
      </div>

      {/* Quick Compare Form */}
      <CompareForm brands={brands} />

      {/* Comparison Preview */}
      {competitors.length === 0 && (
        <div className="bg-gradient-to-br from-slate-50 to-amber-50 rounded-xl border border-slate-200 p-8 mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-6 text-center">What a Comparison Looks Like</h2>
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex-1 text-center">
                  <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <span className="text-lg font-bold text-sky-600">Y</span>
                  </div>
                  <p className="font-semibold text-slate-900">Your Brand</p>
                  <p className="text-3xl font-bold text-emerald-600 mt-2">72</p>
                  <p className="text-xs text-slate-500">AEO Score</p>
                </div>
                <div className="px-6">
                  <div className="text-3xl text-slate-300 font-light">vs</div>
                </div>
                <div className="flex-1 text-center">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <span className="text-lg font-bold text-amber-600">C</span>
                  </div>
                  <p className="font-semibold text-slate-900">Competitor</p>
                  <p className="text-3xl font-bold text-amber-600 mt-2">58</p>
                  <p className="text-xs text-slate-500">AEO Score</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-sm">
                <div className="p-2 bg-slate-50 rounded">
                  <p className="text-xs text-slate-500">ChatGPT</p>
                  <p className="font-semibold text-emerald-600">+14</p>
                </div>
                <div className="p-2 bg-slate-50 rounded">
                  <p className="text-xs text-slate-500">Claude</p>
                  <p className="font-semibold text-emerald-600">+8</p>
                </div>
                <div className="p-2 bg-slate-50 rounded">
                  <p className="text-xs text-slate-500">Perplexity</p>
                  <p className="font-semibold text-red-600">-5</p>
                </div>
                <div className="p-2 bg-slate-50 rounded">
                  <p className="text-xs text-slate-500">Gemini</p>
                  <p className="font-semibold text-emerald-600">+12</p>
                </div>
              </div>
            </div>
            <p className="text-center text-sm text-slate-500 mt-4">
              See how your brand stacks up against competitors across all AI platforms
            </p>
          </div>
        </div>
      )}

      {competitors.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-slate-200 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">No competitors tracked</h2>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Add competitors to compare AI visibility and track share of voice across ChatGPT, Claude, Perplexity, and Gemini.
          </p>
          {brands.length > 0 ? (
            <Link
              href="/dashboard/competitors/add"
              className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-lg transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)' }}
            >
              Add Your First Competitor
            </Link>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-amber-600">You need to add a brand first</p>
              <Link
                href="/dashboard/brands/new"
                className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-lg transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)' }}
              >
                Add a Brand
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(competitorsByBrand).map(([brandName, brandCompetitors]) => (
            <div key={brandName}>
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold text-sky-600">{brandName.charAt(0)}</span>
                </span>
                {brandName}
              </h2>
              <div className="grid gap-4">
                {brandCompetitors.map((competitor) => (
                  <div
                    key={competitor.id}
                    className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                          <span className="text-lg font-bold text-amber-600">
                            {competitor.competitorName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">
                            {competitor.competitorName}
                          </h3>
                          {competitor.competitorDomain && (
                            <p className="text-slate-500 text-sm">{competitor.competitorDomain}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        {competitor.lastComparedAt ? (
                          <>
                            <div className="text-center">
                              <p className="text-xs text-slate-500 mb-1">Your Score</p>
                              <p className={`text-2xl font-bold ${
                                (competitor.yourScore || 0) >= (competitor.theirScore || 0)
                                  ? 'text-emerald-600'
                                  : 'text-red-600'
                              }`}>
                                {competitor.yourScore || 0}
                              </p>
                            </div>
                            <div className="text-2xl text-slate-200">vs</div>
                            <div className="text-center">
                              <p className="text-xs text-slate-500 mb-1">Their Score</p>
                              <p className="text-2xl font-bold text-slate-700">
                                {competitor.theirScore || 0}
                              </p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              (competitor.yourScore || 0) > (competitor.theirScore || 0)
                                ? 'bg-emerald-100 text-emerald-700'
                                : (competitor.yourScore || 0) < (competitor.theirScore || 0)
                                ? 'bg-red-100 text-red-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {(competitor.yourScore || 0) > (competitor.theirScore || 0)
                                ? `+${(competitor.yourScore || 0) - (competitor.theirScore || 0)}`
                                : (competitor.yourScore || 0) < (competitor.theirScore || 0)
                                ? `-${(competitor.theirScore || 0) - (competitor.yourScore || 0)}`
                                : 'Tied'}
                            </div>
                          </>
                        ) : (
                          <span className="text-slate-400">Not compared yet</span>
                        )}
                        <button className="px-4 py-2 bg-sky-50 text-sky-600 rounded-lg font-medium hover:bg-sky-100 transition-colors">
                          Compare Now
                        </button>
                      </div>
                    </div>
                    {competitor.lastComparedAt && (
                      <p className="text-xs text-slate-400 mt-4">
                        Last compared: {new Date(competitor.lastComparedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Add More Card */}
          {canAddMore && (
            <Link
              href="/dashboard/competitors/add"
              className="block bg-slate-50 rounded-xl p-6 border-2 border-dashed border-slate-200 hover:border-sky-300 hover:bg-sky-50 transition-all group text-center"
            >
              <div className="flex items-center justify-center gap-2 text-slate-500 group-hover:text-sky-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="font-medium">Add another competitor</span>
                <span className="text-sm text-slate-400">({totalCompetitors}/{planLimits.competitors})</span>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Quick Compare CTA */}
      <div className="mt-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Quick Compare</h3>
              <p className="text-amber-100 text-sm">Compare any two brands instantly without saving</p>
            </div>
          </div>
          <Link
            href="/compare"
            className="px-6 py-3 bg-white text-amber-600 font-semibold rounded-lg hover:bg-amber-50 transition-colors"
          >
            Try Free Tool
          </Link>
        </div>
      </div>
    </div>
  );
}
