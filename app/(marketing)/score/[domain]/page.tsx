'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  points: number;
  maxPoints: number;
}

export default function ScoreResultsPage() {
  const params = useParams();
  const domain = decodeURIComponent(params.domain as string);
  const [isLoading, setIsLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const analyzeWebsite = async () => {
      setIsLoading(true);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Mock results - in production, this would come from the API
      const mockChecks: CheckResult[] = [
        {
          name: 'llms.txt',
          status: Math.random() > 0.7 ? 'pass' : 'fail',
          message: Math.random() > 0.7 ? 'llms.txt file found and valid' : 'No llms.txt file detected',
          points: Math.random() > 0.7 ? 15 : 0,
          maxPoints: 15,
        },
        {
          name: 'JSON-LD Schema',
          status: Math.random() > 0.5 ? 'pass' : Math.random() > 0.5 ? 'warning' : 'fail',
          message: Math.random() > 0.5 ? 'Organization and WebSite schema found' : 'Missing Product/Organization schema',
          points: Math.random() > 0.5 ? 20 : Math.random() > 0.5 ? 10 : 0,
          maxPoints: 20,
        },
        {
          name: 'GPTBot Access',
          status: Math.random() > 0.6 ? 'pass' : 'fail',
          message: Math.random() > 0.6 ? 'GPTBot allowed in robots.txt' : 'GPTBot blocked or not specified in robots.txt',
          points: Math.random() > 0.6 ? 15 : 0,
          maxPoints: 15,
        },
        {
          name: 'ClaudeBot Access',
          status: Math.random() > 0.5 ? 'pass' : 'fail',
          message: Math.random() > 0.5 ? 'ClaudeBot allowed in robots.txt' : 'ClaudeBot blocked in robots.txt',
          points: Math.random() > 0.5 ? 10 : 0,
          maxPoints: 10,
        },
        {
          name: 'XML Sitemap',
          status: Math.random() > 0.7 ? 'pass' : 'warning',
          message: Math.random() > 0.7 ? 'Valid sitemap.xml found' : 'Sitemap exists but has issues',
          points: Math.random() > 0.7 ? 10 : 5,
          maxPoints: 10,
        },
        {
          name: 'Content Structure',
          status: Math.random() > 0.4 ? 'pass' : 'warning',
          message: Math.random() > 0.4 ? 'Good heading hierarchy and FAQ sections' : 'Could benefit from more structured content',
          points: Math.random() > 0.4 ? 15 : 8,
          maxPoints: 15,
        },
        {
          name: 'Page Speed',
          status: Math.random() > 0.5 ? 'pass' : 'warning',
          message: Math.random() > 0.5 ? 'Fast loading (< 2s)' : 'Moderate loading time (2-4s)',
          points: Math.random() > 0.5 ? 15 : 8,
          maxPoints: 15,
        },
      ];

      const totalPoints = mockChecks.reduce((acc, c) => acc + c.points, 0);
      const maxPoints = mockChecks.reduce((acc, c) => acc + c.maxPoints, 0);
      const calculatedScore = Math.round((totalPoints / maxPoints) * 100);

      setChecks(mockChecks);
      setScore(calculatedScore);
      setIsLoading(false);
    };

    analyzeWebsite();
  }, [domain]);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Thanks! We\'ll send you detailed recommendations.');
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-500';
    if (score >= 40) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return 'Excellent';
    if (score >= 40) return 'Needs Improvement';
    return 'Critical';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'pass') return (
      <svg className="w-6 h-6 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    );
    if (status === 'warning') return (
      <svg className="w-6 h-6 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    );
    return (
      <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="animate-spin w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Analyzing Your Website</h2>
          <p className="text-slate-600 mb-4">Checking {domain} for AEO readiness...</p>
          <div className="space-y-2 text-sm text-slate-500">
            <p>Checking llms.txt...</p>
            <p>Analyzing JSON-LD schema...</p>
            <p>Testing AI crawler access...</p>
            <p>Evaluating content structure...</p>
          </div>
        </div>
      </div>
    );
  }

  const passedChecks = checks.filter(c => c.status === 'pass').length;
  const failedChecks = checks.filter(c => c.status === 'fail').length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
            AEO Score Report
          </h1>
          <p className="text-xl text-slate-600">
            Results for: <strong className="text-slate-900">{domain}</strong>
          </p>
        </div>

        {/* Score Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="text-center">
              <div className={`text-8xl font-bold ${getScoreColor(score)}`}>
                {score}
              </div>
              <p className="text-slate-500 mt-1">out of 100</p>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-4 py-2 rounded-full text-lg font-medium ${
                  score >= 70 ? 'bg-emerald-100 text-emerald-700' :
                  score >= 40 ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {getScoreLabel(score)}
                </span>
              </div>
              <p className="text-slate-600 mb-4">
                {score >= 70
                  ? 'Great job! Your website is well-optimized for AI discovery.'
                  : score >= 40
                  ? 'Your website has some AEO basics but there\'s room for improvement.'
                  : 'Your website needs significant work to be AI-friendly.'
                }
              </p>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-600">{passedChecks} Passed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  <span className="text-slate-600">{failedChecks} Failed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  <span className="text-slate-600">{checks.length - passedChecks - failedChecks} Warnings</span>
                </div>
              </div>
              <div className="mt-4 h-4 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    score >= 70 ? 'bg-emerald-500' :
                    score >= 40 ? 'bg-amber-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Checks */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-8">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Detailed Analysis</h2>
          </div>
          <div className="divide-y divide-slate-200">
            {checks.map((check) => (
              <div key={check.name} className="p-6 flex items-center gap-4">
                {getStatusIcon(check.status)}
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{check.name}</h3>
                  <p className="text-sm text-slate-600">{check.message}</p>
                </div>
                <div className="text-right">
                  <span className={`font-bold ${
                    check.status === 'pass' ? 'text-emerald-600' :
                    check.status === 'warning' ? 'text-amber-600' :
                    'text-red-600'
                  }`}>
                    {check.points}/{check.maxPoints}
                  </span>
                  <p className="text-xs text-slate-500">points</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Wins */}
        {failedChecks > 0 && (
          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-8 mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Wins</h2>
            <ul className="space-y-3">
              {checks.filter(c => c.status === 'fail').map((check, i) => (
                <li key={check.name} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center text-sm flex-shrink-0">
                    {i + 1}
                  </span>
                  <div>
                    <span className="font-medium text-slate-900">{check.name}:</span>{' '}
                    <span className="text-slate-600">
                      {check.name === 'llms.txt' && 'Add an llms.txt file to help AI understand your site (+15 points)'}
                      {check.name === 'JSON-LD Schema' && 'Add Organization and Product schema (+20 points)'}
                      {check.name === 'GPTBot Access' && 'Allow GPTBot in your robots.txt (+15 points)'}
                      {check.name === 'ClaudeBot Access' && 'Allow ClaudeBot in your robots.txt (+10 points)'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Email Capture */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-8 text-white mb-8">
          <h3 className="text-xl font-bold mb-2">Get Implementation Guide</h3>
          <p className="text-emerald-100 mb-4">
            Receive step-by-step instructions to fix these issues and improve your score.
          </p>
          <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 px-4 py-3 rounded-lg text-slate-900 placeholder-slate-500"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-white text-emerald-600 font-bold rounded-lg hover:bg-emerald-50 transition-colors"
            >
              Send Guide
            </button>
          </form>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/score"
            className="px-6 py-3 bg-white border border-slate-200 rounded-lg text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors"
          >
            Check Another Website
          </Link>
          <Link
            href="/check"
            className="px-6 py-3 bg-white border border-slate-200 rounded-lg text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors"
          >
            Check AI Visibility
          </Link>
          <Link
            href="/compare"
            className="px-6 py-3 bg-white border border-slate-200 rounded-lg text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors"
          >
            Compare vs Competitor
          </Link>
        </div>
      </div>
    </div>
  );
}
