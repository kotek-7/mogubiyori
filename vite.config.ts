import react from '@vitejs/plugin-react'
import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import { readRuntimeConfig } from './src/features/auth/runtimeConfig.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Validate the same settings the browser receives before building or serving.
  // Environment variables take precedence over values loaded from .env files.
  readRuntimeConfig({ ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env })

  return {
    plugins: [
      react(),
      tailwindcss(),
      ...(mode === 'test'
        ? []
        : [
            cloudflare({
              remoteBindings:
                process.env.CLOUDFLARE_REMOTE_BINDINGS === 'false'
                  ? false
                  : mode === 'cloudflare' || process.env.CLOUDFLARE_REMOTE_BINDINGS === 'true',
              inspectorPort: false,
            }),
          ]),
    ],
  }
})
