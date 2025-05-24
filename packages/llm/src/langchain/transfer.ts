import { DynamicStructuredTool, tool } from "@langchain/core/tools"
import { z } from "zod"
import { transferNativeCall } from "@polkadot-agent-kit/core"
import {
  Api,
  getAllSupportedChains,
  getChainById,
  KnownChainId,
  parseUnits,
  getDecimalsByChainId
} from "@polkadot-agent-kit/common"
import { getApiForChain, validateAndFormatMultiAddress, executeTool } from "../utils"
import { toolConfigTransferNative, ToolNames, TransferResult, transferToolSchema } from "../types"


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
