import { sveltekit } from '@sveltejs/kit/vite'
import { vite_plugin as live_examples } from 'svelte-multiselect/live-examples'
import { defineConfig } from 'vitest/config'

export default defineConfig(({ mode }) => ({
  plugins: [sveltekit(), live_examples()],

  test: {
    environment: `happy-dom`,
    css: true,
    coverage: {
      provider: `v8`,
      reporter: [`text`, `json-summary`],
      include: [`src/lib/*`],
    },
    include: [`tests/**/*.test.ts`],
    exclude: [`tests/playwright/**`], // Playwright tests run separately
  },

  resolve: {
    conditions: mode === `test` ? [`browser`] : undefined,
  },

  server: {
    fs: { allow: [`..`] }, // needed to import from $root
    port: 3000,
  },

  preview: {
    port: 3000,
  },
}))
