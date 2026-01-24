'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { use } from 'react';
import { getArticleBySlug } from '@/lib/blog/articles';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function BlogArticlePage({ params }: PageProps) {
  const { slug } = use(params);
  const searchParams = useSearchParams();
  const locale = searchParams.get('lang') === 'fr' ? 'fr' : 'en';

  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const t = {
    en: {
      backToBlog: 'Back to blog',
      minRead: 'min read',
      share: 'Share this article',
      relatedArticles: 'Related Articles',
      tryApp: 'Ready to optimize for AI?',
      tryAppCta: 'Try Surfaced Free',
    },
    fr: {
      backToBlog: 'Retour au blog',
      minRead: 'min de lecture',
      share: 'Partager cet article',
      relatedArticles: 'Articles connexes',
      tryApp: 'Prêt à optimiser pour l\'IA ?',
      tryAppCta: 'Essayer Surfaced Gratuitement',
    },
  }[locale];

  const title = locale === 'fr' ? article.titleFr : article.title;
  const content = locale === 'fr' ? article.contentFr : article.content;

  // Simple markdown-like rendering for the content
  const renderContent = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Headers
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-3xl font-bold mt-8 mb-4">{line.slice(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-2xl font-bold mt-8 mb-4">{line.slice(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-xl font-bold mt-6 mb-3">{line.slice(4)}</h3>;
      }

      // Bold text
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={index} className="font-bold my-2">{line.slice(2, -2)}</p>;
      }

      // Lists
      if (line.startsWith('- ')) {
        return <li key={index} className="ml-6 list-disc">{line.slice(2)}</li>;
      }

      // Blockquotes
      if (line.startsWith('> ')) {
        return (
          <blockquote key={index} className="border-l-4 border-sky-500 pl-4 my-4 text-slate-600 italic">
            {line.slice(2)}
          </blockquote>
        );
      }

      // Code blocks
      if (line.startsWith('```')) {
        return null; // Skip code fence lines
      }

      // Tables (simplified - just render as text)
      if (line.startsWith('|')) {
        if (line.includes('---')) return null;
        const cells = line.split('|').filter(c => c.trim());
        return (
          <div key={index} className="grid grid-cols-4 gap-2 py-1 border-b border-slate-200 text-sm">
            {cells.map((cell, i) => (
              <span key={i} className={i === 0 ? 'font-medium' : ''}>{cell.trim()}</span>
            ))}
          </div>
        );
      }

      // Horizontal rule
      if (line === '---') {
        return <hr key={index} className="my-8 border-slate-200" />;
      }

      // Empty lines
      if (line.trim() === '') {
        return <div key={index} className="h-4" />;
      }

      // Regular paragraphs
      return <p key={index} className="my-4 leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href={`/blog?lang=${locale}`} className="text-sky-600 hover:text-sky-700 font-medium">
            &larr; {t.backToBlog}
          </Link>
        </div>
      </header>

      {/* Article */}
      <article className="max-w-3xl mx-auto px-4 py-12">
        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
          <span>{article.author}</span>
          <span>&bull;</span>
          <span>
            {new Date(article.date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
          <span>&bull;</span>
          <span>{article.readTime} {t.minRead}</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-slate-900 mb-8">{title}</h1>

        {/* Content */}
        <div className="prose prose-lg prose-slate max-w-none">
          {renderContent(content)}
        </div>
      </article>

      {/* CTA */}
      <section className="bg-gradient-to-r from-sky-500 to-cyan-500 py-12 px-4">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-2xl font-bold mb-4">{t.tryApp}</h2>
          <a
            href="https://apps.shopify.com/surfaced"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-3 bg-white text-sky-600 font-bold rounded-lg hover:bg-sky-50 transition-colors"
          >
            {t.tryAppCta}
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-8 px-4">
        <div className="max-w-3xl mx-auto text-center text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} Surfaced. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
