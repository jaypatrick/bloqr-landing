# Deployment

Bloqr landing is deployed as a **Cloudflare Worker** with static assets, using Wrangler.

## Architecture

- `astro build` produces static HTML/CSS/JS in `./dist`
- `wrangler deploy` bundles `src/worker.ts` as the Worker entry point and uploads `./dist` as static assets
- The Worker routes dynamic paths (`/waitlist`, `/config`, `/admin/*`, `/api/auth/*`) to edge handlers; everything else is served from `env.ASSETS.fetch(request)`

## Automatic Deployment

Pushes to `main` trigger `.github/workflows/ci.yml` (deploy job), which:
1. Installs dependencies
2. Generates PWA icons (`scripts/generate-icons.mjs`)
3. Runs `astro build`
4. Runs `wrangler deploy`

## Required GitHub Secrets

Set in **GitHub → Repository → Settings → Secrets and variables → Actions**:

| Secret | Description |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token — needs **Workers Scripts:Edit** + **Account:Read** permissions. Create at https://dash.cloudflare.com/profile/api-tokens |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID (found in the Cloudflare dashboard sidebar) |
| `DATABASE_URL` | Neon PostgreSQL connection string (production branch). Used at build time and as runtime secret. |
| `BETTER_AUTH_SECRET` | Random 32+ character string for Better Auth JWT signing. Generate with: `openssl rand -base64 32` |

## Required Cloudflare Workers Secrets (Runtime)

Set in **Cloudflare dashboard → Workers → adblock-landing → Settings → Variables** as **Encrypted secrets**:

| Secret | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string (production branch) |
| `APOLLO_API_KEY` | Apollo.io API key for waitlist contact sync |
| `ADMIN_SECRET` | Legacy password for `/admin/*` fallback auth (keep set until Better Auth migration is complete) |
| `BETTER_AUTH_SECRET` | Same value as GitHub secret — JWT signing key for Better Auth sessions |
| `BETTER_AUTH_URL` | The canonical URL of this app, e.g. `https://adblock-compiler-landing.pages.dev` (update to `https://bloqr.ai` when live) |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID (for admin SSO) |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret |

## Local Development

```bash
cp .dev.vars.example .dev.vars  # fill in your local secrets
npm install
npm run dev        # Astro dev server (static pages only)
npm run preview    # wrangler dev (full Worker + static assets, recommended)
```

## Manual Deploy

```bash
npm run deploy  # astro build && wrangler deploy
```

## Domain Migration Checklist (Pending: bloqr.ai)

When `bloqr.ai` is procured and DNS is configured:

1. Update `SITE_URL` in Cloudflare Workers environment variables
2. Update `BETTER_AUTH_URL` in Cloudflare Workers environment variables
3. Update `site:` in `astro.config.mjs` and rebuild
4. Update the `Sitemap:` URL in `public/robots.txt`
5. Update OAuth redirect URIs in GitHub OAuth App settings
6. Trigger a redeploy (`npm run deploy` or push to `main`)

## GitHub OAuth App Setup

1. Go to https://github.com/settings/developers → OAuth Apps → New OAuth App
2. Application name: `Bloqr Admin (Production)` (create a separate one for local dev)
3. Homepage URL: `https://adblock-compiler-landing.pages.dev` (update to `https://bloqr.ai` when live)
4. Authorization callback URL: `https://adblock-compiler-landing.pages.dev/api/auth/callback/github`
5. Copy Client ID and Client Secret → set as Cloudflare Workers secrets

For local development, create a second OAuth App:
- Homepage URL: `http://localhost:4321`
- Callback URL: `http://localhost:4321/api/auth/callback/github`
- Set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in `.dev.vars`

## Better Auth Migration: Database Schema

Run once after adding Better Auth to provision the required tables in Neon:

```bash
npm run migrate:auth
```

This creates the `user`, `session`, `account`, and `verification` tables with indexes.

## SSO Expansion

Better Auth is configured with `trustedOrigins` to support SSO across all Bloqr properties.
When adding a new Bloqr app:

1. Add its origin to `BETTER_AUTH_TRUSTED_ORIGINS` env var (comma-separated)
2. Configure the new app to use the same `BETTER_AUTH_SECRET` and point `baseURL` at the landing page's `/api/auth` endpoint
3. See `src/lib/auth.ts` for the full Better Auth config

### Option A: Cross-origin session check (zero install)

From another Worker, forward the incoming `Cookie` header to `GET /api/auth/session` on the landing page:

```typescript
const sessionRes = await fetch('https://adblock-compiler-landing.pages.dev/api/auth/session', {
  headers: { cookie: request.headers.get('cookie') ?? '' },
});
const { session } = await sessionRes.json();
```

This works because the landing page's Better Auth config lists the other app's origin in `trustedOrigins`.

### Option B: Shared Better Auth instance (same npm install)

Install `better-auth` in the other app, point `baseURL` at the landing page's `/api/auth` endpoint, use the same `BETTER_AUTH_SECRET`. Sessions are stored in the same Neon DB and are shared across apps automatically.
