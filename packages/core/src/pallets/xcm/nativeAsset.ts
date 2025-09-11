import { getNativeAssets } from "@paraspell/assets"
import type { TDestination, TNodeDotKsmWithRelayChains, TPapiTransaction } from "@paraspell/sdk"
import { Builder } from "@paraspell/sdk"
import { parseUnits } from "@polkadot-agent-kit/common"
import type { XcmTransferResult } from "../../types/xcm"
/**
 * Builds an XCM transaction to transfer a native asset from one chain to another.
 *
 * This function uses the \@paraspell/sdk Builder to construct a cross-chain (XCM) transfer
 * of the native token from a source chain to a destination chain. It supports both relay chains
 * and parachains, and abstracts away the complexity of XCM message construction.
 *
 * @param srcChain - The source chain ID (relay chain or parachain) from which the asset is sent
 * @param destChain - The destination chain ID (relay chain or parachain) to which the asset is sent
 * @param from - The sender's address on the source chain
 * @param to - The recipient's address on the destination chain
 * @param amount - The amount of the native asset to transfer (as bigint, in base units)
 * @returns Promise resolving to XcmTransferResult with detailed success/failure information
 */

export const xcmTransferNativeAsset = async (
  srcChain: string,
  destChain: string,
  from: string,
  to: string,
  amount: string
): Promise<XcmTransferResult> => {
  try {
    const nativeSymbol = getNativeAssets(srcChain as TNodeDotKsmWithRelayChains)

    const decimals = nativeSymbol[0].decimals || 10
    const parsedAmount = parseUnits(amount, decimals)

    // Dry run the XCM transfer native token
    const dryRunTx = await Builder()
      .from(srcChain as TNodeDotKsmWithRelayChains)
      .senderAddress(from)
      .to(destChain as TDestination)
      .currency({ symbol: nativeSymbol[0].symbol, amount: parsedAmount })
      .address(to)
      .dryRun()
 
    const dryRunDetails = {
      originSuccess: dryRunTx.origin?.success || false,
      destinationSuccess: dryRunTx.destination?.success || false,
      originError: dryRunTx.origin?.success ? undefined : dryRunTx.origin?.failureReason,
      destinationError: dryRunTx.destination?.success ? undefined : dryRunTx.destination?.failureReason
    }

    if (dryRunTx.origin?.success && dryRunTx.destination?.success) {
      // Build the actual XCM transaction
      const tx = await Builder()
        .from(srcChain as TNodeDotKsmWithRelayChains)
        .senderAddress(from)
        .to(destChain as TDestination)
        .currency({ symbol: nativeSymbol[0].symbol, amount: parsedAmount })
        .address(to)
        .build()


      return {
        success: true,
        transaction: tx,
        dryRunDetails
      }
    } else {
      const errorDetails = []
      if (!dryRunTx.origin?.success) {
        errorDetails.push(`Origin chain error: ${dryRunTx.origin?.failureReason || "Unknown error"}`)
      }
      if (!dryRunTx.destination?.success) {
        errorDetails.push(`Destination chain error: ${dryRunTx.destination?.failureReason || "Unknown error"}`)
      }

      return {
        success: false,
        error: `XCM dry run failed: ${errorDetails.join("; ")}`,
        dryRunDetails
      }
    }
  } catch (error) {
    return {
      success: false,
      error: `XCM transaction dry run failed: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}
