/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SITE_URL?: string;
  readonly PUBLIC_PLAUSIBLE_DOMAIN?: string;
  readonly PUBLIC_POSTHOG_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  __posthog?: import('posthog-js').PostHog;
}
