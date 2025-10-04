import type { Api, ChainIdAssetHub } from "@polkadot-agent-kit/common"

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

const getAllPoolsInfo = async (api: Api<ChainIdAssetHub>): Promise<PoolInfo[]> => {
  try {
    const allPoolEntries = await api.query.NominationPools.BondedPools.getEntries()

    if (!allPoolEntries) {
      return []
    }

    type PoolEntry = {
      keyArgs: [number]
      value: {
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
    }

    return (allPoolEntries as PoolEntry[]).map(entry => {
      const poolId = entry.keyArgs[0]
      const poolInfo = entry.value
      return {
        id: poolId,
        state: poolInfo.state.type,
        points: poolInfo.points,
        memberCounter: poolInfo.member_counter,
        roles: {
          depositor: poolInfo.roles.depositor,
          root: poolInfo.roles.root,
          nominator: poolInfo.roles.nominator,
          bouncer: poolInfo.roles.bouncer
        }
      }
    })
  } catch (error) {
    throw new Error(`Error fetching all pool info: ${String(error)}`)
  }
}

export const findBestPoolId = async (api: Api<ChainIdAssetHub>): Promise<number | null> => {
  try {
    const allPools = await getAllPoolsInfo(api)
    if (allPools.length === 0) {
      return null
    }

    // Filter for open pools only
    const openPools = allPools.filter(pool => pool.state === "Open")

    if (openPools.length === 0) {
      return null
    }

    const bestPool = openPools.reduce((max, pool) => (pool.points > max.points ? pool : max))
    return bestPool.id
  } catch (error) {
    throw new Error(`Error finding best pool: ${String(error)}`)
  }
}
