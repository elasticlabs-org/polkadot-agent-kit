import type { Api, ChainIdRelay } from "@polkadot-agent-kit/common"
import type { Tx } from "../../types"

/**
 * Creates a join pool transaction call
 * @param api - The API instance to use for the transaction
 * @param amount - The amount to bond to the pool
 * @param poolId - The ID of the pool to join
 * @returns The join pool transaction call
 */
export const joinPoolTx = (
  api: Api<ChainIdRelay>,
  amount: bigint,
  poolId: number
): Tx => {
  return api.tx.NominationPools.join({ amount, pool_id: poolId })
}
