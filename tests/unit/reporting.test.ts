import { describe, it, expect } from 'vitest';
import {
  generateAuditCsv,
  generateVisibilityCsv,
  generateSummaryReport,
} from '@/lib/services/reporting';
import type { AuditReportData, VisibilityReportData } from '@/lib/services/reporting';

describe('Reporting Service', () => {
  describe('CSV Sanitization', () => {
    // Helper to mimic the sanitization function
    const sanitizeCsvField = (value: string): string => {
      let escaped = value.replace(/"/g, '""');
      if (/^[=@+\-\t\r]/.test(escaped)) {
        escaped = "'" + escaped;
      }
      return `"${escaped}"`;
    };

    it('should escape double quotes', () => {
      const result = sanitizeCsvField('Product "Deluxe" Edition');
      expect(result).toBe('"Product ""Deluxe"" Edition"');
    });

    it('should prevent formula injection starting with =', () => {
      const result = sanitizeCsvField('=SUM(A1:A10)');
      expect(result).toBe('"\'=SUM(A1:A10)"');
    });

    it('should prevent formula injection starting with @', () => {
      const result = sanitizeCsvField('@SUM(A1)');
      expect(result).toBe('"\'@SUM(A1)"');
    });

    it('should prevent formula injection starting with +', () => {
      const result = sanitizeCsvField('+cmd|calc');
      expect(result).toBe('"\'+cmd|calc"');
    });

    it('should prevent formula injection starting with -', () => {
      const result = sanitizeCsvField('-1+1');
      expect(result).toBe('"\'-1+1"');
    });

    it('should prevent tab-based injection', () => {
      const result = sanitizeCsvField('\t=SUM(A1)');
      expect(result).toBe('"\'\t=SUM(A1)"');
    });

    it('should not modify normal text', () => {
      const result = sanitizeCsvField('Normal Product Title');
      expect(result).toBe('"Normal Product Title"');
    });
  });

  describe('Audit CSV Generation', () => {
    const mockAuditData: AuditReportData = {
      shop: {
        name: 'Test Shop',
        domain: 'test.myshopify.com',
        plan: 'PLUS',
        aiScore: 75,
        productsCount: 100,
        lastAuditAt: '2024-01-01T00:00:00Z',
      },
      summary: {
        totalProducts: 100,
        auditedProducts: 50,
        averageScore: 75,
        criticalIssues: 5,
        warningIssues: 10,
        infoIssues: 15,
      },
      products: [
        {
          id: '1',
          shopifyProductId: '123456',
          title: 'Test Product',
          handle: 'test-product',
          aiScore: 80,
          hasImages: true,
          hasDescription: true,
          hasMetafields: false,
          descriptionLength: 150,
          issues: [{ type: 'warning', code: 'SHORT_DESC', message: 'Description is short' }],
          lastAuditAt: '2024-01-01T00:00:00Z',
        },
      ],
      visibility: {
        totalChecks: 10,
        mentionedCount: 7,
        mentionRate: 70,
        platformBreakdown: [],
      },
      generatedAt: '2024-01-01T00:00:00Z',
    };

    it('should generate valid CSV with headers', () => {
      const csv = generateAuditCsv(mockAuditData);
      const lines = csv.split('\n');
      expect(lines[0]).toContain('Product ID');
      expect(lines[0]).toContain('Title');
      expect(lines[0]).toContain('AI Score');
    });

    it('should include product data in CSV rows', () => {
      const csv = generateAuditCsv(mockAuditData);
      expect(csv).toContain('123456');
      expect(csv).toContain('Test Product');
      expect(csv).toContain('80');
    });

    it('should handle products with formula-like titles', () => {
      const dataWithFormula = {
        ...mockAuditData,
        products: [
          {
            ...mockAuditData.products[0],
            title: '=MALICIOUS()',
          },
        ],
      };
      const csv = generateAuditCsv(dataWithFormula);
      expect(csv).toContain("'=MALICIOUS()");
    });

    it('should handle empty products array', () => {
      const emptyData = { ...mockAuditData, products: [] };
      const csv = generateAuditCsv(emptyData);
      const lines = csv.split('\n');
      expect(lines.length).toBe(1); // Only header
    });
  });

  describe('Visibility CSV Generation', () => {
    const mockVisibilityData: VisibilityReportData = {
      shop: {
        name: 'Test Shop',
        domain: 'test.myshopify.com',
      },
      summary: {
        totalChecks: 20,
        mentionedCount: 15,
        mentionRate: 75,
        averagePosition: 3,
      },
      checks: [
        {
          id: 'check-1',
          platform: 'chatgpt',
          query: 'best leather wallets',
          isMentioned: true,
          position: 2,
          responseQuality: 'good',
          competitorsFound: ['Competitor A', 'Competitor B'],
          checkedAt: '2024-01-01T00:00:00Z',
        },
      ],
      generatedAt: '2024-01-01T00:00:00Z',
    };

    it('should generate valid CSV with headers', () => {
      const csv = generateVisibilityCsv(mockVisibilityData);
      const lines = csv.split('\n');
      expect(lines[0]).toContain('Check ID');
      expect(lines[0]).toContain('Platform');
      expect(lines[0]).toContain('Query');
    });

    it('should include check data in CSV rows', () => {
      const csv = generateVisibilityCsv(mockVisibilityData);
      expect(csv).toContain('check-1');
      expect(csv).toContain('chatgpt');
      expect(csv).toContain('best leather wallets');
    });

    it('should handle queries with potential injection', () => {
      const dataWithInjection = {
        ...mockVisibilityData,
        checks: [
          {
            ...mockVisibilityData.checks[0],
            query: '+cmd|calc',
          },
        ],
      };
      const csv = generateVisibilityCsv(dataWithInjection);
      expect(csv).toContain("'+cmd|calc");
    });
  });

  describe('Summary Report Generation', () => {
    const mockAuditData: AuditReportData = {
      shop: {
        name: 'Test Shop',
        domain: 'test.myshopify.com',
        plan: 'PLUS',
        aiScore: 75,
        productsCount: 100,
        lastAuditAt: '2024-01-01T00:00:00Z',
      },
      summary: {
        totalProducts: 100,
        auditedProducts: 50,
        averageScore: 75,
        criticalIssues: 5,
        warningIssues: 10,
        infoIssues: 15,
      },
      products: [],
      visibility: {
        totalChecks: 10,
        mentionedCount: 7,
        mentionRate: 70,
        platformBreakdown: [
          { platform: 'chatgpt', checks: 5, mentions: 4, rate: 80 },
        ],
      },
      generatedAt: '2024-01-01T00:00:00Z',
    };

    it('should generate text summary with shop info', () => {
      const report = generateSummaryReport(mockAuditData);
      expect(report).toContain('Test Shop');
      expect(report).toContain('test.myshopify.com');
    });

    it('should include summary statistics', () => {
      const report = generateSummaryReport(mockAuditData);
      expect(report).toContain('Overall AI Score: 75/100');
      expect(report).toContain('Total Products: 100');
      expect(report).toContain('Average Score: 75/100');
    });

    it('should include issues breakdown', () => {
      const report = generateSummaryReport(mockAuditData);
      expect(report).toContain('Critical (Score < 40): 5 products');
      expect(report).toContain('Warning (Score 40-69): 10 products');
    });

    it('should include visibility stats', () => {
      const report = generateSummaryReport(mockAuditData);
      expect(report).toContain('Total Checks: 10');
      expect(report).toContain('Mention Rate: 70%');
    });

    it('should include platform breakdown', () => {
      const report = generateSummaryReport(mockAuditData);
      expect(report).toContain('chatgpt: 4/5 (80%)');
    });

    it('should include Surfaced branding', () => {
      const report = generateSummaryReport(mockAuditData);
      expect(report).toContain('Surfaced');
    });
  });
});
