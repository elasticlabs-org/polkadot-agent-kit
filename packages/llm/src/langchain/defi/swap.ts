import { tool } from "@langchain/core/tools"
import { submitTxWithPolkadotSigner, swapTokens } from "@polkadot-agent-kit/core"
import type { PolkadotSigner } from "polkadot-api/signer"
import type { z } from "zod"

import { ToolNames } from "../../types/common"
import type { SwapTokensToolResult, swapTokensToolSchema } from "../../types/defi/swap"
import { toolConfigSwapTokens } from "../../types/defi/swap"
import { executeTool } from "../../utils"

/**
 * Returns a tool that swaps tokens either across different chains or within a specific DEX
 * Case 1: Cross-chain swap - provide 'from' and 'to' chains for XCM routing
 * Case 2: DEX-specific swap - omit 'from' and 'to', specify 'dex' for single DEX operation
 * @param signer - The Polkadot signer to use for the swap transaction
 * @param sender - The sender address for the swap
 * @returns A dynamic structured tool that executes token swaps
 */
export const swapTokensTool = (signer: PolkadotSigner, sender: string) => {
  return tool(
    async ({
      from = "",
      to = "",
      currencyFrom,
      currencyTo,
      amount,
      receiver: optionalReceiver,
      dex = "HydrationDex"
    }: z.infer<typeof swapTokensToolSchema>) => {
      return executeTool<SwapTokensToolResult>(
        ToolNames.SWAP_TOKENS,
        async () => {
          const swapSender = sender
          const swapReceiver = optionalReceiver ? optionalReceiver : sender
          const isCrossChainSwap = Boolean(from?.trim() && to?.trim())

          try {
            const routerPlan = await swapTokens(
              {
                from,
                to,
                currencyFrom,
                currencyTo,
                amount: amount,
                sender: swapSender,
                receiver: swapReceiver,
                dex: dex
              },
              signer,
              isCrossChainSwap
            )

            const swapTx = routerPlan[0].tx
            const tx = await submitTxWithPolkadotSigner(swapTx, signer)

            if (tx.success) {
              // Case 1: Cross-chain swap
              if (isCrossChainSwap) {
                return {
                  fromChain: from,
                  toChain: to,
                  fromCurrency: currencyFrom,
                  toCurrency: currencyTo,
                  fromAmount: amount,
                  success: true,
                  transactionHash: tx.transactionHash
                }
              }
              // Case 2: DEX-specific swap
              else {
                return {
                  fromCurrency: currencyFrom,
                  toCurrency: currencyTo,
                  fromAmount: amount,
                  success: true,
                  transactionHash: tx.transactionHash
                }
              }
            } else {
              // Handle failure case
              const baseResult = {
                fromCurrency: currencyFrom,
                toCurrency: currencyTo,
                fromAmount: amount,
                success: false,
                transactionHash: tx.transactionHash,
                error: tx.error
              }

              // Add chain info for cross-chain swaps
              return isCrossChainSwap ? { ...baseResult, fromChain: from, toChain: to } : baseResult
            }
          } catch (error) {
            const baseResult = {
              success: false,
              fromCurrency: currencyFrom,
              toCurrency: currencyTo,
              fromAmount: amount,
              error: error instanceof Error ? error.message : "Unknown error occurred"
            }

            // Add chain info for cross-chain swaps
            return isCrossChainSwap ? { ...baseResult, fromChain: from, toChain: to } : baseResult
          }
        },
        result => {
          // Format message based on swap type
          const baseMessage = `${result.fromAmount} ${result.fromCurrency} to ${result.toCurrency}`

          if (result.success) {
            if (result.fromChain && result.toChain) {
              // Cross-chain swap message
              return `Cross-chain swap successful: ${baseMessage} from ${result.fromChain} to ${result.toChain}. Tx Hash: ${result.transactionHash}`
            } else {
              // DEX-specific swap message
              return `DEX swap successful: ${baseMessage} on ${dex}. Tx Hash: ${result.transactionHash}`
            }
          } else {
            if (result.fromChain && result.toChain) {
              // Cross-chain swap error
              return `Cross-chain swap failed: ${baseMessage} from ${result.fromChain} to ${result.toChain}. Error: ${result.error}`
            } else {
              // DEX-specific swap error
              return `DEX swap failed: ${baseMessage} on ${dex}. Error: ${result.error}`
            }
          }
        }
      )
    },
    toolConfigSwapTokens
  )
}
