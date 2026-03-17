import { sveltekit } from '@sveltejs/kit/vite'
import { vite_plugin as live_examples } from 'svelte-multiselect/live-examples'
import { defineConfig } from 'vite-plus'

export default defineConfig({
  fmt: {
    semi: false,
    singleQuote: true,
    printWidth: 90,
  },
  lint: {
    plugins: [`oxc`, `typescript`, `unicorn`, `import`, `jest`],
    options: {
      typeAware: true,
      typeCheck: true,
    },
    categories: {
      correctness: `error`,
      suspicious: `error`,
      perf: `error`,
    },
    ignorePatterns: [`build/`, `.svelte-kit/`, `package/`, `dist/`],
    rules: {
      '@typescript-eslint/no-explicit-any': `error`,
      '@typescript-eslint/no-non-null-asserted-optional-chain': `error`,
      '@typescript-eslint/no-non-null-assertion': `error`,
      'no-unused-vars': `error`,
      'no-eval': `error`,
      eqeqeq: `error`,
      'no-var': `error`,
      'no-throw-literal': `error`,
      'no-useless-rename': `error`,
      'no-self-compare': `error`,
      'no-template-curly-in-string': `error`,
      'no-constructor-return': `error`,
      'no-console': [`error`, { allow: [`warn`, `error`] }],
      'no-inner-declarations': `error`,
      'default-param-last': `error`,
      'guard-for-in': `error`,
      'require-await': `error`,
      'eslint-plugin-unicorn/no-useless-spread': `error`,
      'eslint-plugin-unicorn/prefer-string-replace-all': `error`,
      'eslint-plugin-unicorn/catch-error-name': `error`,
      'eslint-plugin-unicorn/prefer-set-has': `error`,
      'eslint-plugin-unicorn/prefer-array-find': `error`,
      'eslint-plugin-unicorn/prefer-dom-node-append': `error`,
      'eslint-plugin-unicorn/prefer-global-this': `error`,
      'eslint-plugin-unicorn/no-lonely-if': `error`,
      'eslint-plugin-unicorn/no-negated-condition': `error`,
      'eslint-plugin-unicorn/no-typeof-undefined': `error`,
      'eslint-plugin-unicorn/prefer-optional-catch-binding': `error`,
      'eslint-plugin-unicorn/no-length-as-slice-end': `error`,
      'eslint-plugin-unicorn/prefer-node-protocol': `error`,
      'eslint-plugin-unicorn/prefer-regexp-test': `error`,
      'eslint-plugin-unicorn/throw-new-error': `error`,
      'eslint-plugin-unicorn/prefer-includes': `error`,
      'eslint-plugin-unicorn/prefer-type-error': `error`,
      'eslint-plugin-unicorn/prefer-date-now': `error`,
      'eslint-plugin-unicorn/require-number-to-fixed-digits-argument': `error`,
      'eslint-plugin-unicorn/no-useless-promise-resolve-reject': `error`,
      'eslint-plugin-import/no-duplicates': `error`,
      // Rules in enabled categories that are too noisy for this codebase
      'no-self-assign': `off`, // Svelte reactive `x = x` assignments
      'no-await-in-loop': `off`, // test code uses sequential await tick() in loops
      'no-shadow': `off`, // closures intentionally shadow outer names
      'eslint-plugin-unicorn/consistent-function-scoping': `off`, // test helpers + Svelte reactive closures
      'eslint-plugin-import/no-self-import': `off`,
      'eslint-plugin-import/no-unassigned-import': `off`, // CSS imports are side-effect-only
    },
  },
  plugins: [sveltekit(), live_examples()],

  test: {
    environment: `happy-dom`,
    css: true,
    coverage: {
      provider: `v8`,
      reporter: [`text`, `json-summary`],
      include: [`src/lib/*`],
    },
    include: [`tests/**/*.test.ts`],
    exclude: [`tests/playwright/**`], // Playwright tests run separately
  },

  resolve: {
    conditions: process.env.TEST ? [`browser`] : undefined,
  },

  server: {
    fs: { allow: [`..`] }, // needed to import from $root
    port: 3000,
  },

  preview: {
    port: 3000,
  },
})
