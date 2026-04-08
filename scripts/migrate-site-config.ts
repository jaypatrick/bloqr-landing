/**
 * scripts/migrate-site-config.ts
 *
 * Migration script — creates and seeds the `site_config` table in Neon.
 * Compatible with both Deno and Node.js (tsx / ts-node).
 *
 * Usage (Deno):
 *   DATABASE_URL=<neon-connection-string> deno run --allow-net --allow-env scripts/migrate-site-config.ts
 *
 * Usage (Node with tsx):
 *   DATABASE_URL=<neon-connection-string> npx tsx scripts/migrate-site-config.ts
 *
 * The script is idempotent — safe to run multiple times.
 * Rows are only inserted if the key does not already exist (ON CONFLICT DO NOTHING).
 */

import { neon } from '@neondatabase/serverless';

// Support both Deno and Node.js runtimes
const isDeno = typeof globalThis.Deno !== 'undefined';

function getEnv(key: string): string | undefined {
  return isDeno
    ? globalThis.Deno.env.get(key)
    : process.env[key];
}

function exit(code: number): never {
  if (isDeno) {
    globalThis.Deno.exit(code);
  } else {
    process.exit(code);
  }
  throw new Error('unreachable'); // satisfy TypeScript's `never` return type
}

const DATABASE_URL = getEnv('DATABASE_URL');
if (!DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is required.');
  exit(1);
}

const sql = neon(DATABASE_URL);

async function migrate(): Promise<void> {
  console.log('Running site_config migration…');

  // 1. Create the table
  await sql`
    CREATE TABLE IF NOT EXISTS site_config (
      key        TEXT PRIMARY KEY,
      value      TEXT NOT NULL,
      label      TEXT,
      updated_at TIMESTAMPTZ DEFAULT now()
    )
  `;
  console.log('✓ Table site_config created (or already exists)');

  // 2. Seed default values (adblock-compiler era — update rows via admin UI when bloqr.ai is live)
  await sql`
    INSERT INTO site_config (key, value, label) VALUES
      ('SITE_URL',        'https://adblock-landing.jayson-knight.workers.dev',        'Canonical site URL (update to https://bloqr.ai when domain is live)'),
      ('APP_URL',         'https://adblock-frontend.jayson-knight.workers.dev', 'App URL (update to https://app.bloqr.ai)'),
      ('DOCS_URL',        'https://adblock-compiler-docs.pages.dev',            'Docs URL (update to https://docs.bloqr.ai)'),
      ('API_URL',         'https://adblock-compiler-docs.pages.dev',            'API URL (update to https://api.bloqr.ai when live)'),
      ('JSR_URL',         'https://jsr.io/@jk-com/adblock-compiler',           'JSR package URL'),
      ('GITHUB_URL',      'https://github.com/jaypatrick/adblock-compiler',    'GitHub repo URL'),
      ('AUTHOR_URL',      'https://jaysonknight.com',                           'Author website'),
      ('PRODUCT_NAME',    'Bloqr',                                              'Product display name'),
      ('PRODUCT_TAGLINE', 'Good Internet Hygiene. Automated.',                  'Product tagline'),
      ('OG_IMAGE_PATH',   '/og-image.png',                                      'OG image path (relative to SITE_URL)')
    ON CONFLICT (key) DO NOTHING
  `;
  console.log('✓ Seeded site_config rows (skipped any that already exist)');

  console.log('Migration complete.');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  exit(1);
});
