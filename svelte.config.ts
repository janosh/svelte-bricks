import type { Config } from '@sveltejs/kit'
import adapter from '@sveltejs/adapter-static'
import { mdsvex } from 'mdsvex'
import {
  mdsvex_transform,
  starry_night_highlighter,
} from 'svelte-multiselect/live-examples'
import pkg from './package.json' with { type: 'json' }

// mdsvex_transform turns pkg.repository into source links on live examples
if (!pkg.repository) throw new Error(`package.json is missing a "repository" field`)

const defaults = { repo: pkg.repository, hideStyle: true }
const remarkPlugins = [[mdsvex_transform, { defaults }]]

export default {
  extensions: [`.svelte`, `.svx`, `.md`],

  preprocess: [
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
} satisfies Config
