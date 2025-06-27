import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['./tests/integration-tests/**/*.itest.ts'],
    testTimeout: 300000,
    hookTimeout: 300000
  }
})

