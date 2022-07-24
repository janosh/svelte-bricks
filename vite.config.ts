import { sveltekit } from '@sveltejs/kit/vite'

export default {
  plugins: [sveltekit()],
  test: {
    environment: `jsdom`,
  },

  server: {
    fs: { allow: [`..`] }, // needed to import readme.md
  },
}
