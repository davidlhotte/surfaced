import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateSitemapXml,
  generateSitemapIndex,
  generateShopSitemap,
  analyzeSitemap,
  DEFAULT_SITEMAP_CONFIG,
  type SitemapUrl,
  type SitemapConfig,
} from '@/lib/services/sitemap';
import { prisma } from '@/lib/db/prisma';
import { fetchProducts, fetchShopInfo } from '@/lib/shopify/graphql';

// Mock dependencies
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    shop: {
      findUnique: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/shopify/graphql', () => ({
  fetchProducts: vi.fn(),
  fetchShopInfo: vi.fn(),
}));

vi.mock('@/lib/monitoring/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('Sitemap Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateSitemapXml', () => {
    it('should generate valid XML sitemap with single URL', () => {
      const urls: SitemapUrl[] = [
        { loc: 'https://example.com/page1' },
      ];

      const xml = generateSitemapXml(urls);

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
      expect(xml).toContain('<loc>https://example.com/page1</loc>');
      expect(xml).toContain('</urlset>');
    });

    it('should include lastmod when provided', () => {
      const urls: SitemapUrl[] = [
        { loc: 'https://example.com/', lastmod: '2024-01-15' },
      ];

      const xml = generateSitemapXml(urls);

      expect(xml).toContain('<lastmod>2024-01-15</lastmod>');
    });

    it('should include changefreq when provided', () => {
      const urls: SitemapUrl[] = [
        { loc: 'https://example.com/', changefreq: 'weekly' },
      ];

      const xml = generateSitemapXml(urls);

      expect(xml).toContain('<changefreq>weekly</changefreq>');
    });

    it('should include priority when provided', () => {
      const urls: SitemapUrl[] = [
        { loc: 'https://example.com/', priority: 0.8 },
      ];

      const xml = generateSitemapXml(urls);

      expect(xml).toContain('<priority>0.8</priority>');
    });

    it('should format priority with one decimal place', () => {
      const urls: SitemapUrl[] = [
        { loc: 'https://example.com/', priority: 1 },
      ];

      const xml = generateSitemapXml(urls);

      expect(xml).toContain('<priority>1.0</priority>');
    });

    it('should include image sitemap extension', () => {
      const urls: SitemapUrl[] = [
        {
          loc: 'https://example.com/product',
          images: [
            {
              loc: 'https://example.com/image.jpg',
              title: 'Product Image',
              caption: 'A great product',
            },
          ],
        },
      ];

      const xml = generateSitemapXml(urls);

      expect(xml).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');
      expect(xml).toContain('<image:image>');
      expect(xml).toContain('<image:loc>https://example.com/image.jpg</image:loc>');
      expect(xml).toContain('<image:title>Product Image</image:title>');
      expect(xml).toContain('<image:caption>A great product</image:caption>');
      expect(xml).toContain('</image:image>');
    });

    it('should handle multiple images per URL', () => {
      const urls: SitemapUrl[] = [
        {
          loc: 'https://example.com/product',
          images: [
            { loc: 'https://example.com/image1.jpg' },
            { loc: 'https://example.com/image2.jpg' },
            { loc: 'https://example.com/image3.jpg' },
          ],
        },
      ];

      const xml = generateSitemapXml(urls);

      const imageCount = (xml.match(/<image:image>/g) || []).length;
      expect(imageCount).toBe(3);
    });

    it('should escape special XML characters in URLs', () => {
      const urls: SitemapUrl[] = [
        { loc: 'https://example.com/search?q=test&category=shoes' },
      ];

      const xml = generateSitemapXml(urls);

      expect(xml).toContain('&amp;');
      expect(xml).not.toContain('&category'); // Should be escaped
    });

    it('should escape special XML characters in image titles', () => {
      const urls: SitemapUrl[] = [
        {
          loc: 'https://example.com/product',
          images: [
            {
              loc: 'https://example.com/image.jpg',
              title: 'Product <Best> "Quality" & More',
            },
          ],
        },
      ];

      const xml = generateSitemapXml(urls);

      expect(xml).toContain('&lt;');
      expect(xml).toContain('&gt;');
      expect(xml).toContain('&amp;');
      expect(xml).toContain('&quot;');
    });

    it('should handle empty URL array', () => {
      const xml = generateSitemapXml([]);

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<urlset');
      expect(xml).toContain('</urlset>');
      expect(xml).not.toContain('<url>');
    });

    it('should handle multiple URLs', () => {
      const urls: SitemapUrl[] = [
        { loc: 'https://example.com/', priority: 1.0 },
        { loc: 'https://example.com/products', priority: 0.8 },
        { loc: 'https://example.com/about', priority: 0.5 },
      ];

      const xml = generateSitemapXml(urls);

      const urlCount = (xml.match(/<url>/g) || []).length;
      expect(urlCount).toBe(3);
    });

    it('should handle image with only location (no title/caption)', () => {
      const urls: SitemapUrl[] = [
        {
          loc: 'https://example.com/product',
          images: [{ loc: 'https://example.com/image.jpg' }],
        },
      ];

      const xml = generateSitemapXml(urls);

      expect(xml).toContain('<image:loc>https://example.com/image.jpg</image:loc>');
      expect(xml).not.toContain('<image:title>');
      expect(xml).not.toContain('<image:caption>');
    });

    it('should escape apostrophes in text', () => {
      const urls: SitemapUrl[] = [
        {
          loc: 'https://example.com/product',
          images: [
            {
              loc: 'https://example.com/image.jpg',
              title: "John's Product",
            },
          ],
        },
      ];

      const xml = generateSitemapXml(urls);

      expect(xml).toContain('&apos;');
    });
  });

  describe('generateSitemapIndex', () => {
    it('should generate valid sitemap index XML', () => {
      const sitemaps = [
        { loc: 'https://example.com/sitemap-products.xml' },
        { loc: 'https://example.com/sitemap-pages.xml' },
      ];

      const xml = generateSitemapIndex(sitemaps);

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
      expect(xml).toContain('<sitemap>');
      expect(xml).toContain('<loc>https://example.com/sitemap-products.xml</loc>');
      expect(xml).toContain('<loc>https://example.com/sitemap-pages.xml</loc>');
      expect(xml).toContain('</sitemapindex>');
    });

    it('should include lastmod when provided', () => {
      const sitemaps = [
        { loc: 'https://example.com/sitemap.xml', lastmod: '2024-01-15' },
      ];

      const xml = generateSitemapIndex(sitemaps);

      expect(xml).toContain('<lastmod>2024-01-15</lastmod>');
    });

    it('should handle empty sitemaps array', () => {
      const xml = generateSitemapIndex([]);

      expect(xml).toContain('<sitemapindex');
      expect(xml).toContain('</sitemapindex>');
      expect(xml).not.toContain('<sitemap>');
    });

    it('should escape special characters in sitemap URLs', () => {
      const sitemaps = [
        { loc: 'https://example.com/sitemap.xml?token=abc&version=1' },
      ];

      const xml = generateSitemapIndex(sitemaps);

      expect(xml).toContain('&amp;');
    });
  });

  describe('DEFAULT_SITEMAP_CONFIG', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_SITEMAP_CONFIG.includeProducts).toBe(true);
      expect(DEFAULT_SITEMAP_CONFIG.includeCollections).toBe(true);
      expect(DEFAULT_SITEMAP_CONFIG.includePages).toBe(true);
      expect(DEFAULT_SITEMAP_CONFIG.includeBlog).toBe(true);
      expect(DEFAULT_SITEMAP_CONFIG.defaultChangefreq).toBe('weekly');
      expect(DEFAULT_SITEMAP_CONFIG.productPriority).toBe(0.8);
      expect(DEFAULT_SITEMAP_CONFIG.collectionPriority).toBe(0.7);
      expect(DEFAULT_SITEMAP_CONFIG.pagePriority).toBe(0.5);
    });
  });

  describe('XML structure validation', () => {
    it('should produce well-formed XML', () => {
      const urls: SitemapUrl[] = [
        {
          loc: 'https://example.com/',
          lastmod: '2024-01-01',
          changefreq: 'daily',
          priority: 1.0,
          images: [
            {
              loc: 'https://example.com/logo.png',
              title: 'Logo',
            },
          ],
        },
      ];

      const xml = generateSitemapXml(urls);

      // Check opening and closing tags match
      expect((xml.match(/<url>/g) || []).length).toBe(
        (xml.match(/<\/url>/g) || []).length
      );
      expect((xml.match(/<image:image>/g) || []).length).toBe(
        (xml.match(/<\/image:image>/g) || []).length
      );
    });

    it('should have proper XML declaration', () => {
      const xml = generateSitemapXml([]);
      expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle URLs with unicode characters', () => {
      const urls: SitemapUrl[] = [
        { loc: 'https://example.com/产品/测试' },
      ];

      const xml = generateSitemapXml(urls);

      expect(xml).toContain('https://example.com/产品/测试');
    });

    it('should handle very long URLs', () => {
      const longPath = 'a'.repeat(2000);
      const urls: SitemapUrl[] = [
        { loc: `https://example.com/${longPath}` },
      ];

      const xml = generateSitemapXml(urls);

      expect(xml).toContain(longPath);
    });

    it('should handle priority of 0', () => {
      const urls: SitemapUrl[] = [
        { loc: 'https://example.com/', priority: 0 },
      ];

      const xml = generateSitemapXml(urls);

      expect(xml).toContain('<priority>0.0</priority>');
    });

    it('should handle all changefreq values', () => {
      const changefreqs: Array<SitemapUrl['changefreq']> = [
        'always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'
      ];

      for (const freq of changefreqs) {
        const urls: SitemapUrl[] = [
          { loc: 'https://example.com/', changefreq: freq },
        ];
        const xml = generateSitemapXml(urls);
        expect(xml).toContain(`<changefreq>${freq}</changefreq>`);
      }
    });
  });

  describe('generateShopSitemap', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should generate sitemap with products', async () => {
      (fetchShopInfo as ReturnType<typeof vi.fn>).mockResolvedValue({
        name: 'Test Shop',
        domain: 'test.myshopify.com',
      });

      (fetchProducts as ReturnType<typeof vi.fn>).mockResolvedValue({
        products: {
          nodes: [
            {
              handle: 'product-1',
              title: 'Product 1',
              images: { nodes: [] },
            },
            {
              handle: 'product-2',
              title: 'Product 2',
              images: { nodes: [{ url: 'https://example.com/img.jpg', altText: 'Alt' }] },
            },
          ],
        },
      });

      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
      });

      const result = await generateShopSitemap('test.myshopify.com');

      expect(result.urlCount).toBeGreaterThan(1);
      expect(result.sitemap).toContain('product-1');
      expect(result.sitemap).toContain('product-2');
    });

    it('should include homepage with highest priority', async () => {
      (fetchShopInfo as ReturnType<typeof vi.fn>).mockResolvedValue({
        name: 'Test Shop',
        domain: 'test.myshopify.com',
      });

      (fetchProducts as ReturnType<typeof vi.fn>).mockResolvedValue({
        products: { nodes: [] },
      });

      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
      });

      const result = await generateShopSitemap('test.myshopify.com');

      expect(result.sitemap).toContain('<priority>1.0</priority>');
    });

    it('should respect config for excluding products', async () => {
      (fetchShopInfo as ReturnType<typeof vi.fn>).mockResolvedValue({
        name: 'Test Shop',
        domain: 'test.myshopify.com',
      });

      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
      });

      const config = { ...DEFAULT_SITEMAP_CONFIG, includeProducts: false };
      const result = await generateShopSitemap('test.myshopify.com', config);

      expect(fetchProducts).not.toHaveBeenCalled();
    });

    it('should include collections when enabled', async () => {
      (fetchShopInfo as ReturnType<typeof vi.fn>).mockResolvedValue({
        name: 'Test Shop',
        domain: 'test.myshopify.com',
      });

      (fetchProducts as ReturnType<typeof vi.fn>).mockResolvedValue({
        products: { nodes: [] },
      });

      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
      });

      const result = await generateShopSitemap('test.myshopify.com');

      expect(result.sitemap).toContain('/collections');
      expect(result.sitemap).toContain('/collections/all');
    });

    it('should exclude collections when disabled', async () => {
      (fetchShopInfo as ReturnType<typeof vi.fn>).mockResolvedValue({
        name: 'Test Shop',
        domain: 'test.myshopify.com',
      });

      (fetchProducts as ReturnType<typeof vi.fn>).mockResolvedValue({
        products: { nodes: [] },
      });

      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
      });

      const config = { ...DEFAULT_SITEMAP_CONFIG, includeCollections: false };
      const result = await generateShopSitemap('test.myshopify.com', config);

      expect(result.sitemap).not.toContain('/collections');
    });

    it('should include standard pages when enabled', async () => {
      (fetchShopInfo as ReturnType<typeof vi.fn>).mockResolvedValue({
        name: 'Test Shop',
        domain: 'test.myshopify.com',
      });

      (fetchProducts as ReturnType<typeof vi.fn>).mockResolvedValue({
        products: { nodes: [] },
      });

      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
      });

      const result = await generateShopSitemap('test.myshopify.com');

      expect(result.sitemap).toContain('/pages/about');
      expect(result.sitemap).toContain('/pages/contact');
      expect(result.sitemap).toContain('/pages/faq');
    });

    it('should include blog when enabled', async () => {
      (fetchShopInfo as ReturnType<typeof vi.fn>).mockResolvedValue({
        name: 'Test Shop',
        domain: 'test.myshopify.com',
      });

      (fetchProducts as ReturnType<typeof vi.fn>).mockResolvedValue({
        products: { nodes: [] },
      });

      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
      });

      const result = await generateShopSitemap('test.myshopify.com');

      expect(result.sitemap).toContain('/blogs/news');
    });

    it('should count images correctly', async () => {
      (fetchShopInfo as ReturnType<typeof vi.fn>).mockResolvedValue({
        name: 'Test Shop',
        domain: 'test.myshopify.com',
      });

      (fetchProducts as ReturnType<typeof vi.fn>).mockResolvedValue({
        products: {
          nodes: [
            {
              handle: 'product-1',
              title: 'Product 1',
              images: {
                nodes: [
                  { url: 'https://example.com/img1.jpg', altText: 'Alt 1' },
                  { url: 'https://example.com/img2.jpg', altText: 'Alt 2' },
                ],
              },
            },
          ],
        },
      });

      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
      });

      const result = await generateShopSitemap('test.myshopify.com');

      expect(result.imageCount).toBe(2);
    });

    it('should log sitemap generation in audit log', async () => {
      (fetchShopInfo as ReturnType<typeof vi.fn>).mockResolvedValue({
        name: 'Test Shop',
        domain: 'test.myshopify.com',
      });

      (fetchProducts as ReturnType<typeof vi.fn>).mockResolvedValue({
        products: { nodes: [] },
      });

      (prisma.shop.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'shop-1',
      });

      await generateShopSitemap('test.myshopify.com');

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          shopId: 'shop-1',
          action: 'sitemap_generated',
        }),
      });
    });
  });

  describe('analyzeSitemap', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('should return error for invalid URL format', async () => {
      const result = await analyzeSitemap('not-a-valid-url');

      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should reject non-HTTPS URLs', async () => {
      const result = await analyzeSitemap('http://example.com/sitemap.xml');

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Failed to fetch or parse sitemap');
    });

    it('should reject localhost URLs (SSRF protection)', async () => {
      const result = await analyzeSitemap('https://localhost/sitemap.xml');

      expect(result.isValid).toBe(false);
    });

    it('should reject internal IP URLs (SSRF protection)', async () => {
      const internalUrls = [
        'https://127.0.0.1/sitemap.xml',
        'https://192.168.1.1/sitemap.xml',
        'https://10.0.0.1/sitemap.xml',
        'https://172.16.0.1/sitemap.xml',
      ];

      for (const url of internalUrls) {
        const result = await analyzeSitemap(url);
        expect(result.isValid).toBe(false);
      }
    });

    it('should detect invalid sitemap format', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('<html><body>Not a sitemap</body></html>'),
      });

      const result = await analyzeSitemap('https://example.com/sitemap.xml');

      expect(result.issues).toContain('Invalid sitemap format');
    });

    it('should count URLs in valid sitemap', async () => {
      const validSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/</loc></url>
  <url><loc>https://example.com/page1</loc></url>
  <url><loc>https://example.com/page2</loc></url>
</urlset>`;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(validSitemap),
      });

      const result = await analyzeSitemap('https://example.com/sitemap.xml');

      expect(result.urlCount).toBe(3);
    });

    it('should suggest adding images if missing', async () => {
      const sitemapWithoutImages = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/</loc></url>
</urlset>`;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(sitemapWithoutImages),
      });

      const result = await analyzeSitemap('https://example.com/sitemap.xml');

      expect(result.suggestions.some(s => s.includes('image'))).toBe(true);
    });

    it('should suggest adding lastmod if missing', async () => {
      const sitemapWithoutLastmod = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/</loc></url>
</urlset>`;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(sitemapWithoutLastmod),
      });

      const result = await analyzeSitemap('https://example.com/sitemap.xml');

      expect(result.suggestions.some(s => s.includes('lastmod'))).toBe(true);
    });

    it('should suggest adding priority if missing', async () => {
      const sitemapWithoutPriority = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/</loc></url>
</urlset>`;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(sitemapWithoutPriority),
      });

      const result = await analyzeSitemap('https://example.com/sitemap.xml');

      expect(result.suggestions.some(s => s.includes('priority'))).toBe(true);
    });

    it('should detect empty sitemap', async () => {
      const emptySitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(emptySitemap),
      });

      const result = await analyzeSitemap('https://example.com/sitemap.xml');

      expect(result.issues).toContain('Sitemap contains no URLs');
    });

    it('should return error for HTTP errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      const result = await analyzeSitemap('https://example.com/sitemap.xml');

      expect(result.isValid).toBe(false);
      expect(result.issues.some(i => i.includes('404'))).toBe(true);
    });

    it('should calculate score based on issues and suggestions', async () => {
      const perfectSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2024-01-01</lastmod>
    <priority>1.0</priority>
    <image:image>
      <image:loc>https://example.com/logo.png</image:loc>
    </image:image>
  </url>
</urlset>`;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(perfectSitemap),
      });

      const result = await analyzeSitemap('https://example.com/sitemap.xml');

      expect(result.score).toBe(100);
      expect(result.issues).toHaveLength(0);
      expect(result.suggestions).toHaveLength(0);
    });
  });
});
