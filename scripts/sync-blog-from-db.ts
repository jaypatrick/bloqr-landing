/**
 * scripts/sync-blog-from-db.ts
 *
 * Reads blog posts from Neon PostgreSQL and writes them to
 * src/content/blog/*.md files for Astro's static build.
 *
 * Run: npx tsx scripts/sync-blog-from-db.ts
 *
 * Requires DATABASE_URL to be set in the environment.
 */

import { neon } from '@neondatabase/serverless';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = join(__dirname, '..', 'src', 'content', 'blog');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required.');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

interface BlogPostRow {
  slug:         string;
  title:        string;
  description:  string;
  content:      string;
  pub_date:     string;
  updated_date: string | null;
  author:       string;
  category:     string;
  tags:         string[];
  draft:        boolean;
  og_image:     string | null;
}

function buildFrontmatter(post: BlogPostRow): string {
  const lines = [
    '---',
    `title: ${JSON.stringify(post.title)}`,
    `description: ${JSON.stringify(post.description)}`,
    `pubDate: ${new Date(post.pub_date).toISOString().slice(0, 10)}`,
  ];

  if (post.updated_date) {
    lines.push(`updatedDate: ${new Date(post.updated_date).toISOString().slice(0, 10)}`);
  }

  lines.push(`author: ${JSON.stringify(post.author)}`);
  lines.push(`category: ${JSON.stringify(post.category)}`);
  lines.push(`tags: [${post.tags.map((t) => JSON.stringify(t)).join(', ')}]`);
  lines.push(`draft: ${post.draft}`);

  if (post.og_image) {
    lines.push(`image: ${JSON.stringify(post.og_image)}`);
  }

  lines.push('---');
  return lines.join('\n');
}

async function syncPosts() {
  console.log('Syncing blog posts from Neon to src/content/blog/…');

  const posts = await sql<BlogPostRow[]>`
    SELECT slug, title, description, content, pub_date, updated_date,
           author, category, tags, draft, og_image
    FROM blog_posts
    ORDER BY pub_date DESC
  `;

  mkdirSync(BLOG_DIR, { recursive: true });

  let count = 0;
  for (const post of posts) {
    const frontmatter = buildFrontmatter(post);
    const fileContent = `${frontmatter}\n\n${post.content}\n`;
    const filePath = join(BLOG_DIR, `${post.slug}.md`);
    writeFileSync(filePath, fileContent, 'utf-8');
    console.log(`  ✓ ${post.slug}.md`);
    count++;
  }

  console.log(`\nSynced ${count} post(s) to ${BLOG_DIR}`);
}

syncPosts().catch((err) => {
  console.error('Sync failed:', err);
  process.exit(1);
});
