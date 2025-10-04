import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['./tests/integration-tests/sdk.itest.ts'],
    exclude: ['./tests/integration-tests/sdk.mainnet.itest.ts'],
    testTimeout: 3500000,
    hookTimeout: 3500000,
    onConsoleLog: () => true,
    fileParallelism: false,
    poolOptions: {
      threads: {
        singleThread: true
      }
    },
  }
})