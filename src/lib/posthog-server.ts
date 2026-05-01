/**
 * src/lib/posthog-server.ts — Server-side PostHog singleton for Cloudflare Workers
 *
 * Uses a module-level singleton so the PostHog client is reused across
 * requests within the same isolate. In Cloudflare Workers, flushAt: 1 and
 * flushInterval: 0 ensure events are flushed immediately without batching,
 * since the Worker process does not stay alive long enough to batch events.
 *
 * After capturing events, call ctx.waitUntil(posthog.flush()) to ensure
 * events are sent before the Worker terminates.
 */

import { PostHog } from 'posthog-node';

let posthogClient: PostHog | null = null;

/**
 * Returns the PostHog server-side client, creating it on first call.
 * Subsequent calls return the existing singleton instance.
 * If host is omitted or empty, posthog-node uses its built-in default.
 */
export function getPostHogServer(token: string, host?: string): PostHog {
  if (!posthogClient) {
    posthogClient = new PostHog(token, {
      ...(host ? { host } : {}),
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return posthogClient;
}
