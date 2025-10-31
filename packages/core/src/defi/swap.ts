import { getAssetDecimals } from "@paraspell/assets"
import type { TCurrency, TMultiLocation, TNodeDotKsmWithRelayChains } from "@paraspell/sdk"
import type {
  RouterBuilderCore,
  TBuildTransactionsOptions,
  TExchangeInput,
  TRouterAsset,
  TRouterPlan
} from "@paraspell/xcm-router"
import { RouterBuilder } from "@paraspell/xcm-router"
import { parseUnits } from "@polkadot-agent-kit/common"
import type { PolkadotSigner } from "polkadot-api/signer"

import type { AssetInfo } from "../utils/assets"
import { getAllAssetsBySymbol } from "../utils/assets"
import { getPairSupported } from "../utils/defi"

// Constants
const DEFAULT_SLIPPAGE_PCT = "1"
const HYDRATION_DEX = "HydrationDex"

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

function selectBestAsset(assets: AssetInfo[], symbol: string, chain: string): AssetInfo {
  if (!assets || assets.length === 0) {
    throw new Error(`No assets provided for selection of ${symbol} on ${chain}`)
  }

  let candidates = assets.filter(a => a.isFeeAsset === true)
  if (candidates.length === 0) {
    candidates = assets
  }

  candidates.sort((a, b) => {
    const parentsA =
      typeof a.multiLocation?.parents === "number"
        ? a.multiLocation.parents
        : Number.MAX_SAFE_INTEGER
    const parentsB =
      typeof b.multiLocation?.parents === "number"
        ? b.multiLocation.parents
        : Number.MAX_SAFE_INTEGER
    return parentsA - parentsB
  })

  const withAssetId = candidates.filter(a => a.assetId !== undefined)
  if (withAssetId.length > 0) {
    candidates = withAssetId
  }

  // Validate we have a result
  if (candidates.length === 0) {
    const assetDetails = assets
      .map(
        (a, i) =>
          `  ${i + 1}. assetId: ${a.assetId || "undefined"}, alias: ${a.alias || "N/A"}, ` +
          `parents: ${a.multiLocation?.parents ?? "N/A"}, isFeeAsset: ${a.isFeeAsset || false}`
      )
      .join("\n")

    throw new Error(
      `Failed to select asset for symbol ${symbol} on ${chain}.\n\n` +
        `Available assets:\n${assetDetails}\n\n` +
        `Selection criteria: fee assets → lowest parents → has assetId`
    )
  }

  // Return the first (best) asset
  return candidates[0]
}

