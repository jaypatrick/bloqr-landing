/**
 * src/types/env.ts — Shared Cloudflare Workers environment bindings
 *
 * Preferred shared definition for the Worker `Env` interface.
 * Import from here in:
 *   - src/worker.ts           (ExportedHandler<Env>)
 *   - src/env.d.ts            (App.Locals extends Runtime<Env>)
 *   - functions/admin/*.ts    (handler Env types)
 *
 * Prefer importing or extending this interface where practical so binding
 * changes stay aligned across the Worker codebase as modules are migrated.
 * Note: functions/waitlist.ts, functions/config.ts, and src/lib/auth.ts
 * still define their own narrower Env types; those are intentionally scoped
 * to what each module needs.
 *
 * ## New Cloudflare services (activate by uncommenting wrangler.toml blocks)
 *
 * | Binding              | Type                        | Purpose                          |
 * | -------------------- | --------------------------- | -------------------------------- |
 * | `EMAIL_QUEUE`        | `Queue`                     | Durable email delivery queue     |
 * | `EMAIL_DLQ`          | `Queue`                     | Dead letter queue for failed msgs|
 * | `WAITLIST_WORKFLOW`  | `Workflow`                  | Durable post-signup orchestration|
 * | `ANALYTICS`          | `AnalyticsEngineDataset`    | Email + signup event tracking    |
 * | `EMAIL_DEDUP_KV`     | `KVNamespace`               | Email deduplication store        |
 */

import type { EmailQueueMessage } from './emailQueue';

export interface Env {
  // ─── Static asset binding ─────────────────────────────────────────────────
  /** Cloudflare ASSETS binding — serves the pre-built dist/ directory. */
  ASSETS: Fetcher;

  // ─── Database ─────────────────────────────────────────────────────────────
  /** Neon Postgres connection string (branch-specific, set as CF secret). */
  DATABASE_URL: string;

  // ─── External integrations ────────────────────────────────────────────────
  /** Apollo.io API key for contact enrichment (fire-and-forget on waitlist). */
  APOLLO_API_KEY: string;

  // ─── PostHog server-side analytics ────────────────────────────────────────
  /** PostHog project token for server-side event tracking via posthog-node. Set as a CF secret. */
  POSTHOG_PROJECT_TOKEN?: string;
  /** PostHog ingest host. Defaults to the US cloud endpoint if not set. */
  POSTHOG_HOST?: string;

  // ─── Better Auth ──────────────────────────────────────────────────────────
  /** Random 32+ char secret; signs and validates Better Auth sessions. */
  BETTER_AUTH_SECRET: string;
  /** Canonical origin for Better Auth callbacks (e.g. https://bloqr.dev). */
  BETTER_AUTH_URL?: string;
  /** GitHub OAuth App client ID. */
  GITHUB_CLIENT_ID?: string;
  /** GitHub OAuth App client secret. */
  GITHUB_CLIENT_SECRET?: string;
  /**
   * Optional comma-separated list of trusted origins for cross-app SSO.
   * Leave unset until app.bloqr.dev / docs.bloqr.dev are live.
   */
  BETTER_AUTH_TRUSTED_ORIGINS?: string;

  // ─── Admin access ─────────────────────────────────────────────────────────
  /** Legacy bearer token for /admin/* routes (fallback when Better Auth is not configured). */
  ADMIN_SECRET?: string;

  // ─── Worker runtime vars (set in wrangler.toml [vars]) ────────────────────
  /**
   * Canonical domain for this deployment.
   * Used to gate `X-Robots-Tag: noindex, nofollow` on non-canonical hosts
   * (e.g. *.workers.dev preview URLs).
   */
  CANONICAL_DOMAIN?: string;
  /** Deployment environment tag ("production", "staging", etc.). */
  ENVIRONMENT?: string;

  // ─── Email service (Cloudflare Email Workers — transactional, outbound) ──────
  /** Sender address, e.g. "Bloqr <hello@bloqr.dev>" */
  FROM_EMAIL?: string;
  /**
   * Cloudflare Email Workers `SEND_EMAIL` binding.
   * Enables outbound transactional email via the native CF Email Routing
   * infrastructure — no third-party API key required.
   *
   * Wire in wrangler.toml:
   *   [[send_email]]
   *   name = "SEND_EMAIL"
   *   # destination_address = "hello@bloqr.dev"  # optional: restrict to one address
   *
   * @see src/services/emailService.ts — CfEmailSendingStrategy
   * @see https://developers.cloudflare.com/email-routing/email-workers/send-email-workers/
   */
  SEND_EMAIL?: {
    send(message: unknown): Promise<void>;
  };
  /**
   * Cloudflare service binding to the dedicated `bloqr-email` Worker.
   * When present, email is routed through the email worker instead of calling
   * the SEND_EMAIL binding directly.
   *
   * Wire in wrangler.toml:
   *   [[services]]
   *   binding = "EMAIL_WORKER"
   *   service = "bloqr-email"
   *
   * @see src/services/emailService.ts — ServiceBindingStrategy
   */
  EMAIL_WORKER?: Fetcher;

  // ─── Cloudflare Workers bindings ──────────────────────────────────────────
  /**
   * Cloudflare Browser Rendering binding — headless Chromium at the edge.
   * Requires Cloudflare Workers paid plan and `[browser]` binding in wrangler.toml.
   * Access via `env.BROWSER` in Worker handlers.
   * Optional: absent in local dev unless `wrangler dev --remote` is used.
   */
  BROWSER?: Fetcher;

