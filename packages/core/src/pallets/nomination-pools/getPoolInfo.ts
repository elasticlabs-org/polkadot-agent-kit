import type { Api, ChainIdRelay } from "@polkadot-agent-kit/common"

/**
 * Interface for pool information
 */
export interface PoolInfo {
  id: number
  state: string
  points: bigint
  memberCounter: number
  roles: {
    depositor: string
    root: string | undefined
    nominator: string | undefined
    bouncer: string | undefined
  }
}

/**
 * Get information about a nomination pool
 * @param api - The API instance to use for the query
 * @param poolId - The ID of the pool to query
 * @returns Promise that resolves to the pool information or null if not found
 */
export const getPoolInfo = async (
  api: Api<ChainIdRelay>,
  poolId: number
): Promise<PoolInfo | null> => {
  try {
    const poolInfo = await api.query.NominationPools.BondedPools.getValue(poolId)
    
    if (!poolInfo) {
      return null
    }
    
    return {
      id: poolId,
      state: poolInfo.state.type,
      points: poolInfo.points,
      memberCounter: poolInfo.member_counter,
      roles: {
        depositor: poolInfo.roles.depositor,
        root: poolInfo.roles.root,
        nominator: poolInfo.roles.nominator,
        bouncer: poolInfo.roles.bouncer,
      }
    }
  } catch (error) {
    console.error(`Error fetching pool info for pool ${poolId}:`, error)
    return null
  }
} 