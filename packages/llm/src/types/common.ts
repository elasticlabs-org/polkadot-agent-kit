import type { z } from "zod"

import { MAX_RETRIES, RETRY_DELAY_MS, SWAP_TIMEOUT_MS } from "./constants"

/**
 * Enum for tool names used across the application.
 * These constants ensure consistency in tool naming and prevent typos.
 */
export enum ToolNames {
  /** Tool for checking native token balance */
  CHECK_BALANCE = "check_balance",
  /** Tool for transferring native tokens */
  TRANSFER_NATIVE = "transfer_native",
  /** Tool for transferring native tokens to a destination chain via xcm */
  XCM_TRANSFER_NATIVE_ASSET = "xcm_transfer_native_asset",
  /** Tool for dynamically initializing chain APIs */
  INITIALIZE_CHAIN_API = "initialize_chain_api",
  /** Tool for swapping tokens */
  SWAP_TOKENS = "swap_tokens",
  /** Tool for joining a nomination pool */
  JOIN_POOL = "join_pool",
  /** Tool for bonding extra tokens to a nomination pool */
  BOND_EXTRA = "bond_extra",
  /** Tool for unbonding tokens from a nomination pool */
  UNBOND = "unbond",
  /** Tool for withdrawing unbonded tokens from a nomination pool */
  WITHDRAW_UNBONDED = "withdraw_unbonded",
  /** Tool for claiming rewards from a nomination pool */
  CLAIM_REWARDS = "claim_rewards",
  /** Tool for getting nomination pool information */
  GET_POOL_INFO = "get_pool_info",
  /** Tool for registering an identity on People Chain */
  REGISTER_IDENTITY = "register_identity"
}

/**
 * Interface for tool configuration.
 * Defines the structure for configuring tools.
 *
 * @example
 * ```typescript
 * const config: ToolConfig = {
 *   name: "check_balance",
 *   description: "Check balance of the wallet address on a specific chain",
 *   schema: balanceToolSchema
 * }
 * ```
 */
export interface ToolConfig {
  /** The name of the tool */
  name: string
  /** Description of what the tool does */
  description: string
  /** Zod schema for validating tool inputs */
  schema: z.ZodType
}

export interface ToolResponse {
  content: string
  tool_call_id: string
}

/**
 * Executes operation with timeout and retry logic
 */
export async function withTimeoutAndRetry<T>(
  operation: () => Promise<T>,
  timeoutMs: number = SWAP_TIMEOUT_MS,
  maxRetries: number = MAX_RETRIES
): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
      })

      return await Promise.race([operation(), timeoutPromise])
    } catch (error) {
      lastError = error as Error

      if (attempt === maxRetries) break

      // Only retry on network/timeout errors
      if (
        lastError.message.includes("timeout") ||
        lastError.message.includes("network") ||
        lastError.message.includes("connection")
      ) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
        continue
      }

      break // Don't retry on other errors
    }
  }

  throw lastError!
}

export interface Action<TActionSchema extends z.ZodSchema = z.ZodSchema> {
  name: string
  description: string
  schema: TActionSchema
  invoke: (args: z.infer<TActionSchema>) => Promise<string>
}
