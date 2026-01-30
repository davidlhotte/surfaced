'use client';

import Link from 'next/link';

export default function ToolsPage() {
  const tools = [
    {
      id: 'llms-validator',
      title: 'llms.txt Validator',
      description: 'Validate your llms.txt file to ensure AI crawlers can understand your brand.',
      icon: '📄',
      color: 'from-violet-500 to-purple-600',
      href: '/tools/llms-validator',
    },
    {
      id: 'crawler-test',
      title: 'AI Crawler Test',
      description: 'Test if major AI crawlers (GPTBot, ClaudeBot, etc.) can access your website.',
      icon: '🤖',
      color: 'from-sky-500 to-cyan-600',
      href: '/tools/crawler-test',
    },
    {
      id: 'schema-checker',
      title: 'JSON-LD Schema Checker',
      description: 'Validate your structured data for better AI understanding and visibility.',
      icon: '🔗',
      color: 'from-emerald-500 to-teal-600',
      href: '/tools/schema-checker',
    },
    {
      id: 'visibility-check',
      title: 'AI Visibility Checker',
      description: 'See what ChatGPT, Claude, and Perplexity say about your brand right now.',
      icon: '🔍',
      color: 'from-amber-500 to-orange-600',
      href: '/check',
    },
    {
      id: 'aeo-score',
      title: 'AEO Score Grader',
      description: 'Get your website scored for AI readiness with detailed recommendations.',
      icon: '📊',
      color: 'from-rose-500 to-pink-600',
      href: '/score',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-slate-900">
            Surfaced
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/check" className="text-slate-600 hover:text-slate-900">Check</Link>
            <Link href="/score" className="text-slate-600 hover:text-slate-900">Score</Link>
            <Link href="/tools" className="text-sky-600 font-medium">Tools</Link>
            <Link href="/pricing" className="text-slate-600 hover:text-slate-900">Pricing</Link>
            <Link
              href="/login"
              className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6">
            Free AEO Tools
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Everything you need to optimize your brand for AI search engines.
            All tools are free to use - no signup required.
          </p>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tools.map((tool) => (
              <Link
                key={tool.id}
                href={tool.href}
                className="group bg-white rounded-2xl p-8 border border-slate-200 hover:shadow-xl hover:border-slate-300 transition-all"
              >
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-3xl mb-6`}>
                  {tool.icon}
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-sky-600 transition-colors">
                  {tool.title}
                </h2>
                <p className="text-slate-600 mb-4">
                  {tool.description}
                </p>
                <span className="text-sky-600 font-semibold flex items-center gap-1">
                  Try it free
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white mt-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            Need More Than Free Tools?
          </h2>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
            Get unlimited checks, advanced analytics, competitor tracking,
            and automated reports with our premium plans.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/pricing"
              className="px-8 py-4 bg-sky-500 text-white font-bold rounded-xl hover:bg-sky-400 transition-colors"
            >
              View Pricing
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
