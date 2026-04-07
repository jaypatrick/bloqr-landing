/**
 * functions/admin/blog.ts — GET/POST/PUT /admin/blog handler
 *
 * Manages blog posts stored in Neon PostgreSQL.
 * Requires: Authorization: Bearer <ADMIN_SECRET>
 *
 * GET  /admin/blog  → list all posts (no auth required for listing)
 * POST /admin/blog  → create new post (bearer auth)
 * PUT  /admin/blog  → update existing post by id (bearer auth)
 *
 * Exported as plain functions for import by src/worker.ts.
 */

import { neon } from '@neondatabase/serverless';
import { BlogPostSchema } from '../../src/lib/blog-post-schema';

export interface Env {
  DATABASE_URL: string;
  ADMIN_SECRET: string;
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

function isAuthorized(request: Request, env: Env): boolean {
  const authHeader = request.headers.get('Authorization') ?? '';
  const [scheme, token] = authHeader.split(' ');
  return scheme === 'Bearer' && token === env.ADMIN_SECRET;
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

export async function handleGet(_request: Request, env: Env): Promise<Response> {
  if (!env.DATABASE_URL) {
    return json({ error: 'Service unavailable.' }, 503);
  }

  const sql = neon(env.DATABASE_URL);

  try {
    const rows = await sql`
      SELECT
        id, slug, title, description, pub_date, updated_date,
        author, category, tags, draft, og_image, created_at
      FROM blog_posts
      ORDER BY pub_date DESC
    `;
    return json(rows);
  } catch (err) {
    console.error('GET /admin/blog error:', err);
    return json({ error: 'Failed to fetch posts.' }, 500);
  }
}

export async function handlePost(request: Request, env: Env): Promise<Response> {
  if (!env.ADMIN_SECRET) {
    return json({ error: 'Admin access is not configured.' }, 503);
  }
  if (!isAuthorized(request, env)) {
    return json({ error: 'Forbidden.' }, 403);
  }
  if (!env.DATABASE_URL) {
    return json({ error: 'Service unavailable.' }, 503);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON.' }, 400);
  }

  const parsed = BlogPostSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: 'Validation failed.', details: parsed.error.flatten() }, 400);
  }

  const post = parsed.data;
  const sql = neon(env.DATABASE_URL);

  try {
    const rows = await sql`
      INSERT INTO blog_posts
        (slug, title, description, content, pub_date, updated_date, author, category, tags, draft, og_image)
      VALUES
        (${post.slug}, ${post.title}, ${post.description}, ${post.content},
         ${post.pubDate.toISOString()}, ${post.updatedDate?.toISOString() ?? null},
         ${post.author}, ${post.category}, ${post.tags}, ${post.draft}, ${post.image ?? null})
      RETURNING id, slug
    `;
    return json({ success: true, id: rows[0].id, slug: rows[0].slug }, 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('unique')) {
      return json({ error: `A post with slug "${post.slug}" already exists.` }, 409);
    }
    console.error('POST /admin/blog error:', err);
    return json({ error: 'Failed to create post.' }, 500);
  }
}

export async function handlePut(request: Request, env: Env): Promise<Response> {
  if (!env.ADMIN_SECRET) {
    return json({ error: 'Admin access is not configured.' }, 503);
  }
  if (!isAuthorized(request, env)) {
    return json({ error: 'Forbidden.' }, 403);
  }
  if (!env.DATABASE_URL) {
    return json({ error: 'Service unavailable.' }, 503);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON.' }, 400);
  }

  if (typeof body !== 'object' || body === null || !('id' in body)) {
    return json({ error: 'id is required for updates.' }, 400);
  }

  const { id, ...rest } = body as { id: string; [key: string]: unknown };

  const parsed = BlogPostSchema.partial().safeParse(rest);
  if (!parsed.success) {
    return json({ error: 'Validation failed.', details: parsed.error.flatten() }, 400);
  }

  const post = parsed.data;
  const sql = neon(env.DATABASE_URL);

  try {
    const rows = await sql`
      UPDATE blog_posts
      SET
        slug         = COALESCE(${post.slug ?? null}, slug),
        title        = COALESCE(${post.title ?? null}, title),
        description  = COALESCE(${post.description ?? null}, description),
        content      = COALESCE(${post.content ?? null}, content),
        pub_date     = COALESCE(${post.pubDate?.toISOString() ?? null}, pub_date),
        updated_date = COALESCE(${post.updatedDate?.toISOString() ?? null}, updated_date),
        author       = COALESCE(${post.author ?? null}, author),
        category     = COALESCE(${post.category ?? null}, category),
        tags         = COALESCE(${post.tags ?? null}, tags),
        draft        = COALESCE(${post.draft ?? null}, draft),
        og_image     = COALESCE(${post.image ?? null}, og_image)
      WHERE id = ${id}
      RETURNING id, slug
    `;
    if (!rows.length) {
      return json({ error: `No post found with id: ${id}` }, 404);
    }
    return json({ success: true, id: rows[0].id, slug: rows[0].slug });
  } catch (err) {
    console.error('PUT /admin/blog error:', err);
    return json({ error: 'Failed to update post.' }, 500);
  }
}
