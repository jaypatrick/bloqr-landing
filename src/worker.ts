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
 *   GET     /admin/blog     → blog posts list (requires Better Auth session)
 *   POST    /admin/blog     → create blog post (requires Better Auth session)
 *   PUT     /admin/blog     → update blog post (requires Better Auth session)
 *   OPTIONS /admin/blog     → CORS preflight
 *   POST    /api/auth/*     → Better Auth handler (all auth endpoints)
 *   GET     /api/auth/*     → Better Auth handler (session checks, OAuth callbacks)
 *   *                       → env.ASSETS.fetch(request) (static site)
 */

import { handleOptions as waitlistOptions, handlePost as waitlistPost, type Env as WaitlistEnv } from '../functions/waitlist';
import { handleOptions as configGetOptions, handleGet as configGet, type Env as ConfigGetEnv } from '../functions/config';
import { handleOptions as configPostOptions, handlePost as configPost, type Env as ConfigPostEnv } from '../functions/admin/config';
import { handleOptions as blogAdminOptions, handleGet as blogAdminGet, handlePost as blogAdminPost, handlePut as blogAdminPut, type Env as BlogAdminEnv } from '../functions/admin/blog';
import { handleAuth, type Env as AuthEnv } from './lib/auth';

interface Env extends WaitlistEnv, ConfigGetEnv, ConfigPostEnv, BlogAdminEnv, AuthEnv {
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Better Auth — handles all /api/auth/* routes (login, logout, session, OAuth callbacks)
    if (url.pathname.startsWith('/api/auth/')) {
      return handleAuth(request, env);
    }

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

    if (url.pathname === '/admin/blog') {
      if (request.method === 'OPTIONS') return blogAdminOptions();
      if (request.method === 'GET')     return blogAdminGet(request, env);
      if (request.method === 'POST')    return blogAdminPost(request, env);
      if (request.method === 'PUT')     return blogAdminPut(request, env);
      return new Response('Method Not Allowed', { status: 405 });
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
