import { getUniversalUser } from '@/lib/auth/universal';
import prisma from '@/lib/db/client';
import Link from 'next/link';

export default async function CompetitorsPage() {
  const user = await getUniversalUser();
  if (!user) return null;

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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Competitors</h1>
          <p className="text-slate-600">Track and compare against your competitors</p>
        </div>
        <Link
          href="/dashboard/competitors/add"
          className="inline-flex items-center gap-2 px-4 py-2 text-white font-semibold rounded-lg"
          style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)' }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Competitor
        </Link>
      </div>

      {competitors.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-slate-200 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">No competitors yet</h2>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Add competitors to compare AI visibility and track share of voice.
          </p>
          <Link
            href="/dashboard/competitors/add"
            className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-lg"
            style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)' }}
          >
            Add Your First Competitor
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(competitorsByBrand).map(([brandName, brandCompetitors]) => (
            <div key={brandName}>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                {brandName}
              </h2>
              <div className="grid gap-4">
                {brandCompetitors.map((competitor) => (
                  <div
                    key={competitor.id}
                    className="bg-white rounded-xl p-6 border border-slate-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          {competitor.competitorName}
                        </h3>
                        {competitor.competitorDomain && (
                          <p className="text-slate-500">{competitor.competitorDomain}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-6">
                        {competitor.lastComparedAt ? (
                          <>
                            <div className="text-center">
                              <p className="text-sm text-slate-500">Your Score</p>
                              <p className={`text-2xl font-bold ${
                                (competitor.yourScore || 0) >= (competitor.theirScore || 0)
                                  ? 'text-emerald-600'
                                  : 'text-red-600'
                              }`}>
                                {competitor.yourScore || 0}
                              </p>
                            </div>
                            <div className="text-2xl text-slate-300">vs</div>
                            <div className="text-center">
                              <p className="text-sm text-slate-500">Their Score</p>
                              <p className="text-2xl font-bold text-slate-700">
                                {competitor.theirScore || 0}
                              </p>
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
        </div>
      )}

      {/* Quick Compare */}
      <div className="mt-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2">Quick Compare</h2>
            <p className="text-amber-100">Compare any two brands instantly</p>
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
