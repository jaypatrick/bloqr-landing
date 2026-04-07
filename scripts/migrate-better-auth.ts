/**
 * scripts/migrate-better-auth.ts
 *
 * Creates the Better Auth schema tables in Neon.
 * Run once: npm run migrate:auth
 *
 * Requires DATABASE_URL in environment (from .dev.vars or process.env).
 */

import 'dotenv/config'; // optional, for .env support locally
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is not set.');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function migrate() {
  console.log('Running Better Auth schema migration...');

  // Better Auth core tables
  // These match the schema expected by better-auth@1.x with a PostgreSQL adapter

  await sql`
    CREATE TABLE IF NOT EXISTS "user" (
      id             TEXT PRIMARY KEY,
      name           TEXT NOT NULL,
      email          TEXT NOT NULL UNIQUE,
      email_verified BOOLEAN NOT NULL DEFAULT false,
      image          TEXT,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  console.log('✓ user table');

  await sql`
    CREATE TABLE IF NOT EXISTS "session" (
      id         TEXT PRIMARY KEY,
      expires_at TIMESTAMPTZ NOT NULL,
      token      TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ip_address TEXT,
      user_agent TEXT,
      user_id    TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
    )
  `;
  console.log('✓ session table');

  await sql`
    CREATE TABLE IF NOT EXISTS "account" (
      id                       TEXT PRIMARY KEY,
      account_id               TEXT NOT NULL,
      provider_id              TEXT NOT NULL,
      user_id                  TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      access_token             TEXT,
      refresh_token            TEXT,
      id_token                 TEXT,
      access_token_expires_at  TIMESTAMPTZ,
      refresh_token_expires_at TIMESTAMPTZ,
      scope                    TEXT,
      password                 TEXT,
      created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  console.log('✓ account table');

  await sql`
    CREATE TABLE IF NOT EXISTS "verification" (
      id         TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value      TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ
    )
  `;
  console.log('✓ verification table');

  // Indexes for common query patterns
  await sql`CREATE INDEX IF NOT EXISTS session_token_idx       ON "session" (token)`;
  await sql`CREATE INDEX IF NOT EXISTS session_user_id_idx     ON "session" (user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS account_user_id_idx     ON "account" (user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS account_provider_idx    ON "account" (provider_id, account_id)`;
  console.log('✓ indexes');

  console.log('\n✓ Better Auth migration complete.');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
