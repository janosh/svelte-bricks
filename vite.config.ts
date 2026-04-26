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
      pedantic: `error`,
    },
    ignorePatterns: [`build/`, `.svelte-kit/`, `package/`, `dist/`],
    rules: {
      // === Explicitly enabled rules (beyond categories) ===
      'no-unused-vars': `off`, // superseded by type-aware version below
      '@typescript-eslint/no-unused-vars': [
        `error`,
        { argsIgnorePattern: `^_`, varsIgnorePattern: `^_` },
      ],
      'no-console': [`error`, { allow: [`warn`, `error`] }],
      eqeqeq: `error`,
      'no-template-curly-in-string': `error`,
      'no-constructor-return': `error`,
      'default-param-last': `error`,
      'guard-for-in': `error`,
      'no-useless-computed-key': `error`,
      '@typescript-eslint/no-non-null-assertion': `error`,
      '@typescript-eslint/prefer-string-starts-ends-with': `error`,
      '@typescript-eslint/prefer-readonly': `error`,
      '@typescript-eslint/prefer-regexp-exec': `error`,
      '@typescript-eslint/prefer-find': `error`,
      '@typescript-eslint/no-redundant-type-constituents': `error`,
      'eslint-plugin-unicorn/prefer-array-find': `error`,
      'eslint-plugin-unicorn/no-typeof-undefined': `error`,
      'eslint-plugin-unicorn/prefer-optional-catch-binding': `error`,
      'eslint-plugin-unicorn/no-length-as-slice-end': `error`,
      'eslint-plugin-unicorn/prefer-node-protocol': `error`,
      'eslint-plugin-unicorn/throw-new-error': `error`,
      'eslint-plugin-unicorn/prefer-type-error': `error`,
      'eslint-plugin-unicorn/prefer-date-now': `error`,
      'eslint-plugin-unicorn/require-number-to-fixed-digits-argument': `error`,
      'eslint-plugin-unicorn/no-useless-promise-resolve-reject': `error`,
      'eslint-plugin-unicorn/custom-error-definition': `error`,
      'eslint-plugin-import/no-duplicates': `error`,
      // === Svelte framework patterns — NOT bugs ===
      'no-await-in-loop': `off`, // sequential await tick() in tests
      'prefer-const': `off`, // `let` needed for $state/$derived/$bindable
      'only-throw-error': `off`, // SvelteKit redirect() throws non-Error objects
      // === DOM/any propagation — oxlint lacks DOM type stubs ===
      '@typescript-eslint/no-unsafe-assignment': `off`,
      '@typescript-eslint/no-unsafe-call': `off`,
      '@typescript-eslint/no-unsafe-member-access': `off`,
      // === Pedantic rules too noisy for this codebase ===
      'no-inline-comments': `off`,
      'no-confusing-void-expression': `off`, // arrow shorthands returning void are fine
      'strict-boolean-expressions': `off`, // truthiness checks are idiomatic
      'max-lines-per-function': `off`,
      'max-lines': `off`,
      'eslint-plugin-jest/no-conditional-in-test': `off`, // parameterized tests use conditionals
      'eslint-plugin-unicorn/no-array-callback-reference': `off`, // passing named functions to .map() is cleaner
      'eslint-plugin-import/no-unassigned-import': `off`, // CSS side-effect imports
      '@typescript-eslint/prefer-readonly-parameter-types': `off`, // too noisy with DOM types and callbacks
      '@typescript-eslint/strict-void-return': `off`, // flags standard .forEach(() => map.set()) and vi.fn() patterns
    },
  },
  staged: {
    '*.{js,ts,svelte,html,css,md,json,yaml}': `vp check --fix`,
    '*.{ts,svelte}': `sh -c 'npx svelte-kit sync && npx svelte-check-rs --threshold error'`,
    '*.test.ts': `sh -c '! grep -E "(test|describe)\\.only\\(" "$@"' --`,
    '*': `codespell --ignore-words-list falsy --check-filenames`,
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
