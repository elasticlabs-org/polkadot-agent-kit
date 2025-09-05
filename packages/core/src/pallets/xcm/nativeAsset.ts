import { getNativeAssets } from "@paraspell/assets"
import type { TDestination, TNodeDotKsmWithRelayChains, TPapiTransaction } from "@paraspell/sdk"
import { Builder } from "@paraspell/sdk"
import { parseUnits } from "@polkadot-agent-kit/common"
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
 * @returns A Promise resolving to a TPapiTransaction object representing the unsigned XCM transaction
 *
 * @example
 * const tx = await xcmTransferNativeAsset(
 *   'polkadot',
 *   'hydra',
 *   'senderAddress',
 *   'recipientAddress',
 *   10000000000n
 * )
 * // tx can then be signed and submitted using the appropriate transaction handler
 */

export const xcmTransferNativeAsset = async (
  srcChain: string,
  destChain: string,
  from: string,
  to: string,
  amount: string
): Promise<TPapiTransaction> => {
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
  if (dryRunTx.origin?.success && dryRunTx.destination?.success) {
    // XCM transfer native tokken
    const tx = await Builder()
      .from(srcChain as TNodeDotKsmWithRelayChains)
      .senderAddress(from)
      .to(destChain as TDestination)
      .currency({ symbol: nativeSymbol[0].symbol, amount: parsedAmount })
      .address(to)
      .build()

    return tx
  } else {
    throw Error("XCM dry run failed")
  }
}
