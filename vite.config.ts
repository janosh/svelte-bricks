import { config } from '@janosh/vite-config'
import { sveltekit } from '@sveltejs/kit/vite'
import { vite_plugin as live_examples } from 'svelte-multiselect/live-examples'

export default {
  ...config, // shared lint/fmt/build from @janosh/vite-config (dotfiles)

  plugins: [sveltekit(), live_examples()],

  test: {
    environment: `happy-dom`,
    css: true,
    coverage: {
      include: [`src/lib/*`],
    },
    include: [`tests/**/*.test.ts`],
    exclude: [`tests/playwright/**`], // Playwright tests run separately
  },

  resolve: {
    // Vitest component tests need Svelte's browser build for mount().
    conditions: [`browser`],
  },

  server: {
    fs: { allow: [`..`] }, // needed to import from $root
    port: 3000,
  },

  preview: {
    port: 3000,
  },
}