  /**
   * D1 database binding — email delivery log and custom template store.
   *
   * Tables:
   *   - `email_sends`     — immutable delivery log written by the queue consumer
   *   - `email_templates` — optional custom overrides for hard-coded templates
   *
   * Create with `scripts/setup-d1-email.sh` (one-time per environment).
   *
   * Wire in wrangler.toml:
   *   [[d1_databases]]
   *   binding       = "EMAIL_DB"
   *   database_name = "bloqr-landing-email-db"
   *   database_id   = "<id-from-setup-script>"
   *
   * @see src/db/emailDb.ts       — query helpers
   * @see scripts/setup-d1-email.sh — one-time D1 setup
   * @see scripts/migrations/001_email_db.sql — schema definition
   */
  EMAIL_DB?: D1Database;

  /**
   * D1 database binding — site_config read-through cache.
   * Currently reserved / not yet active in handler code.
   */
  BLOQR_CONFIG_CACHE_DB: D1Database;

  // ─── Cloudflare Queues ─────────────────────────────────────────────────────
  //
  // Activate by uncommenting the queue blocks in wrangler.toml and running:
  //   wrangler queues create bloqr-landing-email-queue
  //   wrangler queues create bloqr-landing-email-dlq

  /**
   * Producer binding for the `bloqr-landing-email-queue` Cloudflare Queue.
   *
   * When present, the waitlist handler publishes `EmailQueueMessage` envelopes
   * here instead of sending emails directly.  The queue consumer
   * (`handleEmailQueue` in `src/worker.ts`) delivers them with automatic
   * retries and dead-letter routing.
   *
   * Wire in wrangler.toml:
   *   [[queues.producers]]
   *   binding = "EMAIL_QUEUE"
   *   queue   = "bloqr-landing-email-queue"
   *
   * @see functions/queues/emailConsumer.ts — consumer implementation
   * @see https://developers.cloudflare.com/queues/
   */
  EMAIL_QUEUE?: Queue<EmailQueueMessage>;

  /**
   * Producer binding for the `bloqr-landing-email-dlq` dead letter queue.
   *
   * Messages that exceed `max_retries` in `bloqr-landing-email-queue` are
   * automatically routed here by the CF runtime.  This binding allows handlers
   * to inspect the DLQ size or republish messages via the admin API.
   *
   * Wire in wrangler.toml:
   *   [[queues.producers]]
   *   binding = "EMAIL_DLQ"
   *   queue   = "bloqr-landing-email-dlq"
   */
  EMAIL_DLQ?: Queue<EmailQueueMessage>;

  // ─── Cloudflare Workflows ──────────────────────────────────────────────────
  //
  // Activate by uncommenting the [[workflows]] block in wrangler.toml.

  /**
   * Binding to the `WaitlistSignupWorkflow` Cloudflare Workflow.
   *
   * When present, the waitlist HTTP handler calls `.create(params)` after a
   * successful DB INSERT to trigger durable orchestration of email delivery
   * and Apollo enrichment.  Each workflow step has its own independent retry
   * policy and is checkpointed to persistent state.
   *
   * Wire in wrangler.toml:
   *   [[workflows]]
   *   binding     = "WAITLIST_WORKFLOW"
   *   name        = "waitlist-signup"
   *   class_name  = "WaitlistSignupWorkflow"
   *   script_name = "bloqr-landing"
   *
   * @see src/workflows/waitlistSignup.ts — workflow class definition
   * @see https://developers.cloudflare.com/workflows/
   */
  WAITLIST_WORKFLOW?: Workflow;

  // ─── Cloudflare Analytics Engine ──────────────────────────────────────────
  //
  // Activate by uncommenting the [[analytics_engine_datasets]] block in wrangler.toml.

  /**
   * Analytics Engine dataset binding for email and signup event tracking.
   *
   * Writes structured data points for events such as:
   *   - `waitlist_signup`         — new signup inserted
   *   - `email_sent`              — confirmation email delivered
   *   - `waitlist_workflow_complete` — workflow finished all steps
   *
   * These data points are queryable via the Cloudflare Analytics API and
   * visualisable in the dashboard without a third-party observability platform.
   *
   * Wire in wrangler.toml:
   *   [[analytics_engine_datasets]]
   *   binding = "ANALYTICS"
   *   dataset = "bloqr_email_events"
   *
   * @see https://developers.cloudflare.com/analytics/analytics-engine/
   */
  ANALYTICS?: AnalyticsEngineDataset;

  // ─── KV: Email deduplication ───────────────────────────────────────────────
  //
  // Activate by creating the namespace and uncommenting [[kv_namespaces]] in wrangler.toml.

  /**
   * KV namespace for email deduplication.
   *
   * The queue consumer writes `email-sent:<message-id>` keys (TTL: 24 h) after
   * a successful email send.  On consumer retry, the key presence prevents a
   * duplicate send even if the Worker crashed between sending and ACKing the
   * queue message.
   *
   * Create the namespace:
   *   wrangler kv namespace create EMAIL_DEDUP
   *
   * Wire in wrangler.toml:
   *   [[kv_namespaces]]
   *   binding = "EMAIL_DEDUP_KV"
   *   id      = "<namespace-id-from-above>"
   *
   * @see functions/queues/emailConsumer.ts — consumer dedup logic
   * @see https://developers.cloudflare.com/kv/
   */
  EMAIL_DEDUP_KV?: KVNamespace;
}
