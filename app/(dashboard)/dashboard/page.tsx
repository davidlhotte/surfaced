import { getUniversalUser } from '@/lib/auth/universal';
import prisma from '@/lib/db/client';
import Link from 'next/link';
import { QuickCheckWidget } from '@/components/dashboard/QuickCheckWidget';

// Plan limits for reference
const PLAN_LIMITS = {
  FREE: { checks: 3, brands: 1, competitors: 1 },
  STARTER: { checks: 30, brands: 1, competitors: 3 },
  GROWTH: { checks: 100, brands: 3, competitors: 10 },
  SCALE: { checks: 500, brands: 10, competitors: 25 },
};

export default async function DashboardPage() {
  const user = await getUniversalUser();

  if (!user) {
    return null;
  }

  // Get user's brands
  const brands = await prisma.brand.findMany({
    where: { userId: user.userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  // Get recent checks
  const recentChecks = await prisma.brandVisibilityCheck.findMany({
    where: {
      brand: { userId: user.userId },
    },
    include: { brand: true },
    orderBy: { checkedAt: 'desc' },
    take: 5,
  });

  // Calculate usage this month
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);

  const checksThisMonth = await prisma.brandVisibilityCheck.count({
    where: {
      brand: { userId: user.userId },
      checkedAt: { gte: thisMonth },
    },
  });

  const planLimits = PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.FREE;

  const stats = {
    totalBrands: brands.length,
    avgScore: brands.length > 0
      ? Math.round(brands.reduce((acc: number, b: { aeoScore: number | null }) => acc + (b.aeoScore || 0), 0) / brands.length)
      : 0,
    checksThisMonth,
    checksLimit: planLimits.checks,
  };

  const hasData = brands.length > 0;

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back{user.name ? `, ${user.name.split(' ')[0]}` : ''}!
          </h1>
          <p className="text-slate-600">
            {hasData
              ? "Here's an overview of your AI visibility."
              : "Let's get you started with AI visibility monitoring."}
          </p>
        </div>
        {hasData && (
          <Link
            href="/dashboard/checks"
            className="inline-flex items-center gap-2 px-4 py-2 text-white font-semibold rounded-lg transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)' }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Run Check
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Brands Tracked</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-3xl font-bold text-slate-900">{stats.totalBrands}</p>
                <p className="text-sm text-slate-400">/ {planLimits.brands}</p>
              </div>
            </div>
            <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Average AEO Score</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className={`text-3xl font-bold ${
                  stats.avgScore >= 70 ? 'text-emerald-600' :
                  stats.avgScore >= 40 ? 'text-amber-600' :
                  stats.avgScore > 0 ? 'text-red-600' : 'text-slate-400'
                }`}>
                  {stats.avgScore || '--'}
                </p>
                {stats.avgScore > 0 && <p className="text-sm text-slate-400">/ 100</p>}
              </div>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Checks This Month</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-3xl font-bold text-slate-900">{stats.checksThisMonth}</p>
                <p className="text-sm text-slate-400">/ {stats.checksLimit}</p>
              </div>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          </div>
          {stats.checksThisMonth >= stats.checksLimit * 0.8 && (
            <Link href="/dashboard/billing" className="text-xs text-amber-600 hover:text-amber-700 mt-2 inline-block">
              Running low - Upgrade for more
            </Link>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Current Plan</p>
              <p className="text-3xl font-bold text-slate-900 mt-1 capitalize">{user.plan.toLowerCase()}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
          </div>
          {user.plan === 'FREE' && (
            <Link href="/dashboard/billing" className="text-xs text-purple-600 hover:text-purple-700 mt-2 inline-block">
              Upgrade for more features
            </Link>
          )}
        </div>
      </div>

      {/* Getting Started or Content */}
      {!hasData ? (
        <div className="space-y-6">
          {/* Getting Started Steps */}
          <div className="bg-white rounded-xl border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Get Started in 3 Steps</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="relative">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold">
                    1
                  </div>
                  <h3 className="font-semibold text-slate-900">Add Your Brand</h3>
                </div>
                <p className="text-slate-600 text-sm ml-14">
                  Enter your brand name and website to start tracking AI visibility across ChatGPT, Claude, and more.
                </p>
                <div className="absolute top-5 left-[72px] w-full h-0.5 bg-slate-200 -z-10 hidden md:block" />
              </div>
              <div className="relative">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center font-bold">
                    2
                  </div>
                  <h3 className="font-semibold text-slate-500">Run Your First Check</h3>
                </div>
                <p className="text-slate-500 text-sm ml-14">
                  We&apos;ll query multiple AI platforms to see if and how they mention your brand.
                </p>
                <div className="absolute top-5 left-[72px] w-full h-0.5 bg-slate-200 -z-10 hidden md:block" />
              </div>
              <div>
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center font-bold">
                    3
                  </div>
                  <h3 className="font-semibold text-slate-500">Optimize & Monitor</h3>
                </div>
                <p className="text-slate-500 text-sm ml-14">
                  Get actionable recommendations to improve your AEO score and track progress over time.
                </p>
              </div>
            </div>
            <div className="mt-8 flex justify-center">
              <Link
                href="/dashboard/brands/new"
                className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-lg transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)' }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Your First Brand
              </Link>
            </div>
          </div>

          {/* Quick Check Widget */}
          <QuickCheckWidget />

          {/* Educational Content */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 text-white">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-6 h-6 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="font-semibold">What is AEO?</h3>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                <strong className="text-white">Answer Engine Optimization (AEO)</strong> is the practice of optimizing
                your brand&apos;s content to be accurately represented in AI-powered search tools like ChatGPT,
                Claude, and Perplexity.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-700">
                <p className="text-sm text-slate-400">
                  70% of users now start their search with AI assistants. Is your brand visible?
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-4">How Scoring Works</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-sm text-slate-600"><strong className="text-emerald-600">70-100:</strong> Excellent - AI platforms recommend your brand</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-sm text-slate-600"><strong className="text-amber-600">40-69:</strong> Moderate - Some mentions but room for improvement</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm text-slate-600"><strong className="text-red-600">0-39:</strong> Needs work - Limited or no AI visibility</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-4">
                Your AEO score is calculated by checking how often and how prominently AI platforms mention your brand across different query types.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Quick Check Widget */}
          <QuickCheckWidget />

          {/* Brands and Activity Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Brands List */}
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">Your Brands</h2>
                <Link href="/dashboard/brands" className="text-sm text-sky-600 hover:text-sky-700">
                  View all
                </Link>
              </div>
              <div className="divide-y divide-slate-200">
                {brands.map((brand) => (
                  <Link
                    key={brand.id}
                    href={`/dashboard/brands/${brand.id}`}
                    className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{brand.name}</p>
                      {brand.domain && (
                        <p className="text-sm text-slate-500">{brand.domain}</p>
                      )}
                    </div>
                    <div className="text-right">
                      {brand.aeoScore !== null ? (
                        <span className={`text-lg font-bold ${
                          brand.aeoScore >= 70 ? 'text-emerald-600' :
                          brand.aeoScore >= 40 ? 'text-amber-600' :
                          'text-red-600'
                        }`}>
                          {brand.aeoScore}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">Not checked</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
              {brands.length < planLimits.brands && (
                <div className="p-4 border-t border-slate-200 bg-slate-50">
                  <Link
                    href="/dashboard/brands/new"
                    className="text-sm text-sky-600 hover:text-sky-700 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add another brand ({brands.length}/{planLimits.brands})
                  </Link>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">Recent Checks</h2>
                <Link href="/dashboard/checks" className="text-sm text-sky-600 hover:text-sky-700">
                  View all
                </Link>
              </div>
              {recentChecks.length > 0 ? (
                <div className="divide-y divide-slate-200">
                  {recentChecks.map((check) => (
                    <div key={check.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-slate-900">{check.brand.name}</p>
                        <span className={`font-bold ${
                          check.aeoScore >= 70 ? 'text-emerald-600' :
                          check.aeoScore >= 40 ? 'text-amber-600' :
                          'text-red-600'
                        }`}>
                          {check.aeoScore}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">
                        {new Date(check.checkedAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-slate-500 text-sm">No checks yet</p>
                  <Link href="/dashboard/checks" className="text-sm text-sky-600 hover:text-sky-700 mt-2 inline-block">
                    Run your first check
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Educational Section */}
          <div className="bg-gradient-to-r from-sky-500 to-cyan-500 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold mb-2">Improve Your AEO Score</h2>
                <p className="text-sky-100">Learn how to optimize your brand for AI search engines</p>
              </div>
              <Link
                href="/learn"
                className="px-6 py-3 bg-white text-sky-600 font-semibold rounded-lg hover:bg-sky-50 transition-colors"
              >
                View Resources
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
