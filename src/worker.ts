/**
 * Cloudflare Worker entry point
 *
 * Routes:
 *   POST    /waitlist      → waitlist handler (Neon insert + Apollo sync)
 *   OPTIONS /waitlist      → CORS preflight
 *   GET     /config        → site_config reader (public, cached)
 *   OPTIONS /config        → CORS preflight
 *   POST    /admin/config  → site_config writer (requires ADMIN_SECRET)
 *   OPTIONS /admin/config  → CORS preflight
 *   *                      → env.ASSETS.fetch(request) (static site)
 */

import { handleOptions as waitlistOptions, handlePost as waitlistPost, type Env as WaitlistEnv } from '../functions/waitlist';
import { handleOptions as configGetOptions, handleGet as configGet, type Env as ConfigGetEnv } from '../functions/config';
import { handleOptions as configPostOptions, handlePost as configPost, type Env as ConfigPostEnv } from '../functions/admin/config';

interface Env extends WaitlistEnv, ConfigGetEnv, ConfigPostEnv {
  ASSETS: Fetcher;
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
      if (request.method === 'OPTIONS') return configGetOptions();
      if (request.method === 'GET')     return configGet(request, env);
      return new Response('Method Not Allowed', { status: 405 });
    }

    if (url.pathname === '/admin/config') {
      if (request.method === 'OPTIONS') return configPostOptions();
      if (request.method === 'POST')    return configPost(request, env);
      return new Response('Method Not Allowed', { status: 405 });
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
