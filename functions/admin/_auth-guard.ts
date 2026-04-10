/**
 * functions/admin/_auth-guard.ts — Shared auth helpers for admin handlers
 *
 * Both /admin/config and /admin/blog use the same dual-auth pattern:
 *   1. Better Auth session (primary)
 *   2. Legacy ADMIN_SECRET bearer token (fallback)
 *
 * Centralising here means auth logic changes propagate to both handlers
 * automatically without risk of divergence.
 */

import { getSession, isAdminUser, type AuthEnv } from '../../src/lib/auth';

export interface AdminEnv extends AuthEnv {
  DATABASE_URL?: string;
}

/**
 * Returns true if at least one auth mechanism is configured.
 * Used to distinguish "misconfigured server" (503) from "wrong credentials" (403).
 */
export function isAuthConfigured(env: AdminEnv): boolean {
  return !!(env.BETTER_AUTH_SECRET || env.ADMIN_SECRET);
}

/**
 * Dual-auth: Better Auth session first, legacy ADMIN_SECRET bearer as fallback.
 */
export async function isAuthorized(request: Request, env: AdminEnv): Promise<boolean> {
  // 1. Try Better Auth session (the new way)
  if (env.DATABASE_URL && env.BETTER_AUTH_SECRET) {
    try {
      const session = await getSession(request, env);
      if (session?.user && isAdminUser(session.user.name ?? '')) return true;
    } catch {
      // fall through to legacy check
    }
  }

  // 2. Fall back to legacy ADMIN_SECRET bearer token (backward compat)
  const authHeader = request.headers.get('Authorization') ?? '';
  const [scheme, token] = authHeader.split(' ');
  if (scheme === 'Bearer' && env.ADMIN_SECRET && token === env.ADMIN_SECRET) return true;

  return false;
}
