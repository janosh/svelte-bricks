import { sveltekit } from '@sveltejs/kit/vite'
import type { UserConfig } from 'vite'
import type { UserConfig as VitestConfig } from 'vitest'

export default {
  plugins: [sveltekit()],

  test: {
    environment: `jsdom`,
    css: true,
    coverage: {
      reporter: [`text`, `json-summary`],
    },
  },

  server: {
    fs: { allow: [`..`] }, // needed to import from $root
    port: 3000,
  },

  preview: {
    port: 3000,
  },
} satisfies UserConfig & { test: VitestConfig }
