import { defineConfig } from '@playwright/test'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
const port = process.env.PRESENTATION_SCREEN_PORT ?? '4201'

export default defineConfig({
  testDir: '.',
  testMatch: 'capture-screens.spec.ts',
  outputDir: `${root}/test-results/presentation-screens`,
  workers: 1,
  timeout: 240_000,
  reporter: 'list',
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    timezoneId: 'Asia/Tokyo',
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `pnpm exec vite --mode test --host 127.0.0.1 --port ${port} --strictPort`,
    cwd: root,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    env: { VITE_GAME_MODE: 'local' },
  },
})
