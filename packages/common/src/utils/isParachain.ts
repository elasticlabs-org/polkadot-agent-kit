import type { Chain } from "../chains"

/**
 * Determines if a chain is a parachain based on the chainId
 * @param chain - The chain to check
 * @returns boolean
 */
export const isParachain = (chain: Chain): boolean => {
  if (chain.type === "para" && chain.chainId) {
    const chainIdAsNumber = Number(chain.chainId)
    return chainIdAsNumber > 2000
  }

  return false
}
