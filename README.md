# Bloqr — Landing Page Source

> **Internet Hygiene. Automated.**

This is the source code for the [Bloqr](https://bloqr.dev) marketing landing site — the public face of an AI-powered DNS filter list compiler and real-time threat intelligence service.

If you're here to browse the product, you're in the wrong place (but welcome). If you're here to contribute, read on.

---

## What is Bloqr?

Bloqr is the connective tissue between DNS filtering tools and the filter lists that power them. It compiles, deduplicates, and distributes AI-curated block lists to DNS providers like AdGuard, NextDNS, and Pi-hole — automatically, on a schedule, across every device you own.

No copy-pasting. No manual syncing. No configuration drift.

**Set it. Bloqr it. Forget it.**

Bloqr improves your privacy. It is not a VPN, not an anonymity tool, and not Tor. It controls what your devices reach out to — quietly, in the background, without adding latency or routing your traffic through a stranger's server.

---

## This Repository

This repo contains the marketing landing site only — not the Bloqr service itself. It is a static site deployed to Cloudflare Workers, built with Astro and Svelte.

### Tech stack

| Layer | Technology |
|---|---|
| Framework | [Astro 6](https://astro.build) — static output, file-based routing |
| Components | [Svelte 5](https://svelte.dev) — runes syntax |
| Deployment | [Cloudflare Workers](https://workers.cloudflare.com) via `wrangler deploy` |
| Waitlist DB | [Neon](https://neon.tech) Postgres |
| Auth | [Better Auth](https://www.better-auth.com) — GitHub OAuth SSO |

### Project layout

```
src/
├── worker.ts             # Cloudflare Worker entry — routes requests, injects CSP headers
├── config.ts             # Single source of truth for all URLs and site metadata
├── pages/                # Astro file-based routes
│   ├── index.astro       # Main landing page
│   ├── about.astro
│   ├── blog/             # Blog listing + post pages
│   └── changelog.astro   # Rendered from CHANGELOG.md at build time
├── components/           # Svelte 5 + Astro components
│   ├── BaseHead.astro    # Shared <head>: fonts, CSP meta, analytics
│   ├── Nav.svelte
│   ├── Hero.svelte
│   └── ...
└── styles/
    └── global.css        # Design tokens (:root vars), global resets

brand/
├── BLOQR_DESIGN_LANGUAGE.md   # Personas, voice, page architecture
├── BLOQR_ETHOS.md             # Product philosophy and core promises
├── tokens.css                 # Design token reference
└── logo.svg
``` 

---

## Running Locally

You need **Node.js ≥ 22.12.0**.

```bash
npm install
npm run dev        # Astro dev server — http://localhost:4321 (fast HMR)
npm run build      # Produces ./dist/
npm run preview    # Full Cloudflare Worker runtime (requires .dev.vars)
npm run deploy     # astro build && wrangler deploy
```

Use `npm run dev` for UI work. Use `npm run preview` when you need to test API routes, auth flows, or Worker behaviour — it emulates the full Cloudflare runtime.

Before running `preview`, copy `.dev.vars.example` to `.dev.vars` and fill in your local secrets.

---

## API Routes

The Worker handles a small set of server-side routes. Everything else falls through to the static site.

| Route | What it does |
|---|---|
| `POST /waitlist` | Adds an email to the waitlist (Neon) + syncs to Apollo.io |
| `GET /config` | Returns public site config |
| `POST /admin/config` | Updates site config (auth required) |
| `GET/POST/PUT /admin/blog` | Blog post CRUD (auth required) |
| `GET/POST /api/auth/*` | GitHub OAuth via Better Auth |
| `*` | Static site fallback (`env.ASSETS.fetch`) |

---

## Email Setup (CF Email Workers binding)

Bloqr uses the **Cloudflare Email Workers binding** (`cloudflare:email`) for outbound transactional email (waitlist confirmations) and **Cloudflare Email Routing** for inbound forwarding. Both are fully Cloudflare-native — no third-party API key is needed.

### Outbound — CF Email Workers binding (`SEND_EMAIL`)

1. In the **Cloudflare dashboard → Email → Email Routing**, enable Email Routing on the `bloqr.dev` zone and verify your sending domain.
2. The `[[send_email]]` binding is already declared in `wrangler.toml`. CF handles DKIM/SPF automatically — no keys to manage.
3. `FROM_EMAIL` is set as a plain var in `wrangler.toml [vars]`:
   ```toml
   FROM_EMAIL = "Bloqr <hello@bloqr.dev>"
   ```
   Override it locally in `.dev.vars` if needed.
4. The binding only works in the Cloudflare Workers runtime. Use `npm run preview` (wrangler dev) to exercise email paths locally.

`createEmailService(env)` automatically selects the correct strategy based on what is bound:

| Binding present | Strategy selected |
|---|---|
| `EMAIL_WORKER` (adblock-email service binding) | `ServiceBindingStrategy` — routes to the dedicated email Worker |
| `SEND_EMAIL` only | `CfEmailSendingStrategy` — CF Email Routing Workers binding |
| Neither | `NullEmailStrategy` — logs a warning and drops (local dev / CI) |

### Inbound — Cloudflare Email Routing

Cloudflare Email Routing forwards inbound messages to your personal inbox. Configure it in the **Cloudflare dashboard → Email → Email Routing** — no code changes are required. This is independent of the outbound `SEND_EMAIL` binding.

### Security checklist

- `FROM_EMAIL` is a non-secret plain var — safe in `wrangler.toml [vars]`.
- No API keys or DKIM private keys are required or stored.
- All waitlist request fields are Zod-validated before any email is sent.
- Email delivery errors are fire-and-forget — they never block the `200` waitlist response.

---

## Brand and Voice

Bloqr has a specific voice. Before writing copy, UI labels, or any user-facing text, read:

- `brand/BLOQR_DESIGN_LANGUAGE.md` — personas, tone guidelines, page architecture decisions
- `brand/BLOQR_ETHOS.md` — why Bloqr exists, what we will never do, the promises we keep

The short version:

- Short, declarative sentences. Specific numbers, not vague superlatives.
- "You"-focused — what you get, not what we built.
- Privacy and anonymity are different things. Bloqr improves privacy. It does not provide anonymity.
- Never: "leveraging", "seamlessly", "best-in-class", "enterprise-grade", "game-changing".

---

## Contributing

The authoritative guide for contributors and AI agents working in this repo is `AGENTS.md`.

For design token values, see `brand/tokens.css`. The variables used by components come from `src/styles/global.css`.

---

*Bloqr — The privacy you didn't know you needed.*