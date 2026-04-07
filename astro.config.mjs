import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Cloudflare Pages static output
  // Switch to output: 'server' + adapter: cloudflare() if you need SSR/edge functions
  output: 'static',

  // TODO: update to https://bloqr.ai once the domain is live
  site: 'https://adblock-compiler-landing.pages.dev',

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
        'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self' 'unsafe-inline'; connect-src 'self';"
      }
    }
  }
});
