import type { Chain } from "./chains"

export type Assign<T, U> = {
  [K in keyof T]: K extends keyof U ? U[K] : T[K]
}

const createChain = <const chain extends Chain>(chain: chain) => {
  return chain as Assign<Chain, chain>
}

export const polkadotChain = createChain({
  id: "polkadot",
  name: "Polkadot",
  specName: "polkadot",
  wsUrls: ["wss://polkadot-rpc.n.dwellir.com"],
  relay: "polkadot",
  type: "relay",
  chainId: 0,
  blockExplorerUrl: "https://polkadot.subscan.io",
  prefix: 0,
  decimals: 10,
  symbol: "DOT"
})

export const polkadotAssetHubChain = createChain({
  id: "polkadot_asset_hub",
  name: "AssetHubPolkadot",
  specName: "asset-hub-polkadot",
  wsUrls: ["wss://polkadot-asset-hub-rpc.polkadot.io/"],
  relay: "polkadot",
  type: "system",
  chainId: 1000,
  blockExplorerUrl: "https://assethub-polkadot.subscan.io",
  prefix: 0,
  decimals: 10,
  symbol: "DOT"
})

export const westendChain = createChain({
  id: "west",
  name: "Westend",
  specName: "westend",
  wsUrls: ["wss://westend-rpc.polkadot.io"],
  relay: "west",
  type: "relay",
  chainId: 0,
  blockExplorerUrl: "https://westend.subscan.io",
  xcmExtrinsic: "limited_teleport_assets",
  prefix: 42, // default
  decimals: 12,
  symbol: "WND"
})

export const westendAssetHubChain = createChain({
  id: "west_asset_hub",
  name: "AssetHubWestend",
  specName: "asset-hub-westend",
  wsUrls: ["wss://westend-asset-hub-rpc.polkadot.io"],
  relay: "west",
  type: "system",
  chainId: 1000,
  blockExplorerUrl: "https://assethub-westend.subscan.io",
  prefix: 42, // default
  decimals: 12,
  symbol: "WND"
})

export const hydraChain = createChain({
  id: "hydra",
  name: "Hydration",
  specName: "hydra",
  wsUrls: ["wss://hydration-rpc.n.dwellir.com"],
  relay: "polkadot",
  type: "para",
  chainId: null,
  blockExplorerUrl: "https://hydration.subscan.io",
  prefix: 42,
  decimals: 12,
  symbol: "HDX"
})
