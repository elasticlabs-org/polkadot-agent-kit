import type { DynamicStructuredTool } from "@langchain/core/tools"
import { z } from "zod"

import type { BaseToolCallResult, ToolConfig } from "./common"
import { ToolNames } from "./common"

export const xcmTransferNativeAssetSchema = z.object({
  amount: z.string().describe("The amount of tokens to transfer"),
  to: z.string().describe("The address to transfer the tokens to"),
  sourceChain: z
    .string()
    .describe(
      "The source chain in ParaSpell format (e.g., 'AssetHubWestend', 'PeopleWestend', 'Polkadot')"
    ),
  destChain: z
    .string()
    .describe(
      "The destination chain in ParaSpell format (e.g., 'AssetHubWestend', 'PeopleWestend', 'Polkadot')"
    )
})

/**
 * Type for a token transfer tool that validates input using xcmTransferNativeAssetSchema.
 *
 * @example
 * ```typescript
 * const xcmTransferNativeAssetTool: XcmTransferNativeAssetTool = xcmTransferNativeAssetTool(apis);
 * const result = await xcmTransferNativeAssetTool.invoke({ amount: "1.5", to: "address", sourceChain: "Polkadot", destChain: "AssetHubPolkadot" });
 * ```
 */
export type XcmTransferNativeAssetTool = DynamicStructuredTool<typeof xcmTransferNativeAssetSchema>

export type XcmTransferNativeAssetToolResult = BaseToolCallResult

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
