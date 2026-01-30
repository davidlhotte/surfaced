-- Payload CMS Tables

-- Users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255),
  "role" VARCHAR(50) NOT NULL DEFAULT 'editor',
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "reset_password_token" VARCHAR(255),
  "reset_password_expiration" TIMESTAMP WITH TIME ZONE,
  "salt" VARCHAR(255),
  "hash" VARCHAR(255),
  "login_attempts" INTEGER DEFAULT 0,
  "lock_until" TIMESTAMP WITH TIME ZONE
);

-- Users sessions table
CREATE TABLE IF NOT EXISTS "users_sessions" (
  "id" SERIAL PRIMARY KEY,
  "_order" INTEGER NOT NULL,
  "_parent_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "expires_at" TIMESTAMP WITH TIME ZONE
);

-- Media table
CREATE TABLE IF NOT EXISTS "media" (
  "id" SERIAL PRIMARY KEY,
  "alt" VARCHAR(255) NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "url" VARCHAR(500),
  "thumbnail_u_r_l" VARCHAR(500),
  "filename" VARCHAR(255),
  "mime_type" VARCHAR(100),
  "filesize" INTEGER,
  "width" INTEGER,
  "height" INTEGER,
  "focal_x" DECIMAL,
  "focal_y" DECIMAL
);

-- Categories table
CREATE TABLE IF NOT EXISTS "categories" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "slug" VARCHAR(255) NOT NULL UNIQUE,
  "color" VARCHAR(50) DEFAULT 'sky',
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Categories locales table for i18n
CREATE TABLE IF NOT EXISTS "categories_locales" (
  "id" SERIAL PRIMARY KEY,
  "_locale" VARCHAR(10) NOT NULL,
  "_parent_id" INTEGER NOT NULL REFERENCES "categories"("id") ON DELETE CASCADE,
  "name" VARCHAR(255),
  UNIQUE("_locale", "_parent_id")
);

-- Posts table
CREATE TABLE IF NOT EXISTS "posts" (
  "id" SERIAL PRIMARY KEY,
  "title" VARCHAR(255) NOT NULL,
  "slug" VARCHAR(255) NOT NULL UNIQUE,
  "description" TEXT NOT NULL,
  "featured_image_id" INTEGER REFERENCES "media"("id") ON DELETE SET NULL,
  "content" JSONB NOT NULL,
  "category_id" INTEGER NOT NULL REFERENCES "categories"("id") ON DELETE RESTRICT,
  "author" VARCHAR(255) DEFAULT 'Surfaced Team',
  "read_time" INTEGER DEFAULT 5,
  "status" VARCHAR(50) NOT NULL DEFAULT 'draft',
  "featured" BOOLEAN DEFAULT FALSE,
  "published_at" DATE,
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Posts locales table for i18n
CREATE TABLE IF NOT EXISTS "posts_locales" (
  "id" SERIAL PRIMARY KEY,
  "_locale" VARCHAR(10) NOT NULL,
  "_parent_id" INTEGER NOT NULL REFERENCES "posts"("id") ON DELETE CASCADE,
  "title" VARCHAR(255),
  "description" TEXT,
  "content" JSONB,
  UNIQUE("_locale", "_parent_id")
);

-- Payload preferences table
CREATE TABLE IF NOT EXISTS "payload_preferences" (
  "id" SERIAL PRIMARY KEY,
  "key" VARCHAR(255) NOT NULL,
  "value" JSONB,
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Payload preferences rels table
CREATE TABLE IF NOT EXISTS "payload_preferences_rels" (
  "id" SERIAL PRIMARY KEY,
  "parent_id" INTEGER NOT NULL REFERENCES "payload_preferences"("id") ON DELETE CASCADE,
  "path" VARCHAR(255) NOT NULL,
  "users_id" INTEGER REFERENCES "users"("id") ON DELETE CASCADE
);

-- Payload migrations table
CREATE TABLE IF NOT EXISTS "payload_migrations" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "batch" INTEGER NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_posts_status" ON "posts"("status");
CREATE INDEX IF NOT EXISTS "idx_posts_category" ON "posts"("category_id");
CREATE INDEX IF NOT EXISTS "idx_posts_published_at" ON "posts"("published_at");
CREATE INDEX IF NOT EXISTS "idx_posts_featured" ON "posts"("featured");
CREATE INDEX IF NOT EXISTS "idx_categories_slug" ON "categories"("slug");
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users"("email");
