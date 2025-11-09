import adapter from '@sveltejs/adapter-static'
import { mdsvex } from 'mdsvex'
import { sveltePreprocess } from 'svelte-preprocess'

/** @type {import('@sveltejs/kit').Config} */
export default {
  extensions: [`.svelte`, `.svx`, `.md`],

  preprocess: [sveltePreprocess(), mdsvex({ extensions: [`.svx`, `.md`] })],

  kit: {
    adapter: adapter(),

    alias: {
      $root: `.`,
      $site: `src/site`,
    },
  },

  vitePlugin: {
    inspector: true,
  },
}
