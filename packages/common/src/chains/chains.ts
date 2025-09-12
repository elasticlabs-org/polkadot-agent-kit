import {
  bifrostPolkadotChain,
  hydraChain,
  kusamaAssetHubChain,
  kusamaChain,
  paseoAssetHubChain,
  paseoChain,
  paseoPeopleChain,
  polkadotAssetHubChain,
  polkadotChain,
  westendAssetHubChain,
  westendChain,
  westendPeopleChain
} from "./supportedChains"

export type ChainIdRelay = "polkadot" | "west" | "paseo" | "kusama"
export type ChainIdAssetHub =
  | "polkadot_asset_hub"
  | "west_asset_hub"
  | "kusama_asset_hub"
  | "paseo_asset_hub"
export type ChainIdPara = "hydra" | "paseo_people" | "bifrost_polkadot" | "west_people"
export type KnownChainId = ChainIdRelay | ChainIdAssetHub | ChainIdPara
type UnKnownChainId = string & {}
export type ChainId = KnownChainId | UnKnownChainId

const KNOWN_CHAINS: Record<string, true> = {
  polkadot: true,
  west: true,
  paseo: true,
  kusama: true,
  polkadot_asset_hub: true,
  west_asset_hub: true,
  kusama_asset_hub: true,
  paseo_asset_hub: true,
  hydra: true,
  paseo_people: true,
  bifrost_polkadot: true,
  west_people: true
}

export const isKnownChainId = (id: string): id is KnownChainId => {
  return id in KNOWN_CHAINS
}

export const isChainIdAssetHub = (id: unknown): id is ChainIdAssetHub => {
  const assetHubChains: ChainIdAssetHub[] = [
    "polkadot_asset_hub",
    "west_asset_hub",
    "kusama_asset_hub",
    "paseo_asset_hub"
  ]
  return typeof id === "string" && assetHubChains.includes(id as ChainIdAssetHub)
}

export const isChainIdRelay = (id: unknown): id is ChainIdRelay => {
  const relayChains: ChainIdRelay[] = ["polkadot", "west", "paseo", "kusama"]
  return typeof id === "string" && relayChains.includes(id as ChainIdRelay)
}

export type Chain = {
  id: ChainId
  name: string
  specName: string
  wsUrls: string[]
  relay: ChainIdRelay | null
  chainId: number | null
  type: "system" | "relay" | "para"
  blockExplorerUrl: string | null
  prefix: number
  decimals: number
  symbol: string
}

export type ChainRelay = Chain & { chainId: null }

export type ChainAssetHub = Chain & { chainId: 1000 }

export const getChainById = <T extends Chain>(id: ChainId, chains: Chain[]): T => {
  const foundChain = chains.find(chain => chain.id === id) as T
  if (!foundChain) throw new Error(`Could not find chain ${id}`)
  return foundChain
}

export const getChainByName = <T extends Chain>(name: string, chains: Chain[]): T => {
  const foundChain = chains.find(chain => chain.name === name) as T
  if (!foundChain) throw new Error(`Could not find chain ${name}`)
  return foundChain
}

const SUPPORTED_CHAINS: Chain[] = [
  polkadotChain,
  polkadotAssetHubChain,
  westendChain,
  westendAssetHubChain,
  paseoChain,
  paseoPeopleChain,
  bifrostPolkadotChain,
  hydraChain,
  kusamaChain,
  kusamaAssetHubChain,
  paseoAssetHubChain,
  westendPeopleChain
]

export const getAllSupportedChains = (): Chain[] => {
  return SUPPORTED_CHAINS
}

export const isSupportedChain = (chainId: unknown): chainId is ChainId => {
  return typeof chainId === "string" && SUPPORTED_CHAINS.some(chain => chain.id === chainId)
}

export function getDecimalsByChainId(chainId: string): number {
  const chain = getChainById(chainId, getAllSupportedChains())
  return chain.decimals
}

/**
 * Filter supported chains based on allowed chain IDs
 * @param allowedChains - Array of allowed chain IDs, if undefined returns all chains
 * @returns Filtered array of chains
 */
export const getFilteredChains = (allowedChains?: KnownChainId[]): Chain[] => {
  if (!allowedChains) {
    return getAllSupportedChains()
  }

  return SUPPORTED_CHAINS.filter(chain => allowedChains.includes(chain.id as KnownChainId))
}

/**
 * Check if a chain is allowed based on the configuration
 * @param chainId - Chain ID to check
 * @param allowedChains - Array of allowed chain IDs, if undefined all chains are allowed
 * @returns True if chain is allowed, false otherwise
 */
export const isChainAllowed = (chainId: ChainId, allowedChains?: KnownChainId[]): boolean => {
  if (!allowedChains) {
    return true // All chains allowed if no restriction
  }

  return allowedChains.includes(chainId as KnownChainId)
}

/**
 * Get default chains when no specific chains are configured
 * @returns Array of all supported chain IDs
 */
export const getDefaultChains = (): KnownChainId[] => {
  return SUPPORTED_CHAINS.map(chain => chain.id as KnownChainId)
}
