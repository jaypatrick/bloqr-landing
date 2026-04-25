/**
 * Cloudflare Worker entry point
 *
 * Routes:
 *   POST    /waitlist       → waitlist handler (Neon insert + Apollo sync)
 *   OPTIONS /waitlist       → CORS preflight
 *   GET     /config         → site_config reader (public, cached)
 *   OPTIONS /config         → CORS preflight
 *   POST    /admin/config   → site_config writer (requires ADMIN_SECRET / Better Auth session)
 *   OPTIONS /admin/config   → CORS preflight
 *   GET     /admin/blog     → blog posts list (requires auth)
 *   POST    /admin/blog     → create blog post (requires auth)
 *   PUT     /admin/blog     → update blog post (requires auth)
 *   OPTIONS /admin/blog     → CORS preflight
 *   GET     /admin/email/status  → email config status (requires auth)
 *   GET     /admin/email/preview → render template preview (requires auth)
 *   POST    /admin/email/send-test → send test email (requires auth)
 *   OPTIONS /admin/email/*       → CORS preflight
 *   GET     /api/browser-health → Browser Rendering binding health check (requires auth)
 *   POST    /api/auth/*     → Better Auth handler (all auth endpoints)
 *   GET     /api/auth/*     → Better Auth handler (session checks, OAuth callbacks)
 *   Queue   email-queue     → handleEmailQueue (durable email delivery consumer)
 *   *                       → env.ASSETS.fetch(request) (static site)
 */

import type { Env } from './types/env';
import type { EmailQueueMessage } from './types/emailQueue';
import { handleOptions as waitlistOptions, handlePost as waitlistPost } from '../functions/waitlist';
import { handleOptions as configGetOptions, handleGet as configGet } from '../functions/config';
import { handleOptions as configPostOptions, handlePost as configPost } from '../functions/admin/config';
import { handleOptions as blogOptions, handleGet as blogGet, handlePost as blogPost, handlePut as blogPut } from '../functions/admin/blog';
import {
  handleOptions as emailAdminOptions,
  handleStatus as emailAdminStatus,
  handlePreview as emailAdminPreview,
  handleSendTest as emailAdminSendTest,
} from '../functions/admin/email';
import { handleAuth } from './lib/auth';
import { isAuthConfigured, isAuthorized } from '../functions/admin/_auth-guard';
import { handleEmailQueue } from '../functions/queues/emailConsumer';

// ─── Cloudflare Workflows export ──────────────────────────────────────────────
// WaitlistSignupWorkflow must be exported at the module top level so Wrangler
// registers it as a Workflow class in the Worker bundle.  Without this export
// the [[workflows]] binding in wrangler.toml cannot resolve `class_name`.
export { WaitlistSignupWorkflow } from './workflows/waitlistSignup';

/**
 * Returns the response unchanged if the request host matches the canonical domain.
 * Otherwise appends `X-Robots-Tag: noindex, nofollow` to prevent crawlers from
 * indexing temporary / workers.dev URLs.
 */
