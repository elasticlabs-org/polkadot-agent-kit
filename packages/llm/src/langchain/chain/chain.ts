import { tool } from "@langchain/core/tools"
import type { KnownChainId } from "@polkadot-agent-kit/common"
import type { PolkadotApi } from "@polkadot-agent-kit/core"
import type { z } from "zod"

import type { initializeChainApiSchema, InitializeChainApiToolResult } from "../../types"
import { toolConfigInitializeChainApi } from "../../types/chain"
import { ToolNames } from "../../types/common"
import { executeTool } from "../../utils"

/**
 * Returns a tool that initializes a new chain API dynamically
 * @param polkadotApi - The PolkadotApi instance to use for chain initialization
 * @returns A dynamic structured tool that initializes chain APIs
 */
export const initializeChainApiTool = (polkadotApi: PolkadotApi) => {
  return tool(async ({ chainId }: z.infer<typeof initializeChainApiSchema>) => {
    return executeTool<InitializeChainApiToolResult>(
      ToolNames.INITIALIZE_CHAIN_API,
      async () => {
        const result = await polkadotApi.initializeChainApi(chainId as KnownChainId)
        return result as InitializeChainApiToolResult
      },
      result => {
        if (result.success) {
          return `Successfully initialized ${result.chainId} chain API. You can now use other tools with this chain.`
        } else {
          return `Error: Chain '${result.chainId}' is not initialized. ${result.error ? `Details: ${result.error}` : ""}`
        }
      }
    )
  }, toolConfigInitializeChainApi)
}
