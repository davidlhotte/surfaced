import { getUniversalUser } from '@/lib/auth/universal';
import prisma from '@/lib/db/client';
import Link from 'next/link';

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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Brands</h1>
          <p className="text-slate-600">Manage and monitor your brands</p>
        </div>
        <Link
          href="/dashboard/brands/new"
          className="inline-flex items-center gap-2 px-4 py-2 text-white font-semibold rounded-lg"
          style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)' }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Brand
        </Link>
      </div>

      {brands.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-slate-200 text-center">
          <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">No brands yet</h2>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Add your first brand to start monitoring AI visibility across ChatGPT, Claude, Perplexity, and more.
          </p>
          <Link
            href="/dashboard/brands/new"
            className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-lg"
            style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)' }}
          >
            Add Your First Brand
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/dashboard/brands/${brand.id}`}
              className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{brand.name}</h3>
                  {brand.domain && (
                    <p className="text-slate-500">{brand.domain}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                    <span>{brand._count.visibilityChecks} checks</span>
                    <span>{brand._count.competitors} competitors</span>
                    {brand.industry && <span className="capitalize">{brand.industry}</span>}
                  </div>
                </div>
                <div className="text-right">
                  {brand.aeoScore !== null ? (
                    <div>
                      <span className={`text-3xl font-bold ${
                        brand.aeoScore >= 70 ? 'text-emerald-600' :
                        brand.aeoScore >= 40 ? 'text-amber-600' :
                        'text-red-600'
                      }`}>
                        {brand.aeoScore}
                      </span>
                      <p className="text-sm text-slate-500">AEO Score</p>
                    </div>
                  ) : (
                    <span className="text-slate-400">Not checked yet</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
