import type { Api, ChainIdRelay } from "@polkadot-agent-kit/common"
import type { Tx } from "../../types"
import { findBestPoolId } from "../../utils/nominationPools"

/**
 * Creates a join pool transaction call
 * @param api - The API instance to use for the transaction
 * @param amount - The amount to bond to the pool
 * @returns The join pool transaction call
 */
export const joinPoolTx = async (
  api: Api<ChainIdRelay>,
  amount: bigint
): Promise<Tx> => {
  const poolId = await findBestPoolId(api)
  if (!poolId) {
    throw new Error("No pool found")
  }
  return api.tx.NominationPools.join({ amount, pool_id: poolId })
}
