import type { Api, ChainIdRelay } from "@polkadot-agent-kit/common"

import type { Tx } from "../../types"

/**
 * Creates a claim rewards transaction call
 * @param api - The API instance to use for the transaction
 * @returns The claim rewards transaction call
 */
export const claimRewardsTx = (api: Api<ChainIdRelay>): Tx => {
  return api.tx.NominationPools.claim_payout()
}
