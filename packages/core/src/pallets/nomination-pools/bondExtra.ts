import type { Api, ChainIdAssetHub } from "@polkadot-agent-kit/common"
import type { UnsafeTransactionType } from "@polkadot-agent-kit/common"
/**
 * Creates a bond extra transaction call
 * @param api - The API instance to use for the transaction
 * @param extra - The type of extra bonding ("FreeBalance" or "Rewards")
 * @returns The bond extra transaction call
 */
export const bondExtraTx = (
  api: Api<ChainIdAssetHub>,
  type: "FreeBalance" | "Rewards",
  amount?: bigint
): UnsafeTransactionType => {
  if (type === "FreeBalance") {
    return api.tx.NominationPools.bond_extra({
      extra: { type: "FreeBalance", value: amount ?? BigInt(0) }
    })
  } else {
    return api.tx.NominationPools.bond_extra({ extra: { type: "Rewards", value: undefined } })
  }
}
