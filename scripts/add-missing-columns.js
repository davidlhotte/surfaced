require('dotenv').config({ path: '.env.local' });

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  console.log('Adding missing columns to Shop table...');

  try {
    // Check if columns exist first
    const checkResult = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Shop' AND column_name IN ('name', 'email');
    `);

    const existingColumns = checkResult.rows.map(r => r.column_name);
    console.log('Existing columns:', existingColumns);

    if (!existingColumns.includes('name')) {
      console.log('Adding "name" column...');
      await pool.query('ALTER TABLE "Shop" ADD COLUMN "name" TEXT;');
      console.log('Added "name" column');
    }

    if (!existingColumns.includes('email')) {
      console.log('Adding "email" column...');
      await pool.query('ALTER TABLE "Shop" ADD COLUMN "email" TEXT;');
      console.log('Added "email" column');
    }

    // Verify
    const verifyResult = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Shop'
      ORDER BY ordinal_position;
    `);
    console.log('\nShop table columns after update:');
    verifyResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}`);
    });

    console.log('\nDone!');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}

main();
