/**
 * src/db/emailDb.ts — D1 query helpers for email persistence
 *
 * All email-related D1 operations are centralised here so consumers,
 * admin handlers, and migration scripts import from a single module.
 *
 * ## Database: `bloqr-email` (D1)
 *
 * Two tables:
 *
 *   ### `email_sends`
 *   Immutable delivery log.  One row per send attempt, keyed on `message_id`
 *   (the UUID from `EmailQueueMessage.id`).  Used by the admin dashboard to
 *   show delivery history, error rates, and retry counts.
 *
 *   ### `email_templates`
 *   Mutable template store.  Rows shadow the hard-coded templates in
 *   `src/email/templates/`.  When a row exists for a template name, the
 *   consumer uses the DB version instead of the compiled default.  This lets
 *   you update subject lines and copy via the admin UI without a code deploy.
 *
 * ## Activation
 *
 * 1. Run `scripts/setup-d1-email.sh` to create the database and apply schema.
 * 2. Copy the printed `database_id` into `wrangler.toml` (see template below).
 * 3. Uncomment the `[[d1_databases]]` block for `bloqr-email` in `wrangler.toml`.
 * 4. Deploy — the consumer will start logging sends and reading overrides.
 *
 * @see scripts/setup-d1-email.sh  — one-time database setup
 * @see functions/queues/emailConsumer.ts — consumer that writes email_sends
 * @see functions/admin/email.ts — admin handler that reads/writes email_templates
 */

// ─── Row types ────────────────────────────────────────────────────────────────

/**
 * Delivery status for an email send attempt.
 *
 * - `sent`          — successfully delivered to MailChannels / EMAIL_WORKER
 * - `failed`        — delivery failed; see `error_message` for details
 * - `stale`         — message was older than `MAX_MESSAGE_AGE_MS`; not sent
 * - `deduplicated`  — message ID already in `EMAIL_DEDUP_KV`; not re-sent
 * - `invalid`       — failed Zod schema validation; not retried
 */
export type EmailSendStatus =
  | 'sent'
  | 'failed'
  | 'stale'
  | 'deduplicated'
  | 'invalid';

/**
 * A row in the `email_sends` table.
 *
 * Written by the queue consumer after each message processing attempt.
 * Queue retries create additional rows for the same `message_id` — each
 * attempt has its own row so the full retry history is preserved.
 */
export interface EmailSendRow {
  /** Auto-incremented row ID. */
  id: number;
  /**
   * UUID from `EmailQueueMessage.id`.
   * Not unique — multiple rows may share a `message_id` (one per attempt).
   */
  message_id: string;
  /**
   * Which delivery attempt this row records.
   * 1 = first attempt, 2 = first retry, etc.
   * Maps to `message.attempts` in the Cloudflare Queue consumer.
   */
  attempt: number;
  /** Recipient email address. */
  to_address: string;
  /** Template name (e.g. `waitlistWelcome`). */
  template_name: string;
  /** Delivery outcome. */
  status: EmailSendStatus;
  /**
   * Delivery strategy used.
   * - `service-binding` — routed through `EMAIL_WORKER` (adblock-email)
   * - `mailchannels`    — direct MailChannels TX API call
   * - `none`            — skipped (stale, dedup, invalid, or FROM_EMAIL absent)
   */
  strategy: 'service-binding' | 'mailchannels' | 'none';
  /** Error message if `status === 'failed'` or `status === 'invalid'`. */
  error_message: string | null;
  /** ISO 8601 UTC timestamp when this row was created. */
  created_at: string;
}

/**
 * Input for inserting a new `email_sends` row.
 *
 * `id` and `created_at` are set by the database.
 */
export type EmailSendInput = Omit<EmailSendRow, 'id' | 'created_at'>;

/**
 * A row in the `email_templates` table.
 *
 * Optional DB override for any hard-coded template.  When a row exists for
 * a given `name`, the consumer uses `subject`, `html`, and `text` from the
 * database instead of the compiled default in `src/email/templates/`.
 */
export interface EmailTemplateRow {
  /** Template name — must match an entry in `EmailTemplateNameSchema`. */
  name: string;
  /** Email subject line. */
  subject: string;
  /** Full HTML body (may use `{{email}}` and `{{site_url}}` placeholders). */
  html: string;
  /** Plain-text fallback body. */
  text: string;
  /**
   * Whether this is a custom admin-edited version.
   * `1` = custom (created/updated via admin API), `0` = seeded default.
   */
  is_custom: number;
  /** ISO 8601 UTC timestamp of the last update. */
  updated_at: string;
}

/**
 * Input for creating or updating an `email_templates` row.
 *
 * `updated_at` is always set to `CURRENT_TIMESTAMP` by the upsert query.
 */
export type EmailTemplateInput = Pick<EmailTemplateRow, 'name' | 'subject' | 'html' | 'text'>;

// ─── Pagination ───────────────────────────────────────────────────────────────

/** Options accepted by `listEmailSends`. */
export interface ListEmailSendsOptions {
  /** Maximum number of rows to return. Default: 50. */
  limit?:    number;
  /** Row `id` to start after (exclusive) for cursor-based pagination. */
  afterId?:  number;
  /** Filter by delivery status. */
  status?:   EmailSendStatus;
  /** Filter by template name. */
  template?: string;
  /** Filter by recipient email address. */
  to?:       string;
}

// ─── email_sends helpers ──────────────────────────────────────────────────────

/**
 * Inserts one row into `email_sends`.
 *
 * Silently swallows any D1 error so that a database hiccup never surfaces to
 * the queue consumer as a thrown error (which would trigger a message retry).
 *
 * @returns `true` on success, `false` if the write failed.
 */
