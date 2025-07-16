import type { Api, ChainIdRelay } from "@polkadot-agent-kit/common"
import type { Tx } from "../../types"


/**
 * Creates a bond extra transaction call
 * @param api - The API instance to use for the transaction
 * @param extra - The type of extra bonding ("FreeBalance" or "Rewards")
 * @returns The bond extra transaction call
 */
export const bondExtraTx = (
  api: Api<ChainIdRelay>,
  extra: "FreeBalance" | "Rewards"
): Tx => {
  return api.tx.NominationPools.bond_extra({ extra: {type: 'Rewards', value: undefined}})
}
