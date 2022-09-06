import adapter from '@sveltejs/adapter-static'
import { mdsvex } from 'mdsvex'
import preprocess from 'svelte-preprocess'

export default {
  extensions: [`.svelte`, `.svx`, `.md`],

  preprocess: [
    preprocess(),
    mdsvex({ extensions: [`.svelte`, `.svx`, `.md`] }),
  ],

  kit: {
    adapter: adapter(),
  },
}
