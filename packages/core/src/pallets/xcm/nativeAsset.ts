import type { TDestination, TNodeDotKsmWithRelayChains, TPapiTransaction } from "@paraspell/sdk"
import { Builder } from "@paraspell/sdk"
import type { KnownChainId } from "@polkadot-agent-kit/common"
import { getAllSupportedChains, getChainById } from "@polkadot-agent-kit/common"

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
  srcChain: KnownChainId,
  destChain: KnownChainId,
  from: string,
  to: string,
  amount: bigint
): Promise<TPapiTransaction> => {
  const sourceChain = getChainById(srcChain, getAllSupportedChains())
  const destinationChain = getChainById(destChain, getAllSupportedChains())
  const url = sourceChain.wsUrls
  // XCM transfer native tokken
  const tx = await Builder(url)
    .from(sourceChain.name as TNodeDotKsmWithRelayChains)
    .senderAddress(from)
    .to(destinationChain.name as TDestination)
    .currency({ symbol: sourceChain.symbol, amount: amount })
    .address(to)
    .build()

  return tx
}
