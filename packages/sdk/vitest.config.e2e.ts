import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['./tests/e2e/*.test.ts'],
    testTimeout: 1500000,
    hookTimeout: 1500000,
    poolOptions: {
      threads: {
        singleThread: true
      }
    }
  }
})