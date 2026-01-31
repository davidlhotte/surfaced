import { getUniversalUser } from '@/lib/auth/universal';
import prisma from '@/lib/db/client';
import Link from 'next/link';
import { QuickCheckForm } from '@/components/dashboard/QuickCheckForm';

// Plan limits for reference
const PLAN_LIMITS = {
  FREE: { checks: 3, brands: 1, competitors: 1 },
  STARTER: { checks: 30, brands: 1, competitors: 3 },
  GROWTH: { checks: 100, brands: 3, competitors: 10 },
  SCALE: { checks: 500, brands: 10, competitors: 25 },
};

export default async function ChecksPage() {
  const user = await getUniversalUser();
  if (!user) return null;

  // Get user's brands for the quick check form
  const brands = await prisma.brand.findMany({
    where: { userId: user.userId },
    select: { id: true, name: true, domain: true },
    orderBy: { createdAt: 'desc' },
  });

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

  const planLimits = PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.FREE;
  const limit = planLimits.checks;
  const usagePercent = Math.round((checksThisMonth / limit) * 100);
  const remaining = Math.max(0, limit - checksThisMonth);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI Checks</h1>
          <p className="text-slate-600">Check and monitor your AI visibility</p>
        </div>
        {brands.length > 0 && (
          <Link
            href="/check"
            className="inline-flex items-center gap-2 px-4 py-2 text-white font-semibold rounded-lg transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)' }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            New Check
          </Link>
        )}
      </div>

      {/* Quick Check Form */}
      <QuickCheckForm brands={brands} />

      {/* Usage Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-slate-900">Monthly Usage</h2>
            <p className="text-sm text-slate-500">
              {checksThisMonth} of {limit} checks used this month
            </p>
          </div>
          <div className="text-right">
            <span className={`text-2xl font-bold ${
              usagePercent >= 90 ? 'text-red-600' :
              usagePercent >= 70 ? 'text-amber-600' :
              'text-emerald-600'
            }`}>
              {remaining}
            </span>
            <p className="text-sm text-slate-500">remaining</p>
          </div>
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

      {/* How It Works Section */}
      {checks.length === 0 && (
        <div className="bg-gradient-to-br from-slate-50 to-sky-50 rounded-xl border border-slate-200 p-8 mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-6 text-center">How AI Checks Work</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 text-sm mb-1">1. Query Generation</h3>
              <p className="text-xs text-slate-500">We create relevant prompts based on your brand</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 text-sm mb-1">2. Platform Queries</h3>
              <p className="text-xs text-slate-500">We ask ChatGPT, Claude, Perplexity & Gemini</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 text-sm mb-1">3. Response Analysis</h3>
              <p className="text-xs text-slate-500">We analyze if and how your brand is mentioned</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 text-sm mb-1">4. AEO Score</h3>
              <p className="text-xs text-slate-500">We calculate your visibility score (0-100)</p>
            </div>
          </div>
        </div>
      )}

      {/* Checks History */}
      {checks.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-slate-200 text-center">
          <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">No checks yet</h2>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Run your first AI visibility check to see results here. We&apos;ll track mentions across ChatGPT, Claude, Perplexity, and Gemini.
          </p>
          {brands.length > 0 ? (
            <Link
              href="/check"
              className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-lg transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)' }}
            >
              Run First Check
            </Link>
          ) : (
            <Link
              href="/dashboard/brands/new"
              className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-lg transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)' }}
            >
              Add a Brand First
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Brand</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Score</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-4 h-4 bg-[#10a37f] rounded flex items-center justify-center">
                        <span className="text-white text-[8px] font-bold">G</span>
                      </div>
                      ChatGPT
                    </div>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-4 h-4 bg-[#d97757] rounded flex items-center justify-center">
                        <span className="text-white text-[8px] font-bold">C</span>
                      </div>
                      Claude
                    </div>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-4 h-4 bg-[#20808D] rounded flex items-center justify-center">
                        <span className="text-white text-[8px] font-bold">P</span>
                      </div>
                      Perplexity
                    </div>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-4 h-4 bg-[#4285f4] rounded flex items-center justify-center">
                        <span className="text-white text-[8px] font-bold">G</span>
                      </div>
                      Gemini
                    </div>
                  </th>
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
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold ${
                          check.aeoScore >= 70 ? 'bg-emerald-100 text-emerald-700' :
                          check.aeoScore >= 40 ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {check.aeoScore}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {chatgpt?.mentioned ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-500">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {claude?.mentioned ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-500">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {perplexity?.mentioned ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-500">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {gemini?.mentioned ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-500">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-sm">
                        {new Date(check.checkedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tips Section */}
      <div className="mt-8 bg-gradient-to-r from-sky-500 to-cyan-500 rounded-xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Pro Tip: Check Regularly</h3>
            <p className="text-sky-100 text-sm">
              AI models update frequently. Run checks weekly to track changes in how AI platforms talk about your brand.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
