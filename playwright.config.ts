import type { PlaywrightTestConfig } from '@playwright/test'

export default {
  webServer: {
    command: `npx vp dev --port 3005`,
    port: 3005,
    reuseExistingServer: true,
  },
  workers: 8,
  testDir: `tests/playwright`,
  use: {
    baseURL: `http://localhost:3005`,
  },
} satisfies PlaywrightTestConfig
