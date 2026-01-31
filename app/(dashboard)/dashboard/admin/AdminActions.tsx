'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AdminActionsProps {
  userId: string;
  currentPlan: string;
}

const PLANS = ['FREE', 'STARTER', 'GROWTH', 'SCALE'] as const;

export function AdminActions({ userId, currentPlan }: AdminActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handlePlanChange = async (newPlan: string) => {
    setLoading(`plan-${newPlan}`);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/admin/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, plan: newPlan }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to change plan');
      }

      setSuccess(`Plan changed to ${newPlan}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(null);
    }
  };

  const handleAddSampleData = async () => {
    setLoading('sample');
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/admin/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add sample data');
      }

      setSuccess(`Added ${data.brands} brands and ${data.checks} checks`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(null);
    }
  };

  const handleClearData = async () => {
    if (!confirm('Are you sure you want to delete all your brands and checks? This cannot be undone.')) {
      return;
    }

    setLoading('clear');
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/admin/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to clear data');
      }

      setSuccess('All data cleared');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      {/* Plan Change */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Change Plan</h2>
        <p className="text-sm text-slate-500 mb-4">
          Instantly switch between plans to test different feature limits.
        </p>
        <div className="flex flex-wrap gap-3">
          {PLANS.map((plan) => (
            <button
              key={plan}
              onClick={() => handlePlanChange(plan)}
              disabled={loading !== null || currentPlan === plan}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPlan === plan
                  ? 'bg-sky-100 text-sky-700 cursor-default'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              } disabled:opacity-50`}
            >
              {loading === `plan-${plan}` ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Changing...
                </span>
              ) : (
                <>
                  {plan}
                  {currentPlan === plan && ' (Current)'}
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Sample Data */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Sample Data</h2>
        <p className="text-sm text-slate-500 mb-4">
          Add sample brands and visibility checks to test the dashboard.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleAddSampleData}
            disabled={loading !== null}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading === 'sample' ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Adding...
              </span>
            ) : (
              'Add Sample Data'
            )}
          </button>
          <button
            onClick={handleClearData}
            disabled={loading !== null}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading === 'clear' ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Clearing...
              </span>
            ) : (
              'Clear All Data'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
