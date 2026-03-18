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
      'no-unused-vars': `off`,
      '@typescript-eslint/no-unused-vars': [
        `error`,
        { argsIgnorePattern: `^_`, varsIgnorePattern: `^_` },
      ],
      'no-console': [`error`, { allow: [`warn`, `error`] }],
      'no-self-assign': `off`,
      'no-await-in-loop': `off`,
      'no-shadow': `off`,
      'prefer-const': `off`,
      '@typescript-eslint/no-unnecessary-condition': `off`,
      '@typescript-eslint/consistent-type-imports': `off`,
      'eslint-plugin-unicorn/consistent-function-scoping': `off`,
      '@typescript-eslint/no-unsafe-argument': `off`,
      '@typescript-eslint/no-unsafe-assignment': `off`,
      '@typescript-eslint/no-unsafe-call': `off`,
      '@typescript-eslint/no-unsafe-member-access': `off`,
      '@typescript-eslint/no-unsafe-return': `off`,
      'no-inline-comments': `off`,
      'no-confusing-void-expression': `off`,
      'no-promise-executor-return': `off`,
      'strict-boolean-expressions': `off`,
      'max-lines-per-function': `off`,
      'max-lines': `off`,
      'max-depth': `off`,
      'max-classes-per-file': `off`,
      'sort-vars': `off`,
      'eslint-plugin-jest/no-conditional-in-test': `off`,
      'eslint-plugin-unicorn/no-array-callback-reference': `off`,
      'eslint-plugin-unicorn/no-useless-undefined': `off`,
      'eslint-plugin-unicorn/no-object-as-default-parameter': `off`,
      'eslint-plugin-import/no-self-import': `off`,
      'eslint-plugin-import/no-unassigned-import': `off`,
      'eslint-plugin-import/max-dependencies': `off`,
      'only-throw-error': `off`, // SvelteKit redirect() throws non-Error objects
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
