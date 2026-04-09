# Bloqr — Landing Page

Astro 6 + Svelte 5 marketing landing site, deployed as a Cloudflare Worker with static assets.

## Stack

- **Framework**: [Astro 6](https://astro.build) (`output: 'server'` + `@astrojs/cloudflare` adapter; all pages prerendered)
- **Components**: [Svelte 5](https://svelte.dev) (runes syntax — `$state`, `$props`, `$derived`)
- **Deployment**: [Cloudflare Workers](https://workers.cloudflare.com) via `wrangler deploy`
- **Fonts**: Space Grotesk + JetBrains Mono — self-hosted via the [Astro 6 Fonts API](https://docs.astro.build/en/guides/fonts/) (`fontProviders.fontsource()`)
- **CSP**: Inline scripts/styles auto-hashed (SHA-256) by `security.csp`; enforced at the edge by `applyCSP()` in `src/worker.ts`
- **Code highlighting**: Shiki 4 dual themes (`houston` dark / `vitesse-light` light) with `defaultColor: false` — outputs CSS custom properties via inline `style` attributes; `style-src` must allow inline styles for code blocks to render

## Requirements

- **Node.js ≥ 22.12.0** — required by Astro 6 and Wrangler v4. Node.js 22 LTS is used in CI.

## Quick start

```bash
npm install
npm run dev          # Astro dev server — http://localhost:4321
npm run build        # Produces ./dist/
npm run preview      # wrangler dev (full Worker + static assets, requires .dev.vars)
npm run deploy       # astro build && wrangler deploy
```

> `npm run dev` is best for fast UI iteration with HMR.  
> `npm run preview` emulates the full Cloudflare Worker runtime and is required for testing API routes and auth flows. Copy `.dev.vars.example` → `.dev.vars` and fill in your local secrets before running preview.

## Structure

```
src/
├── worker.ts             # Cloudflare Worker entry point — routes all requests + injects CSP headers
├── config.ts             # SITE_URL, LINKS, META — single source of truth for all URLs
├── content.config.ts     # Astro 6 Content Layer API — blog (glob loader) + changelog (live loader)
├── pages/
│   ├── index.astro       # Main landing page
│   ├── about.astro
│   ├── blog/
│   │   ├── index.astro   # Blog listing (Font API tags included directly — no BaseHead)
│   │   └── [slug].astro  # Blog post (Font API tags included directly — no BaseHead)
│   ├── changelog.astro   # Renders live `changelog` collection (fetched from GitHub at build time)
│   └── ...
├── components/
│   ├── BaseHead.astro    # Shared <head> block — includes Fonts API <Font> tags, CSP meta, analytics
│   ├── Nav.svelte
│   ├── Hero.svelte
│   └── ...
└── styles/
    └── global.css        # Design tokens (:root), global resets, Shiki CSS variable mappings
                          # --font-display / --font-mono fallbacks defined here; Fonts API overrides them

brand/
├── logo.svg
├── tokens.css            # Design token reference (values mirrored in src/styles/global.css)
├── BLOQR_DESIGN_LANGUAGE.md
└── BLOQR_ETHOS.md
```

## Cloudflare Worker deployment

The site uses `output: 'server'` with the `@astrojs/cloudflare` adapter. Every page has `export const prerender = true`, so all HTML is statically generated at build time. The Worker serves static HTML from the ASSETS binding and handles dynamic API routes:

| Route | Handler |
|---|---|
| `POST /waitlist` | Neon insert + Apollo.io contact sync |
| `GET /config` | Public site config reader |
| `POST /admin/config` | Site config writer (auth required) |
| `GET/POST/PUT /admin/blog` | Blog post CRUD (auth required) |
| `GET/POST /api/auth/*` | Better Auth (GitHub OAuth SSO) |
| `*` | `env.ASSETS.fetch(request)` — static site |

All HTML responses get a `Content-Security-Policy` header injected by `applyCSP()` in `src/worker.ts`.

## Content Layer API

Blog posts live in `src/content/blog/` as Markdown. The `changelog` collection uses a custom async loader that fetches `CHANGELOG.md` from the upstream GitHub repo at build time and parses it into structured, typed entries. See `src/content.config.ts`.

## Brand reference

See `brand/BLOQR_DESIGN_LANGUAGE.md` for voice, personas, and page architecture.  
See `brand/tokens.css` for the full design token spec.  
The authoritative guide for AI agents working in this repo is `AGENTS.md`.
