import type { Api, ChainIdRelay } from "@polkadot-agent-kit/common"
import type { MultiAddress } from "@polkadot-api/descriptors"

import type { Tx } from "../../types"

/**
 * Creates an unbond transaction call
 * @param api - The API instance to use for the transaction
 * @param memberAccount - The account to unbond from
 * @param unbondingPoints - The amount of points to unbond
 * @returns The unbond transaction call
 */
export const unbondTx = (
  api: Api<ChainIdRelay>,
  memberAccount: MultiAddress,
  unbondingPoints: bigint
): Tx => {
  return api.tx.NominationPools.unbond({
    member_account: memberAccount,
    unbonding_points: unbondingPoints
  })
}
