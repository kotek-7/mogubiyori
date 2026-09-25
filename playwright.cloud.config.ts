import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/cloud',
  outputDir: './test-results/cloud-4190',
  fullyParallel: true,
  workers: 2,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4190',
    viewport: { width: 1100, height: 1000 },
    timezoneId: 'Asia/Tokyo',
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  },
  webServer: {
    command: 'pnpm exec vite --mode test --host 127.0.0.1 --port 4190 --strictPort',
    url: 'http://127.0.0.1:4190',
    reuseExistingServer: false,
    env: {
      VITE_GAME_MODE: 'cloud',
      VITE_SUPABASE_URL: 'https://cloud-test.invalid',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key',
      VITE_GOOGLE_AUTH_ENABLED: process.env.E2E_GOOGLE_AUTH_ENABLED ?? 'true',
    },
  },
})
