import type { DynamicStructuredTool } from "@langchain/core/tools"
import { getAllSupportedChains, isSupportedChain } from "@polkadot-agent-kit/common"
import { z } from "zod"

import type { ToolConfig } from "./common"
import { ToolNames } from "./common"

// Get supported chains dynamically
const supportedChains = getAllSupportedChains()
const supportedChainIds = supportedChains.map(chain => chain.id)

/**
 * Schema for the balance check tool input.
 * Validates against all dynamically loaded supported chains.
 */
export const balanceToolSchema = z.object({
  chain: z
    .string()
    .refine(chainId => isSupportedChain(chainId), {
      message: `Invalid chain. Must use exact chain ID from: ${supportedChainIds.join(", ")}`
    })
    .describe(
      `The exact chain ID to check balance on. MUST be one of: ${supportedChainIds.join(", ")}`
    )
})

/**
 * Type for a balance checking tool that validates input using balanceToolSchema.
 *
 * @example
 * ```typescript
 * const balanceTool: BalanceTool = checkBalanceTool(apis, address);
 * const result = await balanceTool.invoke({ chain: "polkadot" });
 * ```
 */
export type BalanceTool = DynamicStructuredTool<typeof balanceToolSchema>

/**
 * Result returned by balance checking tools.
 *
 * @example
 * ```typescript
 * const result: BalanceToolResult = {
 *   balance: "123.456",
 *   symbol: "DOT",
 *   chain: "polkadot"
 * };
 * ```
 */
export interface BalanceToolResult {
  /** The formatted balance amount as a string */
  balance: string
  /** The token symbol (e.g., "DOT", "KSM") */
  symbol: string
  /** The chain where the balance was checked */
  chain: string
}

/**
 * Configuration object for the balance checking tool.
 * Used internally by LangChain to register and execute the tool.
 *
 * @example
 * ```typescript
 * const tool = tool(async ({ chain }) => {
 *   // balance checking implementation
 * }, toolConfigBalance);
 * ```
 */
export const toolConfigBalance: ToolConfig = {
  name: ToolNames.CHECK_BALANCE,
  description: "Check balance of the wallet address on a specific chain",
  schema: balanceToolSchema
}
