import { getSmProvider } from "polkadot-api/sm-provider"

import type { ChainId, KnownChainId } from "../chains"
import { isChainAllowed } from "../chains"
import type { SmoldotClient } from "../types/smoldot"

type Chain = Awaited<Parameters<typeof getSmProvider>[0]>

type ChainDef = {
  chainId: ChainId
  chainSpec: string
}

const SMOLDOT_CHAINS_CACHE = new Map<string, Promise<Chain>>()

export const loadChain = async (
  smoldot: SmoldotClient,
  { chainId, chainSpec }: ChainDef,
  relay?: Chain,
  allowedChains?: KnownChainId[]
) => {
  // Validate chain access
  if (!isChainAllowed(chainId, allowedChains)) {
    const allowedChainsStr = allowedChains?.join(", ") || "all"
    throw new Error(`Chain '${chainId}' is not allowed. Allowed chains: ${allowedChainsStr}`)
  }

  const chainPromise = smoldot.addChain({
    chainSpec,
    potentialRelayChains: relay ? [relay] : undefined
  })

  if (!SMOLDOT_CHAINS_CACHE.has(chainId)) SMOLDOT_CHAINS_CACHE.set(chainId, chainPromise)

  return SMOLDOT_CHAINS_CACHE.get(chainId)!
}

export const getSmChainProvider = async (
  smoldot: SmoldotClient,
  chainDef: ChainDef,
  relayDef?: ChainDef,
  allowedChains?: KnownChainId[]
): Promise<ReturnType<typeof getSmProvider>> => {
  const relay = relayDef ? await loadChain(smoldot, relayDef, undefined, allowedChains) : undefined
  const chain = await loadChain(smoldot, chainDef, relay, allowedChains)

  return getSmProvider(chain)
}
