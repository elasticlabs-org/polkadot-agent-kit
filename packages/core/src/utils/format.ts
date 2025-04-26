import { getAllSupportedChains, getChainById, KnowChainId } from "@dot-agent-kit/common"
import * as ss58 from "@subsquid/ss58"
import { AccountId } from "polkadot-api"

/**
 * Account ID encoder instance for validating addresses
 * @private
 */
const accountIdEncoder = AccountId().enc

/**
 * Gets the SS58 prefix for a chain
 * @private
 */
function getChainPrefix(chainId: KnowChainId): number {
  const chain = getChainById(chainId, getAllSupportedChains())
  return chain.prefix
}

/**
 * Converts an address to a different SS58 format
 *
 * @param address - The address to convert
 * @param targetChainId - The target chain ID or SS58 prefix
 * @returns The converted address or null if invalid
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
export function convertAddress(
  address: string,
  targetChainId: KnowChainId | number
): string | null {
  try {
    // Get prefix based on input type
    const prefix = typeof targetChainId === "number" ? targetChainId : getChainPrefix(targetChainId)

    // Validate the address first
    accountIdEncoder(address)

    // Decode the public key from any SS58 format
    const publicKey = ss58.decode(address).bytes

    // Encode to target format
    return ss58.codec(prefix).encode(publicKey)
  } catch (error) {
    console.error(
      "Failed to convert address:",
      error instanceof Error ? error.message : String(error)
    )
    return null
  }
}
