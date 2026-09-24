import react from '@vitejs/plugin-react'
import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    ...(mode === 'test'
      ? []
      : [
          cloudflare({
            remoteBindings: process.env.CLOUDFLARE_REMOTE_BINDINGS !== 'false',
            inspectorPort: false,
          }),
        ]),
  ],
}))
