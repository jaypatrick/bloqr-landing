-- scripts/migrations/001_email_db.sql
-- D1 schema for bloqr-email database
--
-- Apply with:
--   wrangler d1 execute bloqr-email --file scripts/migrations/001_email_db.sql
--   wrangler d1 execute bloqr-email --file scripts/migrations/001_email_db.sql --remote
--
-- Tables:
--   email_sends     — immutable delivery log (one row per queue message processed)
--   email_templates — mutable custom template overrides (managed via /admin/email)
--
-- All timestamps stored as ISO 8601 UTC strings
-- (SQLite TEXT affinity, format: YYYY-MM-DDTHH:MM:SS.sssZ).

-- ─── email_sends ──────────────────────────────────────────────────────────────
-- Immutable delivery log. One row per message processing attempt.
-- Queue retries create additional rows for the same message_id (one per attempt).
-- Used by GET /admin/email/logs for delivery history and error inspection.

CREATE TABLE IF NOT EXISTS email_sends (
  -- Auto-incrementing row ID (stable cursor for pagination)
  id            INTEGER PRIMARY KEY AUTOINCREMENT,

  -- UUID from EmailQueueMessage.id — identifies the original queue message.
  -- NOT unique: a single message_id may have multiple rows (one per attempt).
  message_id    TEXT    NOT NULL,

  -- Which delivery attempt this row records (1 = first, 2 = first retry, etc.)
  attempt       INTEGER NOT NULL DEFAULT 1,

  -- Recipient email address
  to_address    TEXT    NOT NULL,

  -- Template name (e.g. 'waitlistWelcome')
  template_name TEXT    NOT NULL,

  -- Delivery outcome:
  --   sent         — email delivered successfully
  --   failed       — transient or permanent delivery failure
  --   stale        — message was older than 24h; not sent
  --   deduplicated — message_id already in EMAIL_DEDUP_KV; not re-sent
  --   invalid      — failed Zod schema validation; not retried
  status        TEXT    NOT NULL CHECK(status IN ('sent','failed','stale','deduplicated','invalid')),

  -- Transport used:
  --   service-binding — routed through EMAIL_WORKER (adblock-email)
  --   mailchannels    — direct MailChannels TX API
  --   none            — no send attempted (stale/dedup/invalid/missing FROM_EMAIL)
  strategy      TEXT    NOT NULL DEFAULT 'none'
                CHECK(strategy IN ('service-binding','mailchannels','none')),

  -- Error detail when status = 'failed' or 'invalid'
  error_message TEXT    DEFAULT NULL,

  -- When this row was written (ISO 8601 UTC — e.g. 2026-04-25T08:00:00.000Z)
  created_at    TEXT    NOT NULL DEFAULT(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Index for the admin logs query (newest-first with optional status/template filters)
CREATE INDEX IF NOT EXISTS idx_email_sends_created
  ON email_sends (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_sends_status
  ON email_sends (status);

CREATE INDEX IF NOT EXISTS idx_email_sends_template
  ON email_sends (template_name);

CREATE INDEX IF NOT EXISTS idx_email_sends_to
  ON email_sends (to_address);

-- ─── email_templates ──────────────────────────────────────────────────────────
-- Optional DB overrides for hard-coded templates.
-- When a row exists for a template name the queue consumer uses the DB version;
-- otherwise it falls back to the compiled default in src/email/templates/.
--
-- Managed via:
--   GET  /admin/email/templates        — list all rows
--   PUT  /admin/email/templates        — upsert a custom version
--   DELETE /admin/email/templates/:name — remove override (restore default)

CREATE TABLE IF NOT EXISTS email_templates (
  -- Template name — must match an entry in EmailTemplateNameSchema
  name        TEXT PRIMARY KEY,

  -- Email subject line
  subject     TEXT NOT NULL,

  -- Full HTML body (supports {{email}} and {{site_url}} placeholders)
  html        TEXT NOT NULL,

  -- Plain-text fallback body
  text        TEXT NOT NULL,

  -- 1 = created/updated via admin API, 0 = seeded default
  is_custom   INTEGER NOT NULL DEFAULT 0 CHECK(is_custom IN (0, 1)),

  -- ISO 8601 UTC timestamp of last modification (e.g. 2026-04-25T08:00:00.000Z)
  updated_at  TEXT    NOT NULL DEFAULT(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
