'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { use, Suspense, useState, useEffect, useCallback } from 'react';
import { getArticleBySlug, getAllArticles } from '@/lib/blog/articles';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

function BlogArticleContent({ params }: PageProps) {
  const { slug } = use(params);
  const searchParams = useSearchParams();
  const locale = searchParams.get('lang') === 'fr' ? 'fr' : 'en';
  const [readProgress, setReadProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('');

  const article = getArticleBySlug(slug);
  const allArticles = getAllArticles();
  const relatedArticles = allArticles
    .filter(a => a.slug !== slug && a.category === article?.category)
    .slice(0, 2);

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = (scrollTop / docHeight) * 100;
    setReadProgress(Math.min(progress, 100));
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  if (!article) {
    notFound();
  }

  const t = {
    en: {
      backToBlog: 'Back to blog',
      minRead: 'min read',
      tableOfContents: 'Table of Contents',
      share: 'Share',
      relatedArticles: 'Related Articles',
      tryApp: 'Ready to optimize for AI?',
      tryAppDesc: 'Get started with Surfaced and make your store visible to ChatGPT, Claude, and Perplexity.',
      tryAppCta: 'Try Surfaced Free',
      sources: 'Sources',
      readMore: 'Read article',
    },
    fr: {
      backToBlog: 'Retour au blog',
      minRead: 'min de lecture',
      tableOfContents: 'Table des matières',
      share: 'Partager',
      relatedArticles: 'Articles connexes',
      tryApp: 'Prêt à optimiser pour l\'IA ?',
      tryAppDesc: 'Commencez avec Surfaced et rendez votre boutique visible sur ChatGPT, Claude et Perplexity.',
      tryAppCta: 'Essayer Surfaced Gratuitement',
      sources: 'Sources',
      readMore: 'Lire l\'article',
    },
  }[locale];

  const title = locale === 'fr' ? article.titleFr : article.title;
  const content = locale === 'fr' ? article.contentFr : article.content;
  const coverAlt = locale === 'fr' ? article.coverImageAltFr : article.coverImageAlt;

  // Enhanced markdown rendering
  const renderContent = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let codeBlock: string[] = [];
    let inCodeBlock = false;
    let codeLanguage = '';
    let listItems: React.ReactNode[] = [];
    let inList = false;

    const processInlineFormatting = (line: string): React.ReactNode => {
      // Process links, bold, italic, and code
      const parts: React.ReactNode[] = [];
      let remaining = line;
      let key = 0;

      while (remaining.length > 0) {
        // Check for links [text](url)
        const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
        // Check for bold **text**
        const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
        // Check for inline code `code`
        const codeMatch = remaining.match(/`([^`]+)`/);

        const matches = [
          linkMatch ? { match: linkMatch, index: remaining.indexOf(linkMatch[0]), type: 'link' } : null,
          boldMatch ? { match: boldMatch, index: remaining.indexOf(boldMatch[0]), type: 'bold' } : null,
          codeMatch ? { match: codeMatch, index: remaining.indexOf(codeMatch[0]), type: 'code' } : null,
        ].filter(Boolean).sort((a, b) => (a?.index ?? 0) - (b?.index ?? 0));

        if (matches.length === 0 || matches[0] === null) {
          parts.push(remaining);
          break;
        }

        const firstMatch = matches[0];
        const matchObj = firstMatch.match;
        if (!matchObj) break;

        // Add text before match
        if (firstMatch.index > 0) {
          parts.push(remaining.slice(0, firstMatch.index));
        }

        // Add formatted element
        if (firstMatch.type === 'link') {
          const isExternal = matchObj[2].startsWith('http');
          parts.push(
            <a
              key={key++}
              href={matchObj[2]}
              className="text-sky-600 hover:text-sky-700 underline decoration-sky-300 hover:decoration-sky-500 transition-colors"
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
            >
              {matchObj[1]}
              {isExternal && <span className="inline-block ml-1 text-xs">↗</span>}
            </a>
          );
        } else if (firstMatch.type === 'bold') {
          parts.push(<strong key={key++} className="font-semibold text-slate-900">{matchObj[1]}</strong>);
        } else if (firstMatch.type === 'code') {
          parts.push(
            <code key={key++} className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded text-sm font-mono">
              {matchObj[1]}
            </code>
          );
        }

        remaining = remaining.slice(firstMatch.index + matchObj[0].length);
      }

      return parts.length > 0 ? parts : line;
    };

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="my-6 ml-6 space-y-2">
            {listItems}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code block handling
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <div key={`code-${i}`} className="my-6 rounded-xl overflow-hidden border border-slate-200 bg-slate-900">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
                <span className="text-xs font-mono text-slate-400">{codeLanguage || 'code'}</span>
                <button
                  className="text-xs text-slate-400 hover:text-white transition-colors"
                  onClick={() => navigator.clipboard.writeText(codeBlock.join('\n'))}
                >
                  Copy
                </button>
              </div>
              <pre className="p-4 overflow-x-auto">
                <code className="text-sm font-mono text-slate-100">{codeBlock.join('\n')}</code>
              </pre>
            </div>
          );
          codeBlock = [];
          inCodeBlock = false;
          codeLanguage = '';
        } else {
          flushList();
          inCodeBlock = true;
          codeLanguage = line.slice(3).trim();
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlock.push(line);
        continue;
      }

      // Headers with anchors
      if (line.startsWith('# ')) {
        flushList();
        continue; // Skip H1 as we have the title
      }
      if (line.startsWith('## ')) {
        flushList();
        const text = line.slice(3);
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        elements.push(
          <h2 key={i} id={id} className="text-2xl font-bold text-slate-900 mt-12 mb-6 scroll-mt-24 flex items-center gap-3">
            <span className="w-1 h-8 bg-gradient-to-b from-sky-500 to-cyan-500 rounded-full"></span>
            {text}
          </h2>
        );
        continue;
      }
      if (line.startsWith('### ')) {
        flushList();
        const text = line.slice(4);
        elements.push(
          <h3 key={i} className="text-xl font-semibold text-slate-800 mt-8 mb-4">
            {text}
          </h3>
        );
        continue;
      }
      if (line.startsWith('#### ')) {
        flushList();
        const text = line.slice(5);
        elements.push(
          <h4 key={i} className="text-lg font-semibold text-slate-700 mt-6 mb-3">
            {text}
          </h4>
        );
        continue;
      }

      // Lists
      if (line.startsWith('- ')) {
        inList = true;
        listItems.push(
          <li key={`li-${i}`} className="flex items-start gap-3 text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2.5 flex-shrink-0"></span>
            <span>{processInlineFormatting(line.slice(2))}</span>
          </li>
        );
        continue;
      } else if (inList) {
        flushList();
      }

      // Blockquotes
      if (line.startsWith('> ')) {
        flushList();
        elements.push(
          <blockquote key={i} className="my-6 pl-6 border-l-4 border-sky-500 bg-sky-50 py-4 pr-6 rounded-r-lg text-slate-700 italic">
            {processInlineFormatting(line.slice(2))}
          </blockquote>
        );
        continue;
      }

      // Tables
      if (line.startsWith('|')) {
        flushList();
        if (line.includes('---')) continue;
        const cells = line.split('|').filter(c => c.trim());
        const isHeader = i === 0 || lines[i - 1]?.startsWith('|') === false || lines[i + 1]?.includes('---');
        elements.push(
          <div key={i} className={`grid gap-4 py-3 px-4 text-sm ${isHeader ? 'bg-slate-100 font-semibold text-slate-900' : 'border-b border-slate-100'}`}
            style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}>
            {cells.map((cell, ci) => (
              <span key={ci} className={ci === 0 ? 'font-medium' : ''}>{processInlineFormatting(cell.trim())}</span>
            ))}
          </div>
        );
        continue;
      }

      // Horizontal rule
      if (line === '---') {
        flushList();
        elements.push(
          <div key={i} className="my-12 flex items-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
            <div className="w-2 h-2 rounded-full bg-slate-200"></div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
          </div>
        );
        continue;
      }

      // Empty lines
      if (line.trim() === '') {
        continue;
      }

      // Regular paragraphs
      flushList();
      elements.push(
        <p key={i} className="my-5 text-slate-600 leading-relaxed text-lg">
          {processInlineFormatting(line)}
        </p>
      );
    }

    flushList();
    return elements;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-slate-100">
        <div
          className="h-full bg-gradient-to-r from-sky-500 to-cyan-500 transition-all duration-150"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href={`/blog?lang=${locale}`} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t.backToBlog}
          </Link>
          <Link href="/" className="text-xl font-bold text-slate-900">
            Surfaced
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="relative h-[400px] md:h-[500px] overflow-hidden">
        <Image
          src={article.coverImage}
          alt={coverAlt}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/50 to-slate-900/30" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 w-full">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-sky-500 text-white text-sm font-medium rounded-full">
                {article.category.toUpperCase()}
              </span>
              <span className="text-white/80 text-sm">{article.readTime} {t.minRead}</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              {title}
            </h1>
            <div className="flex items-center gap-4">
              {article.authorAvatar && (
                <Image
                  src={article.authorAvatar}
                  alt={article.author}
                  width={48}
                  height={48}
                  className="rounded-full border-2 border-white/20"
                />
              )}
              <div>
                <p className="text-white font-medium">{article.author}</p>
                <p className="text-white/70 text-sm">
                  {new Date(article.date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                  {article.authorRole && ` • ${article.authorRole}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content with sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-12">
          {/* Article */}
          <article className="max-w-none">
            <div className="prose prose-lg prose-slate max-w-none">
              {renderContent(content)}
            </div>
          </article>

          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              {/* Table of Contents */}
              {article.tableOfContents && article.tableOfContents.length > 0 && (
                <div className="bg-slate-50 rounded-2xl p-6 mb-8">
                  <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                    {t.tableOfContents}
                  </h3>
                  <nav className="space-y-2">
                    {article.tableOfContents.map((item, index) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={`block text-sm py-1.5 px-3 rounded-lg transition-colors ${
                          activeSection === item.id
                            ? 'bg-sky-100 text-sky-700 font-medium'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <span className="text-slate-400 mr-2">{String(index + 1).padStart(2, '0')}</span>
                        {locale === 'fr' ? item.titleFr : item.title}
                      </a>
                    ))}
                  </nav>
                </div>
              )}

              {/* Share */}
              <div className="bg-slate-50 rounded-2xl p-6">
                <h3 className="font-semibold text-slate-900 mb-4">{t.share}</h3>
                <div className="flex gap-3">
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-200 hover:bg-sky-500 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                  <a
                    href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&title=${encodeURIComponent(title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-200 hover:bg-[#0077b5] hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>
                  <button
                    onClick={() => navigator.clipboard.writeText(typeof window !== 'undefined' ? window.location.href : '')}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* CTA */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-500 mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t.tryApp}</h2>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">{t.tryAppDesc}</p>
          <a
            href="https://apps.shopify.com/surfaced"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-sky-600 hover:to-cyan-600 transition-all shadow-lg shadow-sky-500/25"
          >
            {t.tryAppCta}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </section>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="py-16 px-4 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">{t.relatedArticles}</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {relatedArticles.map((relatedArticle) => (
                <Link
                  key={relatedArticle.slug}
                  href={`/blog/${relatedArticle.slug}?lang=${locale}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-slate-200 hover:shadow-xl transition-all"
                >
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={relatedArticle.coverImage}
                      alt={locale === 'fr' ? relatedArticle.coverImageAltFr : relatedArticle.coverImageAlt}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-medium text-sky-600 uppercase">{relatedArticle.category}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-500">{relatedArticle.readTime} {t.minRead}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 group-hover:text-sky-600 transition-colors mb-2">
                      {locale === 'fr' ? relatedArticle.titleFr : relatedArticle.title}
                    </h3>
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {locale === 'fr' ? relatedArticle.descriptionFr : relatedArticle.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <Link href="/" className="text-xl font-bold text-slate-900">Surfaced</Link>
            <p className="text-sm text-slate-500 mt-1">AEO for Shopify stores</p>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/blog" className="hover:text-slate-900 transition-colors">Blog</Link>
            <Link href="/tools" className="hover:text-slate-900 transition-colors">Tools</Link>
            <Link href="/pricing" className="hover:text-slate-900 transition-colors">Pricing</Link>
          </div>
          <p className="text-sm text-slate-400">
            &copy; {new Date().getFullYear()} Surfaced. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function BlogArticlePage({ params }: PageProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-600">Loading...</span>
        </div>
      </div>
    }>
      <BlogArticleContent params={params} />
    </Suspense>
  );
}
