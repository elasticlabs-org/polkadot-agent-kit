import { tool } from "@langchain/core/tools"
import type { Api, KnownChainId } from "@polkadot-agent-kit/common"
import { getDecimalsByChainId, parseUnits } from "@polkadot-agent-kit/common"
import { submitAndWatchTx,transferNativeCall } from "@polkadot-agent-kit/core"
import type { PolkadotSigner } from "polkadot-api/signer"
import type { z } from "zod"

import type { TransferToolResult, transferToolSchema } from "../types"
import { ToolNames } from "../types/common"
import { toolConfigTransferNative } from "../types/transfer"
import { executeTool, getApiForChain, validateAndFormatAddress } from "../utils"
/**
 * Returns a tool that transfers native tokens to a specific address
 * @param api - The API instance to use for the transfer
 * @returns A dynamic structured tool that transfers native tokens to the specified address
 */
export const transferNativeTool = (
  apis: Map<KnownChainId, Api<KnownChainId>>,
  signer: PolkadotSigner
) => {
  return tool(async ({ amount, to, chain }: z.infer<typeof transferToolSchema>) => {
    return executeTool<TransferToolResult>(
      ToolNames.TRANSFER_NATIVE,
      async () => {
        const api = getApiForChain(apis, chain)
        const formattedAddress = validateAndFormatAddress(to, chain as KnownChainId)
        const parsedAmount = parseUnits(amount, getDecimalsByChainId(chain))
        const tx = await submitAndWatchTx(
          transferNativeCall(api, formattedAddress, parsedAmount),
          signer
        )
        if (tx.success) {
          return {
            success: tx.success,
            transactionHash: tx.transactionHash
          }
        } else {
          return {
            success: false,
            transactionHash: tx.transactionHash,
            error: tx.error
          }
        }
      },
      result => {
        if (result.success) {
          return `Tx Hash Successful: ${result.transactionHash}`
        } else {
          return `Tx Hash Failed: ${result.transactionHash} with error: ${result.error}`
        }
      }
    )
  }, toolConfigTransferNative)
}
