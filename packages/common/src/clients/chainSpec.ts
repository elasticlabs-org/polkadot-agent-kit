import { chainSpec as polkadotSpec } from "polkadot-api/chains/polkadot"
import { chainSpec as polkadotAssetHubSpec } from "polkadot-api/chains/polkadot_asset_hub"
import { chainSpec as westSpec } from "polkadot-api/chains/westend2"
import { chainSpec as westAssetHubSpec } from "polkadot-api/chains/westend2_asset_hub"
import { chainSpec as paseoSpec } from "polkadot-api/chains/paseo"
import type { ChainId } from "../chains"

/**
 * Cache for chain specifications to avoid redundant lookups
 * @internal - Implementation detail, not meant for external use
 */
const chainSpecCache = new Map<ChainId, string>()

/**
 * Retrieves the chain specification for a given chain ID
 *
 * @param chainId - The identifier of the chain
 * @param specRegistry - Registry mapping chain IDs to their specifications
 * @returns The chain specification string
 * @throws Error if the registry is missing or doesn't contain the requested chain
 */
export function getChainSpec(
  chainId: ChainId,
  specRegistry?: Partial<Record<ChainId, string>>
): string {
  // Validate inputs
  if (!specRegistry) {
    throw new Error("Chain specification registry is required but was not provided")
  }

  // Check cache first
  const cachedSpec = chainSpecCache.get(chainId)
  if (cachedSpec) {
    return cachedSpec
  }

  // Get spec from registry
  const chainSpec = specRegistry[chainId]
  if (!chainSpec) {
    throw new Error(`Unknown chain: ${chainId} is not registered in the specification registry`)
  }

  // Cache and return the result
  chainSpecCache.set(chainId, chainSpec)
  return chainSpec
}

/**
 * Checks if a chain specification exists for the given chain ID
 *
 * @param chainId - The identifier of the chain to check
 * @param specRegistry - Registry mapping chain IDs to their specifications
 * @returns Boolean indicating whether the chain specification exists
 */
export function hasChainSpec(
  chainId: ChainId,
  specRegistry?: Partial<Record<ChainId, string>>
): boolean {
  return !!specRegistry && chainId in specRegistry
}

/**
 * Clears the chain specification cache
 * Useful for testing or when specifications might change at runtime
 */
export function clearChainSpecCache(): void {
  chainSpecCache.clear()
}

export function specRegistry(): Partial<Record<ChainId, string>> {
  return {
    polkadot: polkadotSpec,
    west: westSpec,
    polkadot_asset_hub: polkadotAssetHubSpec,
    west_asset_hub: westAssetHubSpec,
    paseo: paseoSpec
  }
}
