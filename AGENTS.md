# AGENTS.md — Bloqr Landing

Authoritative guide for AI agents working in this repository. Read this before
making changes, running commands, or generating content.

---

## Project Overview

**Bloqr** is an AI-powered DNS filter list compiler and real-time threat
intelligence service. This repo is the **marketing landing site** — a static
Astro site served via a Cloudflare Worker with static assets.

| Field           | Value                                                               |
| --------------- | ------------------------------------------------------------------- |
| Product tagline | "Internet Hygiene. Automated."                                  |
| Repo            | `adblock-compiler.landing` (`bloqr-landing`)                        |
| Owner           | `jaypatrick`                                                        |
| Default branch  | `main`                                                              |
| Deploy target   | Cloudflare Worker with static assets (`src/worker.ts`)              |
| Production URL  | `https://bloqr.dev` (worker: `https://adblock-landing.jk-com.workers.dev`) |

---

## Tech Stack

| Layer          | Technology                                             |
| -------------- | ------------------------------------------------------ |
| Framework      | Astro 6 (`output: 'server'` + `@astrojs/cloudflare` adapter; all pages prerendered via `export const prerender = true`) |
| Components     | Svelte 5 (runes syntax)                                |
| Language       | TypeScript (strict mode)                               |
| Styling        | Plain CSS + CSS custom properties (`src/styles/global.css`) |
| Edge runtime   | Cloudflare Worker (`src/worker.ts`) + handler modules in `functions/` |
| Database       | Neon Postgres (waitlist signups)                       |
| CRM            | Apollo.io (contact enrichment, fire-and-forget)        |
| Fonts          | Space Grotesk + JetBrains Mono — self-hosted via Astro 6 Fonts API (`fontProviders.fontsource()`) |
| CSP            | SHA-256 auto-hashing via `security.csp` (meta CSP); `applyCSP()` in `src/worker.ts` adds `frame-ancestors`/`base-uri`/`form-action` hardening headers |
| Code highlighting | Shiki 4 dual themes (`houston`/`vitesse-light`), `defaultColor:false` — CSS variable output via inline `style` attributes; style policy handled by Astro's meta CSP |

---

## Directory Structure

```
.
├── astro.config.mjs          # Astro 6 config: SSR adapter, Fonts API, CSP, Shiki dual themes, experimental features
├── wrangler.toml             # Cloudflare Worker config: name, assets dir, worker entry, nodejs_compat, secrets
├── tsconfig.json
├── package.json
│
├── brand/                    # All brand assets and guidelines (keep co-located here)
│   ├── tokens.css            # CSS design token reference (values mirrored in src/styles/global.css)
│   ├── logo.svg
│   ├── BLOQR_DESIGN_LANGUAGE.md  # Personas, voice, page architecture, product strategy
│   └── BLOQR_ETHOS.md            # Core promises, privacy philosophy, origin story
│
├── functions/                # Handler modules imported by src/worker.ts (not auto-routed)
│   ├── waitlist.ts           # POST /waitlist — writes to Neon, enriches via Apollo.io
│   ├── config.ts             # GET /config — site_config reader (public, cached)
│   ├── waitlist/
│   │   └── count.ts          # GET /waitlist/count — waitlist count handler
│   └── admin/
│       ├── config.ts         # POST /admin/config — site_config writer (requires ADMIN_SECRET)
│       └── blog.ts           # /admin/blog — blog post CRUD handler
│
├── public/                   # Static assets copied verbatim to dist/
│
├── scripts/
│   ├── gen-og.mjs            # OG image generation
│   └── setup-github.sh       # Repo initialisation utility
│
├── sessions/                 # Agent/conversation session artifacts (reference only)
│
└── src/
    ├── worker.ts             # Cloudflare Worker entry point — routes requests + injects CSP headers
    ├── config.ts             # SITE_URL, LINKS, META — single source of truth
    ├── content.config.ts     # Astro 6 Content Layer API: blog (glob loader) + changelog (live loader)
    ├── env.d.ts              # Astro environment type declarations
    │
    ├── components/           # Svelte 5 components, one per landing page section
    │   ├── BaseHead.astro    # Shared <head>: Fonts API <Font> tags, analytics, ClientRouter
    │   ├── Hero.svelte
    │   ├── Problem.svelte
    │   ├── Features.svelte
    │   ├── HowItWorks.svelte
    │   ├── Audiences.svelte
    │   ├── CodeDemo.svelte
    │   ├── Pricing.svelte
    │   ├── CtaBanner.svelte
    │   ├── WaitlistSignup.svelte
    │   ├── ComingSoon.svelte
    │   ├── DynamicWorkers.svelte
    │   ├── WhyCloudflare.svelte
    │   ├── SocialProof.svelte
    │   ├── FAQ.svelte
    │   ├── FounderNote.svelte
    │   ├── PrivacyCommitments.svelte
    │   ├── BeforeAfter.svelte
    │   ├── Nav.svelte
    │   └── Footer.svelte
    │
    ├── content/
    │   └── blog/             # Blog posts as Markdown (post ID = filename without extension)
    │
    ├── pages/                # File-based routing — all pages have `export const prerender = true`
    │   ├── index.astro       # Main landing page
    │   ├── about.astro
    │   ├── changelog.astro   # Renders live `changelog` Content Layer collection
    │   ├── vpn-myths.astro
    │   ├── why-not-private.astro
    │   ├── privacy.astro
    │   ├── terms.astro
    │   ├── rss.xml.ts        # RSS feed
    │   ├── admin/            # Protected admin pages (Better Auth SSO required)
    │   └── blog/
    │       ├── index.astro   # Blog listing (includes <Font> tags — no BaseHead)
    │       └── [slug].astro  # Blog post (includes <Font> tags — no BaseHead)
    │
    └── styles/
        └── global.css        # Design tokens (:root), global resets, Shiki CSS variable mappings
                              # --font-display / --font-mono fallbacks set here; Fonts API overrides at build time
```

