import type { Api, ChainIdRelay } from "@polkadot-agent-kit/common"

/**
 * Interface for pool member information
 */
export interface PoolMember {
  account: string
  poolId: number
  points: bigint
  lastRecordedRewardCounter: bigint
  unbondingEras: Array<{ era: number; value: bigint }>
}

/**
 * Get members of a nomination pool
 * @param api - The API instance to use for the query
 * @param poolId - The ID of the pool to query members for
 * @returns Promise that resolves to an array of pool members
 */
export const getPoolMembers = async (
  api: Api<ChainIdRelay>,
  poolId: number
): Promise<PoolMember[]> => {
  try {
    const poolMemberEntries = await api.query.NominationPools.PoolMembers.getEntries()

    type PoolMemberEntry = {
      keyArgs: unknown[]
      value: {
        pool_id: number
        points: bigint
        last_recorded_reward_counter: bigint
        unbonding_eras: Array<[number, bigint]>
      } | null
    }

    return (poolMemberEntries as PoolMemberEntry[])
      .filter(({ value }) => value && value.pool_id === poolId)
      .map(({ keyArgs, value }) => {
        const account = keyArgs[0] as string
        const typedValue = value!

        return {
          account,
          poolId: typedValue.pool_id,
          points: typedValue.points,
          lastRecordedRewardCounter: typedValue.last_recorded_reward_counter,
          unbondingEras: typedValue.unbonding_eras.map(([era, value]: [number, bigint]) => ({
            era,
            value
          }))
        }
      })
  } catch (error) {
    throw new Error(`Error fetching pool members for pool ${poolId}: ${String(error)}`)
  }
}
