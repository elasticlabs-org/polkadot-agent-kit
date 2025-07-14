import { getAssetDecimals, getAssetMultiLocation } from "@paraspell/assets"
import type { TCurrency, TMultiLocationValue, TNodeDotKsmWithRelayChains } from "@paraspell/sdk"
import type { TExchangeInput, TRouterPlan } from "@paraspell/xcm-router"
import { RouterBuilder } from "@paraspell/xcm-router"
import { parseUnits } from "@polkadot-agent-kit/common"
import type { PolkadotSigner } from "polkadot-api/signer"

import { getPairSupported } from "../utils/defi"
export interface SwapTokenArgs {
  from?: string
  to?: string
  currencyFrom: string
  currencyTo: string
  amount: string
  sender?: string
  receiver?: string
  dex?: string
}

/**
 * Builds a token swap transaction supporting both cross-chain and DEX-specific swaps.
 *
 * This function uses the \@paraspell/xcm-router RouterBuilder to construct token swaps
 * that exchange one token for another within the Polkadot ecosystem.
 *
 * **Two supported modes:**
 * 1. **Cross-chain swap**: Uses XCM routing between different chains via Hydration DEX
 * 2. **DEX-specific swap**: Direct swap within a specific DEX (e.g., HydrationDex)
 *
 * @param args - The swap configuration object containing:
 *   - from: The source chain ID where the swap originates (required for cross-chain swaps)
 *   - to: The destination chain ID where the swap completes (required for cross-chain swaps)
 *   - currencyFrom: The symbol of the token to swap from (e.g., 'DOT', 'KSM', 'HDX')
 *   - currencyTo: The symbol of the token to swap to (e.g., 'USDT', 'HDX', 'DOT')
 *   - amount: The amount of the source token to swap (as string, in base units for cross-chain, decimal for DEX-specific)
 *   - sender: Optional sender address (defaults to empty string if not provided)
 *   - receiver: Optional receiver address (defaults to empty string if not provided)
 *   - dex: The DEX to use for DEX-specific swaps (e.g., 'HydrationDex')
 * @param signer - The Polkadot signer for transaction signing
 * @param isCrossChainSwap - Boolean flag to determine swap type (true for cross-chain, false for DEX-specific)
 * @returns A Promise resolving to a TRouterPlan object containing the swap transaction plan
 *
 * @example
 * Cross-chain swap:
 * ```typescript
 * const crossChainSwap = await swapTokens(
 *   \{
 *     from: 'Polkadot',
 *     to: 'Hydra',
 *     currencyFrom: 'DOT',
 *     currencyTo: 'HDX',
 *     amount: '10000000000', // base units
 *     sender: 'senderAddress',
 *     receiver: 'receiverAddress'
 *   \},
 *   polkadotSigner,
 *   true // cross-chain swap
 * )
 * ```
 *
 * @example
 * DEX-specific swap:
 * ```typescript
 * const dexSwap = await swapTokens(
 *   \{
 *     currencyFrom: 'HDX',
 *     currencyTo: 'USDT',
 *     amount: '50.5', // decimal amount
 *     sender: 'senderAddress',
 *     receiver: 'receiverAddress',
 *     dex: 'HydrationDex'
 *   \},
 *   polkadotSigner,
 *   false // DEX-specific swap
 * )
 * ```
 */
export const swapTokens = async (
  args: SwapTokenArgs,
  signer: PolkadotSigner,
  isCrossChainSwap: boolean
): Promise<TRouterPlan> => {
  if (isCrossChainSwap) {
    const currencyFromMultiLocation = getAssetMultiLocation(
      args.from as TNodeDotKsmWithRelayChains,
      {
        symbol: args.currencyFrom
      }
    )
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

    return await RouterBuilder()
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
  } else {
    const pair = getPairSupported(args.currencyFrom, args.currencyTo, args.dex)
    if (!pair) {
      throw new Error(
        `Pair ${args.currencyFrom} to ${args.currencyTo} not supported on ${args.dex}`
      )
    }

    const [currencyFrom, currencyTo] = pair
    // test
    const formattedAmount = parseUnits(args.amount, 10)

    const fees = await RouterBuilder()
      .exchange(args.dex as TExchangeInput)
      .currencyFrom({ id: currencyFrom.assetId as TCurrency })
      .currencyTo({ id: currencyTo.assetId as TCurrency })
      .amount(formattedAmount)
      .senderAddress(args.sender || "")
      .recipientAddress(args.receiver || "")
      .slippagePct("1")
      .getXcmFees()

    if (fees.failureChain || fees.failureReason) {
      throw new Error(`Failed to get fees: ${fees.failureChain} ${fees.failureReason}`)
    }

    return await RouterBuilder()
      .exchange(args.dex as TExchangeInput)
      .currencyFrom({ id: currencyFrom.assetId as TCurrency })
      .currencyTo({ id: currencyTo.assetId as TCurrency })
      .amount(formattedAmount)
      .slippagePct("1")
      .senderAddress(args.sender || "")
      .recipientAddress(args.receiver || "")
      .signer(signer)
      .buildTransactions()
  }
}
