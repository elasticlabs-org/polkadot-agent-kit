import { tool } from "@langchain/core/tools"
import { submitTxWithPolkadotSigner, swapCrossChainTokens } from "@polkadot-agent-kit/core"
import type { PolkadotSigner } from "polkadot-api/signer"
import type { z } from "zod"

import { ToolNames } from "../../types/common"
import type { SwapTokensToolResult,swapTokensToolSchema } from "../../types/defi/swap"
import { toolConfigSwapTokens } from "../../types/defi/swap"
import { executeTool } from "../../utils"

/**
 * Returns a tool that swaps tokens across different chains using the Hydration DEX
 * @param signer - The Polkadot signer to use for the swap transaction
 * @param sender - The sender address for the swap
 * @returns A dynamic structured tool that executes cross-chain token swaps
 */
export const swapCrossChainTokensTool = (signer: PolkadotSigner, sender: string) => {
  return tool(
    async ({
      from,
      to,
      currencyFrom,
      currencyTo,
      amount,
      receiver: optionalReceiver
    }: z.infer<typeof swapTokensToolSchema>) => {
      return executeTool<SwapTokensToolResult>(
        ToolNames.SWAP_TOKENS,
        async () => {
          const swapSender = sender
          const swapReceiver = optionalReceiver ? optionalReceiver : sender

          try {
            const routerPlan = await swapCrossChainTokens(
              {
                from,
                to,
                currencyFrom,
                currencyTo,
                amount: amount,
                sender: swapSender,
                receiver: swapReceiver
              },
              signer
            )

            const swapTx = routerPlan[0].tx
            const tx = await submitTxWithPolkadotSigner(swapTx, signer)

            if (tx.success) {
              return {
                fromChain: from,
                toChain: to,
                fromCurrency: currencyFrom,
                toCurrency: currencyTo,
                fromAmount: amount,
                success: true,
                transactionHash: tx.transactionHash
              }
            } else {
              return {
                fromChain: from,
                toChain: to,
                fromCurrency: currencyFrom,
                toCurrency: currencyTo,
                fromAmount: amount,
                success: false,
                transactionHash: tx.transactionHash,
                error: tx.error
              }
            }
          } catch (error) {
            return {
              success: false,
              fromChain: from,
              toChain: to,
              fromCurrency: currencyFrom,
              toCurrency: currencyTo,
              fromAmount: amount,
              error: error instanceof Error ? error.message : "Unknown error occurred"
            }
          }
        },
        result => {
          if (result.success) {
            return `Swap successful: ${result.fromAmount} ${result.fromCurrency} from ${result.fromChain} to ${result.toCurrency} on ${result.toChain}. Tx Hash: ${result.transactionHash}`
          } else {
            return `Swap failed: ${result.fromAmount} ${result.fromCurrency} from ${result.fromChain} to ${result.toCurrency} on ${result.toChain}. Error: ${result.error}`
          }
        }
      )
    },
    toolConfigSwapTokens
  )
}
