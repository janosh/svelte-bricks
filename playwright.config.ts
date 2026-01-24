import type { PlaywrightTestConfig } from '@playwright/test'

export default {
  webServer: {
    command: `vite dev --port 3005`,
    port: 3005,
    reuseExistingServer: true,
    timeout: 60_000, // Allow 1 min for dev server to start on CI
  },
  workers: 4, // Parallel test workers
  timeout: 30_000, // Global timeout per test
  testDir: `tests/playwright`,
  use: {
    baseURL: `http://localhost:3005`,
  },
} satisfies PlaywrightTestConfig
