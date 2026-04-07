/**
 * Cloudflare Worker entry point
 *
 * Routes:
 *   POST    /waitlist  → waitlist handler (Neon insert + Apollo sync)
 *   OPTIONS /waitlist  → CORS preflight
 *   *                  → env.ASSETS.fetch(request)  (static site)
 */

import { handleOptions, handlePost, type Env as WaitlistEnv } from '../functions/waitlist';

interface Env extends WaitlistEnv {
  ASSETS: Fetcher;    // Static assets binding (auto-injected by Workers runtime)
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/waitlist') {
      if (request.method === 'OPTIONS') return handleOptions();
      if (request.method === 'POST')    return handlePost(request, env);
      return new Response('Method Not Allowed', { status: 405 });
    }

    // Serve static assets for everything else
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;

