import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Cloudflare Pages static output
  // Switch to output: 'server' + adapter: cloudflare() if you need SSR/edge functions
  output: 'static',

  site: 'https://bloqr.ai',

  // To enable Cloudflare Workers SSR, uncomment:
  // output: 'server',
  // adapter: cloudflare({ mode: 'directory' }),

  integrations: [
    svelte(),
    sitemap(),
  ],

  vite: {
    server: {
      headers: {
        // NOTE: This CSP is dev-only. Production CSP should be set in wrangler.toml
        // or Cloudflare Pages headers (/_headers file) for proper edge delivery.
        'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self' 'unsafe-inline'; connect-src 'self' https://app.posthog.com https://plausible.io;"
      }
    }
  }
});
