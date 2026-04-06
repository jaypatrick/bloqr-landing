# AdBlock Compiler — Landing Page

Astro + Svelte landing page, deployed to Cloudflare Pages.

## Stack

- **Framework**: [Astro 5](https://astro.build) (static output)
- **Components**: [Svelte 5](https://svelte.dev) (runes syntax)
- **Deployment**: [Cloudflare Pages](https://pages.cloudflare.com)
- **Fonts**: Space Grotesk + JetBrains Mono (Google Fonts)

## Quick start

```bash
npm install
npm run dev          # http://localhost:4321
npm run build        # ./dist/
npm run preview      # preview via wrangler pages dev
npm run deploy       # build + deploy to Cloudflare Pages
```

## Structure

```
src/
├── pages/
│   └── index.astro          # Root page, assembles all components
├── components/
│   ├── Nav.svelte            # Sticky nav with scroll-aware styling
│   ├── Hero.svelte           # Hero section + stats bar
│   ├── Problem.svelte        # VPN vs AdBlock Compiler comparison
│   ├── HowItWorks.svelte     # 3-step guide (TODO)
│   ├── Audiences.svelte      # Consumer / Developer / Vendor cards (TODO)
│   ├── Features.svelte       # 6-cell feature grid
│   ├── CodeDemo.svelte       # Code window + get started CTA (TODO)
│   ├── CtaBanner.svelte      # Final CTA section
│   └── Footer.svelte         # Site footer
└── styles/
    └── global.css            # Brand tokens + base styles

brand/
├── logo.svg                  # SVG wordmark + icon
└── tokens.css                # Full design token reference
```

## Cloudflare deployment

The project is configured for **static output** (`output: 'static'` in `astro.config.mjs`).
This means it deploys as a fully static site to Cloudflare Pages — no Workers runtime needed.

To enable **SSR / edge functions** (e.g., for a contact form or email capture):
1. Change `output: 'static'` to `output: 'server'` in `astro.config.mjs`
2. Uncomment the `adapter: cloudflare()` line
3. Re-run `npm run deploy`

## Components still to build

Three components are imported in `index.astro` but not yet implemented:
- `HowItWorks.svelte` — 3-step code walkthrough
- `Audiences.svelte` — consumer / developer / vendor audience cards
- `CodeDemo.svelte` — interactive code window with copy button

The reference HTML (`/brand/landing-page.html`) shows the complete design for all sections.

## Brand reference

See `/brand/tokens.css` for the full design token spec and `/brand/logo.svg` for the wordmark.
Brand voice guidelines are in the project root at `.claude/brand-voice-guidelines.md`.
