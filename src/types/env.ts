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
 */

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

  // ─── Better Auth ──────────────────────────────────────────────────────────
  /** Random 32+ char secret; signs and validates Better Auth sessions. */
  BETTER_AUTH_SECRET: string;
  /** Canonical origin for Better Auth callbacks (e.g. https://bloqr.jaysonknight.com). */
  BETTER_AUTH_URL?: string;
  /** GitHub OAuth App client ID. */
  GITHUB_CLIENT_ID?: string;
  /** GitHub OAuth App client secret. */
  GITHUB_CLIENT_SECRET?: string;
  /**
   * Optional comma-separated list of trusted origins for cross-app SSO.
   * Leave unset until app.bloqr.ai / docs.bloqr.ai are live.
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

  // ─── Cloudflare Workers bindings ──────────────────────────────────────────
  /**
   * Cloudflare Browser Rendering binding — headless Chromium at the edge.
   * Requires Cloudflare Workers paid plan and `[browser]` binding in wrangler.toml.
   * Access via `env.BROWSER` in Worker handlers.
   * Optional: absent in local dev unless `wrangler dev --remote` is used.
   */
  BROWSER?: Fetcher;

  /**
   * D1 database binding — site_config read-through cache.
   * Currently reserved / not yet active in handler code.
   */
  bloqr_config_cache: D1Database;
}
