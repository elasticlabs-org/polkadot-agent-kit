import type { KnownChainId } from "@polkadot-agent-kit/common"
import { getAllSupportedChains, getChainById } from "@polkadot-agent-kit/common"
import { MultiAddress } from "@polkadot-api/descriptors"
import * as ss58 from "@subsquid/ss58"
import { AccountId } from "polkadot-api"

/**
 * Gets the SS58 prefix for a chain
 * @internal
 */
function getChainPrefix(chainId: KnownChainId): number {
  const chain = getChainById(chainId, getAllSupportedChains())
  return chain.prefix
}

/**
 * Converts an address to a different SS58 format
 *
 * @param address - The address to convert
 * @param targetChainId - The target chain ID or SS58 prefix
 * @returns The converted address
 * @throws Error if the address is invalid or conversion fails
 *
 * @example
 * ```typescript
 * // Convert using chain ID
 * convertAddress('5GrwvaEF...', 'west');
 *
 * // Convert to specific prefix
 * convertAddress('5GrwvaEF...', 42);
 * ```
 */
export function convertAddress(address: string, targetChainId: KnownChainId | number): string {
  try {
    // Get prefix based on input type
    const prefix = typeof targetChainId === "number" ? targetChainId : getChainPrefix(targetChainId)

    // Validate the address first
    AccountId().enc(address)

    // Decode the public key from any SS58 format
    const publicKey = ss58.decode(address).bytes

    // Encode to target format
    return ss58.codec(prefix).encode(publicKey)
  } catch (error) {
    throw new Error(
      `Failed to convert address ${address} to format ${targetChainId}: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

export function toMultiAddress(address: string): MultiAddress {
  return MultiAddress.Id(address)
}
