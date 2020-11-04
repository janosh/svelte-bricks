import svelte from 'rollup-plugin-svelte'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import livereload from 'rollup-plugin-livereload'
import { terser } from 'rollup-plugin-terser'
import { mdsvex } from 'mdsvex'

const dev = process.env.ROLLUP_WATCH

function serve() {
  let server

  function toExit() {
    if (server) server.kill(0)
  }

  return {
    writeBundle() {
      if (server) return
      server = require(`child_process`).spawn(
        `npm`,
        [`run`, `start`, `--`, `--dev`],
        {
          stdio: [`ignore`, `inherit`, `inherit`],
          shell: true,
        }
      )

      process.on(`SIGTERM`, toExit)
      process.on(`exit`, toExit)
    },
  }
}

export default {
  input: `src/main.js`,
  output: {
    sourcemap: true,
    format: `iife`,
    name: `app`,
    file: `public/build/bundle.js`,
  },
  plugins: [
    svelte({
      extensions: [`.svelte`, `.svx`],
      preprocess: mdsvex(),
      // enable run-time checks when not in production
      dev,
      // Extract any component CSS into a separate file - better for performance
      css: (css) => {
        css.write(`bundle.css`)
      },
    }),

    // If you have external dependencies installed from npm, you'll most likely need
    // these plugins. In some cases you'll need additional config. See here for details:
    // https://github.com/rollup/plugins/tree/master/packages/commonjs
    resolve({
      browser: true,
      dedupe: [`svelte`],
    }),
    commonjs(),

    // In dev mode, call `start` script once the bundle has been generated.
    dev && serve(),

    // Watch the `public` directory and hot-reload changes when not in production.
    dev && livereload(`public`),

    // If we're building for production, minify.
    !dev && terser(),
  ],
  watch: {
    clearScreen: false,
  },
}
