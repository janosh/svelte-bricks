import adapter from '@sveltejs/adapter-static'
import { mdsvex } from 'mdsvex'
import preprocess from 'svelte-preprocess'

export default {
  extensions: [`.svelte`, `.svx`],

  preprocess: [preprocess(), mdsvex()],

  kit: {
    adapter: adapter(),

    // hydrate the <body> element in src/app.html
    target: `body`,
  },
}
