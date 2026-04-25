/**
 * scripts/migrate-email-schema.ts — Neon migration for email tracking columns
 *
 * Adds `email_message_id` to the `waitlist` table so each signup can be
 * linked back to the email queue message that triggered the confirmation.
 *
 * This enables:
 *   - Cross-referencing the `email_sends` D1 table with signup records
 *   - Auditing whether a signup received a confirmation email
 *   - Debugging delivery failures by joining waitlist + email_sends
 *
 * Run once per Neon branch:
 *   npm run migrate:email
 *
 * Or directly:
 *   npx tsx scripts/migrate-email-schema.ts
 *
 * Requires DATABASE_URL in .dev.vars or process.env.
 */

import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env['DATABASE_URL'];
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is not set. Add it to .dev.vars or process.env.');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

/** Safely mask the password portion of a postgres connection URL for logging. */
function maskConnectionUrl(raw: string): string {
  try {
    const parsed = new URL(raw);
    parsed.password = '***';
    return parsed.toString();
  } catch {
    return raw.replace(/:[^:@]*@/, ':***@');
  }
}

async function migrate(): Promise<void> {
  console.log('Running email schema migration on Neon...');
  console.log(`  Database: ${maskConnectionUrl(DATABASE_URL!)}`);
  console.log('');

  // ── Add email_message_id to waitlist ────────────────────────────────────────
  // email_message_id is the UUID from EmailQueueMessage.id.
  // Nullable because:
  //   1. Existing rows won't have it (historical data)
  //   2. Newly-added rows always have it set — the HTTP handler generates a
  //      UUID before the INSERT and stores it here regardless of whether
  //      FROM_EMAIL/Workflow/Queue are active (so it is ready when email
  //      delivery is enabled later)
  //
  // This column is set atomically in the INSERT so no UPDATE is required
  // after enqueueing.  The partial index below speeds up admin lookups.
  //
  // We use DO NOTHING on column conflict so this is safe to run multiple times.

  await sql`
    ALTER TABLE waitlist
    ADD COLUMN IF NOT EXISTS email_message_id TEXT DEFAULT NULL
  `;
  console.log('  ✓ waitlist.email_message_id column added (TEXT, nullable)');

  // Index for the admin lookup: "which signup is linked to this message?"
  await sql`
    CREATE INDEX IF NOT EXISTS idx_waitlist_email_message_id
    ON waitlist (email_message_id)
    WHERE email_message_id IS NOT NULL
  `;
  console.log('  ✓ idx_waitlist_email_message_id index created');

  // ── Verify ──────────────────────────────────────────────────────────────────
  const columns = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'waitlist'
    ORDER BY ordinal_position
  `;

  console.log('');
  console.log('  waitlist table columns:');
  for (const col of columns) {
    const nullable = (col as Record<string, string>)['is_nullable'] === 'YES' ? '(nullable)' : '(not null)';
    console.log(`    ${(col as Record<string, string>)['column_name']}  — ${(col as Record<string, string>)['data_type']} ${nullable}`);
  }

  console.log('');
  console.log('  ✓ Migration complete.');
  console.log('');
  console.log('  Next steps:');
  console.log('    1. Run the same migration on staging/production Neon branches');
  console.log('       by switching DATABASE_URL and re-running this script');
}

migrate().catch((err: unknown) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
