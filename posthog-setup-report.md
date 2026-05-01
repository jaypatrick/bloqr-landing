<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Bloqr landing page. Both client-side and server-side event tracking are now instrumented across the key conversion surfaces.

**What was done:**

- Installed `posthog-node` for server-side tracking in Cloudflare Worker functions
- Created `src/lib/posthog-server.ts` — singleton PostHog client for the CF Worker runtime
- Added `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` to `src/types/env.ts`; these are Cloudflare secrets set via `wrangler secret put` (see `.dev.vars.example` for local values)
- Updated `src/components/PostHog.astro` to read the project token from `PUBLIC_POSTHOG_KEY` (build-time env var) and gate initialization behind `import.meta.env.PROD`; set `PUBLIC_POSTHOG_KEY` in `.env` (see `.env.example`)
- Added PostHog initialization to `src/pages/blog/[slug].astro` (was previously missing)
- Instrumented 10 events across 7 files — client-side (Svelte) and server-side (CF Worker)
- `waitlist_signup` enhanced: now calls `posthog.identify(email)` before capture, and passes `X-PostHog-Session-Id` / `X-PostHog-Distinct-Id` headers to the server for session and person correlation
- Server-side events use `ctx.waitUntil(posthog.flush())` to guarantee delivery before the Worker terminates

| Event | Description | File |
|---|---|---|
| `waitlist_signup` | User successfully joins the waitlist (existing event, enhanced with `identify()` and session header) | `src/components/WaitlistSignup.svelte` |
| `waitlist_segment_selected` | User selects a role segment pill (list-maker, privacy-vendor, individual) | `src/components/WaitlistSignup.svelte` |
| `waitlist_signup_failed` | Waitlist form submission returned a non-duplicate error | `src/components/WaitlistSignup.svelte` |
| `hero_cta_clicked` | User clicks a CTA button in the hero section (get_started_free, read_the_docs, see_how_it_works) | `src/components/Hero.svelte` |
| `pricing_cta_clicked` | User clicks a pricing tier CTA button — includes `tier` and `cta` properties | `src/components/Pricing.svelte` |
| `faq_item_opened` | User expands an FAQ accordion item — includes question text and index | `src/components/FAQ.svelte` |
| `cta_banner_clicked` | User clicks the bottom CTA banner (launch_the_app, view_docs) | `src/components/CtaBanner.svelte` |
| `blog_post_viewed` | User views a blog post — includes title, category, tags, and slug | `src/pages/blog/[slug].astro` |
| `waitlist_signup_server` | Server-side confirmation of a new waitlist signup persisted to the database | `functions/waitlist.ts` |
| `waitlist_signup_duplicate_server` | Server-side detection of a duplicate waitlist signup attempt | `functions/waitlist.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics:** available in your PostHog workspace
- **Waitlist Signups Over Time:** available in your PostHog workspace
- **Waitlist Conversion Funnel** (Hero CTA → Pricing CTA → Signup): available in your PostHog workspace
- **Pricing CTA Clicks by Tier:** available in your PostHog workspace
- **Waitlist Segment Distribution:** available in your PostHog workspace
- **Signup Errors & Duplicates:** available in your PostHog workspace

**Deployment note:** ensure `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` are set as Cloudflare secrets before enabling server-side tracking in production:
```
wrangler secret put POSTHOG_PROJECT_TOKEN
wrangler secret put POSTHOG_HOST
```

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-astro-ssr/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
