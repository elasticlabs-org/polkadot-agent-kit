import type { Chain, ChainRelay } from "../chains"

/**
 * Determines if a chain is a relay chain based
 * @param chain - The chain to check
 * @returns boolean
 */
export const isRelayChain = (chain: Chain): chain is ChainRelay => {
  if (chain.type === "relay") return true
  return false
}
