import type { DynamicStructuredTool } from "@langchain/core/tools"
import { z } from "zod"

import type { BaseToolCallResult, ToolConfig } from "./common"
import { ToolNames } from "./common"

export const mintVdotSchema = z.object({
  amount: z.string().describe("The amount of DOT to stake (in DOT units, e.g., '1.5' for 1.5 DOT)")
})

export const toolConfigMintVdot: ToolConfig = {
  name: ToolNames.MINT_VDOT,
  description: "Mint vDOT tokens by staking DOT on Bifrost",
  schema: mintVdotSchema
}

export type MintVdotTool = DynamicStructuredTool<typeof mintVdotSchema>

export type MintVdotToolResult = BaseToolCallResult
