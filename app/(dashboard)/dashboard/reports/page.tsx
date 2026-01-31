import { getUniversalUser } from '@/lib/auth/universal';
import prisma from '@/lib/db/client';
import Link from 'next/link';

export default async function ReportsPage() {
  const user = await getUniversalUser();
  if (!user) return null;

  const isFreePlan = user.plan === 'FREE' || user.plan === 'STARTER';

  // Get user's brands for non-free plans
  const brands = await prisma.brand.findMany({
    where: { userId: user.userId },
    select: { id: true, name: true, aeoScore: true, lastCheckAt: true },
    orderBy: { createdAt: 'desc' },
  });

  // Get recent checks for non-free plans
  const recentChecks = !isFreePlan ? await prisma.brandVisibilityCheck.findMany({
    where: {
      brand: { userId: user.userId },
    },
    orderBy: { checkedAt: 'desc' },
    take: 7,
  }) : [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="text-slate-600">Weekly and monthly AI visibility reports</p>
      </div>

      {isFreePlan ? (
        <div className="space-y-6">
          {/* Blurred Preview */}
          <div className="relative">
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 rounded-xl flex items-center justify-center">
              <div className="text-center p-8 max-w-md">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Unlock Reports</h2>
                <p className="text-slate-600 mb-6">
                  Weekly and monthly reports are available on Growth and Scale plans. Get detailed insights into your AI visibility trends.
                </p>
                <Link
                  href="/dashboard/billing"
                  className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-lg transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)' }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  Upgrade to Growth
                </Link>
              </div>
            </div>

            {/* Fake Report Content (Blurred) */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 select-none">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Weekly Report - Jan 24, 2025</h2>
                  <p className="text-sm text-slate-500">Your AI visibility summary</p>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                  +12% vs last week
                </span>
              </div>

              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">Overall Score</p>
                  <p className="text-2xl font-bold text-emerald-600">78</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">Mentions</p>
                  <p className="text-2xl font-bold text-slate-900">24</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">Citations</p>
                  <p className="text-2xl font-bold text-slate-900">12</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">Share of Voice</p>
                  <p className="text-2xl font-bold text-sky-600">34%</p>
                </div>
              </div>

              <div className="h-48 bg-slate-100 rounded-lg mb-6 flex items-center justify-center">
                <span className="text-slate-400">Weekly trend chart</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-600">ChatGPT mentions</span>
                  <span className="font-semibold text-emerald-600">+18%</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-600">Claude mentions</span>
                  <span className="font-semibold text-emerald-600">+8%</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-600">Perplexity citations</span>
                  <span className="font-semibold text-red-600">-3%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">What You Get with Reports</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">Weekly Email Summaries</h3>
                  <p className="text-sm text-slate-500">Get a digest every Monday with your visibility stats</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">Monthly PDF Reports</h3>
                  <p className="text-sm text-slate-500">Detailed analysis you can share with your team</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">Trend Analysis</h3>
                  <p className="text-sm text-slate-500">See how your visibility changes over time</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">Competitor Benchmarks</h3>
                  <p className="text-sm text-slate-500">Compare your progress against competitors</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">Share of Voice Metrics</h3>
                  <p className="text-sm text-slate-500">Track your presence vs industry averages</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">Actionable Recommendations</h3>
                  <p className="text-sm text-slate-500">Get specific tips to improve your AEO score</p>
                </div>
              </div>
            </div>
          </div>

          {/* Upgrade CTA */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-3">Ready to get detailed insights?</h2>
            <p className="text-purple-200 mb-6 max-w-lg mx-auto">
              Upgrade to Growth or Scale to unlock weekly reports, trend analysis, and competitor benchmarks.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/dashboard/billing"
                className="px-8 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:bg-purple-50 transition-colors"
              >
                View Plans
              </Link>
              <span className="text-purple-200">Starting at $79/month</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Report Settings */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Report Settings</h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                <div>
                  <p className="font-medium text-slate-900">Weekly Email Report</p>
                  <p className="text-sm text-slate-500">Receive a summary every Monday at 9am</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-5 h-5 rounded border-slate-300 text-sky-500 focus:ring-sky-500"
                />
              </label>
              <label className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                <div>
                  <p className="font-medium text-slate-900">Monthly PDF Report</p>
                  <p className="text-sm text-slate-500">Detailed monthly analysis on the 1st of each month</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-5 h-5 rounded border-slate-300 text-sky-500 focus:ring-sky-500"
                />
              </label>
              <label className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                <div>
                  <p className="font-medium text-slate-900">Score Drop Alerts</p>
                  <p className="text-sm text-slate-500">Get notified if your AEO score drops more than 10 points</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-5 h-5 rounded border-slate-300 text-sky-500 focus:ring-sky-500"
                />
              </label>
            </div>
          </div>

          {/* Current Summary */}
          {brands.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Current Snapshot</h2>
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-sky-50 rounded-lg text-center">
                  <p className="text-sm text-slate-500">Brands Tracked</p>
                  <p className="text-2xl font-bold text-sky-600">{brands.length}</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-lg text-center">
                  <p className="text-sm text-slate-500">Avg AEO Score</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {brands.length > 0 && brands.some(b => b.aeoScore !== null)
                      ? Math.round(brands.reduce((acc, b) => acc + (b.aeoScore || 0), 0) / brands.filter(b => b.aeoScore !== null).length)
                      : '--'}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg text-center">
                  <p className="text-sm text-slate-500">Checks This Week</p>
                  <p className="text-2xl font-bold text-purple-600">{recentChecks.length}</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg text-center">
                  <p className="text-sm text-slate-500">Last Check</p>
                  <p className="text-lg font-bold text-amber-600">
                    {recentChecks[0]
                      ? new Date(recentChecks[0].checkedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : '--'}
                  </p>
                </div>
              </div>

              {/* Brand Scores */}
              <div className="space-y-2">
                {brands.map((brand) => (
                  <div key={brand.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="font-medium text-slate-900">{brand.name}</span>
                    <span className={`font-bold ${
                      (brand.aeoScore || 0) >= 70 ? 'text-emerald-600' :
                      (brand.aeoScore || 0) >= 40 ? 'text-amber-600' :
                      brand.aeoScore ? 'text-red-600' : 'text-slate-400'
                    }`}>
                      {brand.aeoScore !== null ? brand.aeoScore : 'Not checked'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Reports */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Reports</h2>
            <div className="text-center py-12 text-slate-500">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="font-medium">No reports generated yet</p>
              <p className="text-sm mt-1">Reports will appear here after your first week of tracking</p>
            </div>
          </div>

          {/* Coming Soon Features */}
          <div className="bg-slate-900 rounded-xl p-6 text-white">
            <h2 className="text-lg font-semibold mb-4">Coming Soon</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="w-10 h-10 bg-sky-500/20 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-medium mb-1">Share of Voice</h3>
                <p className="text-sm text-slate-400">Track your brand&apos;s presence vs competitors in AI responses</p>
              </div>
              <div>
                <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="font-medium mb-1">Trend Analysis</h3>
                <p className="text-sm text-slate-400">Interactive charts showing visibility changes over time</p>
              </div>
              <div>
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-medium mb-1">Custom Schedules</h3>
                <p className="text-sm text-slate-400">Choose when and how often to receive your reports</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
