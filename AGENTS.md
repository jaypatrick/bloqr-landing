# AGENTS.md — Bloqr Landing

Authoritative guide for AI agents working in this repository. Read this before
making changes, running commands, or generating content.

---

## Project Overview

**Bloqr** is an AI-powered DNS filter list compiler and real-time threat
intelligence service. This repo is the **marketing landing site** — a static
Astro site served via a Cloudflare Worker with static assets.

| Field           | Value                                                         |
| --------------- | ------------------------------------------------------------- |
| Product tagline | "Good Internet Hygiene. Automated."                           |
| Repo            | `adblock-compiler.landing` (`bloqr-landing`)                  |
| Owner           | `jaypatrick`                                                  |
| Default branch  | `main`                                                        |
| Deploy target   | Cloudflare Workers with static assets                         |
| Production URL  | `https://adblock-landing.jayson-knight.workers.dev` → `bloqr.ai` TBD |

---

## Tech Stack

| Layer          | Technology                                             |
| -------------- | ------------------------------------------------------ |
| Framework      | Astro 5 (`output: 'static'`)                           |
| Components     | Svelte 5 (runes syntax)                                |
| Language       | TypeScript (strict mode)                               |
| Styling        | Plain CSS + CSS custom properties (`src/styles/global.css`) |
| Edge runtime   | Cloudflare Worker (`src/worker.ts`) + handler modules in `functions/` |
| Database       | Neon Postgres (waitlist signups)                       |
| CRM            | Apollo.io (contact enrichment, fire-and-forget)        |
| Fonts          | JetBrains Mono (code) + Space Grotesk (UI)             |

---

## Directory Structure

```
.
├── astro.config.mjs          # Astro + Svelte integration, CSP headers, static output
├── wrangler.toml             # Cloudflare Worker config: name, assets dir, entry point
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
│   ├── waitlist.ts           # handlePost/handleOptions for POST /waitlist
│   ├── config.ts             # handleGet for GET /config
│   └── admin/
│       ├── config.ts         # handlePost for POST /admin/config
│       └── blog.ts           # handleGet/handlePost/handlePut for /admin/blog
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
    ├── worker.ts             # Cloudflare Worker entry point — routes all requests
    ├── config.ts             # SITE_URL, LINKS, META — single source of truth
    ├── env.d.ts              # Astro environment type declarations
    │
    ├── components/           # Svelte 5 components, one per landing page section
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
    │   ├── Nav.svelte
    │   └── Footer.svelte
    │
    ├── content/
    │   ├── config.ts         # Astro content collection schema
    │   └── blog/             # Blog posts as Markdown (slug = filename)
    │
    ├── pages/                # File-based routing
    │   ├── index.astro       # Main landing page
    │   ├── about.astro
    │   ├── changelog.astro
    │   ├── vpn-myths.astro
    │   ├── rss.xml.ts        # RSS feed
    │   └── blog/
    │       ├── index.astro
    │       └── [slug].astro
    │
    └── styles/
        └── global.css        # Global resets, base styles, and shared :root design tokens
```

---

## Commands

| Command             | Description                                                               |
| ------------------- | ------------------------------------------------------------------------- |
| `npm install`       | Install dependencies                                                      |
| `npm run dev`       | Astro dev server (HMR for the static site; does not emulate CF runtime)   |
| `npm run build`     | Build static output to `dist/`                                            |
| `npm run preview`   | Wrangler dev server for local Cloudflare runtime/functions testing        |
| `npm run astro ...` | Astro CLI passthrough                                                     |

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
- Read secrets from the `env` binding passed by CF, **not** `process.env`.
- Always set `Content-Type: application/json` and return correct HTTP status codes.

### Blog / Content Collections

- Posts live in `src/content/blog/` as Markdown.
- Frontmatter must match the schema defined in `src/content/config.ts`.
- Slug is derived automatically from the filename.

---

## Brand Voice — Quick Reference

Full detail: `brand/BLOQR_DESIGN_LANGUAGE.md` → _Voice & Tone Guidelines_

### Core Mantras

| Mantra                             | Context                             |
| ---------------------------------- | ----------------------------------- |
| "Set it. Bloqr it. Forget it."     | Consumer promise — zero maintenance |
| "Bring your own. Or use ours."     | Vendor philosophy — no lock-in      |
| "Good internet habits. Automated." | Tagline — applies to all personas   |
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

Merging to `main` triggers a Cloudflare Worker deployment automatically.

Worker entrypoint: `src/worker.ts`  
Deploy command: `npm run deploy`  
Build command: `npm run build`

To deploy manually:

```bash
npm run deploy
```

---

## References

- `brand/BLOQR_DESIGN_LANGUAGE.md` — product strategy, personas, page architecture, voice
- `brand/BLOQR_ETHOS.md` — privacy philosophy, core promises, origin story
- `brand/tokens.css` — design token reference (values are mirrored in `src/styles/global.css`)
- `src/styles/global.css` — active CSS custom properties used by all components
- `src/config.ts` — canonical URLs, links, and site metadata
