import { tool } from "@langchain/core/tools"
import {
  submitTxWithPolkadotSigner,
  waitForVerification,
  xcmTransferNativeAsset
} from "@polkadot-agent-kit/core"
import type { PolkadotSigner } from "polkadot-api/signer"
import type { z } from "zod"

import type { xcmTransferNativeAssetSchema, XcmTransferNativeAssetToolResult } from "../../types"
import { ToolNames } from "../../types/common"
import { toolConfigXcmTransferNativeAsset } from "../../types/xcm"
import { executeTool } from "../../utils"

/**
 * Returns a tool that transfers native tokens to a specific address to a destination chain via xcm
 * @param api - The API instance to use for the transfer
 * @returns A dynamic structured tool that transfers native tokens to the specified address to a destination chain via xcm
 */
export const xcmTransferNativeTool = (signer: PolkadotSigner, sender: string) => {
  return tool(
    async ({
      amount,
      to,
      sourceChain,
      destChain,
      verifyWithHyperbridge
    }: z.infer<typeof xcmTransferNativeAssetSchema>) => {
      return executeTool<XcmTransferNativeAssetToolResult>(
        ToolNames.XCM_TRANSFER_NATIVE_ASSET,
        async () => {
          const xcmTx = await xcmTransferNativeAsset(sourceChain, destChain, sender, to, amount)

          if (!xcmTx.success) {
            return {
              success: false,
              error: xcmTx.error
            }
          }

          const tx = await submitTxWithPolkadotSigner(xcmTx.transaction!, signer)
          if (!tx.success) {
            return {
              success: false,
              transactionHash: tx.transactionHash,
              error: tx.error
            }
          }

          // If verification is requested, wait for Hyperbridge confirmation
          if (verifyWithHyperbridge && tx.transactionHash) {
            try {
              // Convert chain names to format expected by Hyperbridge
              const sourceChainId = sourceChain.toLowerCase().replace(/\s+/g, "_")
              const destChainId = destChain.toLowerCase().replace(/\s+/g, "_")

              const verificationResult = await waitForVerification(
                tx.transactionHash,
                sourceChainId,
                destChainId
              )

              if (!verificationResult.success) {
                return {
                  success: true,
                  transactionHash: tx.transactionHash,
                  error: `Transaction sent but verification failed: ${verificationResult.error || "Unknown error"}`
                }
              }

              // Successful transfer with verification
              return {
                success: true,
                transactionHash: tx.transactionHash,
                verified: true,
                verificationStatus: verificationResult.status
              }
            } catch (verifyError) {
              // Transaction was successful but verification failed
              return {
                success: true,
                transactionHash: tx.transactionHash,
                error: `Transaction sent but verification error: ${verifyError instanceof Error ? verifyError.message : String(verifyError)}`
              }
            }
          }

          // Successful transfer without verification
          return {
            success: true,
            transactionHash: tx.transactionHash
          }
        },
        result => {
          if (result.success) {
            let message = `✅ XCM Transfer Successful!\n\nTransaction Hash: ${result.transactionHash}\n`

            if ((result as any).verified) {
              message += `\n🔒 Verification Status: ${(result as any).verificationStatus}\n`
              message += `Cross-chain message has been verified by Hyperbridge.`
            }

            if (result.error) {
              message += `\n⚠️ Note: ${result.error}`
            }

            return message
          } else {
            return `❌ XCM Transfer Failed\n\nTransaction Hash: ${result.transactionHash}\nError: ${result.error}`
          }
        }
      )
    },
    toolConfigXcmTransferNativeAsset
  )
}
