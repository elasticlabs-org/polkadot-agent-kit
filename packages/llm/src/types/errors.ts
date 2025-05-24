/**
 * Error codes used throughout the application.
 * Organized by category for better maintainability.
 */
export const ERROR_CODES = {
  LLM_CHAIN_NOT_AVAILABLE: 1001,
  LLM_CHAIN_NOT_SUPPORTED: 1002,
  LLM_INVALID_ADDRESS: 1003,
  LLM_ADDRESS_FORMAT_ERROR: 1004,
  LLM_INVALID_PARAMETERS: 1005,
  LLM_GENERIC_ERROR: 1006,
  LLM_INVALID_RESPONSE: 1007,
  LLM_INVALID_TOOL_CALL: 1008,
  LLM_INVALID_TOOL_CALL_ID: 1009
} as const

/**
 * Base interface for tool errors with numeric error codes.
 */
export interface ToolError extends Error {
  /** Numeric error code for programmatic handling */
  code: number
  /** Optional additional error details */
  details?: unknown
}

/**
 * Error thrown when a requested blockchain network is not available.
 * 
 * @example
 * ```typescript
 * throw new ChainNotAvailableError("invalid-chain", ["polkadot", "kusama"]);
 * // Error: Chain 'invalid-chain' not available. Available chains: polkadot, kusama
 * // error.code === 1001
 * ```
 */
export class ChainNotAvailableError extends Error implements ToolError {
  code = ERROR_CODES.LLM_CHAIN_NOT_AVAILABLE
  
  constructor(chain: string, availableChains: string[]) {
    super(`Chain '${chain}' not available. Available chains: ${availableChains.join(", ")}`)
    this.name = "ChainNotAvailableError"
  }
}

/**
 * Error thrown when an address format is invalid.
 * 
 * @example
 * ```typescript
 * throw new InvalidAddressError("invalid-address");
 * // Error: Invalid address: invalid-address
 * // error.code === 2001
 * ```
 */
export class InvalidAddressError extends Error implements ToolError {
  code = ERROR_CODES.LLM_INVALID_ADDRESS
  
  constructor(address: string) {
    super(`Invalid address: ${address}`)
    this.name = "InvalidAddressError"
  }
}

/**
 * Utility function to check if an error is a specific tool error.
 * 
 * @example
 * ```typescript
 * try {
 *   // some operation
 * } catch (error) {
 *   if (isToolError(error, ERROR_CODES.CHAIN_NOT_AVAILABLE)) {
 *     // Handle chain not available error
 *   }
 * }
 * ```
 */
export function isToolError(error: unknown, code: number): error is ToolError {
  return error instanceof Error && 'code' in error && error.code === code
}

/**
 * Type guard to check if an error is any tool error.
 */
export function isAnyToolError(error: unknown): error is ToolError {
  return error instanceof Error && 'code' in error && typeof error.code === 'number'
}

