import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir:    './e2e',
  globalSetup: './e2e/global-setup.ts',
  timeout:    30_000,
  retries:    process.env.CI ? 2 : 0,
  reporter:   process.env.CI ? 'github' : 'list',
  use: {
    baseURL:       process.env.BASE_URL ?? 'http://localhost:3000',
    screenshot:    'only-on-failure',
    video:         'retain-on-failure',
    trace:         'retain-on-failure',
    actionTimeout: 10_000,
  },
  projects: [
    {
      name: 'chromium',
      use:  { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.CI
    ? undefined
    : {
        command:              'pnpm --filter @etsy-analyzer/web dev',
        url:                  'http://localhost:3000',
        reuseExistingServer:  true,
        timeout:              60_000,
      },
})
