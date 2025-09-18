import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['./tests/integration-tests/sdk.itest.ts'],
    exclude: ['./tests/integration-tests/sdk.mainnet.itest.ts'],
    testTimeout: 600000,
    hookTimeout: 600000,
    onConsoleLog: () => true,
  }
})