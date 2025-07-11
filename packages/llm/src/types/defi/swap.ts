import type { DynamicStructuredTool } from "@langchain/core/tools"
import { z } from "zod"

import type { ToolConfig } from "../common"
import { ToolNames } from "../common"

/**
 * Schema for the swap tokens tool input.
 * Defines the structure and validation rules for token swap requests.
 *
 * @example
 * ```typescript
 * {
 *   from: "polkadot",
 *   to: "hydra", 
 *   currencyFrom: "DOT",
 *   currencyTo: "HDX",
 *   amount: "10000000000",
 *   sender: "senderAddress",
 *   receiver: "receiverAddress"
 * }
 * ```
 */
export const swapTokensToolSchema = z.object({
  from: z
    .string()
    .describe("The source chain ID where the swap originates (e.g., 'polkadot', 'kusama', 'hydra')"),
  to: z
    .string()
    .describe("The destination chain ID where the swap completes (e.g., 'polkadot', 'kusama', 'hydra')"),
  currencyFrom: z
    .string()
    .describe("The symbol of the token to swap from (e.g., 'DOT', 'KSM', 'HDX')"),
  currencyTo: z
    .string()
    .describe("The symbol of the token to swap to (e.g., 'DOT', 'KSM', 'HDX', 'USDT')"),
  amount: z
    .string()
    .describe("The amount of the source token to swap"),
  receiver: z
    .string()
    .optional()
    .describe("Optional receiver address (defaults to empty string if not provided)")
})

/**
 * Type for a token swap tool that validates input using swapTokensToolSchema.
 *
 * @example
 * ```typescript
 * const swapTool: SwapTokensTool = swapTokensTool(apis, signer);
 * const result = await swapTool.invoke({ 
 *   from: "polkadot", 
 *   to: "hydra",
 *   currencyFrom: "DOT",
 *   currencyTo: "HDX",
 *   amount: "10000000000"
 * });
 * ```
 */
export type SwapTokensTool = DynamicStructuredTool<typeof swapTokensToolSchema>

/**
 * Result returned by token swap tools.
 *
 * @example
 * ```typescript
 * const result: SwapTokensToolResult = {
 *   success: true,
 *   transactionHash: "0x123...",
 *   fromChain: "polkadot",
 *   toChain: "hydra",
 *   fromCurrency: "DOT",
 *   toCurrency: "HDX",
 *   fromAmount: "10000000000",
 *   estimatedToAmount: "5000000000"
 * };
 * ```
 */
export interface SwapTokensToolResult {
  /** Whether the swap was successful */
  success: boolean
  /** Transaction hash if successful */
  transactionHash?: string
  /** Error message if unsuccessful */
  error?: string
  /** The source chain where the swap originated */
  fromChain: string
  /** The destination chain where the swap completed */
  toChain: string
  /** The token symbol that was swapped from */
  fromCurrency: string
  /** The token symbol that was swapped to */
  toCurrency: string
  /** The amount of source tokens swapped */
  fromAmount: string
  /** The estimated amount of destination tokens received */
  estimatedToAmount?: string
}

/**
 * Configuration object for the token swap tool.
 * Used internally by LangChain to register and execute the tool.
 *
 * @example
 * ```typescript
 * const tool = tool(async ({ from, to, currencyFrom, currencyTo, amount, receiver }) => {
 *   // token swap implementation
 * }, toolConfigSwapTokens);
 * ```
 */
export const toolConfigSwapTokens: ToolConfig = {
  name: ToolNames.SWAP_TOKENS,
  description: "Swap tokens across different chains using the Hydration DEX through XCM routing",
  schema: swapTokensToolSchema
}