---

## Commands

| Command             | Description                                                            |
| ------------------- | ---------------------------------------------------------------------- |
| `npm install`       | Install dependencies                                                   |
| `npm run dev`       | Astro dev server (HMR; uses Node.js adapter locally — does not emulate CF Worker runtime) |
| `npm run build`     | Build static output to `dist/`                                         |
| `npm run preview`   | Wrangler dev using `wrangler.toml` + `dist/` assets — includes Worker routes/functions |
| `npm run astro ...` | Astro CLI passthrough                                                  |

> Use `npm run dev` for normal Astro UI work and fast HMR. Use
> `npm run preview` when you need Cloudflare Worker runtime behaviour or
> access to local secrets from `.dev.vars` (gitignored). See below.

---

## Environment Variables

| Variable               | Local file  | CF secret | Notes                                                    |
| ---------------------- | ----------- | --------- | -------------------------------------------------------- |
| `DATABASE_URL`         | `.dev.vars` | ✅        | Neon connection string, branch-specific                  |
| `APOLLO_API_KEY`       | `.dev.vars` | ✅        | Apollo.io contact enrichment                             |
| `ADMIN_SECRET`         | `.dev.vars` | ✅        | Required for admin-protected Worker flows                |
| `BETTER_AUTH_SECRET`   | `.dev.vars` | ✅        | Better Auth signing/encryption secret                    |
| `BETTER_AUTH_URL`      | `.dev.vars` | CF env var | Base URL for Better Auth callbacks and session endpoints |
| `GITHUB_CLIENT_ID`     | `.dev.vars` | ✅        | GitHub OAuth application client ID                       |
| `GITHUB_CLIENT_SECRET` | `.dev.vars` | ✅        | GitHub OAuth application client secret                   |
| `SITE_URL`             | `.env`      | CF env var | Overrides default in `src/config.ts`                    |

**Never commit `.dev.vars` or any secret.** Use `.dev.vars.example` as the
committed template, then copy it locally to `.dev.vars` for `npm run preview`.
Only `.dev.vars.example` belongs in Git; `.dev.vars` must remain untracked.

If a `.dev.vars` file is ever found tracked in the repository, immediately
remove it from the index (`git rm --cached .dev.vars`), purge it from Git
history using `git filter-repo` or BFG Repo-Cleaner, rotate every secret that
was exposed, and recreate `.dev.vars` locally from `.dev.vars.example`.

### Neon branch → `DATABASE_URL` mapping

| Branch       | Neon endpoint                           |
| ------------ | --------------------------------------- |
| `production` | `ep-winter-term-a8rxh2a9-pooler`        |
| `staging`    | `ep-polished-resonance-a8mefek3-pooler` |
| `dev/jayson` | `ep-round-recipe-a8b3d3bd-pooler`       |

---

## Key Patterns & Conventions

### URLs and Metadata

**Always import from `src/config.ts`** — never inline URLs or strings.

```ts
import { SITE_URL, LINKS, META } from "../config";
```

`LINKS` includes `app`, `github`, `docs`, `api`, `jsr`, `author`, and all
internal page paths.

### Svelte Components

- Svelte 5 runes only: `$props()`, `$state()`, `$derived()`, `$effect()`.
- Do **not** use Svelte 4 `export let` syntax.
- Scoped `<style>` block per component.
- Use `var(--token-name)` from `src/styles/global.css` for all design values —
  never hardcode colours, spacing, or font sizes.

### CSS

