import { polkadot } from "@polkadot-api/descriptors"
import type { ChainDefinition, TypedApi } from "polkadot-api"
import {
  getChainById,
  getDescriptors,
  isChainIdAssetHub,
  isChainIdRelay,
  type Chain,
  type ChainId,
  type ChainIdAssetHub,
  type ChainIdRelay,
  type Descriptors,
  type KnownChainId
} from "../chains"
import { getClient, type ClientOptions } from "../clients/client"

export type LightClients = ClientOptions["lightClients"]
type ApiBase<Id extends ChainId> = Id extends KnownChainId
  ? TypedApi<Descriptors<Id>>
  : TypedApi<ChainDefinition>

export type Api<Id extends ChainId> = ApiBase<Id> & {
  chainId: Id
  chain: Chain
  waitReady: Promise<void>
  client?: {
    bestBlocks$?: { complete: () => void }
    disconnect?: () => Promise<void>
  }
  lightClients?: LightClients
}

export const isApiAssetHub = (api: Api<ChainId>): api is Api<ChainIdAssetHub> => {
  return isChainIdAssetHub(api.chainId)
}

export const isApiRelay = (api: Api<ChainId>): api is Api<ChainIdRelay> => {
  return isChainIdRelay(api.chainId)
}

export const getApiInner = async <Id extends ChainId>(
  chainId: ChainId,
  lightClients: LightClients,
  chains: Chain[]
): Promise<Api<Id>> => {
  const chain = getChainById(chainId, chains)

  const descriptors = getDescriptors(chain.id)
  const client = await getClient(chainId, chains, { lightClients })
  if (!client) throw new Error(`Could not create client for chain ${chainId}/${lightClients}`)

  const api = client.getTypedApi(descriptors ?? polkadot) as Api<Id>

  api.chainId = chainId as Id
  api.chain = chain
  api.waitReady = (() => {
    // Track subscription for cleanup
    let subscription: any = null

    // Create the actual Promise
    const readyPromise = new Promise<void>((resolve, reject) => {
      // Set default timeout (30 seconds)
      const timeoutId = setTimeout(() => {
        if (subscription) subscription.unsubscribe()
        reject(new Error("Connection timeout after 45000ms"))
      }, 45000)

      // Set up subscription with cleanup
      subscription = client.bestBlocks$.subscribe({
        next: () => {
          clearTimeout(timeoutId)
          if (subscription) subscription.unsubscribe()
          resolve()
        },
        error: err => {
          clearTimeout(timeoutId)
          if (subscription) subscription.unsubscribe()
          reject(err)
        }
      })
    })

    return readyPromise
  })()

  return api
}

const getApiCacheId = (chainId: ChainId, lightClient: LightClients): string =>
  `${chainId}-${lightClient?.enable ?? "false"}`

const API_CACHE = new Map<string, Promise<Api<ChainId>>>()

export const getApi = async <Id extends ChainId, Papi = Api<Id>>(
  id: Id,
  chains: Chain[] = [],
  waitReady = true,
  lightClients: LightClients
): Promise<Papi> => {
  const cacheKey = getApiCacheId(id, lightClients)

  if (!API_CACHE.has(cacheKey)) API_CACHE.set(cacheKey, getApiInner(id, lightClients, chains))

  const api = (await API_CACHE.get(cacheKey)) as Api<KnownChainId>

  if (waitReady) await api.waitReady

  return api as Papi
}

/**
 * Disconnects an API instance and cleans up associated resources
 * @param api The API instance to disconnect
 * @returns Promise that resolves when disconnection is complete
 */
export const disconnect = async <Id extends ChainId>(api: Api<Id>): Promise<void> => {
  const cacheKey = getApiCacheId(api.chainId, api.lightClients)

  try {
    // Clean up any active subscriptions
    if (api.client?.bestBlocks$) {
      api.client.bestBlocks$.complete()
    }

    // Disconnect the underlying client
    await api.client?.disconnect?.()

    // Remove from cache
    API_CACHE.delete(cacheKey)
  } catch (error) {
    throw new Error(`Failed to disconnect API: ${(error as Error).message}`)
  }
}
