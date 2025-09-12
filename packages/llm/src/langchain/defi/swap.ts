import { tool } from "@langchain/core/tools"
import { submitTxWithPolkadotSigner, swapTokens } from "@polkadot-agent-kit/core"
import type { PolkadotSigner } from "polkadot-api/signer"
import type { z } from "zod"

import { ToolNames } from "../../types/common"
import { withTimeoutAndRetry } from "../../types/common"
import { DEFAULT_DEX, UNKNOWN_ERROR_MESSAGE } from "../../types/constants"
import type { SwapContext, TransactionResult } from "../../types/defi"
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
  return tool(async (input: z.infer<typeof swapTokensToolSchema>) => {
    return executeTool<SwapTokensToolResult>(
      ToolNames.SWAP_TOKENS,
      async () => {
        const swapContext = createSwapContext(input, sender)

        try {
          const transactionResult = await withTimeoutAndRetry(async () => {
            const routerPlan = await executeSwap(swapContext, signer)
            const swapTx = routerPlan[0].tx
            return await submitTxWithPolkadotSigner(swapTx, signer)
          })

          return createSwapResult(swapContext, transactionResult)
        } catch (error) {
          return createErrorResult(swapContext, error)
        }
      },
      result => formatSwapMessage(result, input.dex || DEFAULT_DEX)
    )
  }, toolConfigSwapTokens)
}

/**
 * Creates swap context from input parameters
 */
function createSwapContext(
  input: z.infer<typeof swapTokensToolSchema>,
  sender: string
): SwapContext {
  const {
    from = "",
    to = "",
    currencyFrom,
    currencyTo,
    amount,
    receiver: optionalReceiver,
    dex = DEFAULT_DEX
  } = input

  return {
    from,
    to,
    currencyFrom,
    currencyTo,
    amount,
    sender,
    receiver: optionalReceiver || sender,
    dex,
    isCrossChainSwap: Boolean(from?.trim() && to?.trim())
  }
}

/**
 * Executes the swap transaction
 */
async function executeSwap(context: SwapContext, signer: PolkadotSigner) {
  return await swapTokens(
    {
      from: context.from,
      to: context.to,
      currencyFrom: context.currencyFrom,
      currencyTo: context.currencyTo,
      amount: context.amount,
      sender: context.sender,
      receiver: context.receiver,
      dex: context.dex
    },
    signer,
    context.isCrossChainSwap
  )
}

/**
 * Creates successful or failed swap result
 */
function createSwapResult(
  context: SwapContext,
  transactionResult: TransactionResult
): SwapTokensToolResult {
  const baseResult = {
    fromCurrency: context.currencyFrom,
    toCurrency: context.currencyTo,
    fromAmount: context.amount,
    success: transactionResult.success,
    transactionHash: transactionResult.transactionHash,
    ...(transactionResult.error && { error: transactionResult.error })
  }

  // Add chain information for cross-chain swaps
  return context.isCrossChainSwap
    ? {
        ...baseResult,
        fromChain: context.from,
        toChain: context.to
      }
    : baseResult
}

/**
 * Creates error result from caught exception
 */
function createErrorResult(context: SwapContext, error: unknown): SwapTokensToolResult {
  const baseResult = {
    success: false,
    fromCurrency: context.currencyFrom,
    toCurrency: context.currencyTo,
    fromAmount: context.amount,
    error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE
  }

  return context.isCrossChainSwap
    ? {
        ...baseResult,
        fromChain: context.from,
        toChain: context.to
      }
    : baseResult
}

/**
 * Formats user-friendly message based on swap result
 */
function formatSwapMessage(result: SwapTokensToolResult, dex: string): string {
  const swapDetails = createSwapDetails(result, dex)
  const statusMessage = createStatusMessage(result)

  return `${swapDetails.type} swap ${swapDetails.status}: ${swapDetails.description}. ${statusMessage}`
}

/**
 * Creates swap details for message formatting
 */
function createSwapDetails(result: SwapTokensToolResult, dex: string) {
  const isSuccess = result.success
  const isCrossChain = Boolean(result.fromChain && result.toChain)

  const type = isCrossChain ? "Cross-chain" : "DEX"
  const status = isSuccess ? "successful" : "failed"

  const baseDescription = `${result.fromAmount} ${result.fromCurrency} to ${result.toCurrency}`
  const location = isCrossChain ? `from ${result.fromChain} to ${result.toChain}` : `on ${dex}`

  return {
    type,
    status,
    description: `${baseDescription} ${location}`
  }
}

/**
 * Creates status message with transaction hash or error
 */
function createStatusMessage(result: SwapTokensToolResult): string {
  return result.success ? `Tx Hash: ${result.transactionHash}` : `Error: ${result.error}`
}
