import { getAssetDecimals, getAssetsObject } from "@paraspell/assets"
import type { TCurrency, TLocation, TNodeDotKsmWithRelayChains } from "@paraspell/sdk"
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

import type { AssetInfo } from "../utils"
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
      typeof a.location?.parents === "number" ? a.location.parents : Number.MAX_SAFE_INTEGER
    const parentsB =
      typeof b.location?.parents === "number" ? b.location.parents : Number.MAX_SAFE_INTEGER
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
          `parents: ${a.location?.parents ?? "N/A"}, isFeeAsset: ${a.isFeeAsset || false}`
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

function getAssetlocationWithSelection(
  chain: TNodeDotKsmWithRelayChains,
  symbol: string
): TLocation {
  const chainAssets = getAssetsObject(chain)
  const nativeAssetSymbol = chainAssets.nativeAssetSymbol

  let assetsInfo: AssetInfo[] = []

  // Check if symbol matches native asset symbol (case-insensitive comparison)
  if (symbol.toUpperCase() === nativeAssetSymbol?.toUpperCase()) {
    // Return native asset info
    const nativeAssets = chainAssets.nativeAssets || []
    const matchingNative = nativeAssets.find(
      (asset: { symbol: string }) => asset.symbol?.toUpperCase() === symbol.toUpperCase()
    )

    if (matchingNative && matchingNative.location) {
      assetsInfo = [
        {
          symbol: matchingNative.symbol,
          location: matchingNative.location,
          decimals: matchingNative.decimals,
          isNative: true,
          isFeeAsset: matchingNative.isFeeAsset,
          existentialDeposit: matchingNative.existentialDeposit
        }
      ]
    }
  }

  // If not found in native assets, search in otherAssets
  if (assetsInfo.length === 0) {
    const otherAssets = chainAssets.otherAssets || []
    const matchingAssets = otherAssets.filter(
      (asset: { symbol: string }) => asset.symbol?.toUpperCase() === symbol.toUpperCase()
    )

    assetsInfo = matchingAssets.map(
      (asset: {
        symbol: string
        assetId?: string
        decimals: number
        location?: TLocation
        existentialDeposit?: string
        isFeeAsset?: boolean
        alias?: string
      }) => ({
        symbol: asset.symbol,
        assetId: asset.assetId,
        decimals: asset.decimals,
        location: asset.location,
        existentialDeposit: asset.existentialDeposit,
        isFeeAsset: asset.isFeeAsset,
        alias: asset.alias,
        isNative: false
      })
    )
  }

  // Handle no assets found
  if (!assetsInfo || assetsInfo.length === 0) {
    throw new Error(`No asset found for symbol ${symbol} on ${chain}`)
  }

  // Handle single asset - return directly
  if (assetsInfo.length === 1) {
    if (!assetsInfo[0].location) {
      throw new Error(`Asset ${symbol} on ${chain} does not have a location`)
    }
    return assetsInfo[0].location
  }

  // Handle multiple assets - apply selection strategy
  const selectedAsset = selectBestAsset(assetsInfo, symbol, chain)

  if (!selectedAsset.location) {
    throw new Error(
      `Selected asset ${symbol} (${selectedAsset.alias || selectedAsset.assetId}) on ${chain} does not have a location`
    )
  }

  return selectedAsset.location
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
  const { locationFrom, locationTo } = getCrossChainlocations(args)
  if (!locationFrom || !locationTo) {
    throw new Error("Failed to get locations for cross-chain swap")
  }
  const formattedAmount = formatCrossChainAmount(args)

  // Validate fees before proceeding
  await validateSwapFees({
    builder: createCrossChainRouterBuilder(args, locationFrom, locationTo, formattedAmount),
    swapType: "cross-chain"
  })

  return await createCrossChainRouterBuilder(args, locationFrom, locationTo, formattedAmount)
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
 * Gets locations for cross-chain currencies
 */
function getCrossChainlocations(args: SwapTokenArgs) {
  const locationFrom = getAssetlocationWithSelection(
    args.from as TNodeDotKsmWithRelayChains,
    args.currencyFrom
  )

  const locationTo = getAssetlocationWithSelection(
    args.to as TNodeDotKsmWithRelayChains,
    args.currencyTo
  )

  return { locationFrom, locationTo }
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
  locationFrom: TLocation,
  locationTo: TLocation,
  formattedAmount: string
) {
  return RouterBuilder()
    .from(args.from as TNodeDotKsmWithRelayChains)
    .to(args.to as TNodeDotKsmWithRelayChains)
    .exchange(HYDRATION_DEX)
    .currencyFrom({ location: locationFrom })
    .currencyTo({ location: locationTo })
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
