// Load env files
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env.production.local' });

const { Pool } = require('pg');
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';

function decryptToken(ciphertext) {
  if (!ciphertext || typeof ciphertext !== 'string') {
    throw new Error('Invalid ciphertext: must be a non-empty string');
  }

  const parts = ciphertext.split(':');

  if (parts.length !== 3) {
    throw new Error(`Invalid ciphertext format: expected 3 parts, got ${parts.length}`);
  }

  const [ivHex, authTagHex, encrypted] = parts;

  if (!ivHex || ivHex.length !== 32) {
    throw new Error('Invalid IV length');
  }
  if (!authTagHex || authTagHex.length !== 32) {
    throw new Error('Invalid authTag length');
  }

  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  console.log('Testing decryption...');
  console.log('ENCRYPTION_KEY:', process.env.ENCRYPTION_KEY?.substring(0, 10) + '...');

  try {
    const result = await pool.query('SELECT "accessToken" FROM "Shop" WHERE "shopDomain" = $1', ['locateus-2.myshopify.com']);

    if (result.rows.length === 0) {
      console.log('Shop not found');
      return;
    }

    const encryptedToken = result.rows[0].accessToken;
    console.log('Encrypted token from DB:', encryptedToken.substring(0, 50) + '...');

    const decryptedToken = decryptToken(encryptedToken);
    console.log('Decrypted token:', decryptedToken);
    console.log('SUCCESS!');
  } catch (e) {
    console.error('Decryption failed:', e.message);
  } finally {
    await pool.end();
  }
}

main();
