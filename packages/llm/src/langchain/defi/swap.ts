import { tool } from "@langchain/core/tools"
import type { KnownChainId } from "@polkadot-agent-kit/common"
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
          // Use provided sender/receiver or fall back to defaults
          const swapSender =  sender
          const swapReceiver = optionalReceiver || sender

          // Validate addresses
          const formattedSender = validateAndFormatAddress(swapSender, from as KnownChainId)
          const formattedReceiver = validateAndFormatAddress(swapReceiver, to as KnownChainId)



          // TODO: Execute the router plan transactions
          // The RouterPlan structure and execution method need to be investigated
          // from the @paraspell/xcm-router documentation or source code
          
          // For now, we'll return a placeholder success response
          // This should be updated once we understand how to execute TRouterPlan
          try {
            // Placeholder: In a real implementation, we would execute the routerPlan here
            // Example: await routerPlan.execute() or similar method
            const routerPlan = await swapTokens(
                {
                  from,
                  to,
                  currencyFrom,
                  currencyTo,
                  amount,
                  sender: formattedSender,
                  receiver: formattedReceiver
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
