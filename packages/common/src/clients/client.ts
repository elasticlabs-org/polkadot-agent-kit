import { createClient, type PolkadotClient } from "polkadot-api"

import { type Chain, type ChainId, type ChainRelay, getChainById } from "../chains"
import type { SmoldotClient } from "../types"
import { isRelayChain } from "../utils"
import { getChainSpec, hasChainSpec } from "./chainSpec"
import { getSmChainProvider } from "./smoldotProvider"

export type ClientOptions = {
  lightClients?: {
    enable: boolean
    smoldot: SmoldotClient
    chainSpecs: Partial<Record<ChainId, string>>
  }
}

export const getClientCacheId = (chainId: ChainId, { lightClients }: ClientOptions) =>
  `${chainId}-${lightClients?.enable ?? "false"}`

export const CLIENTS_CACHE = new Map<string, Promise<PolkadotClient>>()

export const getClient = (
  chainId: ChainId,
  chains: Chain[],
  options: ClientOptions
): Promise<PolkadotClient> => {
  const cacheKey = getClientCacheId(chainId, options)
  if (!CLIENTS_CACHE.has(cacheKey)) {
    const chain = getChainById(chainId, chains)

    CLIENTS_CACHE.set(
      cacheKey,
      isRelayChain(chain) ? getRelayChainClient(chain, options) : getParaChainClient(chain, options)
    )
  }

  return CLIENTS_CACHE.get(cacheKey) as Promise<PolkadotClient>
}

const getEnvironmentWsProvider = async () => {
  const isNodeJs = typeof window === "undefined"
  return isNodeJs
    ? (await import("polkadot-api/ws-provider/node")).getWsProvider
    : (await import("polkadot-api/ws-provider/web")).getWsProvider
}

export const getRelayChainClient = async (chain: ChainRelay, options: ClientOptions) => {
  const getWsProvider = await getEnvironmentWsProvider()

  // force ws provider if light clients are disabled or chainSpec is not available
  if (
    !options.lightClients ||
    !options.lightClients.enable ||
    !hasChainSpec(chain.id, options?.lightClients?.chainSpecs)
  ) {
    return createClient(getWsProvider(chain.wsUrls))
  }

  const { smoldot, chainSpecs } = options.lightClients

  const chainSpec = getChainSpec(chain.id, chainSpecs)
  const smChainProvider = await getSmChainProvider(smoldot, { chainId: chain.id, chainSpec })
  // fallback to smoldot
  return createClient(smChainProvider)
}

export const getParaChainClient = async (chain: Chain, options: ClientOptions) => {
  const getWsProvider = await getEnvironmentWsProvider()

  if (!chain.relay) throw new Error(`Chain ${chain.id} does not have a relay chain`)
  const { id: paraChainId, relay: relayChainId } = chain

  const chainSpecList = options?.lightClients?.chainSpecs

  if (
    !options.lightClients ||
    !options.lightClients.enable ||
    !hasChainSpec(paraChainId, chainSpecList) ||
    !hasChainSpec(relayChainId, chainSpecList)
  ) {
    return createClient(getWsProvider(chain.wsUrls))
  }

  const { chainSpecs, smoldot } = options.lightClients

  const [relayChainSpec, paraChainSpec] = [
    getChainSpec(relayChainId, chainSpecs),
    getChainSpec(paraChainId, chainSpecs)
  ]

  return createClient(
    await getSmChainProvider(
      smoldot,
      { chainId: chain.id, chainSpec: paraChainSpec },
      { chainId: relayChainId, chainSpec: relayChainSpec }
    )
  )
}
