---
applyTo: "**"
---

# Bloqr Landing — GitHub Copilot Instructions

This is the marketing landing site for **Bloqr** — an AI-powered DNS filter
list compiler and real-time threat intelligence service.

- Full brand strategy and personas: `brand/BLOQR_DESIGN_LANGUAGE.md`
- Privacy philosophy and core promises: `brand/BLOQR_ETHOS.md`
- Canonical URLs, links, and site metadata: `src/config.ts`
- CSS design tokens (`:root` vars): `src/styles/global.css`

---

## Tech Stack

| Layer          | Technology                                               |
| -------------- | -------------------------------------------------------- |
| Framework      | Astro 5 — `output: 'static'`, file-based routing         |
| Components     | Svelte 5 — runes syntax (`$state`, `$props`, `$derived`) |
| Language       | TypeScript — strict mode                                 |
| Styling        | Plain CSS + CSS custom properties (`src/styles/global.css`) |
| Edge runtime   | Cloudflare Worker (`src/worker.ts`) + handlers in `functions/` |
| Database       | Neon Postgres (waitlist)                                 |

---

## Code Conventions

### General

- Import all URLs, links, and metadata from `src/config.ts` — never hardcode
  them inline in components or pages.
- `const` over `let`; explicit type annotations on function parameters.
- No `any` — use `unknown` with type narrowing.
- TypeScript strict mode is configured; do not add `// @ts-ignore`.

### Svelte Components

- **Use Svelte 5 runes.** The correct syntax is:
  ```svelte
  <script lang="ts">
    let { label, count = 0 } = $props<{ label: string; count?: number }>();
    let doubled = $derived(count * 2);
  </script>
  ```
- Do **not** use Svelte 4 `export let` props, `$:` reactive declarations,
  or writable stores for local component state.
- Keep styles in the component's `<style>` block (scoped by default).
- Use `var(--token-name)` from `src/styles/global.css` for **all** colours,
  spacing, and typography values — never hardcode hex or rgb values.
- One component = one major landing page section. Create sub-components
  for patterns repeated within a section, not across sections.

### CSS

- Design tokens are defined as CSS custom properties in `src/styles/global.css`
  (the `:root` block). The `brand/tokens.css` file is the design reference, but
  the variables actually used by components come from `global.css`.
- Class naming convention: BEM-adjacent, descriptive names
  (`.hero__subtitle`, `.features__card`, `.nav__link--active`).
- Do **not** introduce Tailwind, UnoCSS, or any utility-class framework.
- Media query breakpoints should use the token values already established
  in `src/styles/global.css`.

### Astro Pages

- Pages live in `src/pages/` — Astro derives routes from filenames.
- Set `<head>` metadata using `META.title`, `META.description`, and
  `META.ogImage` from `src/config.ts`.
- Blog posts are Astro Content Collections in `src/content/blog/`.
  Frontmatter must match the schema in `src/content/config.ts`.
  Slugs are derived from filenames automatically.
- Do not render content exclusively on the client side via toggled state —
  all SEO-relevant content must be present in the server-rendered HTML.

### Cloudflare Worker Routing

- New API routes must be added to `src/worker.ts` — handler files in
  `functions/*.ts` are imported by the Worker, not auto-routed by Cloudflare.
- Keep handlers thin: **validate input → call service → return Response**.
- Read secrets from the `env` parameter (CF Workers binding) — never from
  `process.env`.
- Always set `Content-Type: application/json` and return the correct
  HTTP status code.
- Errors from non-critical integrations (e.g. Apollo.io enrichment) must
  not block the primary response — handle them fire-and-forget.

---

## Brand Voice

> Full guidelines: `brand/BLOQR_DESIGN_LANGUAGE.md` → _Voice & Tone_

### Write

- Short declarative sentences.
- Specific, verifiable numbers ("48,291 rules" not "thousands of rules").
- "You"-focused copy — what the reader gains, not what Bloqr does.
- Honest caveats for unshipped features ("We're building this").

### Do Not Write

- "Leveraging", "seamlessly", "best-in-class", "enterprise-grade",
  "game-changing".
- Passive voice when active is possible.
- Interchangeable use of "privacy" and "anonymity" — they are distinct.
  Bloqr improves privacy (controls data exposure); it does not provide
  anonymity (hiding identity from all parties).

### Core Mantras — Use These, Don't Paraphrase

| Mantra                             | Usage context              |
| ---------------------------------- | -------------------------- |
| "Set it. Bloqr it. Forget it."     | Consumer-facing CTAs       |
| "Bring your own. Or use ours."     | Vendor / integration copy  |
| "Internet Hygiene. Automated."     | Tagline — universal        |
| "Browsing Hygiene"                 | Our coined concept for DNS |

---

## The Four Personas

When writing copy or UI labels, identify which persona is addressed:

| #   | Name        | Who they are                                              |
| --- | ----------- | --------------------------------------------------------- |
| 1   | Beneficiary | Everyday consumer — no DNS knowledge, wants one-switch UX |
| 2   | Pilot       | Power user — self-hosted DNS, privacy-aware               |
| 3   | Builder     | Developer or list maker — API, library, CLI user          |
| 4   | Ally        | DNS vendor / partner (AdGuard, NextDNS, Pi-hole)          |

Full persona profiles in `brand/BLOQR_DESIGN_LANGUAGE.md`.

---

## Anti-Patterns — Always Avoid

| Anti-pattern                              | Preferred alternative                         |
| ----------------------------------------- | --------------------------------------------- |
| Hardcoding `bloqr.ai` or any URL          | Import from `src/config.ts` (`LINKS`, `META`) |
| Svelte 4 `export let` prop syntax         | Svelte 5 `$props()` rune                      |
| Hardcoded hex/rgb/spacing values          | `var(--token-name)` from `src/styles/global.css` |
| `process.env` inside CF functions         | `env.VARIABLE_NAME` (CF Workers binding)      |
| `any` TypeScript type                     | `unknown` + type narrowing                    |
| Client-side-only content rendering        | SSR-present HTML, progressively enhanced      |
| Positioning AI as replacing list makers   | AI complements and amplifies human curation   |
| Conflating privacy with anonymity in copy | Use the correct, distinct term                |

---

## UI Interaction Patterns

- **Code / UI toggle:** Code blocks on the landing page pair with a UI
  mockup. The "Show code" toggle reveals the underlying JSON/YAML/API
  call. Always include the companion message:
  _"You'll never write a line of this. The UI builds it for you."_
- **Progressive disclosure:** The product has two modes — "Do it for me"
  (AI-configured) and "Let me drive" (full JSON/YAML/API). Copy and UI
  should never assume one mode over the other.
- **Non-technical copy alongside code:** Whenever code is visible to the
  user, accompany it with reassurance that it is auto-generated by the UI
  and requires no manual editing.
