import { getUniversalUser } from '@/lib/auth/universal';
import prisma from '@/lib/db/client';
import { redirect } from 'next/navigation';
import { AdminActions } from './AdminActions';

export default async function AdminPage() {
  const user = await getUniversalUser();

  if (!user) {
    redirect('/login');
  }

  // Get full user data
  const fullUser = await prisma.universalUser.findUnique({
    where: { id: user.userId },
    include: {
      brands: {
        include: {
          visibilityChecks: {
            orderBy: { checkedAt: 'desc' },
            take: 5,
          },
          competitors: true,
        },
      },
      _count: {
        select: {
          brands: true,
          sessions: true,
        },
      },
    },
  });

  if (!fullUser) {
    return (
      <div className="p-8">
        <p className="text-red-600">User not found in database</p>
      </div>
    );
  }

  // Check if dev mode (localhost or specific flag)
  const isDev = process.env.NODE_ENV === 'development' ||
                process.env.ENABLE_ADMIN_PAGE === 'true';

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
        <p className="text-slate-600">Development tools for testing</p>
        {!isDev && (
          <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
            Note: Set ENABLE_ADMIN_PAGE=true in production env vars to enable full admin features.
          </div>
        )}
      </div>

      {/* Current User Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Current User</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-slate-500">User ID</p>
            <p className="font-mono text-sm text-slate-900 truncate">{fullUser.id}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Email</p>
            <p className="font-medium text-slate-900">{fullUser.email}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Name</p>
            <p className="font-medium text-slate-900">{fullUser.name || '(not set)'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Current Plan</p>
            <span className={`inline-block px-2 py-1 text-sm font-semibold rounded ${
              fullUser.plan === 'FREE' ? 'bg-slate-100 text-slate-700' :
              fullUser.plan === 'STARTER' ? 'bg-blue-100 text-blue-700' :
              fullUser.plan === 'GROWTH' ? 'bg-purple-100 text-purple-700' :
              'bg-emerald-100 text-emerald-700'
            }`}>
              {fullUser.plan}
            </span>
          </div>
          <div>
            <p className="text-sm text-slate-500">Auth Provider</p>
            <p className="font-mono text-sm text-slate-900 truncate">{fullUser.authProvider || 'email'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Trial Ends</p>
            <p className="font-medium text-slate-900">
              {fullUser.trialEndsAt ? new Date(fullUser.trialEndsAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Total Brands</p>
            <p className="font-bold text-2xl text-slate-900">{fullUser._count.brands}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Created At</p>
            <p className="font-medium text-slate-900">
              {new Date(fullUser.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Plan Actions */}
      <AdminActions userId={fullUser.id} currentPlan={fullUser.plan} />

      {/* Existing Brands */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mt-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Your Brands ({fullUser.brands.length})</h2>
        {fullUser.brands.length === 0 ? (
          <p className="text-slate-500">No brands yet. Use the "Add Sample Data" button above.</p>
        ) : (
          <div className="space-y-4">
            {fullUser.brands.map((brand) => (
              <div key={brand.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-slate-900">{brand.name}</h3>
                    <p className="text-sm text-slate-500">{brand.domain || 'No domain'}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-2xl font-bold ${
                      (brand.aeoScore || 0) >= 70 ? 'text-emerald-600' :
                      (brand.aeoScore || 0) >= 40 ? 'text-amber-600' :
                      'text-red-600'
                    }`}>
                      {brand.aeoScore ?? '-'}
                    </span>
                    <p className="text-xs text-slate-500">AEO Score</p>
                  </div>
                </div>
                <div className="flex gap-4 text-sm text-slate-500">
                  <span>{brand.visibilityChecks.length} checks</span>
                  <span>{brand.competitors.length} competitors</span>
                  <span>Industry: {brand.industry || 'Not set'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Plan Limits Reference */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mt-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Plan Limits Reference</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 font-medium text-slate-600">Feature</th>
                <th className="text-center py-2 px-3 font-medium text-slate-600">FREE</th>
                <th className="text-center py-2 px-3 font-medium text-slate-600">STARTER</th>
                <th className="text-center py-2 px-3 font-medium text-slate-600">GROWTH</th>
                <th className="text-center py-2 px-3 font-medium text-slate-600">SCALE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2 px-3 text-slate-700">AI Checks / Month</td>
                <td className="py-2 px-3 text-center">3</td>
                <td className="py-2 px-3 text-center">30</td>
                <td className="py-2 px-3 text-center">100</td>
                <td className="py-2 px-3 text-center">500</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-slate-700">Brands</td>
                <td className="py-2 px-3 text-center">1</td>
                <td className="py-2 px-3 text-center">1</td>
                <td className="py-2 px-3 text-center">3</td>
                <td className="py-2 px-3 text-center">10</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-slate-700">Competitors</td>
                <td className="py-2 px-3 text-center">1</td>
                <td className="py-2 px-3 text-center">3</td>
                <td className="py-2 px-3 text-center">10</td>
                <td className="py-2 px-3 text-center">25</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-slate-700">Weekly Reports</td>
                <td className="py-2 px-3 text-center text-slate-400">-</td>
                <td className="py-2 px-3 text-center text-emerald-600">Yes</td>
                <td className="py-2 px-3 text-center text-emerald-600">Yes</td>
                <td className="py-2 px-3 text-center text-emerald-600">Yes</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-slate-700">Historical Data</td>
                <td className="py-2 px-3 text-center text-slate-400">-</td>
                <td className="py-2 px-3 text-center text-slate-400">-</td>
                <td className="py-2 px-3 text-center text-emerald-600">Yes</td>
                <td className="py-2 px-3 text-center text-emerald-600">Yes</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-slate-700">API Access</td>
                <td className="py-2 px-3 text-center text-slate-400">-</td>
                <td className="py-2 px-3 text-center text-slate-400">-</td>
                <td className="py-2 px-3 text-center text-slate-400">-</td>
                <td className="py-2 px-3 text-center text-emerald-600">Yes</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
