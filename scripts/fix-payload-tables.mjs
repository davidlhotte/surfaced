#!/usr/bin/env node
import pg from 'pg';

const { Pool } = pg;

async function fixTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('sslmode=require')
      ? { rejectUnauthorized: false }
      : undefined,
  });

  try {
    console.log('Fixing Payload CMS tables...');

    // Drop and recreate users_sessions with correct schema
    await pool.query(`
      DROP TABLE IF EXISTS "users_sessions" CASCADE;

      CREATE TABLE "users_sessions" (
        "id" TEXT PRIMARY KEY,
        "_order" INTEGER NOT NULL,
        "_parent_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMPTZ,
        "expires_at" TIMESTAMPTZ NOT NULL
      );
      CREATE INDEX "users_sessions_parent_idx" ON "users_sessions"("_parent_id");
      CREATE INDEX "users_sessions_order_idx" ON "users_sessions"("_order");
    `);
    console.log('✓ Fixed users_sessions table');

    // Create missing system tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "payload_kv" (
        "id" SERIAL PRIMARY KEY,
        "key" TEXT UNIQUE NOT NULL,
        "data" JSONB NOT NULL
      );
      CREATE INDEX IF NOT EXISTS "payload_kv_key_idx" ON "payload_kv"("key");
    `);
    console.log('✓ Created payload_kv table');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "payload_locked_documents" (
        "id" SERIAL PRIMARY KEY,
        "global_slug" TEXT,
        "updated_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
      CREATE INDEX IF NOT EXISTS "payload_locked_documents_global_slug_idx" ON "payload_locked_documents"("global_slug");
    `);
    console.log('✓ Created payload_locked_documents table');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "payload_locked_documents_rels" (
        "id" SERIAL PRIMARY KEY,
        "order" INTEGER,
        "parent_id" INTEGER NOT NULL REFERENCES "payload_locked_documents"("id") ON DELETE CASCADE,
        "path" TEXT NOT NULL,
        "users_id" INTEGER REFERENCES "users"("id") ON DELETE CASCADE,
        "media_id" INTEGER REFERENCES "media"("id") ON DELETE CASCADE,
        "categories_id" INTEGER REFERENCES "categories"("id") ON DELETE CASCADE,
        "posts_id" INTEGER REFERENCES "posts"("id") ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels"("parent_id");
      CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels"("path");
    `);
    console.log('✓ Created payload_locked_documents_rels table');

    console.log('\n✅ All Payload tables fixed successfully!');
  } catch (error) {
    console.error('Error fixing tables:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

fixTables().catch(err => {
  console.error(err);
  process.exit(1);
});
