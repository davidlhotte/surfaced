'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface UserSettings {
  name: string;
  email: string;
  plan: string;
  emailAlerts: boolean;
  weeklyReport: boolean;
  scoreDropAlerts: boolean;
  competitorAlerts: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/auth/universal/me');
      const data = await res.json();
      if (data.user) {
        setSettings({
          name: data.user.name || '',
          email: data.user.email,
          plan: data.user.plan || 'FREE',
          emailAlerts: true,
          weeklyReport: true,
          scoreDropAlerts: true,
          competitorAlerts: false,
        });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      // TODO: Implement settings update API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600">Manage your account preferences and notifications</p>
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Profile Section */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-slate-50">
            <h2 className="text-lg font-semibold text-slate-900">Profile</h2>
            <p className="text-sm text-slate-500">Your personal information</p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={settings?.name || ''}
                onChange={(e) => setSettings(s => s ? { ...s, name: e.target.value } : null)}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={settings?.email || ''}
                disabled
                className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
              />
              <p className="text-xs text-slate-500 mt-2">Email cannot be changed. Contact support if you need to update it.</p>
            </div>
          </div>
        </div>

        {/* Plan Information */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-slate-50">
            <h2 className="text-lg font-semibold text-slate-900">Subscription</h2>
            <p className="text-sm text-slate-500">Your current plan and features</p>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between p-4 bg-sky-50 rounded-lg border border-sky-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-slate-900 capitalize">{settings?.plan.toLowerCase()} Plan</span>
                  {settings?.plan === 'FREE' && (
                    <span className="px-2 py-0.5 bg-sky-100 text-sky-700 text-xs font-medium rounded">Free Forever</span>
                  )}
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  {settings?.plan === 'FREE'
                    ? '3 checks/month, 1 brand, 1 competitor'
                    : settings?.plan === 'STARTER'
                    ? '30 checks/month, 1 brand, 3 competitors'
                    : settings?.plan === 'GROWTH'
                    ? '100 checks/month, 3 brands, 10 competitors'
                    : '500 checks/month, 10 brands, 25 competitors'}
                </p>
              </div>
              <Link
                href="/dashboard/billing"
                className="px-4 py-2 text-sky-600 font-medium hover:bg-sky-100 rounded-lg transition-colors"
              >
                {settings?.plan === 'FREE' ? 'Upgrade' : 'Manage'}
              </Link>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-slate-50">
            <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
            <p className="text-sm text-slate-500">Configure how and when we contact you</p>
          </div>
          <div className="divide-y divide-slate-200">
            <label className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors cursor-pointer">
              <div>
                <p className="font-medium text-slate-900">Email Alerts</p>
                <p className="text-sm text-slate-500">Get notified about significant changes to your AI visibility</p>
              </div>
              <input
                type="checkbox"
                checked={settings?.emailAlerts || false}
                onChange={(e) => setSettings(s => s ? { ...s, emailAlerts: e.target.checked } : null)}
                className="w-5 h-5 rounded border-slate-300 text-sky-500 focus:ring-sky-500"
              />
            </label>
            <label className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors cursor-pointer">
              <div>
                <p className="font-medium text-slate-900">Weekly Report</p>
                <p className="text-sm text-slate-500">Receive a weekly AI visibility summary every Monday</p>
              </div>
              <input
                type="checkbox"
                checked={settings?.weeklyReport || false}
                onChange={(e) => setSettings(s => s ? { ...s, weeklyReport: e.target.checked } : null)}
                className="w-5 h-5 rounded border-slate-300 text-sky-500 focus:ring-sky-500"
              />
            </label>
            <label className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors cursor-pointer">
              <div>
                <p className="font-medium text-slate-900">Score Drop Alerts</p>
                <p className="text-sm text-slate-500">Get notified if your AEO score drops by more than 10 points</p>
              </div>
              <input
                type="checkbox"
                checked={settings?.scoreDropAlerts || false}
                onChange={(e) => setSettings(s => s ? { ...s, scoreDropAlerts: e.target.checked } : null)}
                className="w-5 h-5 rounded border-slate-300 text-sky-500 focus:ring-sky-500"
              />
            </label>
            <label className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors cursor-pointer">
              <div>
                <p className="font-medium text-slate-900">Competitor Alerts</p>
                <p className="text-sm text-slate-500">Get notified when a competitor surpasses your visibility</p>
              </div>
              <input
                type="checkbox"
                checked={settings?.competitorAlerts || false}
                onChange={(e) => setSettings(s => s ? { ...s, competitorAlerts: e.target.checked } : null)}
                className="w-5 h-5 rounded border-slate-300 text-sky-500 focus:ring-sky-500"
              />
            </label>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-slate-50">
            <h2 className="text-lg font-semibold text-slate-900">Security</h2>
            <p className="text-sm text-slate-500">Keep your account secure</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">Password</p>
                <p className="text-sm text-slate-500">Change your password to keep your account secure</p>
              </div>
              <button
                type="button"
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors font-medium"
              >
                Change Password
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">Two-Factor Authentication</p>
                <p className="text-sm text-slate-500">Add an extra layer of security to your account</p>
              </div>
              <button
                type="button"
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors font-medium"
              >
                Enable 2FA
              </button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
          <div className="p-6 border-b border-red-200 bg-red-50">
            <h2 className="text-lg font-semibold text-red-600">Danger Zone</h2>
            <p className="text-sm text-red-500">Irreversible and destructive actions</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-red-50/50 rounded-lg border border-red-100">
              <div>
                <p className="font-medium text-slate-900">Export Data</p>
                <p className="text-sm text-slate-500">Download all your data in CSV format</p>
              </div>
              <button
                type="button"
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors font-medium"
              >
                Export
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-red-50/50 rounded-lg border border-red-100">
              <div>
                <p className="font-medium text-slate-900">Delete Account</p>
                <p className="text-sm text-slate-500">Permanently delete your account and all data</p>
              </div>
              <button
                type="button"
                className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-red-600 hover:bg-red-100 transition-colors font-medium"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end sticky bottom-4">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3 text-white font-semibold rounded-lg disabled:opacity-50 shadow-lg transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)' }}
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </span>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
