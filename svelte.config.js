import adapter from '@sveltejs/adapter-static'
import { mdsvex } from 'mdsvex'
import preprocess from 'svelte-preprocess'

/** @type {import('@sveltejs/kit').Config} */
export default {
  extensions: [`.svelte`, `.svx`, `.md`],

  preprocess: [
    preprocess(),
    mdsvex({ extensions: [`.svelte`, `.svx`, `.md`] }),
  ],

  kit: {
    adapter: adapter(),

    alias: {
      $root: `.`,
      $site: `src/site`,
    },
  },

  compilerOptions: {
    // https://github.com/janosh/svelte-multiselect/issues/196
    immutable: true,
    // enable direct prop access for vitest unit tests
    accessors: process.env.TEST,
  },
}
