import { getUniversalUser } from '@/lib/auth/universal';
import prisma from '@/lib/db/client';
import Link from 'next/link';

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

  const stats = {
    totalBrands: brands.length,
    avgScore: brands.length > 0
      ? Math.round(brands.reduce((acc: number, b: { aeoScore: number | null }) => acc + (b.aeoScore || 0), 0) / brands.length)
      : 0,
    checksThisMonth: recentChecks.length,
  };

  return (
    <div>
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back{user.name ? `, ${user.name.split(' ')[0]}` : ''}!
        </h1>
        <p className="text-slate-600">Here&apos;s an overview of your AI visibility.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Brands Tracked</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalBrands}</p>
            </div>
            <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Average AEO Score</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.avgScore}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Checks This Month</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.checksThisMonth}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {brands.length === 0 ? (
        <div className="bg-white rounded-xl p-8 border border-slate-200 text-center mb-8">
          <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Add Your First Brand</h2>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Start monitoring your AI visibility by adding a brand. We&apos;ll track what ChatGPT, Claude, and Perplexity say about you.
          </p>
          <Link
            href="/dashboard/brands/new"
            className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-lg"
            style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)' }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Brand
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
              <div className="p-8 text-center text-slate-500">
                No checks yet. Add a brand to get started.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Check */}
      <div className="bg-gradient-to-r from-sky-500 to-cyan-500 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2">Quick AI Check</h2>
            <p className="text-sky-100">Check any brand&apos;s AI visibility instantly</p>
          </div>
          <Link
            href="/check"
            className="px-6 py-3 bg-white text-sky-600 font-semibold rounded-lg hover:bg-sky-50 transition-colors"
          >
            Run Check
          </Link>
        </div>
      </div>
    </div>
  );
}
