/**
 * Cloudflare Worker entry point
 *
 * Routes:
 *   POST    /waitlist      → waitlist handler (Neon insert + Apollo sync)
 *   OPTIONS /waitlist      → CORS preflight
 *   GET     /config        → returns all site_config rows as { key: value } JSON
 *   OPTIONS /config        → CORS preflight
 *   POST    /admin/config  → updates a single site_config row (requires Authorization: Bearer)
 *   OPTIONS /admin/config  → CORS preflight
 *   *                      → env.ASSETS.fetch(request)  (static site)
 */

import { handleOptions as waitlistOptions, handlePost as waitlistPost, type Env as WaitlistEnv } from '../functions/waitlist';
import { handleGet as configGet, handleOptions as configOptions, type Env as ConfigEnv } from '../functions/config';
import { handlePost as adminConfigPost, handleOptions as adminConfigOptions, type Env as AdminConfigEnv } from '../functions/admin/config';

interface Env extends WaitlistEnv, ConfigEnv, AdminConfigEnv {
  ASSETS: Fetcher;    // Static assets binding (auto-injected by Workers runtime)
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/waitlist') {
      if (request.method === 'OPTIONS') return waitlistOptions();
      if (request.method === 'POST')    return waitlistPost(request, env, ctx);
      return new Response('Method Not Allowed', { status: 405 });
    }

    if (url.pathname === '/config') {
      if (request.method === 'OPTIONS') return configOptions();
      if (request.method === 'GET')     return configGet(request, env);
      return new Response('Method Not Allowed', { status: 405 });
    }

    if (url.pathname === '/admin/config') {
      if (request.method === 'OPTIONS') return adminConfigOptions();
      if (request.method === 'POST')    return adminConfigPost(request, env);
      return new Response('Method Not Allowed', { status: 405 });
    }

    // Serve static assets for everything else
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;

