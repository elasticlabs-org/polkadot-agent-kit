import { tool } from "@langchain/core/tools"
import type { KeyringPair } from "@polkadot/keyring/types"
import type { Api, KnownChainId } from "@polkadot-agent-kit/common"
import { getDecimalsByChainId, parseUnits } from "@polkadot-agent-kit/common"
import { submitTxWithPolkadotSigner, submitXcmTxWithKeypair, xcmTransferNativeAsset } from "@polkadot-agent-kit/core"
import type { z } from "zod"

import type { xcmTransferNativeAssetSchema, XcmTransferNativeAssetToolResult } from "../types"
import { ToolNames } from "../types/common"
import { toolConfigXcmTransferNativeAsset } from "../types/xcm"
import { executeTool, getApiForChain, validateAndFormatAddress } from "../utils"
import { PolkadotSigner } from "polkadot-api/signer"

/**
 * Returns a tool that transfers native tokens to a specific address to a destination chain via xcm
 * @param api - The API instance to use for the transfer
 * @returns A dynamic structured tool that transfers native tokens to the specified address to a destination chain via xcm
 */
export const xcmTransferNativeTool = (
  signer: PolkadotSigner,
  sender: string,
) => {
  return tool(
    async ({
      amount,
      to,
      sourceChain,
      destChain
    }: z.infer<typeof xcmTransferNativeAssetSchema>) => {
      return executeTool<XcmTransferNativeAssetToolResult>(
        ToolNames.XCM_TRANSFER_NATIVE_ASSET,
        async () => {
          const formattedAddress = validateAndFormatAddress(to, sourceChain as KnownChainId)
          const parsedAmount = parseUnits(amount, getDecimalsByChainId(sourceChain))
          const xcmTx = await xcmTransferNativeAsset(
            sourceChain as KnownChainId,
            destChain as KnownChainId,
            sender,
            formattedAddress,
            parsedAmount
          )
          const tx = await submitTxWithPolkadotSigner(xcmTx, signer)
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
    },
    toolConfigXcmTransferNativeAsset
  )
}
