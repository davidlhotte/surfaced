require('dotenv').config({ path: '.env.local' });

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  console.log('Checking shops in database...');
  console.log('Database URL:', process.env.DATABASE_URL ? 'Set' : 'NOT SET');

  try {
    const result = await pool.query('SELECT id, "shopDomain", plan, "installedAt" FROM "Shop"');

    console.log('Total shops:', result.rows.length);
    console.log('Shops:', JSON.stringify(result.rows, null, 2));

    // Check specifically for the problematic shop
    const targetResult = await pool.query('SELECT * FROM "Shop" WHERE "shopDomain" = $1', ['locateus-2.myshopify.com']);

    if (targetResult.rows.length > 0) {
      console.log('\nTarget shop found!');
      console.log('Shop details:', JSON.stringify(targetResult.rows[0], null, 2));
    } else {
      console.log('\nTarget shop NOT FOUND: locateus-2.myshopify.com');
    }
  } catch (e) {
    console.error('Query error:', e.message);
  } finally {
    await pool.end();
  }
}

main();
