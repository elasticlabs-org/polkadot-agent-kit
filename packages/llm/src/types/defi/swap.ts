import type { DynamicStructuredTool } from "@langchain/core/tools"
import { z } from "zod"

import type { ToolConfig } from "../common"
import { ToolNames } from "../common"

/**
 * Schema for the swap tokens tool input.
 * Defines the structure and validation rules for token swap requests.
 *
 * Supports two main use cases:
 * 1. Cross-chain swap: Include `from` and `to` for one-click cross-chain swaps
 * 2. DEX-specific swap: Omit `from` and `to` for swaps within a specific DEX
 *
 * @example
 * Cross-chain swap (one-click):
 * ```typescript
 * {
 *   from: "Polkadot",
 *   to: "Hydration",
 *   currencyFrom: "DOT",
 *   currencyTo: "HDX",
 *   amount: "10000000000",
 *   receiver: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
 * }
 * ```
 *
 * @example
 * DEX-specific swap:
 * ```typescript
 * {
 *   currencyFrom: "HDX",
 *   currencyTo: "USDT",
 *   amount: "5000000000",
 *   dex: "HydrationDex",
 *   receiver: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
 * }
 * ```
 */
export const swapTokensToolSchema = z.object({
  from: z
    .string()
    .optional()
    .describe(
      "The source chain ID where the swap originates (e.g., 'Polkadot', 'Kusama', 'Hydra', 'AssetHubPolkadot'). Required for cross-chain swaps."
    ),
  to: z
    .string()
    .optional()
    .describe(
      "The destination chain ID where the swap completes (e.g., 'Polkadot', 'Kusama', 'Hydra', 'AssetHubPolkadot'). Required for cross-chain swaps."
    ),
  currencyFrom: z
    .string()
    .describe("The symbol of the token to swap from (e.g., 'DOT', 'KSM', 'HDX')"),
  currencyTo: z
    .string()
    .describe("The symbol of the token to swap to (e.g., 'DOT', 'KSM', 'HDX', 'USDT')"),
  amount: z.string().describe("The amount of the source token to swap"),
  receiver: z
    .string()
    .optional()
    .describe("Optional receiver address (defaults to sender if not provided)"),
  dex: z
    .string()
    .optional()
    .describe(
      "The name of the DEX to use for the swap (e.g., 'HydrationDex'). Required for DEX-specific swaps."
    )
})

/**
 * Type for a token swap tool that validates input using swapTokensToolSchema.
 * Supports both cross-chain swaps and DEX-specific swaps.
 *
 * @example
 * Cross-chain swap:
 * ```typescript
 * const swapTool: SwapTokensTool = swapTokensTool(apis, signer);
 * const result = await swapTool.invoke({
 *   from: "Polkadot",
 *   to: "Hydration",
 *   currencyFrom: "DOT",
 *   currencyTo: "HDX",
 *   amount: "10000000000"
 * });
 * ```
 *
 * @example
 * DEX-specific swap:
 * ```typescript
 * const swapTool: SwapTokensTool = swapTokensTool(apis, signer);
 * const result = await swapTool.invoke({
 *   currencyFrom: "HDX",
 *   currencyTo: "USDT",
 *   amount: "5000000000",
 *   dex: "HydrationDex"
 * });
 * ```
 */
export type SwapTokensTool = DynamicStructuredTool<typeof swapTokensToolSchema>

/**
 * Result returned by token swap tools.
 * Chain information is included for cross-chain swaps, omitted for DEX-specific swaps.
 *
 * @example
 * Cross-chain swap result:
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
 *
 * @example
 * DEX-specific swap result:
 * ```typescript
 * const result: SwapTokensToolResult = {
 *   success: true,
 *   transactionHash: "0x456...",
 *   fromCurrency: "HDX",
 *   toCurrency: "USDT",
 *   fromAmount: "5000000000",
 *   estimatedToAmount: "2500000000"
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
  /** The source chain where the swap originated (only for cross-chain swaps) */
  fromChain?: string
  /** The destination chain where the swap completed (only for cross-chain swaps) */
  toChain?: string
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
 * Supports both cross-chain swaps and DEX-specific swaps.
 *
 * @example
 * Cross-chain swap usage:
 * ```typescript
 * const tool = tool(async ({ from, to, currencyFrom, currencyTo, amount, receiver }) => {
 *   // cross-chain swap implementation using from/to chains
 * }, toolConfigSwapTokens);
 * ```
 *
 * @example
 * DEX-specific swap usage:
 * ```typescript
 * const tool = tool(async ({ currencyFrom, currencyTo, amount, receiver, dex }) => {
 *   // DEX-specific swap implementation using specified DEX
 * }, toolConfigSwapTokens);
 * ```
 */
export const toolConfigSwapTokens: ToolConfig = {
  name: ToolNames.SWAP_TOKENS,
  description:
    "Swap tokens either across different chains via XCM routing or within a specific DEX. Supports cross-chain swaps (with from/to chains) and DEX-specific swaps (with dex parameter).",
  schema: swapTokensToolSchema
}
