import { defineConfig } from 'vitest/config'

// Unit tests never initialize workerd or call a remote AI binding.
export default defineConfig({
  test: {
    include: [
      'src/**/*.test.ts',
      'shared/**/*.test.ts',
      'worker/**/*.test.ts',
      'tests/**/*.test.ts',
    ],
  },
})
