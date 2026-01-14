import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  sanitizeCSVRow,
  sanitizeEmail,
  sanitizePhone,
  sanitizeUrl,
} from '@/lib/security/sanitize';

describe('Sanitization', () => {
  describe('sanitizeString', () => {
    it('should prevent formula injection', () => {
      expect(sanitizeString('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
      expect(sanitizeString('+1234567890')).toBe("'+1234567890");
      expect(sanitizeString('-5')).toBe("'-5");
      expect(sanitizeString('@test')).toBe("'@test");
    });

    it('should remove HTML tags', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe('');
      expect(sanitizeString('Hello <b>World</b>')).toBe('Hello World');
    });

    it('should trim whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });

    it('should handle empty strings', () => {
      expect(sanitizeString('')).toBe('');
    });
  });

  describe('sanitizeCSVRow', () => {
    it('should sanitize all string values in a row', () => {
      const row = {
        name: '<script>alert("xss")</script>',
        address: '=HYPERLINK("http://evil.com")',
        city: 'New York',
      };

      const sanitized = sanitizeCSVRow(row);

      expect(sanitized.name).toBe('');
      expect(sanitized.address).toBe("'=HYPERLINK(\"http://evil.com\")");
      expect(sanitized.city).toBe('New York');
    });
  });

  describe('sanitizeEmail', () => {
    it('should lowercase and trim email', () => {
      expect(sanitizeEmail('  Test@Example.COM  ')).toBe('test@example.com');
    });
  });

  describe('sanitizePhone', () => {
    it('should keep only valid phone characters', () => {
      expect(sanitizePhone('+1 (555) 123-4567')).toBe('+1 (555) 123-4567');
      expect(sanitizePhone('abc123def')).toBe('123');
    });
  });

  describe('sanitizeUrl', () => {
    it('should add https if missing', () => {
      expect(sanitizeUrl('example.com')).toBe('https://example.com');
      expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
    });
  });
});
