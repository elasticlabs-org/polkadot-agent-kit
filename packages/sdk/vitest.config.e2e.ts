import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['./tests/e2e/*.test.ts'],
    testTimeout: 1200000,
    hookTimeout: 1200000,
    poolOptions: {
      threads: {
        singleThread: true
      }
    }
  }
})