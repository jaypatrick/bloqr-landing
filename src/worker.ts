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
 *   POST    /api/auth/*     → Better Auth handler (all auth endpoints)
 *   GET     /api/auth/*     → Better Auth handler (session checks, OAuth callbacks)
 *   *                       → env.ASSETS.fetch(request) (static site)
 */

import { handleOptions as waitlistOptions, handlePost as waitlistPost, type Env as WaitlistEnv } from '../functions/waitlist';
import { handleOptions as configGetOptions, handleGet as configGet, type Env as ConfigGetEnv } from '../functions/config';
import { handleOptions as configPostOptions, handlePost as configPost, type Env as ConfigPostEnv } from '../functions/admin/config';
import { handleOptions as blogOptions, handleGet as blogGet, handlePost as blogPost, handlePut as blogPut, type Env as BlogEnv } from '../functions/admin/blog';
import { handleAuth, type Env as AuthEnv } from './lib/auth';

interface Env extends WaitlistEnv, ConfigGetEnv, ConfigPostEnv, BlogEnv, AuthEnv {
  ASSETS: Fetcher;
  /** Set in wrangler.toml [vars]. Used to gate X-Robots-Tag noindex on non-canonical hosts. */
  CANONICAL_DOMAIN?: string;
}

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
 * Injects a Content-Security-Policy header on HTML responses.
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
    } else {
      response = await env.ASSETS.fetch(request);
      // Safety guard: if ASSETS returns an empty or untyped response for an HTML
      // route, return a proper 503 instead of a 0-byte download.
      const contentType = response.headers.get('content-type');
      if (response.status === 200 && (!contentType || contentType.trim() === '')) {
        response = new Response('Service temporarily unavailable — assets not deployed correctly.', {
          status: 503,
          headers: { 'content-type': 'text/plain; charset=utf-8' },
        });
      }
    }

    response = applyCSP(response);
    return applyRobotsTag(response, url.hostname, env.CANONICAL_DOMAIN);
  },
} satisfies ExportedHandler<Env>;
