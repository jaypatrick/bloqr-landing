# PostHog Astro (SSR) Example Project

For the canonical reference implementation, see the upstream repository:

- **Repository:** https://github.com/PostHog/context-mill
- **Path:** `basics/astro-ssr`

The example demonstrates:
- Client-side PostHog web snippet initialization (`window.posthog`)
- Server-side `posthog-node` usage in API/edge routes
- Forwarding `X-PostHog-Session-Id` and `X-PostHog-Distinct-Id` headers for unified session tracking
- Calling `posthog.identify()` before `posthog.capture()` so events are attributed to the identified person
- Guarding `posthog.flush()` with `.catch()` inside `ctx.waitUntil()`
