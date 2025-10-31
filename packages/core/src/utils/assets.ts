import { getNativeAssets, getOtherAssets } from "@paraspell/assets"
import type { TMultiLocation, TNodeWithRelayChains, TRelayChain } from "@paraspell/sdk"
import { NODES_WITH_RELAY_CHAINS, RELAY_CHAINS } from "@paraspell/sdk"
import type { Api, KnownChainId } from "@polkadot-agent-kit/common"

// Type for asset information from ParaSpell
export interface AssetInfo {
  symbol: string
  assetId?: string
  decimals: number
  multiLocation?: TMultiLocation
  existentialDeposit?: string
  isFeeAsset?: boolean
  alias?: string
}

export async function getAssetBalance(
  api: Api<KnownChainId>,
  chain: string,
  assetSymbol: string,
  address: string
) {
  if (isValidTNodeWithRelayChains(chain)) {
    const assets = getOtherAssets(chain as TNodeWithRelayChains)

    const filteredAssets = assets.filter(asset => asset.symbol && asset.symbol === assetSymbol)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const assetAccount = await api.query.Assets.Account.getValue(
      Number(filteredAssets[0]?.assetId),
      address
    )
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
    return assetAccount.balance
  } else {
    throw new Error(`Chain ${chain} is not a valid TNodeWithRelayChains`)
  }
}

export function getAllAssetsBySymbol(chain: string, assetSymbol: string): AssetInfo[] {
  let assets: AssetInfo[] = []
  if (isValidTNodeWithRelayChains(chain)) {
    if (isValidRelayChains(chain)) {
      assets = getNativeAssets(chain as TRelayChain) as AssetInfo[]
    } else {
      assets = getOtherAssets(chain as TNodeWithRelayChains) as AssetInfo[]
    }

    const filteredAssets = assets.filter(asset => asset.symbol && asset.symbol === assetSymbol)

    return filteredAssets
  } else {
    throw new Error(`Chain ${chain} is not a valid TNodeWithRelayChains`)
  }
}

// Including relay chains
function isValidTNodeWithRelayChains(chain: string): boolean {
  return (NODES_WITH_RELAY_CHAINS as readonly string[]).includes(chain)
}

// Just relay chains
function isValidRelayChains(chain: string): boolean {
  return (RELAY_CHAINS as readonly string[]).includes(chain)
}
