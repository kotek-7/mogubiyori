import { defineConfig } from '@playwright/test'
import { fileURLToPath } from 'node:url'

const port = process.env.PRESENTATION_VIDEO_PORT ?? '4202'

export default defineConfig({
  testDir: '.',
  testMatch: 'capture-videos.spec.ts',
  outputDir: '../../test-results/presentation-videos',
  workers: 1,
  retries: 0,
  timeout: 90_000,
  reporter: 'list',
  use: { baseURL: `http://127.0.0.1:${port}`, timezoneId: 'Asia/Tokyo' },
  webServer: {
    cwd: fileURLToPath(new URL('../..', import.meta.url)),
    command: `pnpm exec vite --mode test --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    env: { VITE_GAME_MODE: 'local' },
    timeout: 30_000,
  },
})
