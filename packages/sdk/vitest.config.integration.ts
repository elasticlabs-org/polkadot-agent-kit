import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['./tests/integration-tests/**/*.itest.ts'],
    testTimeout: 20000,
    hookTimeout: 30000
  }
})

