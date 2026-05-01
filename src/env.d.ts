/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

// ─── Cloudflare Workers runtime type augmentation (Astro 6 pattern) ───────────
// This gives any Astro page/component type-safe access to Cloudflare bindings
// via `Astro.locals.runtime.env` when needed in the future.
// See: https://docs.astro.build/en/guides/integrations-guide/cloudflare/#runtime
type Runtime = import('@astrojs/cloudflare').Runtime<import('./types/env').Env>;

declare namespace App {
  interface Locals extends Runtime {}
}

// ─── Build-time environment variables (import.meta.env) ───────────────────────
// These are available in Astro page/component frontmatter at build time.
// Note: secrets like DATABASE_URL are NOT exposed here — they come from the
// Cloudflare Workers `env` binding at runtime, not from import.meta.env.
interface ImportMetaEnv {
  readonly SITE_URL?: string;
  readonly PUBLIC_PLAUSIBLE_DOMAIN?: string;
  readonly PUBLIC_POSTHOG_KEY?: string;
  readonly PUBLIC_CF_BEACON_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  posthog?: import('posthog-js').PostHog;
}
