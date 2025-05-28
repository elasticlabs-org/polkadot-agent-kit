import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ToolConfig, ToolNames } from "../types";

/**
 * Schema for the transfer tool input.
 * Defines the structure and validation rules for token transfer requests.
 *
 * @example
 * ```typescript
 * {
 *   amount: "1.5",  // Amount of tokens to transfer
 *   to: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",  // Recipient address
 *   chain: "polkadot"  // Target chain
 * }
 * ```
 */
export const transferToolSchema = z.object({
    amount: z.string().describe("The amount of tokens to transfer"),
    to: z.string().describe("The address to transfer the tokens to"),
    chain: z.string().describe("The chain to transfer the tokens to")
})

/**
 * Type for a token transfer tool that validates input using transferToolSchema.
 * 
 * @example
 * ```typescript
 * const transferTool: TransferTool = transferNativeTool(apis);
 * const result = await transferTool.invoke({ amount: "1.5", to: "address", chain: "polkadot" });
 * ```
 */
export type TransferTool = DynamicStructuredTool<typeof transferToolSchema>

/**
 * Result returned by token transfer tools.
 * 
 * @example
 * ```typescript
 * const result: TransferResult = {
 *   amount: "1.5",
 *   address: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
 *   chain: "polkadot"
 * };
 * ```
 */
export interface TransferResult {
    /** The amount of tokens transferred */
    amount: string
    /** The recipient address */
    address: string
    /** The chain where the transfer occurred */
    chain: string
}

/**
 * Configuration object for the native token transfer tool.
 * Used internally by LangChain to register and execute the tool.
 * 
 * @example
 * ```typescript
 * const tool = tool(async ({ amount, to, chain }) => {
 *   // transfer implementation
 * }, toolConfigTransferNative);
 * ```
 */
export const toolConfigTransferNative: ToolConfig = {
    name: ToolNames.TRANSFER_NATIVE,
    description: "Transfer native tokens to a specific address",
    schema: transferToolSchema
}



