import { defineConfig } from 'vitest/config'

// Unit tests never initialize workerd or call a remote AI binding.
export default defineConfig({
  test: { include: ['tests/**/*.test.ts'], exclude: ['tests/e2e/**'] },
})
