import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['./tests/e2e/*.test.ts'],
    testTimeout: 60000,
    hookTimeout: 60000,
    poolOptions: {
      threads: {
        singleThread: true
      }
    }
  }
})