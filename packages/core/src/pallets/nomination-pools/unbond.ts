import type { Api, ChainIdAssetHub } from "@polkadot-agent-kit/common"
import type { UnsafeTransactionType } from "@polkadot-agent-kit/common"

/**
 * Creates an unbond transaction call
 * @param api - The API instance to use for the transaction
 * @param memberAccount - The account to unbond from
 * @param unbondingPoints - The amount of points to unbond
 * @returns The unbond transaction call
 */
export const unbondTx = (
  api: Api<ChainIdAssetHub>,
  memberAccount: string,
  unbondingPoints: bigint
): UnsafeTransactionType => {
  return api.tx.NominationPools.unbond({
    member_account: {
      type: "Id",
      value: memberAccount
    },
    unbonding_points: unbondingPoints
  })
}
