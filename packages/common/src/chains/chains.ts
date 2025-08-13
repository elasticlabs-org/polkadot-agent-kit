import {
  bifrost_polkadot,
  hydra,
  paseo,
  paseo_people,
  polkadot,
  polkadot_asset_hub,
  west,
  west_asset_hub
} from "@polkadot-api/descriptors"

import {
  bifrostPolkadotChain,
  paseoChain,
  paseoPeopleChain,
  polkadotAssetHubChain,
  polkadotChain,
  westendAssetHubChain,
  westendChain
} from "./supported-chains"
type DescriptorsRelayType = {
  polkadot: typeof polkadot
  west: typeof west
  paseo: typeof paseo
}

type DescriptorsAssetHubType = {
  polkadot_asset_hub: typeof polkadot_asset_hub
  west_asset_hub: typeof west_asset_hub
}

type DescriptorsParaType = {
  hydra: typeof hydra
  paseo_people: typeof paseo_people
  bifrost_polkadot: typeof bifrost_polkadot
}

const DESCRIPTORS_RELAY: DescriptorsRelayType = {
  polkadot,
  west,
  paseo
}

const DESCRIPTORS_ASSET_HUB: DescriptorsAssetHubType = {
  polkadot_asset_hub,
  west_asset_hub
}

const DESCRIPTORS_PARA: DescriptorsParaType = {
  hydra,
  paseo_people,
  bifrost_polkadot
}

export const DESCRIPTORS_ALL = {
  ...DESCRIPTORS_RELAY,
  ...DESCRIPTORS_ASSET_HUB,
  ...DESCRIPTORS_PARA
}

type DescriptorsAssetHub = typeof DESCRIPTORS_ASSET_HUB
type DescriptorsRelay = typeof DESCRIPTORS_RELAY
type DescriptorsPara = typeof DESCRIPTORS_PARA
export type DescriptorsAll = DescriptorsRelay & DescriptorsAssetHub & DescriptorsPara

export type ChainIdAssetHub = keyof DescriptorsAssetHub
export type ChainIdRelay = keyof DescriptorsRelay
export type ChainIdPara = keyof DescriptorsParaType
export type KnownChainId = ChainIdRelay | ChainIdAssetHub | ChainIdPara
type UnKnownChainId = string & {}
export type ChainId = KnownChainId | UnKnownChainId

export const isChainIdAssetHub = (id: unknown): id is ChainIdAssetHub =>
  typeof id === "string" && !!DESCRIPTORS_ASSET_HUB[id as ChainIdAssetHub]
export const isChainIdRelay = (id: unknown): id is ChainIdRelay =>
  typeof id === "string" && !!DESCRIPTORS_RELAY[id as ChainIdRelay]

export type Descriptors<Id extends KnownChainId> = DescriptorsAll[Id]

export const getDescriptors = (id: ChainId): Descriptors<KnownChainId> | undefined => {
  if (DESCRIPTORS_ALL[id as KnownChainId]) {
    return DESCRIPTORS_ALL[id as KnownChainId]
  }
  return undefined
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
  bifrostPolkadotChain
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