function applyRobotsTag(response: Response, hostname: string, canonicalDomain: string | undefined): Response {
  if (!canonicalDomain || hostname === canonicalDomain) return response;
  const headers = new Headers(response.headers);
  headers.set('X-Robots-Tag', 'noindex, nofollow');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

/**
 * Returns true for requests that are likely asking for an HTML document.
 * This scopes HTML-specific fallbacks away from asset requests such as CSS,
 * JS, images, or extensionless static files.
 */
function isHtmlNavigationRequest(request: Request, url: URL): boolean {
  const accept = (request.headers.get('accept') ?? '').toLowerCase();
  return accept.includes('text/html') || url.pathname.endsWith('/') || url.pathname.endsWith('.html');
}

/**
 * Injects a Content-Security-Policy header and additional security hardening
 * headers on HTML responses.
 *
 * Astro's generated HTML already includes a hash-based CSP meta tag for the
 * scripts and styles it emits at build time. Header and meta CSP are enforced
 * together, so defining fetch/script/style directives here can unintentionally
 * block valid runtime behaviour such as external analytics scripts, analytics
 * beacons, and inline scripts that Astro has already hashed.
 *
 * To avoid conflicting with Astro's generated CSP, the worker only sets
 * non-conflicting hardening directives here and leaves script/style/fetch
 * directives to the document-level CSP.
 */
function applyCSP(response: Response): Response {
  const contentType = (response.headers.get('content-type') ?? '').toLowerCase();
  if (!contentType.startsWith('text/html')) return response;

  const csp = [
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  const headers = new Headers(response.headers);
  headers.set('Content-Security-Policy', csp);
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('X-Content-Type-Options', 'nosniff');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    let response: Response;

    // Better Auth — handles all /api/auth/* routes (login, logout, session, OAuth callbacks)
    if (url.pathname.startsWith('/api/auth/')) {
      response = await handleAuth(request, env);
    } else if (url.pathname === '/waitlist') {
      if (request.method === 'OPTIONS') response = waitlistOptions();
      else if (request.method === 'POST') response = await waitlistPost(request, env, ctx);
      else response = new Response('Method Not Allowed', { status: 405 });
    } else if (url.pathname === '/config') {
      if (request.method === 'OPTIONS') response = configGetOptions();
      else if (request.method === 'GET') response = await configGet(request, env);
      else response = new Response('Method Not Allowed', { status: 405 });
    } else if (url.pathname === '/admin/config') {
      if (request.method === 'OPTIONS') response = configPostOptions();
      else if (request.method === 'POST') response = await configPost(request, env);
      else response = new Response('Method Not Allowed', { status: 405 });
    } else if (url.pathname === '/admin/blog') {
      if (request.method === 'OPTIONS') response = blogOptions();
      else if (request.method === 'GET') response = await blogGet(request, env);
      else if (request.method === 'POST') response = await blogPost(request, env);
      else if (request.method === 'PUT') response = await blogPut(request, env);
      else response = new Response('Method Not Allowed', { status: 405 });
    } else if (url.pathname === '/admin/email/status') {
      if (request.method === 'OPTIONS') response = emailAdminOptions();
      else if (request.method === 'GET') response = await emailAdminStatus(request, env);
      else response = new Response('Method Not Allowed', { status: 405 });
    } else if (url.pathname === '/admin/email/preview') {
      if (request.method === 'OPTIONS') response = emailAdminOptions();
      else if (request.method === 'GET') response = await emailAdminPreview(request, env);
      else response = new Response('Method Not Allowed', { status: 405 });
    } else if (url.pathname === '/admin/email/send-test') {
      if (request.method === 'OPTIONS') response = emailAdminOptions();
      else if (request.method === 'POST') response = await emailAdminSendTest(request, env);
      else response = new Response('Method Not Allowed', { status: 405 });
    } else if (url.pathname === '/api/browser-health') {
      if (request.method === 'OPTIONS') {
        response = new Response(null, { status: 204 });
      } else if (request.method === 'GET') {
        // Admin-only browser rendering health check.
        // Returns 200 if BROWSER binding is present and accessible, 503 if not.
        if (!isAuthConfigured(env)) {
          response = new Response(
            JSON.stringify({ ok: false, error: 'Admin access is not configured.' }),
            { status: 503, headers: { 'content-type': 'application/json' } }
          );
        } else if (!(await isAuthorized(request, env))) {
          response = new Response(
            JSON.stringify({ ok: false, error: 'Forbidden.' }),
            { status: 403, headers: { 'content-type': 'application/json' } }
          );
        } else if (!env.BROWSER) {
          response = new Response(
            JSON.stringify({ ok: false, error: 'BROWSER binding not configured. Ensure [browser] is set in wrangler.toml and the account has Browser Rendering enabled.' }),
            { status: 503, headers: { 'content-type': 'application/json' } }
          );
        } else {
          response = new Response(
            JSON.stringify({ ok: true, binding: 'BROWSER', message: 'Cloudflare Browser Rendering binding is present.' }),
            { status: 200, headers: { 'content-type': 'application/json' } }
          );
        }
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
    } else {
      response = await env.ASSETS.fetch(request);

      const contentType = response.headers.get('content-type');

      // Safety guard: if ASSETS returns an empty or untyped response for an HTML
      // navigation request, return a 503 instead of a 0-byte download.
      // HEAD requests legitimately have no body — skip the check for them.
      if (
        response.status === 200 &&
        request.method !== 'HEAD' &&
        isHtmlNavigationRequest(request, url) &&
        (!contentType || contentType.trim() === '')
      ) {
        response = new Response('Service temporarily unavailable — assets not deployed correctly.', {
          status: 503,
          headers: { 'content-type': 'text/plain; charset=utf-8' },
        });
      }

      // If ASSETS returns 404 for an HTML navigation, dist/ is incomplete or the
      // page genuinely doesn't exist — return a proper response instead of
      // Cloudflare's raw default 404 page.
      if (response.status === 404 && isHtmlNavigationRequest(request, url)) {
        response = new Response('Page not found.', {
          status: 404,
          headers: { 'content-type': 'text/html; charset=utf-8' },
        });
      }
    }

    response = applyCSP(response);
    return applyRobotsTag(response, url.hostname, env.CANONICAL_DOMAIN);
  },

  /**
   * Queue consumer — processes batches from the `email-queue` Cloudflare Queue.
   *
   * Activated when `[[queues.consumers]]` is configured in `wrangler.toml`.
   * Each message is an `EmailQueueMessage` envelope containing a template name,
   * recipient, and render parameters.  The consumer renders and delivers the
   * email, writes a dedup key to `EMAIL_DEDUP_KV`, and ACKs on success.
   * Transient failures call `message.retry()` — messages exceeding `max_retries`
   * are automatically routed to the `email-dlq` dead letter queue.
   *
   * @see functions/queues/emailConsumer.ts — consumer implementation
   * @see https://developers.cloudflare.com/queues/
   */
  async queue(
    batch: MessageBatch<EmailQueueMessage>,
    env: Env,
  ): Promise<void> {
    return handleEmailQueue(batch, env);
  },
} satisfies ExportedHandler<Env, EmailQueueMessage>;
