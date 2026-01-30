import { getUniversalUser } from '@/lib/auth/universal';
import Link from 'next/link';

export default async function ReportsPage() {
  const user = await getUniversalUser();
  if (!user) return null;

  const isFreePlan = user.plan === 'FREE';

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="text-slate-600">Weekly and monthly AI visibility reports</p>
      </div>

      {isFreePlan ? (
        <div className="bg-white rounded-xl p-12 border border-slate-200 text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Upgrade for Reports</h2>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Weekly and monthly reports are available on Growth and Scale plans. Get detailed insights into your AI visibility trends.
          </p>
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-lg"
            style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)' }}
          >
            Upgrade to Growth
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Report Settings */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Report Settings</h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">Weekly Email Report</p>
                  <p className="text-sm text-slate-500">Receive a summary every Monday</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-5 h-5 rounded border-slate-300 text-sky-500 focus:ring-sky-500"
                />
              </label>
              <label className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">Monthly PDF Report</p>
                  <p className="text-sm text-slate-500">Detailed monthly analysis</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-5 h-5 rounded border-slate-300 text-sky-500 focus:ring-sky-500"
                />
              </label>
            </div>
          </div>

          {/* Recent Reports */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Reports</h2>
            <div className="text-center py-8 text-slate-500">
              No reports generated yet. Reports will appear here after your first week of tracking.
            </div>
          </div>

          {/* Upcoming Features */}
          <div className="bg-slate-900 rounded-xl p-6 text-white">
            <h2 className="text-lg font-semibold mb-4">Coming Soon</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="text-3xl mb-2">📊</div>
                <h3 className="font-medium mb-1">Share of Voice</h3>
                <p className="text-sm text-slate-400">Track your brand&apos;s presence vs competitors</p>
              </div>
              <div>
                <div className="text-3xl mb-2">📈</div>
                <h3 className="font-medium mb-1">Trend Analysis</h3>
                <p className="text-sm text-slate-400">See how your visibility changes over time</p>
              </div>
              <div>
                <div className="text-3xl mb-2">📧</div>
                <h3 className="font-medium mb-1">Custom Schedules</h3>
                <p className="text-sm text-slate-400">Choose when and how often to receive reports</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
