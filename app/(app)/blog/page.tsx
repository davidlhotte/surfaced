'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { getAllArticles, BlogArticle } from '@/lib/blog/articles';

function BlogContent() {
  const searchParams = useSearchParams();
  const locale = searchParams.get('lang') === 'fr' ? 'fr' : 'en';

  const articles = getAllArticles();

  const t = {
    en: {
      title: 'Blog',
      subtitle: 'Learn about AEO, AI visibility, and e-commerce optimization',
      readMore: 'Read article',
      minRead: 'min read',
      backToHome: 'Back to home',
      categories: {
        aeo: 'AEO',
        shopify: 'Shopify',
        ai: 'AI',
        tutorial: 'Tutorial',
      },
    },
    fr: {
      title: 'Blog',
      subtitle: 'Apprenez-en plus sur l\'AEO, la visibilité IA et l\'optimisation e-commerce',
      readMore: 'Lire l\'article',
      minRead: 'min de lecture',
      backToHome: 'Retour à l\'accueil',
      categories: {
        aeo: 'AEO',
        shopify: 'Shopify',
        ai: 'IA',
        tutorial: 'Tutoriel',
      },
    },
  }[locale];

  const getCategoryColor = (category: BlogArticle['category']) => {
    const colors = {
      aeo: 'bg-sky-100 text-sky-700',
      shopify: 'bg-green-100 text-green-700',
      ai: 'bg-purple-100 text-purple-700',
      tutorial: 'bg-amber-100 text-amber-700',
    };
    return colors[category];
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="text-sky-600 hover:text-sky-700 font-medium">
            &larr; {t.backToHome}
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-white to-slate-50 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">{t.title}</h1>
          <p className="text-lg text-slate-600">{t.subtitle}</p>
        </div>
      </section>

      {/* Articles */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            {articles.map((article) => (
              <article
                key={article.slug}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(article.category)}`}>
                    {t.categories[article.category]}
                  </span>
                  <span className="text-sm text-slate-500">
                    {article.readTime} {t.minRead}
                  </span>
                  <span className="text-sm text-slate-400">
                    {new Date(article.date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-slate-900 mb-3">
                  <Link href={`/blog/${article.slug}?lang=${locale}`} className="hover:text-sky-600 transition-colors">
                    {locale === 'fr' ? article.titleFr : article.title}
                  </Link>
                </h2>

                <p className="text-slate-600 mb-4">
                  {locale === 'fr' ? article.descriptionFr : article.description}
                </p>

                <Link
                  href={`/blog/${article.slug}?lang=${locale}`}
                  className="inline-flex items-center text-sky-600 font-medium hover:text-sky-700"
                >
                  {t.readMore} &rarr;
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 px-4 mt-12">
        <div className="max-w-4xl mx-auto text-center text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} Surfaced. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default function BlogPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>}>
      <BlogContent />
    </Suspense>
  );
}
