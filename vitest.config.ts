import { defineConfig } from 'vitest/config';

/**
 * vitest.config.ts — Vitest configuration for the Bloqr landing Worker tests.
 *
 * Environment: `node` — tests run against Node.js, not a browser or jsdom,
 * because all Worker service code is environment-agnostic (no DOM APIs).
 * `globalThis.fetch` is the standard Web Fetch API, available in Node 18+
 * and in the CF Workers runtime.  Tests mock it via `vi.stubGlobal`.
 *
 * Test files: `src/**\/*.test.ts`
 */
export default defineConfig({
  test: {
    environment: 'node',
    include:     ['src/**/*.test.ts'],
    globals:     true,
    coverage: {
      provider: 'v8',
      include:  ['src/services/**'],
    },
  },
});
