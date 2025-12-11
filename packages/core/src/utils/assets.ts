import type { TLocation } from "@paraspell/sdk"

// Type for asset information from ParaSpell
export interface AssetInfo {
  symbol: string
  assetId?: string
  decimals: number
  location?: TLocation
  existentialDeposit?: string
  isFeeAsset?: boolean
  alias?: string
  isNative: boolean
}
