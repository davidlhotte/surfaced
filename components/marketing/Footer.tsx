import Link from 'next/link';

export function MarketingFooter() {
  return (
    <footer className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#0A1628' }}>
                <svg viewBox="0 0 64 64" width="28" height="28" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="footerGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0EA5E9"/>
                      <stop offset="100%" stopColor="#38BDF8"/>
                    </linearGradient>
                  </defs>
                  <path d="M10 46 Q20 38 32 38 Q44 38 54 46 Q44 30 32 30 Q20 30 10 46 Z" fill="url(#footerGrad)" opacity="0.3"/>
                  <path d="M8 40 Q18 28 32 28 Q46 28 56 40 Q46 20 32 20 Q18 20 8 40 Z" fill="url(#footerGrad)" opacity="0.5"/>
                  <path d="M6 34 Q16 18 32 18 Q48 18 58 34 Q48 12 32 12 Q16 12 6 34 Z" fill="url(#footerGrad)"/>
                  <circle cx="32" cy="16" r="4" fill="#38BDF8"/>
                </svg>
              </div>
              <span className="text-xl font-bold">surfaced</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed">
              The AI Visibility Platform. See what ChatGPT, Claude & Perplexity say about your brand and optimize for AI search.
            </p>
          </div>

          {/* Free Tools */}
          <div>
            <h4 className="font-semibold mb-4">Free Tools</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/check" className="hover:text-white transition-colors">AI Visibility Checker</Link></li>
              <li><Link href="/score" className="hover:text-white transition-colors">AEO Score Grader</Link></li>
              <li><Link href="/compare" className="hover:text-white transition-colors">Competitor Comparison</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">AEO Blog</Link></li>
            </ul>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/shopify" className="hover:text-white transition-colors">For Shopify</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Login</Link></li>
              <li><Link href="/signup" className="hover:text-white transition-colors">Sign Up</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/gdpr" className="hover:text-white transition-colors">GDPR</Link></li>
              <li><a href="mailto:support@surfaced.app" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Surfaced. All rights reserved.
          </p>
          <p className="text-sm text-slate-500">
            Answer Engine Optimization for Every Brand
          </p>
        </div>
      </div>
    </footer>
  );
}
