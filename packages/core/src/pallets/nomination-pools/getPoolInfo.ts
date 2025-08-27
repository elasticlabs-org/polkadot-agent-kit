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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const poolInfo = await api.query.NominationPools.BondedPools.getValue(poolId)

    if (!poolInfo) {
      return null
    }

    const typedPoolInfo = poolInfo as {
      state: { type: string }
      points: bigint
      member_counter: number
      roles: {
        depositor: string
        root?: string
        nominator?: string
        bouncer?: string
      }
    }

    return {
      id: poolId,
      state: typedPoolInfo.state.type,
      points: typedPoolInfo.points,
      memberCounter: typedPoolInfo.member_counter,
      roles: {
        depositor: typedPoolInfo.roles.depositor,
        root: typedPoolInfo.roles.root,
        nominator: typedPoolInfo.roles.nominator,
        bouncer: typedPoolInfo.roles.bouncer
      }
    }
  } catch (error) {
    throw new Error(`Error fetching pool info for pool ${poolId}: ${String(error)}`)
  }
}
