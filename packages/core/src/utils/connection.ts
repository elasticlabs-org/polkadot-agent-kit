import type { ApiOptions} from "@polkadot/api/types"
import type { ApiInfo} from "@substrate/asset-transfer-api";
import {constructApiPromise } from "@substrate/asset-transfer-api"

interface ConnectionOptions extends ApiOptions {
  /** Timeout for each connection attempt in milliseconds (default: 10000) */
  timeout?: number
  /** Maximum number of attempts through all URLs (default: 3) */
  maxAttempts?: number
}

/**
 * Wraps constructApiPromise with timeout and round-robin WebSocket URL selection.
 * If a connection times out or fails, it automatically tries the next URL in the array.
 *
 * @param wsUrls - Array of WebSocket URLs to try
 * @param options - Connection options including timeout settings
 * @returns Promise that resolves to the API connection result
 * @throws Error if all connection attempts fail
 */
export const constructApiPromiseWithTimeout = async (
  wsUrls: string[],
  options: ConnectionOptions = {}
): Promise<ApiInfo> => {
  const { timeout = 10000, maxAttempts = 3, ...apiOptions } = options

  if (!wsUrls || wsUrls.length === 0) {
    throw new Error("No WebSocket URLs provided")
  }

  let currentUrlIndex = 0
  let attempt = 0
  const errors: Array<{ url: string; error: string; attempt: number }> = []

  while (attempt < maxAttempts) {
    const url = wsUrls[currentUrlIndex]
    attempt++

    try {
      const result = await connectWithTimeout(url, apiOptions, timeout)
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      errors.push({ url, error: errorMessage, attempt })

      currentUrlIndex = (currentUrlIndex + 1) % wsUrls.length
    }
  }

  // All attempts failed
  const errorSummary = errors.map(e => `  Attempt ${e.attempt}: ${e.url} - ${e.error}`).join("\n")

  throw new Error(
    `Failed to connect to any WebSocket URL after ${maxAttempts} attempts.\n` +
      `URLs tried: ${wsUrls.join(", ")}\n` +
      `Errors:\n${errorSummary}`
  )
}

/**
 * Creates a connection with timeout handling
 */
async function connectWithTimeout(
  url: string,
  apiOptions: ApiOptions,
  timeoutMs: number
): Promise<ApiInfo> {
  return new Promise((resolve, reject) => {
    // Set up timeout
    const timeoutId = setTimeout(() => {
      reject(new Error(`Connection timeout after ${timeoutMs}ms`))
    }, timeoutMs)

    constructApiPromise(url, apiOptions)
      .then(result => {
        clearTimeout(timeoutId)
        resolve(result)
      })
      .catch(error => {
        clearTimeout(timeoutId)
        reject(error instanceof Error ? error : new Error(String(error)))
      })
  })
}
