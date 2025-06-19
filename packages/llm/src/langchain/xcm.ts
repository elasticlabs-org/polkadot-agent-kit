import { tool } from "@langchain/core/tools"
import type { Api, KnownChainId } from "@polkadot-agent-kit/common"
import { getDecimalsByChainId, parseUnits } from "@polkadot-agent-kit/common"
import { submitXcmTxWithKeypair, xcmTransferNativeAsset } from "@polkadot-agent-kit/core"
import type { z } from "zod"

import type { XcmTransferNativeAssetToolResult, xcmTransferNativeAssetSchema } from "../types"
import { ToolNames } from "../types/common"
import { toolConfigXcmTransferNativeAsset } from "../types/xcm"
import { executeTool, getApiForChain, validateAndFormatAddress } from "../utils"
import { KeyringPair } from "@polkadot/keyring/types"

/**
 * Returns a tool that transfers native tokens to a specific address to a destination chain via xcm
 * @param api - The API instance to use for the transfer
 * @returns A dynamic structured tool that transfers native tokens to the specified address to a destination chain via xcm
 */
export const xcmTransferNativeTool = (
  apis: Map<KnownChainId, Api<KnownChainId>>,
  signer: KeyringPair
) => {  
  return tool(async ({ amount, to, sourceChain, destChain }: z.infer<typeof xcmTransferNativeAssetSchema>) => {
    return executeTool<XcmTransferNativeAssetToolResult>(
      ToolNames.XCM_TRANSFER_NATIVE_ASSET,
      async () => {
        const api = getApiForChain(apis, sourceChain)
        const formattedAddress = validateAndFormatAddress(to, sourceChain as KnownChainId)
        const parsedAmount = parseUnits(amount, getDecimalsByChainId(sourceChain))
        console.log("Go to here");
        const xcmSubmittable = await xcmTransferNativeAsset(api, formattedAddress, parsedAmount, destChain as KnownChainId)
        console.log("xcmSubmittable", xcmSubmittable);
        const tx = await submitXcmTxWithKeypair(xcmSubmittable, signer)
        console.log("tx", tx);
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
  }, toolConfigXcmTransferNativeAsset)
}


