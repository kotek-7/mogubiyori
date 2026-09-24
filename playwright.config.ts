import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: `test-results/local-${process.env.E2E_PORT ?? '4173'}`,
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: `http://127.0.0.1:${process.env.E2E_PORT ?? '4173'}`,
    viewport: { width: 1440, height: 1000 },
    timezoneId: 'Asia/Tokyo',
    trace: 'retain-on-failure',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  },
  webServer: {
    command: `pnpm exec vite --mode test --host 127.0.0.1 --port ${process.env.E2E_PORT ?? '4173'} --strictPort`,
    url: `http://127.0.0.1:${process.env.E2E_PORT ?? '4173'}`,
    reuseExistingServer: false,
    env: { VITE_GAME_MODE: 'local' },
  },
})
