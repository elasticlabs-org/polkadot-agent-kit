import type { DynamicStructuredTool } from "@langchain/core/tools"
import { z } from "zod"

import type { ToolConfig } from "../types"
import { ToolNames } from "./common"


export const xcmTransferNativeAssetSchema = z.object({
  amount: z.string().describe("The amount of tokens to transfer"),
  to: z.string().describe("The address to transfer the tokens to"),
  sourceChain: z.string().describe("The source chain to transfer the tokens from"),
  destChain: z.string().describe("The destination chain to transfer the tokens to")
})

/**
 * Type for a token transfer tool that validates input using xcmTransferNativeAssetSchema.
 *
 * @example
 * ```typescript
 * const xcmTransferNativeAssetTool: XcmTransferNativeAssetTool = xcmTransferNativeAssetTool(apis);
 * const result = await xcmTransferNativeAssetTool.invoke({ amount: "1.5", to: "address", sourceChain: "polkadot", destChain: "AssetHub" });
 * ```
 */
export type XcmTransferNativeAssetTool = DynamicStructuredTool<typeof xcmTransferNativeAssetSchema>

/**
 * The result of a transfer tool operation.
 */
export interface XcmTransferNativeAssetToolResult {
  /**
   * Indicates whether the transfer was successful.
   */
  success: boolean

  /**
   * The transaction hash if the transfer was submitted successfully.
   * This may be undefined if the transfer failed.
   */
  transactionHash?: string

  /**
   * An error message if the transfer failed.
   * This will be undefined if the transfer was successful.
   */
  error?: string
}

/**
 * Configuration object for the native token transfer tool via xcm
 * Used internally by LangChain to register and execute the tool.
 *
 * @example
 * ```typescript
 * const tool = tool(async ({ amount, to, sourceChain, destChain }) => {
 *   // transfer implementation
 * }, toolConfigXcmTransferNativeAsset);
 * ```
 */
export const toolConfigXcmTransferNativeAsset: ToolConfig = {
  name: ToolNames.XCM_TRANSFER_NATIVE_ASSET,
  description: "Transfer native tokens to a specific address to a destination chain via xcm",
  schema: xcmTransferNativeAssetSchema
}
