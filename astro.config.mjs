// Astro telemetry is disabled via ASTRO_TELEMETRY_DISABLED=1 (set in CI env and .env.example)
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  // Cloudflare Pages static output
  // Switch to output: 'server' + adapter: cloudflare() if you need SSR/edge functions
  output: 'static',

  // To enable Cloudflare Workers SSR, uncomment:
  // output: 'server',
  // adapter: cloudflare({ mode: 'directory' }),

  integrations: [
    svelte(),
  ],

  vite: {
    server: {
      headers: {
        'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self' 'unsafe-inline'; connect-src 'self';"
      }
    }
  }
});
