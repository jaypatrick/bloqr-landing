/**
 * src/lib/auth.ts — Better Auth configuration
 *
 * Provides:
 *   - betterAuth instance configured for Cloudflare Workers + Neon
 *   - handleAuth(request, env) → routes all /api/auth/* requests
 *   - getSession(request, env) → validates session for admin edge functions
 *   - isAdminUser(login) → checks if GitHub user is allowed admin access
 *
 * SSO design:
 *   This auth instance is the single source of truth for all Bloqr properties.
 *   Other apps (app.bloqr.ai, docs.bloqr.ai) validate sessions by calling
 *   GET /api/auth/session on this origin with the session cookie forwarded.
 *   BETTER_AUTH_TRUSTED_ORIGINS controls which cross-origin requests are accepted.
 *
 * NOTE: This file must NOT be imported in any Astro page frontmatter
 * (runs at build time). Import only from src/worker.ts and functions/*.
 */

import { betterAuth } from 'better-auth';
import { Pool } from '@neondatabase/serverless';

/**
 * Loose auth env — all fields optional so admin handlers don't need unsafe casts.
 * Extend your handler's Env with this interface instead of duplicating fields.
 */
export interface AuthEnv {
  DATABASE_URL?: string;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  /** Optional: comma-separated list of trusted origins for cross-app SSO */
  BETTER_AUTH_TRUSTED_ORIGINS?: string;
  /** Legacy — kept for backward compat during migration */
  ADMIN_SECRET?: string;
}

/** Full env required for the Worker entry point (handleAuth). */
export interface Env
  extends Required<Pick<AuthEnv, 'DATABASE_URL' | 'BETTER_AUTH_SECRET'>>,
    Omit<AuthEnv, 'DATABASE_URL' | 'BETTER_AUTH_SECRET'> {}

/**
 * Admin allowlist — only GitHub accounts in this list get admin access.
 * Checked against the GitHub OAuth account username. When a user authenticates
 * via the GitHub social provider, Better Auth stores the GitHub login (username)
 * in `session.user.name`, which is what `isAdminUser()` checks.
 * TODO: move to a DB table when the team grows beyond 1.
 */
const ADMIN_GITHUB_LOGINS = new Set([
  'jaypatrick', // Jayson Knight — founder
]);

export function isAdminUser(githubLogin: string): boolean {
  return ADMIN_GITHUB_LOGINS.has(githubLogin);
}

/**
 * Fallback base URL used when BETTER_AUTH_URL is not set in environment.
 * Override this with the BETTER_AUTH_URL secret in Cloudflare Workers.
 * Update to https://bloqr.ai when the domain is live.
 */
const FALLBACK_BASE_URL = 'https://adblock-compiler-landing.pages.dev';

/**
 * Module-level cache of betterAuth instances, keyed by config fingerprint.
 * Cloudflare Workers reuse the same isolate across requests in the same instance,
 * so memoizing here avoids reconstructing a new Pool + auth on every request.
 */
const authInstanceCache = new Map<string, ReturnType<typeof betterAuth>>();

/**
 * Create (or reuse a cached) Better Auth instance for the given env.
 * The cache key is the tuple of fields that affect auth behaviour.
 */
function getOrCreateAuth(env: Env) {
  const cacheKey = [
    env.DATABASE_URL,
    env.BETTER_AUTH_SECRET,
    env.BETTER_AUTH_URL ?? '',
    env.GITHUB_CLIENT_ID ?? '',
    env.BETTER_AUTH_TRUSTED_ORIGINS ?? '',
  ].join('|');

  const cached = authInstanceCache.get(cacheKey);
  if (cached) return cached;

  const pool    = new Pool({ connectionString: env.DATABASE_URL });
  const baseURL = env.BETTER_AUTH_URL ?? FALLBACK_BASE_URL;

  const trustedOrigins = env.BETTER_AUTH_TRUSTED_ORIGINS
    ? env.BETTER_AUTH_TRUSTED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
    : [];

  const githubClientId     = env.GITHUB_CLIENT_ID ?? '';
  const githubClientSecret = env.GITHUB_CLIENT_SECRET ?? '';

  const auth = betterAuth({
    baseURL,
    secret: env.BETTER_AUTH_SECRET,

    // Better Auth uses Kysely internally; Pool from @neondatabase/serverless
    // is compatible with the PostgresPool interface Kysely expects.
    database: pool,

    // Social providers — GitHub OAuth only (admin use)
    ...(githubClientId && githubClientSecret
      ? {
          socialProviders: {
            github: {
              clientId: githubClientId,
              clientSecret: githubClientSecret,
            },
          },
        }
      : {}),

    // Session config
    session: {
      expiresIn:  60 * 60 * 24 * 7,   // 7 days
      updateAge:  60 * 60 * 24,        // refresh if older than 1 day
      cookieCache: {
        enabled: true,
        maxAge:  60 * 5,              // 5 min client-side cache
      },
    },

    // Trust the resolved base URL for this environment, plus any explicitly
    // configured cross-app origins. This avoids always trusting the fallback
    // Pages domain when a different canonical BETTER_AUTH_URL is configured.
    trustedOrigins: [...new Set([baseURL, ...trustedOrigins])],

    // Rate limiting (uses DB storage for Cloudflare Workers compatibility)
    rateLimit: {
      enabled: true,
      window:  60,  // seconds
      max:     20,  // requests per window
      storage: 'database',
    },
  });

  authInstanceCache.set(cacheKey, auth);
  return auth;
}

/**
 * Handle all /api/auth/* requests.
 * Called from src/worker.ts for any request matching that path prefix.
 */
export async function handleAuth(request: Request, env: Env): Promise<Response> {
  if (!env.DATABASE_URL || !env.BETTER_AUTH_SECRET) {
    return new Response(JSON.stringify({ error: 'Auth service not configured.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const auth = getOrCreateAuth(env);
  return auth.handler(request);
}

/**
 * Validate the session for an incoming admin request.
 * Accepts AuthEnv (all fields optional) so callers with partially-typed
 * environments don't need unsafe casts — the function guards internally.
 *
 * Returns the session object if valid and configured, null otherwise.
 *
 * Usage in edge functions:
 *   const session = await getSession(request, env);
 *   if (!session || !isAdminUser(session.user.name ?? '')) {
 *     return new Response(JSON.stringify({ error: 'Forbidden.' }), { status: 403 });
 *   }
 */
export async function getSession(request: Request, env: AuthEnv) {
  if (!env.DATABASE_URL || !env.BETTER_AUTH_SECRET) return null;

  try {
    const auth = getOrCreateAuth(
      env as Required<Pick<AuthEnv, 'DATABASE_URL' | 'BETTER_AUTH_SECRET'>> & AuthEnv
    );
    const session = await auth.api.getSession({ headers: request.headers });
    return session;
  } catch {
    return null;
  }
}
