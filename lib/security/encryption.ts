import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }
  return Buffer.from(key, 'hex');
}

export function encryptToken(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decryptToken(ciphertext: string): string {
  if (!ciphertext || typeof ciphertext !== 'string') {
    throw new Error('Invalid ciphertext: must be a non-empty string');
  }

  const parts = ciphertext.split(':');

  // Validate format: must have exactly 3 parts (iv:authTag:encrypted)
  if (parts.length !== 3) {
    throw new Error('Invalid ciphertext format: expected iv:authTag:encrypted');
  }

  const [ivHex, authTagHex, encrypted] = parts;

  // Validate each part exists and has expected length
  if (!ivHex || ivHex.length !== 32) {
    throw new Error('Invalid ciphertext: IV must be 32 hex characters');
  }
  if (!authTagHex || authTagHex.length !== 32) {
    throw new Error('Invalid ciphertext: AuthTag must be 32 hex characters');
  }
  if (!encrypted || encrypted.length === 0) {
    throw new Error('Invalid ciphertext: encrypted data is empty');
  }

  // Validate hex format
  const hexRegex = /^[0-9a-fA-F]+$/;
  if (!hexRegex.test(ivHex) || !hexRegex.test(authTagHex) || !hexRegex.test(encrypted)) {
    throw new Error('Invalid ciphertext: contains non-hex characters');
  }

  try {
    const key = getKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = createDecipheriv(ALGORITHM, key, iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    // Re-throw with more context but without exposing internal details
    if (error instanceof Error && error.message.includes('Unsupported state')) {
      throw new Error('Decryption failed: invalid authentication tag');
    }
    throw new Error('Decryption failed: corrupted or tampered data');
  }
}

export function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  if (bufA.length !== bufB.length) {
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}
