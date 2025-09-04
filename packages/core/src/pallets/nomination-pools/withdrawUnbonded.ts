import type { Api, ChainIdRelay } from "@polkadot-agent-kit/common"


import { UnsafeTransactionType } from "@polkadot-agent-kit/common"

/**
 * Creates a withdraw unbonded transaction call
 * @param api - The API instance to use for the transaction
 * @param memberAccount - The account to withdraw unbonded tokens for
 * @param numSlashingSpans - The number of slashing spans
 * @returns The withdraw unbonded transaction call
 */
export const withdrawUnbondedTx = (
  api: Api<ChainIdRelay>,
  memberAccount: string,
  numSlashingSpans: number
): UnsafeTransactionType => {
  return api.tx.NominationPools.withdraw_unbonded({
    member_account: memberAccount,
    num_slashing_spans: numSlashingSpans
  })
}
