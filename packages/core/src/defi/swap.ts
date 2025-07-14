import { getAssetDecimals,getAssetMultiLocation } from "@paraspell/assets"
import type { TMultiLocationValue, TNodeDotKsmWithRelayChains } from "@paraspell/sdk"
import type { TRouterPlan } from "@paraspell/xcm-router";
import { RouterBuilder } from "@paraspell/xcm-router"
import { parseUnits } from "@polkadot-agent-kit/common"
import type { PolkadotSigner } from "polkadot-api/signer"

export interface SwapTokenArgs {
  from: string
  to: string
  currencyFrom: string
  currencyTo: string
  amount: string
  sender?: string
  receiver?: string
}

/**
 * Builds a cross-chain token swap transaction using the Hydration DEX.
 *
 * This function uses the \@paraspell/xcm-router RouterBuilder to construct a cross-chain swap
 * that exchanges one token for another across different chains in the Polkadot ecosystem.
 * Currently only supports swaps through the Hydration DEX with a fixed 1% slippage tolerance.
 *
 * @param args - The swap configuration object containing:
 *   - from: The source chain ID where the swap originates
 *   - to: The destination chain ID where the swap completes  
 *   - currencyFrom: The symbol of the token to swap from (e.g., 'DOT', 'KSM')
 *   - currencyTo: The symbol of the token to swap to (e.g., 'USDT', 'HDX')
 *   - amount: The amount of the source token to swap (as string, in base units)
 *   - sender: Optional sender address (defaults to empty string if not provided)
 *   - receiver: Optional receiver address (defaults to empty string if not provided)
 * @param signer - The Polkadot signer for transaction signing
 * @returns A Promise resolving to a TRouterPlan object containing the swap transaction plan
 *
 * @example
 * ```typescript
 * const swapPlan = await swapTokens(
 *   \{
 *     from: 'Polkadot',
 *     to: 'Hydra',
 *     currencyFrom: 'DOT',
 *     currencyTo: 'HDX',
 *     amount: '10000000000',
 *     sender: 'senderAddress',
 *     receiver: 'receiverAddress'
 *   \},
 *   polkadotSigner
 * )
 * // swapPlan contains the transaction plan that can be executed
 * ```
 */

export const swapCrossChainTokens = async (
  args: SwapTokenArgs,
  signer: PolkadotSigner
): Promise<TRouterPlan> => {
  const currencyFromMultiLocation = getAssetMultiLocation(args.from as TNodeDotKsmWithRelayChains, {
    symbol: args.currencyFrom
  })
  const currencyToMultiLocation = getAssetMultiLocation(args.to as TNodeDotKsmWithRelayChains, {
    symbol: args.currencyTo
  })

  // get token decimals from asset
  const currencyFromDecimals = getAssetDecimals(
    args.from as TNodeDotKsmWithRelayChains,
    args.currencyFrom
  )
  if (!currencyFromDecimals) {
    throw new Error(`Failed to get decimals for ${args.currencyFrom} on ${args.from}`)
  }

  // format amount to base units
  const formattedAmount = parseUnits(args.amount, currencyFromDecimals)

  // get fees
  const fees = await RouterBuilder()
    .from(args.from as TNodeDotKsmWithRelayChains)
    .exchange("HydrationDex")
    .to(args.to as TNodeDotKsmWithRelayChains)
    .currencyFrom({ multilocation: currencyFromMultiLocation as TMultiLocationValue })
    .currencyTo({ multilocation: currencyToMultiLocation as TMultiLocationValue })
    .amount(BigInt(formattedAmount).toString())
    .senderAddress(args.sender || "")
    .recipientAddress(args.receiver || "")
    .slippagePct("1")
    .getXcmFees()

  if (fees.failureChain || fees.failureReason) {
    throw new Error(`Failed to get fees: ${fees.failureChain} ${fees.failureReason}`)
  }

  const routerPlan = await RouterBuilder()
    .from(args.from as TNodeDotKsmWithRelayChains)
    .to(args.to as TNodeDotKsmWithRelayChains)
    .exchange("HydrationDex") // only Hydration is supported for now
    .currencyFrom({ multilocation: currencyFromMultiLocation as TMultiLocationValue })
    .currencyTo({ multilocation: currencyToMultiLocation as TMultiLocationValue })
    .amount(BigInt(formattedAmount).toString())
    .slippagePct("1")
    .senderAddress(args.sender || "")
    .recipientAddress(args.receiver || "")
    .signer(signer)
     
    .buildTransactions()

  return routerPlan
}
