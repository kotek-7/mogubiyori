import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    // E2E requests are mocked in the browser and must never invoke the live model.
    proxy:
      mode === 'test'
        ? undefined
        : {
            // Keep the browser origin/Host together for the API's same-origin check.
            '/api': { target: 'http://127.0.0.1:8787', changeOrigin: false },
          },
  },
}))