export async function logEmailSend(
  db: D1Database,
  record: EmailSendInput,
): Promise<boolean> {
  try {
    await db
      .prepare(
        `INSERT INTO email_sends
           (message_id, attempt, to_address, template_name, status, strategy, error_message, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      )
      .bind(
        record.message_id,
        record.attempt,
        record.to_address,
        record.template_name,
        record.status,
        record.strategy,
        record.error_message ?? null,
      )
      .run();
    return true;
  } catch (err) {
    console.warn('[emailDb] logEmailSend failed:', err);
    return false;
  }
}

/**
 * Fetches a single `email_sends` row by `message_id`.
 *
 * @returns The row, or `null` if not found or on error.
 */
export async function getEmailSend(
  db: D1Database,
  messageId: string,
): Promise<EmailSendRow | null> {
  try {
    const result = await db
      .prepare('SELECT * FROM email_sends WHERE message_id = ? LIMIT 1')
      .bind(messageId)
      .first<EmailSendRow>();
    return result ?? null;
  } catch (err) {
    console.warn('[emailDb] getEmailSend failed:', err);
    return null;
  }
}

/**
 * Lists rows from `email_sends` with optional filtering and cursor-based pagination.
 *
 * Results are ordered newest-first (`created_at DESC, id DESC`).
 *
 * @param options.limit   - Maximum rows to return. Clamped to a hard maximum of 200.
 *                          Default: 50.
 * @param options.afterId - Row `id` to start after (exclusive) — cursor pagination.
 * @param options.status  - Filter by delivery status.
 * @param options.template - Filter by template name.
 * @param options.to      - Filter by recipient email address.
 *
 * @returns Array of rows (may be empty).
 */
export async function listEmailSends(
  db: D1Database,
  options: ListEmailSendsOptions = {},
): Promise<EmailSendRow[]> {
  const { limit = 50, afterId, status, template, to } = options;

  const conditions: string[]       = [];
  const bindings:   (string | number)[] = [];

  if (afterId !== undefined) {
    conditions.push('id < ?');
    bindings.push(afterId);
  }
  if (status) {
    conditions.push('status = ?');
    bindings.push(status);
  }
  if (template) {
    conditions.push('template_name = ?');
    bindings.push(template);
  }
  if (to) {
    conditions.push('to_address = ?');
    bindings.push(to);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  bindings.push(Math.max(1, Math.min(limit, 200))); // clamp to 1..200 rows per page

  try {
    const { results } = await db
      .prepare(`SELECT * FROM email_sends ${where} ORDER BY created_at DESC, id DESC LIMIT ?`)
      .bind(...bindings)
      .all<EmailSendRow>();
    return results ?? [];
  } catch (err) {
    console.warn('[emailDb] listEmailSends failed:', err);
    return [];
  }
}

// ─── email_templates helpers ──────────────────────────────────────────────────

/**
 * Fetches a custom template override from `email_templates`.
 *
 * The queue consumer calls this before falling back to the compiled default
 * in `src/email/templates/`.  If no row exists the hard-coded default is used.
 *
 * @returns The row if a custom version exists, or `null`.
 */
export async function getEmailTemplate(
  db: D1Database,
  name: string,
): Promise<EmailTemplateRow | null> {
  try {
    const result = await db
      .prepare('SELECT * FROM email_templates WHERE name = ? LIMIT 1')
      .bind(name)
      .first<EmailTemplateRow>();
    return result ?? null;
  } catch (err) {
    console.warn('[emailDb] getEmailTemplate failed:', err);
    return null;
  }
}

/**
 * Returns all rows from `email_templates` ordered by name.
 *
 * Used by the admin UI to show all available templates and their current
 * custom/default state.
 *
 * @returns Array of rows (may be empty).
 */
export async function listEmailTemplates(
  db: D1Database,
): Promise<EmailTemplateRow[]> {
  try {
    const { results } = await db
      .prepare('SELECT * FROM email_templates ORDER BY name ASC')
      .all<EmailTemplateRow>();
    return results ?? [];
  } catch (err) {
    console.warn('[emailDb] listEmailTemplates failed:', err);
    return [];
  }
}

/**
 * Creates or updates an `email_templates` row for the given template name.
 *
 * Uses `INSERT OR REPLACE` so the same statement handles both create and
 * update.  Sets `is_custom = 1` and refreshes `updated_at`.
 *
 * @returns `true` on success, `false` on error.
 */
export async function upsertEmailTemplate(
  db: D1Database,
  template: EmailTemplateInput,
): Promise<boolean> {
  try {
    await db
      .prepare(
        `INSERT INTO email_templates (name, subject, html, text, is_custom, updated_at)
         VALUES (?, ?, ?, ?, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
         ON CONFLICT(name) DO UPDATE SET
           subject    = excluded.subject,
           html       = excluded.html,
           text       = excluded.text,
           is_custom  = 1,
           updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
      )
      .bind(template.name, template.subject, template.html, template.text)
      .run();
    return true;
  } catch (err) {
    console.warn('[emailDb] upsertEmailTemplate failed:', err);
    return false;
  }
}

/**
 * Deletes a custom template override, restoring the compiled default.
 *
 * The hard-coded template in `src/email/templates/` is always the fallback;
 * deleting the DB row does not remove the template from the system.
 *
 * @returns `true` on success, `false` on error.
 */
export async function deleteEmailTemplate(
  db: D1Database,
  name: string,
): Promise<boolean> {
  try {
    await db
      .prepare('DELETE FROM email_templates WHERE name = ?')
      .bind(name)
      .run();
    return true;
  } catch (err) {
    console.warn('[emailDb] deleteEmailTemplate failed:', err);
    return false;
  }
}
