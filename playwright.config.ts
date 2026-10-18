import { defineConfig, devices } from '@playwright/test'

const PORT = 3100
const baseURL = `http://localhost:${PORT}`

// See specs/40-testing.md (TEST-001)
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,
  expect: { timeout: 7_000 },
  use: {
    baseURL,
    timezoneId: 'America/New_York',
    locale: 'en-US',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
      grepInvert: /@mobile/,
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'] },
      grepInvert: /@desktop|@kds/,
    },
  ],
  webServer: {
    command: 'pnpm build:e2e && pnpm start:e2e',
    url: `${baseURL}/api/health`,
    reuseExistingServer: !!process.env.PW_REUSE_SERVER,
    timeout: 300_000,
    env: {
      PORT: String(PORT),
      DATABASE_URI: 'file:./data/e2e.db',
      PAYLOAD_SECRET: 'e2e-secret-not-for-production',
      NEXT_PUBLIC_SITE_URL: baseURL,
      ENABLE_TEST_API: '1',
      E2E: '1',
    },
  },
})
