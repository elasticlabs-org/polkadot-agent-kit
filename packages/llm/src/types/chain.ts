import type { DynamicStructuredTool } from "@langchain/core/tools"
import { z } from "zod"

import type { ToolConfig } from "./common"
import { ToolNames } from "./common"

/**
 * Schema for the chain initialization tool input.
 * Defines the structure and validation rules for chain initialization requests.
 *
 * @example
 * ```typescript
 * {
 *   chainId: "kusama"  // Chain ID to initialize
 * }
 * ```
 */
export const initializeChainApiSchema = z.object({
  chainId: z
    .string()
    .describe(
      "The chain ID to initialize (e.g., 'polkadot', 'kusama', 'west', 'polkadot_asset_hub', 'west_asset_hub')"
    )
})

/**
 * Type for chain initialization tool result.
 * Structure returned by the chain initialization operation.
 */
export interface InitializeChainApiToolResult {
  success: boolean
  chainId: string
  message: string
  error?: string
}

/**
 * Type for chain initialization tool as a LangChain DynamicStructuredTool.
 */
export type InitializeChainApiTool = DynamicStructuredTool

/**
 * Configuration object for the chain initialization tool.
 * Used internally by LangChain to register and execute the tool.
 *
 * @example
 * ```typescript
 * const tool = tool(async ({ chainId }) => {
 *   // chain initialization implementation
 * }, toolConfigInitializeChainApi);
 * ```
 */
export const toolConfigInitializeChainApi: ToolConfig = {
  name: ToolNames.INITIALIZE_CHAIN_API,
  description:
    "Initialize a new blockchain API for the agent to interact with. Use this when other tools fail due to missing chain API.",
  schema: initializeChainApiSchema
}
