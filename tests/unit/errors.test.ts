import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  formatZodError,
} from '@/lib/utils/errors';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create an error with correct properties', () => {
      const error = new AppError('Test error', 'VALIDATION_ERROR', 400, { field: 'test' });

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ field: 'test' });
      expect(error.name).toBe('AppError');
    });

    it('should default to 500 status code', () => {
      const error = new AppError('Server error', 'INTERNAL_ERROR');

      expect(error.statusCode).toBe(500);
    });
  });

  describe('ValidationError', () => {
    it('should have correct defaults', () => {
      const error = new ValidationError('Invalid data');

      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ValidationError');
    });

    it('should accept details', () => {
      const details = { email: ['Invalid format'], name: ['Required'] };
      const error = new ValidationError('Invalid data', details);

      expect(error.details).toEqual(details);
    });
  });

  describe('UnauthorizedError', () => {
    it('should have correct defaults', () => {
      const error = new UnauthorizedError();

      expect(error.message).toBe('Unauthorized');
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('UnauthorizedError');
    });

    it('should accept custom message', () => {
      const error = new UnauthorizedError('Invalid token');

      expect(error.message).toBe('Invalid token');
    });
  });

  describe('ForbiddenError', () => {
    it('should have correct defaults', () => {
      const error = new ForbiddenError();

      expect(error.message).toBe('Forbidden');
      expect(error.code).toBe('FORBIDDEN');
      expect(error.statusCode).toBe(403);
      expect(error.name).toBe('ForbiddenError');
    });
  });

  describe('NotFoundError', () => {
    it('should have correct defaults', () => {
      const error = new NotFoundError();

      expect(error.message).toBe('Not found');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('NotFoundError');
    });

    it('should accept custom message', () => {
      const error = new NotFoundError('Store not found');

      expect(error.message).toBe('Store not found');
    });
  });

  describe('RateLimitError', () => {
    it('should have correct defaults', () => {
      const error = new RateLimitError();

      expect(error.message).toBe('Too many requests');
      expect(error.code).toBe('RATE_LIMITED');
      expect(error.statusCode).toBe(429);
      expect(error.name).toBe('RateLimitError');
    });
  });
});

describe('formatZodError', () => {
  it('should format single field error', () => {
    const schema = z.object({
      email: z.string().email('Invalid email format'),
    });

    const result = schema.safeParse({ email: 'invalid' });

    if (!result.success) {
      const formatted = formatZodError(result.error);
      expect(formatted).toEqual({
        email: ['Invalid email format'],
      });
    } else {
      throw new Error('Expected validation to fail');
    }
  });

  it('should format multiple field errors', () => {
    const schema = z.object({
      email: z.string().email('Invalid email'),
      name: z.string().min(1, 'Name is required'),
    });

    const result = schema.safeParse({ email: 'invalid', name: '' });

    if (!result.success) {
      const formatted = formatZodError(result.error);
      expect(formatted).toHaveProperty('email');
      expect(formatted).toHaveProperty('name');
    } else {
      throw new Error('Expected validation to fail');
    }
  });

  it('should format nested field errors', () => {
    const schema = z.object({
      settings: z.object({
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
      }),
    });

    const result = schema.safeParse({ settings: { color: 'red' } });

    if (!result.success) {
      const formatted = formatZodError(result.error);
      expect(formatted['settings.color']).toEqual(['Invalid hex color']);
    } else {
      throw new Error('Expected validation to fail');
    }
  });

  it('should accumulate multiple errors on same field', () => {
    const schema = z.object({
      password: z
        .string()
        .min(8, 'Must be at least 8 characters')
        .regex(/[A-Z]/, 'Must contain uppercase'),
    });

    const result = schema.safeParse({ password: 'abc' });

    if (!result.success) {
      const formatted = formatZodError(result.error);
      expect(formatted.password).toContain('Must be at least 8 characters');
    } else {
      throw new Error('Expected validation to fail');
    }
  });

  it('should handle array path elements', () => {
    const schema = z.object({
      stores: z.array(
        z.object({
          name: z.string().min(1, 'Name required'),
        })
      ),
    });

    const result = schema.safeParse({ stores: [{ name: '' }] });

    if (!result.success) {
      const formatted = formatZodError(result.error);
      expect(formatted['stores.0.name']).toEqual(['Name required']);
    } else {
      throw new Error('Expected validation to fail');
    }
  });

  it('should handle root-level errors', () => {
    const schema = z.string().min(1, 'Required');

    const result = schema.safeParse('');

    if (!result.success) {
      const formatted = formatZodError(result.error);
      // Root level error has empty path, which becomes ''
      expect(formatted['']).toEqual(['Required']);
    } else {
      throw new Error('Expected validation to fail');
    }
  });

  it('should return correct format for store validation errors', () => {
    // This test simulates the actual validation error the user encountered
    const storeSchema = z.object({
      name: z.string().min(1, 'Name is required'),
      email: z.string().email('Invalid email format').optional().or(z.literal('')),
      website: z.string().url('Invalid URL format').optional().or(z.literal('')),
      phone: z.string().max(50).optional(),
    });

    // Test invalid email
    const result1 = storeSchema.safeParse({
      name: 'Test Store',
      email: 'invalid-email',
      website: 'https://example.com',
    });

    if (!result1.success) {
      const formatted = formatZodError(result1.error);
      expect(formatted.email).toBeDefined();
      expect(formatted.email[0]).toBe('Invalid email format');
    }

    // Test invalid website
    const result2 = storeSchema.safeParse({
      name: 'Test Store',
      email: 'test@example.com',
      website: 'not-a-url',
    });

    if (!result2.success) {
      const formatted = formatZodError(result2.error);
      expect(formatted.website).toBeDefined();
      expect(formatted.website[0]).toBe('Invalid URL format');
    }
  });
});
