-- Payload CMS Tables - Full schema for Payload 3.x
-- Tables will be auto-migrated by Payload on subsequent deployments

CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT,
  "role" TEXT DEFAULT 'editor' NOT NULL,
  "updated_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  "email" TEXT UNIQUE NOT NULL,
  "reset_password_token" TEXT,
  "reset_password_expiration" TIMESTAMPTZ,
  "salt" TEXT,
  "hash" TEXT,
  "login_attempts" INTEGER DEFAULT 0,
  "lock_until" TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "users_sessions" (
  "id" TEXT PRIMARY KEY,
  "_order" INTEGER NOT NULL,
  "_parent_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMPTZ,
  "expires_at" TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS "users_sessions_parent_idx" ON "users_sessions"("_parent_id");
CREATE INDEX IF NOT EXISTS "users_sessions_order_idx" ON "users_sessions"("_order");

-- Payload system tables
CREATE TABLE IF NOT EXISTS "payload_kv" (
  "id" SERIAL PRIMARY KEY,
  "key" TEXT UNIQUE NOT NULL,
  "data" JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS "payload_kv_key_idx" ON "payload_kv"("key");

CREATE TABLE IF NOT EXISTS "payload_locked_documents" (
  "id" SERIAL PRIMARY KEY,
  "global_slug" TEXT,
  "updated_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS "payload_locked_documents_global_slug_idx" ON "payload_locked_documents"("global_slug");

CREATE TABLE IF NOT EXISTS "payload_locked_documents_rels" (
  "id" SERIAL PRIMARY KEY,
  "order" INTEGER,
  "parent_id" INTEGER NOT NULL REFERENCES "payload_locked_documents"("id") ON DELETE CASCADE,
  "path" TEXT NOT NULL,
  "users_id" INTEGER REFERENCES "users"("id") ON DELETE CASCADE,
  "media_id" INTEGER,
  "categories_id" INTEGER,
  "posts_id" INTEGER
);
CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels"("parent_id");
CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels"("path");

CREATE TABLE IF NOT EXISTS "media" (
  "id" SERIAL PRIMARY KEY,
  "alt" TEXT NOT NULL,
  "updated_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  "url" TEXT,
  "thumbnail_u_r_l" TEXT,
  "filename" TEXT,
  "mime_type" TEXT,
  "filesize" INTEGER,
  "width" INTEGER,
  "height" INTEGER,
  "focal_x" NUMERIC,
  "focal_y" NUMERIC
);

CREATE TABLE IF NOT EXISTS "categories" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT UNIQUE NOT NULL,
  "color" TEXT DEFAULT 'sky',
  "updated_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "categories_locales" (
  "id" SERIAL PRIMARY KEY,
  "_locale" TEXT NOT NULL,
  "_parent_id" INTEGER NOT NULL REFERENCES "categories"("id") ON DELETE CASCADE,
  "name" TEXT,
  UNIQUE("_locale", "_parent_id")
);

CREATE TABLE IF NOT EXISTS "posts" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "slug" TEXT UNIQUE NOT NULL,
  "description" TEXT NOT NULL,
  "featured_image_id" INTEGER REFERENCES "media"("id") ON DELETE SET NULL,
  "content" JSONB NOT NULL,
  "category_id" INTEGER REFERENCES "categories"("id"),
  "author" TEXT DEFAULT 'Surfaced Team',
  "read_time" INTEGER DEFAULT 5,
  "status" TEXT DEFAULT 'draft' NOT NULL,
  "featured" BOOLEAN DEFAULT FALSE,
  "published_at" DATE,
  "updated_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS "posts_status_idx" ON "posts"("status");
CREATE INDEX IF NOT EXISTS "posts_category_idx" ON "posts"("category_id");

CREATE TABLE IF NOT EXISTS "posts_locales" (
  "id" SERIAL PRIMARY KEY,
  "_locale" TEXT NOT NULL,
  "_parent_id" INTEGER NOT NULL REFERENCES "posts"("id") ON DELETE CASCADE,
  "title" TEXT,
  "description" TEXT,
  "content" JSONB,
  UNIQUE("_locale", "_parent_id")
);

CREATE TABLE IF NOT EXISTS "payload_preferences" (
  "id" SERIAL PRIMARY KEY,
  "key" TEXT NOT NULL,
  "value" JSONB,
  "updated_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "payload_preferences_rels" (
  "id" SERIAL PRIMARY KEY,
  "parent_id" INTEGER NOT NULL REFERENCES "payload_preferences"("id") ON DELETE CASCADE,
  "path" TEXT NOT NULL,
  "users_id" INTEGER REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "payload_migrations" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "batch" INTEGER NOT NULL,
  "updated_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
