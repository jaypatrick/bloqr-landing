import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// ── Blog ──────────────────────────────────────────────────────────────────────
// Content Layer API with glob() loader — reads markdown from src/content/blog/
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

// ── Changelog (Live Content Collection) ──────────────────────────────────────
// Custom loader that fetches CHANGELOG.md from the adblock-compiler repo at
// build time and parses it into structured entries — one per release section.
// This is an Astro 6 "Live Content Collection" pattern: an external data
// source (GitHub raw) consumed through the Content Layer API so that the
// collection benefits from type-safety, IDE intellisense, and Astro's
// content cache layer.
const CHANGELOG_URL =
  'https://raw.githubusercontent.com/jaypatrick/adblock-compiler/main/CHANGELOG.md';

interface ChangeSection {
  version:  string;
  date:     string | null;
  isLatest: boolean;
  content:  string;
}

function parseChangelog(raw: string): ChangeSection[] {
  const lines   = raw.split('\n');
  const sections: ChangeSection[] = [];
  let current:   ChangeSection | null = null;
  let bodyLines: string[] = [];
  const versionRe = /^## \[(.+?)\](?:\s+-\s+(\d{4}-\d{2}-\d{2}))?/;

  for (const line of lines) {
    const match = line.match(versionRe);
    if (match) {
      if (current) {
        current.content = bodyLines.join('\n').trim();
        sections.push(current);
      }
      current = {
        version:  match[1],
        date:     match[2] ?? null,
        isLatest: false,
        content:  '',
      };
      bodyLines = [];
    } else if (current) {
      bodyLines.push(line);
    }
  }
  if (current) {
    current.content = bodyLines.join('\n').trim();
    sections.push(current);
  }

  // Always exclude [Unreleased] — it has no date and its content is work-in-progress.
  // isLatest is assigned after filtering so the first real versioned release gets the flag.
  const filtered = sections.filter(s => s.version !== 'Unreleased');
  if (filtered.length > 0) filtered[0].isLatest = true;
  return filtered;
}

const changelog = defineCollection({
  loader: async () => {
    let raw = '';
    try {
      const res = await fetch(CHANGELOG_URL);
      if (res.ok) raw = await res.text();
    } catch {
      // Graceful fallback — page still renders with empty collection
    }
    return parseChangelog(raw).slice(0, 20).map((section, idx) => ({
      id:   section.version.replace(/[^a-z0-9]/gi, '-').toLowerCase(),
      data: {
        version:  section.version,
        date:     section.date,
        isLatest: section.isLatest,
        order:    idx,
        content:  section.content,
      },
    }));
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