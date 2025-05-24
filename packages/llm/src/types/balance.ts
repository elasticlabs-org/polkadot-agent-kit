import { DynamicStructuredTool } from "@langchain/core/tools"
import { ToolConfig, ToolNames } from "../types"
import { z } from "zod"

/**
 * Schema for the balance check tool input.
 * Defines the structure and validation rules for balance check requests.
 *
 * @example
 * ```typescript
 * {
 *   chain: "polkadot"  // Chain to check balance on
 * }
 * ```
 */
export const balanceToolSchema = z.object({
    chain: z
        .string()
        .describe(
            "The chain name to check balance on (e.g., 'polkadot', 'kusama', 'west', 'westend_asset_hub')"
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



