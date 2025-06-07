import { tool } from "@langchain/core/tools"
import type { Api, KnownChainId } from "@polkadot-agent-kit/common"
import { getDecimalsByChainId,parseUnits } from "@polkadot-agent-kit/common"
import { transferNativeCall } from "@polkadot-agent-kit/core"
import type { z } from "zod"

import type { TransferToolResult, transferToolSchema } from "../types"
import { toolConfigTransferNative, ToolNames } from "../types"
import { executeTool,getApiForChain, validateAndFormatMultiAddress } from "../utils"
/**
 * Returns a tool that transfers native tokens to a specific address
 * @param api The API instance to use for the transfer
 * @returns A dynamic structured tool that transfers native tokens to the specified address
 */
export const transferNativeTool = (apis: Map<KnownChainId, Api<KnownChainId>>) => {
  return tool(async ({ amount, to, chain }: z.infer<typeof transferToolSchema>) => {
    return executeTool<TransferResult>(
      ToolNames.TRANSFER_NATIVE,
      async () => {
        const api = getApiForChain(apis, chain)
        const formattedAddress = validateAndFormatMultiAddress(to, chain as KnownChainId)
        const parsedAmount = parseUnits(amount, getDecimalsByChainId(chain))

        await transferNativeCall(api, formattedAddress, parsedAmount)
        return {
          amount,
          address: String(formattedAddress.value),
          chain
        }
      },
      result => `Transferred ${result.amount} to ${result.address}`
    )
  }, toolConfigTransferNative)
}
