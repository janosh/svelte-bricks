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
    plugins: [`oxc`, `typescript`, `unicorn`, `import`, `vitest`],
    options: { typeAware: true, typeCheck: true },
    categories: {
      correctness: `error`,
      suspicious: `error`,
      perf: `error`,
    },
    ignorePatterns: [`build/**`, `.svelte-kit/**`, `package/**`, `dist/**`],
    rules: {
      // === Explicitly enabled rules (beyond categories) ===
      'no-unused-vars': `off`, // superseded by type-aware version below
      '@typescript-eslint/no-unused-vars': [
        `error`,
        { argsIgnorePattern: `^_`, varsIgnorePattern: `^_` },
      ],
      '@typescript-eslint/no-explicit-any': `error`,
      '@typescript-eslint/no-non-null-asserted-optional-chain': `error`,
      '@typescript-eslint/no-non-null-assertion': `error`,
      '@typescript-eslint/prefer-string-starts-ends-with': `error`,
      '@typescript-eslint/prefer-readonly': `error`,
      '@typescript-eslint/prefer-regexp-exec': `error`,
      '@typescript-eslint/prefer-find': `error`,
      '@typescript-eslint/no-redundant-type-constituents': `error`,
      '@typescript-eslint/strict-void-return': `error`,
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
      'no-useless-computed-key': `error`,
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
      'eslint-plugin-unicorn/custom-error-definition': `error`,
      'eslint-plugin-import/no-duplicates': `error`,
      'eslint-plugin-vitest/prefer-strict-boolean-matchers': `error`,
      'eslint-plugin-vitest/prefer-called-exactly-once-with': `error`,
      'eslint-plugin-vitest/require-awaited-expect-poll': `error`,
      'eslint-plugin-vitest/valid-expect': [`error`, { maxArgs: 2 }], // Vitest supports expect(actual, message)
    },
  },
  staged: {
    '*.{js,ts,svelte,html,css,md,json,yaml}': `vp check --fix`,
    '*.{ts,svelte}': `sh -c 'npx svelte-kit sync && npx svelte-check-rs --threshold error'`,
    '*.test.ts': `sh -c '! grep -E "(test|describe)\\.only\\(" "$@"' --`,
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
    // Vitest component tests need Svelte's browser build for mount().
    conditions: [`browser`],
  },

  server: {
    fs: { allow: [`..`] }, // needed to import from $root
    port: 3000,
  },

  preview: {
    port: 3000,
  },

  build: {
    // Default cssTarget is chrome111 which doesn't support light-dark(),
    cssTarget: `esnext`, // causing LightningCSS to polyfill it with broken space toggles
  },
})
