/**
 * scripts/migrate-blog-posts.ts
 *
 * Creates the blog_posts table in Neon PostgreSQL.
 * Run: npx tsx scripts/migrate-blog-posts.ts
 *
 * Requires DATABASE_URL to be set in the environment.
 */

import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required.');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function migrate() {
  console.log('Running blog_posts migration…');

  await sql`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug         TEXT NOT NULL UNIQUE,
      title        TEXT NOT NULL,
      description  TEXT NOT NULL,
      content      TEXT NOT NULL,
      pub_date     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_date TIMESTAMPTZ,
      author       TEXT NOT NULL DEFAULT 'Jayson Knight',
      category     TEXT NOT NULL CHECK (category IN ('education', 'industry', 'release')),
      tags         TEXT[] NOT NULL DEFAULT '{}',
      draft        BOOLEAN NOT NULL DEFAULT true,
      og_image     TEXT,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS blog_posts_slug_idx
    ON blog_posts (slug)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS blog_posts_pub_date_idx
    ON blog_posts (pub_date DESC)
    WHERE draft = false
  `;

  console.log('✓ blog_posts table and indexes created (or already exist).');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