function getAssetMultiLocationWithSelection(
  chain: TNodeDotKsmWithRelayChains,
  symbol: string
): TMultiLocation {
  // Get all assets with this symbol
  const assets = getAllAssetsBySymbol(chain, symbol)

  // Handle no assets found
  if (!assets || assets.length === 0) {
    throw new Error(`No asset found for symbol ${symbol} on ${chain}`)
  }

  // Handle single asset - return directly
  if (assets.length === 1) {
    if (!assets[0].multiLocation) {
      throw new Error(`Asset ${symbol} on ${chain} does not have a multilocation`)
    }
    return assets[0].multiLocation
  }

  // Handle multiple assets - apply selection strategy
  const selectedAsset = selectBestAsset(assets, symbol, chain)

  if (!selectedAsset.multiLocation) {
    throw new Error(
      `Selected asset ${symbol} (${selectedAsset.alias || selectedAsset.assetId}) on ${chain} does not have a multilocation`
    )
  }

  return selectedAsset.multiLocation
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
 * @param args - The swap configuration object
 * @param signer - The Polkadot signer for transaction signing
 * @param isCrossChainSwap - Boolean flag to determine swap type
 * @returns A Promise resolving to a TRouterPlan object containing the swap transaction plan
 */
export const swapTokens = async (
  args: SwapTokenArgs,
  signer: PolkadotSigner,
  isCrossChainSwap: boolean
): Promise<TRouterPlan> => {
  validateSwapArgs(args, isCrossChainSwap)

  return isCrossChainSwap
    ? await executeCrossChainSwap(args, signer)
    : await executeDexSwap(args, signer)
}

/**
 * Validates swap arguments based on swap type
 */
function validateSwapArgs(args: SwapTokenArgs, isCrossChainSwap: boolean): void {
  if (isCrossChainSwap) {
    if (!args.from || !args.to) {
      throw new Error("Cross-chain swaps require both 'from' and 'to' chain parameters")
    }
  } else {
    if (!args.dex) {
      throw new Error("DEX-specific swaps require 'dex' parameter")
    }
  }

  if (!args.currencyFrom || !args.currencyTo) {
    throw new Error("Both 'currencyFrom' and 'currencyTo' are required")
  }

  if (!args.amount || parseFloat(args.amount) <= 0) {
    throw new Error("Amount must be a positive number")
  }
}

/**
 * Executes cross-chain swap using XCM routing
 */
async function executeCrossChainSwap(
  args: SwapTokenArgs,
  signer: PolkadotSigner
): Promise<TRouterPlan> {
  const { multilocationFrom, multilocationTo } = getCrossChainMultilocations(args)
  if (!multilocationFrom || !multilocationTo) {
    throw new Error("Failed to get multilocations for cross-chain swap")
  }
  const formattedAmount = formatCrossChainAmount(args)

  // Validate fees before proceeding
  await validateSwapFees({
    builder: createCrossChainRouterBuilder(
      args,
      multilocationFrom,
      multilocationTo,
      formattedAmount
    ),
    swapType: "cross-chain"
  })

  return await createCrossChainRouterBuilder(
    args,
    multilocationFrom,
    multilocationTo,
    formattedAmount
  )
    .signer(signer)
    .buildTransactions()
}

/**
 * Executes DEX-specific swap
 */
async function executeDexSwap(args: SwapTokenArgs, signer: PolkadotSigner): Promise<TRouterPlan> {
  const { currencyFrom, currencyTo } = validateAndGetDexPair(args)
  const decimals = getAssetDecimals("Hydration", args.currencyFrom)
  if (!decimals) {
    throw new Error(`Failed to get decimals for ${args.currencyFrom} on Hydration`)
  }

  const formattedAmount = parseUnits(args.amount, decimals)

  // Validate fees before proceeding
  await validateSwapFees({
    builder: createDexRouterBuilder(
      args,
      currencyFrom,
      currencyTo,
      BigInt(formattedAmount).toString()
    ),
    swapType: "DEX-specific"
  })

  return await createDexRouterBuilder(
    args,
    currencyFrom,
    currencyTo,
    BigInt(formattedAmount).toString()
  )
    .signer(signer)
    .buildTransactions()
}

/**
 * Gets multilocations for cross-chain currencies
 */
function getCrossChainMultilocations(args: SwapTokenArgs) {
  const multilocationFrom = getAssetMultiLocationWithSelection(
    args.from as TNodeDotKsmWithRelayChains,
    args.currencyFrom
  )
  const multilocationTo = getAssetMultiLocationWithSelection(
    args.to as TNodeDotKsmWithRelayChains,
    args.currencyTo
  )

  return { multilocationFrom, multilocationTo }
}

/**
 * Formats amount for cross-chain swaps using proper decimals
 */
function formatCrossChainAmount(args: SwapTokenArgs): string {
  const decimals = getAssetDecimals(args.from as TNodeDotKsmWithRelayChains, args.currencyFrom)
  if (!decimals) {
    throw new Error(`Failed to get decimals for ${args.currencyFrom} on ${args.from}`)
  }

  return parseUnits(args.amount, decimals).toString()
}

/**
 * Validates DEX pair support and returns currency objects
 */
function validateAndGetDexPair(args: SwapTokenArgs) {
  const pair = getPairSupported(args.currencyFrom, args.currencyTo, args.dex)

  if (!pair) {
    throw new Error(
      `Trading pair ${args.currencyFrom}/${args.currencyTo} is not supported on ${args.dex}`
    )
  }

  return {
    currencyFrom: pair[0],
    currencyTo: pair[1]
  }
}

/**
 * Creates router builder for cross-chain swaps
 */
function createCrossChainRouterBuilder(
  args: SwapTokenArgs,
  multilocationFrom: TMultiLocation,
  multilocationTo: TMultiLocation,
  formattedAmount: string
) {
  return RouterBuilder()
    .from(args.from as TNodeDotKsmWithRelayChains)
    .to(args.to as TNodeDotKsmWithRelayChains)
    .exchange(HYDRATION_DEX)
    .currencyFrom({ multilocation: multilocationFrom })
    .currencyTo({ multilocation: multilocationTo })
    .amount(BigInt(formattedAmount).toString())
    .slippagePct(DEFAULT_SLIPPAGE_PCT)
    .senderAddress(args.sender || "")
    .recipientAddress(args.receiver || "")
}

/**
 * Creates router builder for DEX-specific swaps
 */
function createDexRouterBuilder(
  args: SwapTokenArgs,
  currencyFrom: TRouterAsset,
  currencyTo: TRouterAsset,
  formattedAmount: string
) {
  return RouterBuilder()
    .exchange(args.dex as TExchangeInput)
    .currencyFrom({ id: currencyFrom.assetId as TCurrency })
    .currencyTo({ id: currencyTo.assetId as TCurrency })
    .amount(formattedAmount)
    .slippagePct(DEFAULT_SLIPPAGE_PCT)
    .senderAddress(args.sender || "")
    .recipientAddress(args.receiver || "")
}

/**
 * Validates swap fees before execution
 */
async function validateSwapFees({
  builder,
  swapType
}: {
  builder: RouterBuilderCore<TBuildTransactionsOptions>
  swapType: "cross-chain" | "DEX-specific"
}): Promise<void> {
  const fees = await builder.getXcmFees()

  // Check origin balance sufficiency
  if (!fees.origin.sufficient) {
    throw new Error(`Unable to swap due to insufficient balance`)
  }

  // Check destination balance sufficiency
  if (!fees.destination.sufficient) {
    throw new Error(`Unable to swap due to insufficient destination balance`)
  }

  // Check each hop for sufficiency and errors
  if (fees.hops && fees.hops.length > 0) {
    for (const hop of fees.hops) {
      if (!hop.result.sufficient) {
        throw new Error(
          `Insufficient balance for hop on ${hop.chain}: ${hop.result.dryRunError || "Unknown error"}`
        )
      }

      if (hop.result.dryRunError) {
        throw new Error(`Dry run error on ${hop.chain}: ${hop.result.dryRunError}`)
      }
    }
  }

  if (fees.failureChain || fees.failureReason) {
    throw new Error(
      `Failed to calculate ${swapType} swap fees: ${fees.failureChain || fees.failureReason}`
    )
  }
}