- All design tokens are defined as CSS custom properties in `src/styles/global.css`
  (the `:root` block). The `brand/tokens.css` file is the design reference, but
  the variables actually used by components come from `global.css`.
- Class names: BEM-adjacent descriptive names (`.hero__title`, `.features__grid`).
- Do **not** introduce Tailwind, UnoCSS, or any utility-class framework.

### TypeScript

- Strict mode is on — no `// @ts-ignore`.
- Prefer `const`; use explicit type annotations for function parameters.
- Use `unknown` + type narrowing instead of `any`.

### Cloudflare Worker Routing

- All API routes are wired in `src/worker.ts` — add new endpoints there to make
  them reachable. Handler files in `functions/*.ts` are imported by the Worker,
  not auto-routed by Cloudflare.
- Keep handlers thin: validate input → write to service → return `Response`.
- Read secrets from the `env` binding passed by the Worker, **not** `process.env`.
- Always set `Content-Type: application/json` and return correct HTTP status codes.
- `applyCSP()` in `src/worker.ts` injects a `Content-Security-Policy` header on every `text/html` response. It sets `frame-ancestors 'none'`, `base-uri 'self'`, and `form-action 'self'`, and deliberately does **not** set `style-src` or `script-src` — those are left to Astro's auto-generated hash-based meta CSP (`security.csp`). Inline style allowances for Shiki are handled at the document level, not in the Worker header.
- `wrangler.toml` sets `compatibility_flags = ["nodejs_compat"]` — required by `better-auth`'s `node:async_hooks` import. Do not remove this flag.

### Astro 6 Fonts API

- Fonts are declared in `astro.config.mjs` (`fonts: [...]`) using `fontProviders.fontsource()`.
- The `<Font cssVariable="--font-display" preload />` and `<Font cssVariable="--font-mono" preload />` components (from `astro/components/Font.astro`) inject `@font-face` rules, `<link rel="preload">` tags, and the CSS custom property assignments at build time.
- `BaseHead.astro` includes these `<Font>` tags. Pages with a **custom `<head>`** (currently `blog/index.astro` and `blog/[slug].astro`) must include the `Font` import and tags directly.
- `src/styles/global.css` defines `--font-display: system-ui, sans-serif` and `--font-mono: monospace` as fallbacks in `:root`. The Fonts API overrides these with the hashed font stacks. Never hardcode a font family; always use `var(--font-display)` or `var(--font-mono)`.

### Astro Compiler and Caching

- `astro.config.mjs` enables `experimental.rustCompiler: true` (uses `@astrojs/compiler-rs` for faster `.astro` compilation) and `experimental.queuedRendering: { enabled: true, contentCache: true }` (batches rendering tasks and caches content collection queries). Do **not** add `experimental.routeRules` — it has no effect since pages are served via `env.ASSETS.fetch()` in `src/worker.ts`, bypassing adapter route rule evaluation.
- Route caching is handled in the Cloudflare Worker layer, not via Astro route rules. If caching behaviour changes, update the Worker implementation and its documentation rather than `astro.config.mjs`.
### Blog / Content Collections

- The content config is at `src/content.config.ts` (project root) — **not** `src/content/config.ts`.
- Blog posts live in `src/content/blog/` as Markdown files. Frontmatter must match the schema defined in `src/content.config.ts`.
- In Astro 6, blog post identifiers use `post.id` (not `post.slug`). The ID is the filename without the `.md` extension.
- The `changelog` collection uses a custom async loader that fetches `CHANGELOG.md` from the upstream GitHub repo at build time. It is an Astro 6 **live content collection** — external data consumed through the Content Layer API with full type-safety and Astro's content cache.
- Use `getCollection('blog')` / `getCollection('changelog')` to query collections in page frontmatter.

---

## Brand Voice — Quick Reference

Full detail: `brand/BLOQR_DESIGN_LANGUAGE.md` → _Voice & Tone Guidelines_

### Core Mantras

| Mantra                             | Context                             |
| ---------------------------------- | ----------------------------------- |
| "Set it. Bloqr it. Forget it."     | Consumer promise — zero maintenance |
| "Bring your own. Or use ours."     | Vendor philosophy — no lock-in      |
| "Internet Hygiene. Automated."     | Tagline — applies to all personas   |
| "Browsing Hygiene"                 | Our coined concept — not "security" |

### Write

- Short declarative sentences.
- Specific verifiable numbers ("48,291 rules" not "thousands of rules").
- "You"-focused copy — what the reader gains.
- Honest caveats for features not yet shipped ("We're building this").

### Do Not Write

- "Leveraging", "seamlessly", "best-in-class", "enterprise-grade", "game-changing".
- Passive voice when active is possible.
- "Privacy" and "anonymity" interchangeably — they mean different things here.

### The Four Personas

