import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig(({ mode }) => ({
  plugins: [sveltekit()],

  test: {
    environment: `jsdom`,
    css: true,
    coverage: {
      provider: `v8`,
      reporter: [`text`, `json-summary`],
      include: [`src/lib/*`],
    },
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
