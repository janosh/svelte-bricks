import adapter from '@sveltejs/adapter-static'
import { mdsvex } from 'mdsvex'
import {
  mdsvex_transform,
  starry_night_highlighter,
  sveltePreprocess,
} from 'svelte-multiselect/live-examples'
import pkg from './package.json' with { type: 'json' }

const defaults = { repo: pkg.repository, hideStyle: true }
const remarkPlugins = [[mdsvex_transform, { defaults }]]

/** @type {import('@sveltejs/kit').Config} */
export default {
  extensions: [`.svelte`, `.svx`, `.md`],

  preprocess: [
    sveltePreprocess(), // wrapped version that skips markdown files
    mdsvex({
      remarkPlugins,
      extensions: [`.svx`, `.md`],
      highlight: { highlighter: starry_night_highlighter },
    }),
  ],

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
