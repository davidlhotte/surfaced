// Load both env files - .env.local for DB, .env.production.local for ENCRYPTION_KEY
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env.production.local' });

const { Pool } = require('pg');
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';

function encryptToken(plaintext) {
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  console.log('Fixing shop token...');
  console.log('ENCRYPTION_KEY set:', process.env.ENCRYPTION_KEY ? 'Yes' : 'No');

  try {
    // Create a properly encrypted dev token
    const encryptedToken = encryptToken('dev-token-fixed-' + Date.now());
    console.log('Generated encrypted token:', encryptedToken.substring(0, 50) + '...');

    // Update the shop with the encrypted token
    const result = await pool.query(
      'UPDATE "Shop" SET "accessToken" = $1, "updatedAt" = NOW() WHERE "shopDomain" = $2 RETURNING id, "shopDomain"',
      [encryptedToken, 'locateus-2.myshopify.com']
    );

    if (result.rows.length > 0) {
      console.log('Successfully updated shop:', result.rows[0]);
    } else {
      console.log('No shop found to update');
    }

    // Verify the update
    const verifyResult = await pool.query('SELECT id, "shopDomain", "accessToken" FROM "Shop" WHERE "shopDomain" = $1', ['locateus-2.myshopify.com']);
    console.log('\nVerification - accessToken format correct:', verifyResult.rows[0].accessToken.includes(':') ? 'Yes' : 'No');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}

main();
