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
    
    return poolMemberEntries
      .filter(({ value }) => value && value.pool_id === poolId)
      .map(({ keyArgs, value }) => {
        const account = keyArgs[0] as string
        
        return {
          account,
          poolId: value.pool_id,
          points: value.points,
          lastRecordedRewardCounter: value.last_recorded_reward_counter,
          unbondingEras: value.unbonding_eras.map((era: any) => ({
            era: era.era,
            value: era.value
          }))
        }
      })
  } catch (error) {
    console.error(`Error fetching pool members for pool ${poolId}:`, error)
    return []
  }
} 