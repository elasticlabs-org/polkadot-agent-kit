import type { TNodeDotKsmWithRelayChains } from "@paraspell/sdk"

import { RouterBuilder, TRouterPlan } from '@paraspell/xcm-router'
import type { PolkadotSigner } from "polkadot-api/signer"
import { getSupportedAssets, getAssetMultiLocation, TCurrencyInput, getAssetId, TMultiLocationValueWithOverride } from "@paraspell/assets";

export interface SwapTokenArgs {
    from: string;
    to: string;
    currencyFrom: string;
    currencyTo: string;
    amount: string;
    sender?: string;
    receiver?: string;
}


/**
 * Builds a cross-chain token swap transaction using the Hydration DEX.
 *
 * This function uses the @paraspell/xcm-router RouterBuilder to construct a cross-chain swap
 * that exchanges one token for another across different chains in the Polkadot ecosystem.
 * Currently only supports swaps through the Hydration DEX with a fixed 1% slippage tolerance.
 *
 * @param args - The swap configuration object
 * @param args.from - The source chain ID where the swap originates
 * @param args.to - The destination chain ID where the swap completes
 * @param args.currencyFrom - The symbol of the token to swap from (e.g., 'DOT', 'KSM')
 * @param args.currencyTo - The symbol of the token to swap to (e.g., 'USDT', 'HDX')
 * @param args.amount - The amount of the source token to swap (as string, in base units)
 * @param args.sender - Optional sender address (defaults to empty string if not provided)
 * @param args.receiver - Optional receiver address (defaults to empty string if not provided)
 * @param signer - The Polkadot signer for transaction signing
 * @returns A Promise resolving to a TRouterPlan object containing the swap transaction plan
 *
 * @example
 * const swapPlan = await swapTokens(
 *   {
 *     from: 'polkadot',
 *     to: 'hydra',
 *     currencyFrom: 'DOT',
 *     currencyTo: 'HDX',
 *     amount: '10000000000',
 *     sender: 'senderAddress',
 *     receiver: 'receiverAddress'
 *   },
 *   polkadotSigner
 * )
 * // swapPlan contains the transaction plan that can be executed
 */

export const swapTokens = async (
    args: SwapTokenArgs,
    signer: PolkadotSigner
): Promise<TRouterPlan> => {

    const currencyFromMultiLocation = getAssetMultiLocation(args.from as TNodeDotKsmWithRelayChains, {symbol: args.currencyFrom})
    const currencyToMultiLocation = getAssetMultiLocation(args.to as TNodeDotKsmWithRelayChains, {symbol: args.currencyTo})


    const routerPlan = await RouterBuilder()
    .from(args.from as TNodeDotKsmWithRelayChains)
    .to(args.to as TNodeDotKsmWithRelayChains)
    .exchange('HydrationDex') // only Hydration is supported for now
    .currencyFrom({ multilocation: currencyFromMultiLocation as TMultiLocationValueWithOverride })
    .currencyTo({ multilocation: currencyToMultiLocation as TMultiLocationValueWithOverride })
    .amount(args.amount)
    .slippagePct('1')
    .senderAddress(args.sender || '')
    .recipientAddress(args.receiver || '')
    .signer(signer)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .buildTransactions()


    return routerPlan
}


