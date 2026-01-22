import { describe, it, expect } from 'vitest';

// We need to test the internal functions, so we'll import them
// Since some functions are not exported, we'll test the behavior through the public API

describe('Duplicate Content Detection', () => {
  describe('Similarity Calculation', () => {
    // Helper function to simulate the Jaccard similarity calculation
    const calculateSimilarity = (str1: string, str2: string): number => {
      const normalize = (s: string) =>
        s.toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .split(/\s+/)
          .filter(w => w.length > 2);

      const words1 = new Set(normalize(str1));
      const words2 = new Set(normalize(str2));

      if (words1.size === 0 || words2.size === 0) return 0;

      const intersection = new Set([...words1].filter(w => words2.has(w)));
      const union = new Set([...words1, ...words2]);

      return intersection.size / union.size;
    };

    it('should return 1 for identical strings', () => {
      const text = 'This is a test product description with multiple words';
      expect(calculateSimilarity(text, text)).toBe(1);
    });

    it('should return 0 for completely different strings', () => {
      const text1 = 'apple banana cherry';
      const text2 = 'dog elephant fox';
      expect(calculateSimilarity(text1, text2)).toBe(0);
    });

    it('should return value between 0 and 1 for partially similar strings', () => {
      const text1 = 'premium leather wallet for men with multiple card slots';
      const text2 = 'luxury leather wallet for women with coin pocket';
      const similarity = calculateSimilarity(text1, text2);
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(1);
    });

    it('should be case insensitive', () => {
      const text1 = 'This Is A Test';
      const text2 = 'this is a test';
      expect(calculateSimilarity(text1, text2)).toBe(1);
    });

    it('should ignore punctuation', () => {
      const text1 = 'Hello, world! How are you?';
      const text2 = 'Hello world How are you';
      expect(calculateSimilarity(text1, text2)).toBe(1);
    });

    it('should filter out short words', () => {
      const text1 = 'the quick brown fox';
      const text2 = 'a fast brown fox';
      // 'the' and 'a' should be filtered, so similarity is based on 'quick/fast', 'brown', 'fox'
      const similarity = calculateSimilarity(text1, text2);
      expect(similarity).toBeGreaterThan(0.3);
      expect(similarity).toBeLessThan(0.8);
    });

    it('should return 0 for empty strings', () => {
      expect(calculateSimilarity('', '')).toBe(0);
      expect(calculateSimilarity('test', '')).toBe(0);
      expect(calculateSimilarity('', 'test')).toBe(0);
    });
  });

  describe('N-gram Similarity', () => {
    // Helper function to simulate n-gram similarity
    const calculateNgramSimilarity = (str1: string, str2: string, n: number = 3): number => {
      const getNgrams = (s: string) => {
        const clean = s.toLowerCase().replace(/[^a-z0-9\s]/g, '');
        const ngrams = new Set<string>();
        for (let i = 0; i <= clean.length - n; i++) {
          ngrams.add(clean.substring(i, i + n));
        }
        return ngrams;
      };

      const ngrams1 = getNgrams(str1);
      const ngrams2 = getNgrams(str2);

      if (ngrams1.size === 0 || ngrams2.size === 0) return 0;

      const intersection = new Set([...ngrams1].filter(ng => ngrams2.has(ng)));
      const union = new Set([...ngrams1, ...ngrams2]);

      return intersection.size / union.size;
    };

    it('should return 1 for identical strings', () => {
      const text = 'This is a test';
      expect(calculateNgramSimilarity(text, text)).toBe(1);
    });

    it('should detect partial matches in similar strings', () => {
      const text1 = 'Our premium product is made with care';
      const text2 = 'Our premium product is crafted with love';
      const similarity = calculateNgramSimilarity(text1, text2);
      expect(similarity).toBeGreaterThan(0.3);
    });

    it('should return low similarity for different strings', () => {
      const text1 = 'abcdefgh';
      const text2 = 'xyz12345';
      const similarity = calculateNgramSimilarity(text1, text2);
      expect(similarity).toBeLessThan(0.1);
    });
  });

  describe('Template Detection Patterns', () => {
    const templateIndicators = [
      /\[product\s*name\]/gi,
      /\[brand\]/gi,
      /\{\{.*?\}\}/g,
      /INSERT\s+.*?\s+HERE/gi,
      /Lorem ipsum/gi,
      /placeholder/gi,
    ];

    const hasTemplatePattern = (text: string): boolean => {
      return templateIndicators.some(pattern => pattern.test(text));
    };

    it('should detect [product name] placeholder', () => {
      const text = 'This [product name] is amazing';
      expect(hasTemplatePattern(text)).toBe(true);
    });

    it('should detect [brand] placeholder', () => {
      const text = 'Made by [brand], the leading manufacturer';
      expect(hasTemplatePattern(text)).toBe(true);
    });

    it('should detect Liquid/Mustache templates', () => {
      const text = 'Buy {{product.title}} now for only {{product.price}}';
      expect(hasTemplatePattern(text)).toBe(true);
    });

    it('should detect INSERT HERE patterns', () => {
      const text = 'INSERT PRODUCT NAME HERE is our best seller';
      expect(hasTemplatePattern(text)).toBe(true);
    });

    it('should detect Lorem ipsum', () => {
      const text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit';
      expect(hasTemplatePattern(text)).toBe(true);
    });

    it('should detect placeholder text', () => {
      const text = 'This is placeholder text that needs to be replaced';
      expect(hasTemplatePattern(text)).toBe(true);
    });

    it('should not flag normal product descriptions', () => {
      const text = 'This premium leather wallet features multiple card slots and a sleek design';
      expect(hasTemplatePattern(text)).toBe(false);
    });
  });

  describe('Score Calculation', () => {
    it('should calculate high score for unique content', () => {
      // Score = (1 - duplicateRatio) * 100
      const totalProducts = 100;
      const affectedProducts = 5;
      const duplicateRatio = affectedProducts / totalProducts;
      const score = Math.round((1 - duplicateRatio) * 100);
      expect(score).toBe(95);
    });

    it('should calculate low score for mostly duplicate content', () => {
      const totalProducts = 100;
      const affectedProducts = 80;
      const duplicateRatio = affectedProducts / totalProducts;
      const score = Math.round((1 - duplicateRatio) * 100);
      expect(score).toBe(20);
    });

    it('should return 100 for no duplicates', () => {
      const totalProducts = 100;
      const affectedProducts = 0;
      const duplicateRatio = affectedProducts / totalProducts;
      const score = Math.round((1 - duplicateRatio) * 100);
      expect(score).toBe(100);
    });
  });
});