| #   | Persona     | Who They Are                                        |
| --- | ----------- | --------------------------------------------------- |
| 1   | Beneficiary | Everyday consumer — no DNS knowledge, one-switch UX |
| 2   | Pilot       | Power user — self-hosted DNS, technically literate  |
| 3   | Builder     | Developer / list maker — API, library, CLI user     |
| 4   | Ally        | DNS vendor / partner (AdGuard, NextDNS, Pi-hole)    |

When writing copy, identify which persona is addressed and match the voice.
Full persona profiles are in `brand/BLOQR_DESIGN_LANGUAGE.md`.

---

## Sensitive Areas — Do Not Get These Wrong

| Topic                    | Rule                                                                                         |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| AI vs. list makers       | AI complements human curation — never frames it as a replacement                             |
| DNS vendor relationships | Bloqr is infrastructure that augments every vendor — never adversarial                       |
| Privacy vs. anonymity    | Bloqr improves privacy (data exposure control), not anonymity (identity hiding)              |
| AI opt-in                | Features using personal data must be explicitly opt-in — not buried in a privacy policy      |
| Code on landing page     | Code blocks are intentional and accessible — always pair with "you never need to write this" |

---

## Deployment

Merging to `main` triggers a Cloudflare Worker deployment automatically via CI.

Worker entrypoint: `src/worker.ts`  
Deploy command: `npm run deploy`  
Static assets (ASSETS binding): `./dist/client/` — Worker bundle: `./dist/server/`  
Build command: `npm run build`

To deploy manually:

```bash
npm run deploy   # astro build && wrangler deploy
```

---

## ⚠️ Critical: Cloudflare Dashboard Is Dangerous

**NEVER add, edit, or delete variables or secrets in the Cloudflare Workers dashboard for adblock-landing.**

Doing so creates a new Worker version with **NO static assets** — the ASSETS binding becomes empty and every request returns "Page not found" immediately. The Worker code is present but `env.ASSETS.fetch()` has nothing to serve.

This is not a bug; it is how Cloudflare Workers works: assets are only attached to a Worker version during a `wrangler deploy` upload. A dashboard-only change (add/edit/delete variable or secret) creates a new version that inherits the Worker script but carries zero assets.

### Safe alternatives

- **To change plain vars** (`ENVIRONMENT`, `CANONICAL_DOMAIN`, `PUBLIC_POSTHOG_KEY`, etc.): edit `wrangler.toml` `[vars]` and merge to `main` — CI will deploy with assets attached.
- **To add or rotate secrets**: use the CLI only — this updates the secret value without creating an asset-less version:
  ```bash
  wrangler secret put SECRET_NAME
  ```

### Emergency recovery

If the dashboard was used accidentally and the site is broken:

1. CF dashboard → **adblock-landing** → **Deployments**
2. Find the last entry labelled **"Manually deployed"** — that is what Cloudflare calls a `wrangler deploy` from CI (as opposed to a dashboard-only change)
3. Click `...` → **Rollback**
4. Re-run CI (`main` branch) to restore the latest code with assets attached

### Where each config value lives

| Variable               | Lives in              | How to change                                 |
| ---------------------- | --------------------- | --------------------------------------------- |
| `ENVIRONMENT`          | `wrangler.toml [vars]` | Edit file, push to main                      |
| `CANONICAL_DOMAIN`     | `wrangler.toml [vars]` | Edit file, push to main                      |
| `PUBLIC_POSTHOG_KEY`   | `wrangler.toml [vars]` | Edit file, push to main                      |
| `DATABASE_URL`         | CF secret             | `wrangler secret put DATABASE_URL`            |
| `APOLLO_API_KEY`       | CF secret             | `wrangler secret put APOLLO_API_KEY`          |
| `ADMIN_SECRET`         | CF secret             | `wrangler secret put ADMIN_SECRET`            |
| `BETTER_AUTH_SECRET`   | CF secret             | `wrangler secret put BETTER_AUTH_SECRET`      |
| `BETTER_AUTH_URL`      | CF secret             | `wrangler secret put BETTER_AUTH_URL`         |
| `GITHUB_CLIENT_ID`     | CF secret             | `wrangler secret put GITHUB_CLIENT_ID`        |
| `GITHUB_CLIENT_SECRET` | CF secret             | `wrangler secret put GITHUB_CLIENT_SECRET`    |

---

## References

- `brand/BLOQR_DESIGN_LANGUAGE.md` — product strategy, personas, page architecture, voice
- `brand/BLOQR_ETHOS.md` — privacy philosophy, core promises, origin story
- `brand/tokens.css` — design token reference (values are mirrored in `src/styles/global.css`)
- `src/styles/global.css` — runtime CSS custom properties used by all components
- `src/config.ts` — canonical URLs, links, and site metadata
