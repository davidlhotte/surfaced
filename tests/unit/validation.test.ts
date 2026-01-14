import { describe, it, expect } from 'vitest';
import {
  validateSettings,
  paginationSchema,
  colorSchema,
} from '@/lib/utils/validation';

describe('Validation', () => {
  describe('settingsSchema', () => {
    it('should validate empty settings', () => {
      const settings = {};

      const result = validateSettings(settings);
      expect(result.success).toBe(true);
    });

    it('should validate any settings object', () => {
      const settings = {
        someField: 'value',
      };

      // Our generic schema accepts any object
      const result = validateSettings(settings);
      expect(result.success).toBe(true);
    });
  });

  describe('paginationSchema', () => {
    it('should apply default values', () => {
      const result = paginationSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should coerce string values', () => {
      const result = paginationSchema.safeParse({ page: '5', limit: '50' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(5);
        expect(result.data.limit).toBe(50);
      }
    });

    it('should reject page less than 1', () => {
      const result = paginationSchema.safeParse({ page: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject limit greater than 100', () => {
      const result = paginationSchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
    });

    it('should accept valid pagination', () => {
      const result = paginationSchema.safeParse({ page: 3, limit: 25 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
        expect(result.data.limit).toBe(25);
      }
    });
  });

  describe('colorSchema', () => {
    it('should accept valid hex color', () => {
      const result = colorSchema.safeParse('#FF5733');
      expect(result.success).toBe(true);
    });

    it('should accept lowercase hex color', () => {
      const result = colorSchema.safeParse('#ff5733');
      expect(result.success).toBe(true);
    });

    it('should reject non-hex color', () => {
      const result = colorSchema.safeParse('red');
      expect(result.success).toBe(false);
    });

    it('should reject 3-digit hex color', () => {
      const result = colorSchema.safeParse('#F00');
      expect(result.success).toBe(false);
    });

    it('should reject hex without hash', () => {
      const result = colorSchema.safeParse('FF5733');
      expect(result.success).toBe(false);
    });
  });
});
