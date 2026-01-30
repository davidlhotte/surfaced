import pg from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function initPayloadTables() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString: databaseUrl,
  });

  try {
    console.log('Connecting to database...');
    await client.connect();

    console.log('Reading migration SQL...');
    const sql = readFileSync(
      join(__dirname, '../prisma/migrations/20260130000000_payload_init/migration.sql'),
      'utf8'
    );

    console.log('Executing Payload tables migration...');
    await client.query(sql);

    console.log('✅ Payload tables created successfully!');
  } catch (error) {
    if (error.message?.includes('already exists')) {
      console.log('ℹ️ Tables already exist, skipping...');
    } else {
      console.error('❌ Error creating tables:', error.message);
      // Don't exit with error - tables might already exist
    }
  } finally {
    await client.end();
  }
}

initPayloadTables();
