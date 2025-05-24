import { DynamicStructuredTool } from "@langchain/core/tools"
import { z } from "zod"

/**
 * Enum for tool names used across the application.
 * These constants ensure consistency in tool naming and prevent typos.
 */
export enum ToolNames {
  /** Tool for checking native token balance */
  CHECK_BALANCE = "check_balance",
  /** Tool for transferring native tokens */
  TRANSFER_NATIVE = "transfer_native"
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

