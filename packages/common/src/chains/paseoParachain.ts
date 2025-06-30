import { createChain } from "./supported-chains";



export const hydrationPaseoChain = createChain({
  id: "rococohydradx",
  name: "Hydration (Paseo)",
  specName: "rococohydradx",
  wsUrls: ["wss://paseo-rpc.play.hydration.cloud"],
  relay: "paseo",
  type: "para",
  chainId: 2034,
  blockExplorerUrl: null,
  prefix: null,
  decimals: null,
  symbol: null
});



export const popNetworkChain = createChain({
  id: "popnetwork",
  name: "Pop Network",
  specName: "popnetwork",
  wsUrls: ["wss://rpc1.paseo.popnetwork.xyz"],
  relay: "paseo",
  type: "para",
  chainId: 4001,
  blockExplorerUrl: null,
  prefix: 42,
  decimals: 10,
  symbol: "PAS"
});

export const paseoAssetHubChain = createChain({
  id: "paseoassethub",
  name: "AssetHub",
  specName: "paseoassethub",
  wsUrls: [
    "wss://asset-hub-paseo-rpc.n.dwellir.com",
    "wss://sys.ibp.network/asset-hub-paseo",
    "wss://asset-hub-paseo.dotters.network",
    "wss://pas-rpc.stakeworld.io/assethub",
    "wss://sys.turboflakes.io/asset-hub-paseo"
  ],
  relay: "paseo",
  type: "para",
  chainId: 1000,
  blockExplorerUrl: null,
  prefix: 42,
  decimals: 10,
  symbol: "PAS"
});


