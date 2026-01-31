'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { getAllArticles, BlogArticle } from '@/lib/blog/articles';

function BlogContent() {
  const searchParams = useSearchParams();
  const locale = searchParams.get('lang') === 'fr' ? 'fr' : 'en';

  const articles = getAllArticles();
  const featuredArticle = articles.find(a => a.featured) || articles[0];
  const otherArticles = articles.filter(a => a.slug !== featuredArticle?.slug);

  const t = {
    en: {
      title: 'Blog',
      subtitle: 'Insights and guides on AEO, AI visibility, and e-commerce optimization',
      readMore: 'Read article',
      minRead: 'min read',
      backToHome: 'Home',
      featured: 'Featured',
      categories: {
        aeo: 'AEO',
        shopify: 'Shopify',
        ai: 'AI',
        tutorial: 'Tutorial',
      },
      newsletter: 'Get AEO insights',
      newsletterDesc: 'Weekly tips on optimizing your store for AI assistants.',
      subscribe: 'Subscribe',
      emailPlaceholder: 'Enter your email',
    },
    fr: {
      title: 'Blog',
      subtitle: 'Guides et conseils sur l\'AEO, la visibilité IA et l\'optimisation e-commerce',
      readMore: 'Lire l\'article',
      minRead: 'min de lecture',
      backToHome: 'Accueil',
      featured: 'À la une',
      categories: {
        aeo: 'AEO',
        shopify: 'Shopify',
        ai: 'IA',
        tutorial: 'Tutoriel',
      },
      newsletter: 'Recevez nos conseils AEO',
      newsletterDesc: 'Des astuces hebdomadaires pour optimiser votre boutique pour les assistants IA.',
      subscribe: 'S\'abonner',
      emailPlaceholder: 'Votre email',
    },
  }[locale];

  const getCategoryColor = (category: BlogArticle['category']) => {
    const colors = {
      aeo: 'bg-sky-100 text-sky-700 border-sky-200',
      shopify: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      ai: 'bg-violet-100 text-violet-700 border-violet-200',
      tutorial: 'bg-amber-100 text-amber-700 border-amber-200',
    };
    return colors[category];
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold text-slate-900">
              Surfaced
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <Link href="/blog" className="text-sky-600 font-medium">Blog</Link>
              <Link href="/tools" className="text-slate-600 hover:text-slate-900 transition-colors">Tools</Link>
              <Link href="/pricing" className="text-slate-600 hover:text-slate-900 transition-colors">Pricing</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href={locale === 'fr' ? '/blog?lang=en' : '/blog?lang=fr'}
              className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              {locale === 'fr' ? 'EN' : 'FR'}
            </Link>
            <a
              href="https://apps.shopify.com/surfaced"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
            >
              Try Surfaced
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-sky-50 py-20 px-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-sky-100 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-100 rounded-full blur-3xl opacity-50"></div>
        </div>
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur border border-slate-200 rounded-full text-sm text-slate-600 mb-6">
            <span className="w-2 h-2 bg-sky-500 rounded-full animate-pulse"></span>
            AEO Resources & Guides
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            {t.title}
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            {t.subtitle}
          </p>
        </div>
      </section>

      {/* Featured Article */}
      {featuredArticle && (
        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-8">
              <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full">
                {t.featured}
              </span>
            </div>
            <Link
              href={`/blog/${featuredArticle.slug}?lang=${locale}`}
              className="group block"
            >
              <div className="grid lg:grid-cols-2 gap-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl overflow-hidden">
                <div className="relative h-64 lg:h-auto lg:min-h-[400px]">
                  <Image
                    src={featuredArticle.coverImage}
                    alt={locale === 'fr' ? featuredArticle.coverImageAltFr : featuredArticle.coverImageAlt}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-900/50 to-transparent lg:hidden"></div>
                </div>
                <div className="flex flex-col justify-center p-8 lg:p-12">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(featuredArticle.category)}`}>
                      {t.categories[featuredArticle.category]}
                    </span>
                    <span className="text-slate-400 text-sm">{featuredArticle.readTime} {t.minRead}</span>
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4 group-hover:text-sky-400 transition-colors">
                    {locale === 'fr' ? featuredArticle.titleFr : featuredArticle.title}
                  </h2>
                  <p className="text-slate-300 mb-6 line-clamp-3">
                    {locale === 'fr' ? featuredArticle.descriptionFr : featuredArticle.description}
                  </p>
                  <div className="flex items-center gap-4">
                    {featuredArticle.authorAvatar && (
                      <Image
                        src={featuredArticle.authorAvatar}
                        alt={featuredArticle.author}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    )}
                    <div>
                      <p className="text-white text-sm font-medium">{featuredArticle.author}</p>
                      <p className="text-slate-400 text-sm">
                        {new Date(featuredArticle.date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Articles Grid */}
      <section className="py-12 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {otherArticles.map((article) => (
              <Link
                key={article.slug}
                href={`/blog/${article.slug}?lang=${locale}`}
                className="group bg-white rounded-2xl overflow-hidden border border-slate-200 hover:shadow-xl hover:border-slate-300 transition-all duration-300"
              >
                <div className="relative h-52 overflow-hidden">
                  <Image
                    src={article.coverImage}
                    alt={locale === 'fr' ? article.coverImageAltFr : article.coverImageAlt}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${getCategoryColor(article.category)}`}>
                      {t.categories[article.category]}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 text-sm text-slate-500 mb-3">
                    <span>{article.readTime} {t.minRead}</span>
                    <span className="text-slate-300">•</span>
                    <span>
                      {new Date(article.date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3 group-hover:text-sky-600 transition-colors line-clamp-2">
                    {locale === 'fr' ? article.titleFr : article.title}
                  </h3>
                  <p className="text-sm text-slate-600 line-clamp-2 mb-4">
                    {locale === 'fr' ? article.descriptionFr : article.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {article.authorAvatar && (
                        <Image
                          src={article.authorAvatar}
                          alt={article.author}
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                      )}
                      <span className="text-xs text-slate-500">{article.author}</span>
                    </div>
                    <span className="text-sky-600 text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                      {t.readMore}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-sky-600 to-cyan-600">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t.newsletter}</h2>
          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">{t.newsletterDesc}</p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder={t.emailPlaceholder}
              className="flex-1 px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-white text-sky-600 font-semibold rounded-xl hover:bg-sky-50 transition-colors"
            >
              {t.subscribe}
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <Link href="/" className="text-2xl font-bold">Surfaced</Link>
              <p className="text-slate-400 mt-4 max-w-md">
                The first AEO (Answer Engine Optimization) platform for Shopify stores. Make your products visible on ChatGPT, Claude, and Perplexity.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-3 text-slate-400">
                <li><Link href="/tools" className="hover:text-white transition-colors">Free Tools</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-3 text-slate-400">
                <li><Link href="/blog/what-is-aeo-complete-guide-2025" className="hover:text-white transition-colors">What is AEO?</Link></li>
                <li><Link href="/tools/llms-validator" className="hover:text-white transition-colors">llms.txt Validator</Link></li>
                <li><Link href="/tools/schema-checker" className="hover:text-white transition-colors">Schema Checker</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-400 text-sm">
              &copy; {new Date().getFullYear()} Surfaced. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function BlogPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-600">Loading...</span>
        </div>
      </div>
    }>
      <BlogContent />
    </Suspense>
  );
}
