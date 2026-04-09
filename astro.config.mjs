import { defineConfig, fontProviders } from 'astro/config';
import svelte from '@astrojs/svelte';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Cloudflare Workers adapter — `output:'server'` is required by
  // @astrojs/cloudflare.  Every page in this site uses
  // `export const prerender = true`, so all HTML is statically generated
  // at build time and served from the ASSETS binding.  The SSR runtime
  // exists only to serve the custom API routes in src/worker.ts.
  //
  // prerenderEnvironment:'node' is set explicitly even though the Astro 6
  // default is 'workerd'.  The reason: src/worker.ts is a custom Cloudflare
  // Worker entry that routes unmatched requests to env.ASSETS.fetch() rather
  // than the Astro SSR handler.  When prerenderEnvironment:'workerd' is used,
  // the @astrojs/cloudflare adapter starts a local workerd preview server
  // using the compiled custom worker and makes POST requests to the internal
  // Astro prerender endpoints (/__astro_static_paths).  Because the custom
  // worker forwards unknown paths to ASSETS (not to the Astro SSR handler),
  // these endpoints return 404 and the build fails.  Switching to 'workerd'
  // requires the custom worker to also handle the Astro prerender endpoints.
  // The nodejs_compat flag in wrangler.toml is unrelated — it handles the
  // better-auth node:async_hooks dependency at runtime.
  output: 'server',
  adapter: cloudflare({
    prerenderEnvironment: 'node',
    // Use the Cloudflare Images Worker Binding (env.IMAGES) for image
    // optimization at the edge.  The binding is provisioned automatically
    // by Wrangler when the account has Cloudflare Images enabled.
    // Making this explicit (rather than relying on the default) ensures
    // the intent is clear and avoids surprises if the adapter default changes.
    imageService: 'cloudflare-binding',
  }),

  // Derived from the SITE_URL env var so the sitemap and RSS context.site stay
  // consistent with the rest of the codebase (src/config.ts SITE_URL, wrangler.toml
  // CANONICAL_DOMAIN, and wrangler.toml [[routes]]).  Set SITE_URL in the
  // Cloudflare dashboard (or .env / .dev.vars locally) when migrating to bloqr.ai.
  site: process.env.SITE_URL ?? 'https://bloqr.jaysonknight.com',

  // ── Astro 6 Fonts API ──────────────────────────────────────────────────
  // Uses the fontsource() provider to self-host fonts from the installed
  // @fontsource npm packages.  The Font component in BaseHead injects
  // @font-face rules, preload <link> tags, and the CSS custom properties
  // (--font-display, --font-mono) consumed by global.css and components.
  fonts: [
    {
      name: 'Space Grotesk',
      cssVariable: '--font-display',
      provider: fontProviders.fontsource(),
      weights: [400, 500, 600, 700],
      styles: ['normal'],
      display: 'swap',
      fallbacks: ['system-ui', 'sans-serif'],
    },
    {
      name: 'JetBrains Mono',
      cssVariable: '--font-mono',
      provider: fontProviders.fontsource(),
      weights: [400, 500, 700],
      styles: ['normal'],
      display: 'swap',
      fallbacks: ['monospace'],
    },
  ],

  // ── Astro 6 Security ───────────────────────────────────────────────────
  // checkOrigin guards against CSRF on form actions.
  // csp auto-hashes inline scripts/styles so a strict CSP can be enforced
  // without 'unsafe-inline'.  Production CSP headers are applied in
  // src/worker.ts via applyCSP(), which adds hardening directives
  // (frame-ancestors, base-uri, form-action) at the edge.
  security: {
    checkOrigin: true,
    csp: {
      algorithm: 'SHA-256',
    },
  },

  // ── Markdown / Code Highlighting ──────────────────────────────────────
  // Uses Shiki 4 (bundled with Astro 6) with dual dark/light themes so that
  // highlighted code blocks emit CSS custom properties (--shiki-dark / --shiki-light)
  // via inline `style` attributes on each token element.  The global.css Shiki
  // section maps these CSS vars to actual colours based on prefers-color-scheme.
  // Note: `defaultColor:false` moves colour declarations into CSS variables but
  // still uses inline `style` attributes for them — `style-src` must still allow
  // inline styles (via 'unsafe-inline') for code blocks to render correctly.
  // The stylesheet that maps these CSS vars to actual colours is in
  // src/styles/global.css under the "Shiki dual-theme" section.
  markdown: {
    syntaxHighlight: {
      type: 'shiki',
      excludeLangs: [],
    },
    shikiConfig: {
      // houston: Astro's own dark theme — matches the Bloqr dark palette well.
      // vitesse-light: clean minimal light theme for light-mode users.
      // defaultColor:false — outputs CSS variables via inline style attributes (not raw colour values).
      // Inline styles are still emitted; style-src must allow them.
      themes: {
        dark:  'houston',
        light: 'vitesse-light',
      },
      defaultColor: false,
      wrap: true,
    },
  },

  // ── Astro 6 Experimental features ─────────────────────────────────────
  experimental: {
    // Use the Rust-based .astro compiler from @astrojs/compiler-rs for
    // faster builds.  Requires the @astrojs/compiler-rs package (already
    // in dependencies).
    rustCompiler: true,

    // Queue and batch rendering tasks to improve build throughput.
    // contentCache caches content collection query results across renders
    // so identical collection reads don't re-fetch from disk/network.
    queuedRendering: {
      enabled: true,
      contentCache: true,
    },
  },

  integrations: [
    svelte(),
    sitemap(),
  ],

  vite: {
    server: {
      headers: {
        // Dev-only CSP — permissive to allow Vite's HMR inline style/script
        // injection during local development.  ws:/wss: are required for Vite
        // HMR WebSocket connections.  Production CSP is stricter: inline hashes
        // are auto-generated by security.csp above and hardening directives are
        // added by applyCSP() in src/worker.ts.
        'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self' ws: wss: https://app.posthog.com https://plausible.io; img-src 'self' data:;",
      }
    }
  }
});
