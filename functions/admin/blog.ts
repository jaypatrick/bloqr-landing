/**
 * functions/admin/blog.ts — /admin/blog handler
 *
 * GET    /admin/blog  → list blog posts
 * POST   /admin/blog  → create blog post
 * PUT    /admin/blog  → update blog post
 * OPTIONS /admin/blog → CORS preflight
 *
 * Auth: Better Auth session (primary) or legacy ADMIN_SECRET bearer token (fallback).
 * Exported as plain functions for import by src/worker.ts.
 */

import { neon } from '@neondatabase/serverless';
import { getSession, isAdminUser } from '../../src/lib/auth';

export interface Env {
  DATABASE_URL: string;
  ADMIN_SECRET?: string;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  BETTER_AUTH_TRUSTED_ORIGINS?: string;
}

interface BlogPost {
  id:          string;
  slug:        string;
  title:       string;
  excerpt:     string | null;
  content:     string | null;
  published:   boolean;
  created_at:  string;
  updated_at:  string;
}

interface BlogPostBody {
  slug?:      string;
  title?:     string;
  excerpt?:   string;
  content?:   string;
  published?: boolean;
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type':  'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    },
  });

/**
 * Dual-auth: Better Auth session first, legacy ADMIN_SECRET bearer as fallback.
 */
async function isAuthorized(request: Request, env: Env): Promise<boolean> {
  // 1. Try Better Auth session (the new way)
  if (env.DATABASE_URL && env.BETTER_AUTH_SECRET) {
    try {
      const session = await getSession(request, env as Parameters<typeof getSession>[1]);
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

export function handleOptions(): Response {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function handleGet(request: Request, env: Env): Promise<Response> {
  if (!env.DATABASE_URL) {
    return json({ error: 'Service unavailable.' }, 503);
  }
  if (!(await isAuthorized(request, env))) {
    return json({ error: 'Forbidden.' }, 403);
  }

  const sql = neon(env.DATABASE_URL);

  try {
    const rows = await sql<BlogPost[]>`
      SELECT id, slug, title, excerpt, content, published, created_at, updated_at
      FROM blog_posts
      ORDER BY created_at DESC
    `;
    return json({ posts: rows });
  } catch (err) {
    console.error('GET /admin/blog error:', err);
    return json({ error: 'Failed to load blog posts.' }, 500);
  }
}

export async function handlePost(request: Request, env: Env): Promise<Response> {
  if (!env.DATABASE_URL) {
    return json({ error: 'Service unavailable.' }, 503);
  }
  if (!(await isAuthorized(request, env))) {
    return json({ error: 'Forbidden.' }, 403);
  }

  let body: BlogPostBody;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON.' }, 400);
  }

  const slug    = (body.slug    ?? '').trim();
  const title   = (body.title   ?? '').trim();
  const excerpt = (body.excerpt ?? '').trim() || null;
  const content = (body.content ?? '').trim() || null;
  const published = body.published ?? false;

  if (!slug)  return json({ error: 'slug is required.' },  400);
  if (!title) return json({ error: 'title is required.' }, 400);

  const sql = neon(env.DATABASE_URL);

  try {
    const id = crypto.randomUUID();
    const rows = await sql<BlogPost[]>`
      INSERT INTO blog_posts (id, slug, title, excerpt, content, published)
      VALUES (${id}, ${slug}, ${title}, ${excerpt}, ${content}, ${published})
      RETURNING id, slug, title, excerpt, published, created_at, updated_at
    `;
    return json({ post: rows[0] }, 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return json({ error: `Slug "${slug}" already exists.` }, 409);
    }
    console.error('POST /admin/blog error:', err);
    return json({ error: 'Failed to create blog post.' }, 500);
  }
}

export async function handlePut(request: Request, env: Env): Promise<Response> {
  if (!env.DATABASE_URL) {
    return json({ error: 'Service unavailable.' }, 503);
  }
  if (!(await isAuthorized(request, env))) {
    return json({ error: 'Forbidden.' }, 403);
  }

  let body: BlogPostBody & { id?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON.' }, 400);
  }

  const id = (body.id ?? '').trim();
  if (!id) return json({ error: 'id is required.' }, 400);

  const updates: Record<string, unknown> = {};
  if (body.slug    !== undefined) updates['slug']      = body.slug.trim();
  if (body.title   !== undefined) updates['title']     = body.title.trim();
  if (body.excerpt !== undefined) updates['excerpt']   = body.excerpt.trim() || null;
  if (body.content !== undefined) updates['content']   = body.content.trim() || null;
  if (body.published !== undefined) updates['published'] = body.published;

  if (Object.keys(updates).length === 0) {
    return json({ error: 'No fields to update.' }, 400);
  }

  const sql = neon(env.DATABASE_URL);

  try {
    const rows = await sql<BlogPost[]>`
      UPDATE blog_posts
      SET
        slug      = CASE WHEN ${('slug'      in updates) as boolean} THEN ${updates['slug']      as string  ?? null} ELSE slug      END,
        title     = CASE WHEN ${('title'     in updates) as boolean} THEN ${updates['title']     as string  ?? null} ELSE title     END,
        excerpt   = CASE WHEN ${('excerpt'   in updates) as boolean} THEN ${updates['excerpt']   as string  ?? null} ELSE excerpt   END,
        content   = CASE WHEN ${('content'   in updates) as boolean} THEN ${updates['content']   as string  ?? null} ELSE content   END,
        published = CASE WHEN ${('published' in updates) as boolean} THEN ${updates['published'] as boolean ?? null} ELSE published END,
        updated_at = now()
      WHERE id = ${id}
      RETURNING id, slug, title, excerpt, published, created_at, updated_at
    `;
    if (!rows.length) {
      return json({ error: `No blog post found with id: ${id}` }, 404);
    }
    return json({ post: rows[0] });
  } catch (err) {
    console.error('PUT /admin/blog error:', err);
    return json({ error: 'Failed to update blog post.' }, 500);
  }
}
