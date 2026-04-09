import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// ── Blog ──────────────────────────────────────────────────────────────────────
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title:       z.string(),
    description: z.string(),
    pubDate:     z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author:      z.string().default('Bloqr Team'),
    category:    z.enum(['education', 'industry', 'release']),
    tags:        z.array(z.string()).default([]),
    draft:       z.boolean().default(false),
    image:       z.string().optional(),
  }),
});

// ── Changelog ──────────────────────────────────────────────────────────────���──
// Fetches CHANGELOG.md from adblock-compiler at build time and parses it into
// typed entries via the Astro 6 Content Layer API loader object signature.
// Uses the { load(ctx) } object form so Astro treats it as a custom loader
// (not the simpleLoader/glob path) and calls store.set() directly.
const CHANGELOG_URL =
  'https://raw.githubusercontent.com/jaypatrick/adblock-compiler/main/CHANGELOG.md';

function parseChangelog(raw: string) {
  const lines = raw.split('\n');
  const sections: Array<{ version: string; date: string | null; content: string }> = [];
  let current: { version: string; date: string | null; content: string } | null = null;
  let bodyLines: string[] = [];
  const versionRe = /^## \[(.+?)\](?:\s+-\s+(\d{4}-\d{2}-\d{2}))?/;

  for (const line of lines) {
    const match = line.match(versionRe);
    if (match) {
      if (current) {
        current.content = bodyLines.join('\n').trim();
        sections.push(current);
      }
      current = { version: match[1], date: match[2] ?? null, content: '' };
      bodyLines = [];
    } else if (current) {
      bodyLines.push(line);
    }
  }
  if (current) {
    current.content = bodyLines.join('\n').trim();
    sections.push(current);
  }

  // Exclude [Unreleased] entirely — no date, work-in-progress content.
  return sections.filter(s => s.version !== 'Unreleased');
}

const changelog = defineCollection({
  // Object loader form: Astro calls load(ctx) and we use ctx.store.set()
  // to populate entries. This avoids the simpleLoader path that expects
  // file-based entries with frontmatter.
  loader: {
    name: 'changelog-loader',
    load: async (ctx) => {
      // Clear stale entries from previous builds so removed/renamed versions don't persist.
      ctx.store.clear();

      let raw = '';
      try {
        const res = await fetch(CHANGELOG_URL);
        if (res.ok) raw = await res.text();
      } catch {
        // Graceful fallback — changelog page renders empty
      }

      const sections = parseChangelog(raw).slice(0, 20);
      sections.forEach((section, idx) => {
        const id = section.version.replace(/[^a-z0-9]/gi, '-').toLowerCase();
        ctx.store.set({
          id,
          data: {
            version:  section.version,
            date:     section.date,
            isLatest: idx === 0,
            order:    idx,
            content:  section.content,
          },
        });
      });
    },
  },
  schema: z.object({
    version:  z.string(),
    date:     z.string().nullable(),
    isLatest: z.boolean(),
    order:    z.number(),
    content:  z.string(),
  }),
});

export const collections = { blog, changelog };