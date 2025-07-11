import { tool } from "@langchain/core/tools"
import { getDecimalsByChainId, parseUnits, type KnownChainId } from "@polkadot-agent-kit/common"
import { submitTxWithPolkadotSigner, swapTokens } from "@polkadot-agent-kit/core"
import type { PolkadotSigner } from "polkadot-api/signer"
import type { z } from "zod"

import type { swapTokensToolSchema, SwapTokensToolResult } from "../../types/defi/swap"
import { ToolNames } from "../../types/common"
import { toolConfigSwapTokens } from "../../types/defi/swap"
import { executeTool, validateAndFormatAddress } from "../../utils"

/**
 * Returns a tool that swaps tokens across different chains using the Hydration DEX
 * @param signer - The Polkadot signer to use for the swap transaction
 * @param sender - The sender address for the swap
 * @returns A dynamic structured tool that executes cross-chain token swaps
 */
export const swapTokensTool = (signer: PolkadotSigner, sender: string) => {
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

          const swapSender =  sender
          const swapReceiver = optionalReceiver ? optionalReceiver : sender
          const formattedAmount = parseUnits(amount, 10)

          try {
            const routerPlan = await swapTokens(
                {
                  from,
                  to,
                  currencyFrom,
                  currencyTo,
                  amount: BigInt(formattedAmount).toString(),
                  sender: swapSender,
                  receiver: swapReceiver
                },
                signer
              )
    
              const swapTx = routerPlan[0].tx
              const tx = await submitTxWithPolkadotSigner(swapTx, signer);

              if (tx.success) {
                return {
                  fromChain: from,
                  toChain: to,
                  fromCurrency: currencyFrom,
                  toCurrency: currencyTo,
                  fromAmount: formattedAmount.toString(),
                  success: true,
                  transactionHash: tx.transactionHash
                }
              } else {
                return {
                  fromChain: from,
                  toChain: to,
                  fromCurrency: currencyFrom,
                  toCurrency: currencyTo,
                  fromAmount: formattedAmount.toString(),
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
              fromAmount: formattedAmount.toString(),
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
