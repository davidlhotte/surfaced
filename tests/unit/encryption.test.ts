import { describe, it, expect, vi } from 'vitest';

// Set environment variable before importing
vi.stubEnv('ENCRYPTION_KEY', 'a'.repeat(64));

import { encryptToken, decryptToken, safeCompare } from '@/lib/security/encryption';

describe('Encryption', () => {
  describe('encryptToken', () => {
    it('should encrypt a token', () => {
      const plaintext = 'test-access-token';
      const encrypted = encryptToken(plaintext);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted.split(':')).toHaveLength(3);
    });

    it('should produce different ciphertexts for same plaintext', () => {
      const plaintext = 'test-access-token';
      const encrypted1 = encryptToken(plaintext);
      const encrypted2 = encryptToken(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
    });
  });

  describe('decryptToken', () => {
    it('should decrypt an encrypted token', () => {
      const plaintext = 'test-access-token';
      const encrypted = encryptToken(plaintext);
      const decrypted = decryptToken(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should throw on invalid ciphertext format', () => {
      expect(() => decryptToken('invalid')).toThrow();
    });
  });

  describe('safeCompare', () => {
    it('should return true for identical strings', () => {
      expect(safeCompare('abc', 'abc')).toBe(true);
    });

    it('should return false for different strings', () => {
      expect(safeCompare('abc', 'def')).toBe(false);
    });

    it('should return false for strings of different lengths', () => {
      expect(safeCompare('abc', 'abcd')).toBe(false);
    });
  });
});
