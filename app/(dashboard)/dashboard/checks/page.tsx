import { getUniversalUser } from '@/lib/auth/universal';
import prisma from '@/lib/db/client';
import Link from 'next/link';

export default async function ChecksPage() {
  const user = await getUniversalUser();
  if (!user) return null;

  // Get all visibility checks for user's brands
  const checks = await prisma.brandVisibilityCheck.findMany({
    where: {
      brand: { userId: user.userId },
    },
    include: {
      brand: {
        select: { id: true, name: true },
      },
    },
    orderBy: { checkedAt: 'desc' },
    take: 50,
  });

  // Calculate usage
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);

  const checksThisMonth = checks.filter(
    (c) => new Date(c.checkedAt) >= thisMonth
  ).length;

  const planLimits: Record<string, number> = {
    FREE: 3,
    STARTER: 30,
    GROWTH: 100,
    SCALE: 500,
  };

  const limit = planLimits[user.plan] || 3;
  const usagePercent = Math.round((checksThisMonth / limit) * 100);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI Checks</h1>
          <p className="text-slate-600">History of your AI visibility checks</p>
        </div>
        <Link
          href="/check"
          className="inline-flex items-center gap-2 px-4 py-2 text-white font-semibold rounded-lg"
          style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)' }}
        >
          New Check
        </Link>
      </div>

      {/* Usage Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-slate-900">Monthly Usage</h2>
            <p className="text-sm text-slate-500">
              {checksThisMonth} of {limit} checks used this month
            </p>
          </div>
          <span className={`text-2xl font-bold ${
            usagePercent >= 90 ? 'text-red-600' :
            usagePercent >= 70 ? 'text-amber-600' :
            'text-emerald-600'
          }`}>
            {usagePercent}%
          </span>
        </div>
        <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              usagePercent >= 90 ? 'bg-red-500' :
              usagePercent >= 70 ? 'bg-amber-500' :
              'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(usagePercent, 100)}%` }}
          />
        </div>
        {usagePercent >= 80 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-amber-600">Running low on checks</p>
            <Link
              href="/dashboard/billing"
              className="text-sm text-sky-600 hover:text-sky-700 font-medium"
            >
              Upgrade for more
            </Link>
          </div>
        )}
      </div>

      {/* Checks History */}
      {checks.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-slate-200 text-center">
          <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">No checks yet</h2>
          <p className="text-slate-600 mb-6">Run your first AI visibility check to see results here.</p>
          <Link
            href="/check"
            className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-lg"
            style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)' }}
          >
            Run First Check
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Brand</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">ChatGPT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Claude</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Perplexity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Gemini</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {checks.map((check) => {
                const chatgpt = check.chatgptResult as { mentioned?: boolean } | null;
                const claude = check.claudeResult as { mentioned?: boolean } | null;
                const perplexity = check.perplexityResult as { mentioned?: boolean } | null;
                const gemini = check.geminiResult as { mentioned?: boolean } | null;

                return (
                  <tr key={check.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/brands/${check.brand.id}`}
                        className="font-medium text-slate-900 hover:text-sky-600"
                      >
                        {check.brand.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${
                        check.aeoScore >= 70 ? 'text-emerald-600' :
                        check.aeoScore >= 40 ? 'text-amber-600' :
                        'text-red-600'
                      }`}>
                        {check.aeoScore}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {chatgpt?.mentioned ? (
                        <span className="text-emerald-600">Yes</span>
                      ) : (
                        <span className="text-red-600">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {claude?.mentioned ? (
                        <span className="text-emerald-600">Yes</span>
                      ) : (
                        <span className="text-red-600">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {perplexity?.mentioned ? (
                        <span className="text-emerald-600">Yes</span>
                      ) : (
                        <span className="text-red-600">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {gemini?.mentioned ? (
                        <span className="text-emerald-600">Yes</span>
                      ) : (
                        <span className="text-red-600">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(check.checkedAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
