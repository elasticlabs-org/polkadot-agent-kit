import type { Api, ChainIdAssetHub } from "@polkadot-agent-kit/common"
import type { UnsafeTransactionType } from "@polkadot-agent-kit/common"

/**
 * Creates a claim rewards transaction call
 * @param api - The API instance to use for the transaction
 * @returns The claim rewards transaction call
 */
export const claimRewardsTx = (api: Api<ChainIdAssetHub>): UnsafeTransactionType => {
  return api.tx.NominationPools.claim_payout()
}
