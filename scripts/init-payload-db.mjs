import pg from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function initPayloadTables() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('DATABASE_URL not set, skipping Payload table init');
    process.exit(0);
  }

  const client = new pg.Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    console.log('Creating Payload CMS tables...');

    const sql = readFileSync(join(__dirname, 'payload-init.sql'), 'utf8');
    await client.query(sql);

    console.log('✅ Payload tables ready!');
  } catch (error) {
    if (error.message?.includes('already exists')) {
      console.log('ℹ️ Tables already exist');
    } else {
      console.error('⚠️ Warning:', error.message);
    }
  } finally {
    await client.end();
  }
}

initPayloadTables();
