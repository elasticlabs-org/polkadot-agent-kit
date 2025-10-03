import { tool } from "@langchain/core/tools"
import type { Api, ChainIdAssetHub, UnsafeTransactionType } from "@polkadot-agent-kit/common"
import { parseUnits } from "@polkadot-agent-kit/common"
import { getAllSupportedChains, getChainById, isChainIdAssetHub } from "@polkadot-agent-kit/common"
import type { PolkadotApi } from "@polkadot-agent-kit/core"
import {
  bondExtraTx,
  claimRewardsTx,
  joinPoolTx,
  submitTxWithPolkadotSigner,
  unbondTx,
  withdrawUnbondedTx
} from "@polkadot-agent-kit/core"
import type { PolkadotSigner } from "polkadot-api"
import type { z } from "zod"
import { _success } from "zod/v4/core"

import type {
  bondExtraToolSchema,
  claimRewardsToolSchema,
  joinPoolToolSchema,
  StakingToolResult,
  unbondToolSchema,
  withdrawUnbondedToolSchema
} from "../types"
import { ToolNames } from "../types/common"
import {
  toolConfigBondExtra,
  toolConfigClaimRewards,
  toolConfigJoinPool,
  toolConfigUnbond,
  toolConfigWithdrawUnbonded
} from "../types/staking"
import { executeTool, validateAndFormatAddress } from "../utils"

/**
 * Returns a tool that joins a nomination pool
 * @param polkadotApi - The Polkadot API instance
 * @param signer - The signer to use for transactions
 * @returns A dynamic structured tool for joining nomination pools
 */
export const joinPoolTool = (polkadotApi: PolkadotApi, signer: PolkadotSigner) => {
  return tool(async ({ amount, chain }: z.infer<typeof joinPoolToolSchema>) => {
    return executeTool<StakingToolResult>(
      ToolNames.JOIN_POOL,
      async () => {
        if (!isChainIdAssetHub(chain)) {
          return {
            success: false,
            error: `Staking operations are only supported on Asset Hub chains. The provided chain '${chain}' is not an Asset Hub chain. Supported Asset Hub chains are: polkadot_asset_hub, west_asset_hub, kusama_asset_hub, paseo_asset_hub.`
          }
        }
        const api = polkadotApi.getApi(chain) as Api<ChainIdAssetHub>

        const chainInfo = getChainById(chain, getAllSupportedChains())
        const amountBigInt = parseUnits(amount, chainInfo.decimals)

        const tx = await joinPoolTx(api, amountBigInt)

        const result = await submitTxWithPolkadotSigner(tx, signer)

        if (result.success) {
          return {
            success: true,
            transactionHash: result.transactionHash,
            data: { amount, chain }
          }
        } else {
          return {
            success: false,
            transactionHash: result.transactionHash,
            error: result.error
          }
        }
      },
      result => {
        if (result.success) {
          return `Successfully joined pool with ${amount} tokens on ${chain}. Transaction hash: ${result.transactionHash}`
        } else {
          return `Tx Hash Failed: ${result.transactionHash} with error: ${result.error}`
        }
      }
    )
  }, toolConfigJoinPool)
}

/**
 * Returns a tool that bonds extra tokens to a nomination pool
 * @param polkadotApi - The Polkadot API instance
 * @param signer - The signer to use for transactions
 * @returns A dynamic structured tool for bonding extra tokens
 */
export const bondExtraTool = (polkadotApi: PolkadotApi, signer: PolkadotSigner) => {
  return tool(async ({ type, amount, chain }: z.infer<typeof bondExtraToolSchema>) => {
    return executeTool<StakingToolResult>(
      ToolNames.BOND_EXTRA,
      async () => {
        if (!isChainIdAssetHub(chain)) {
          return {
            success: false,
            error: `Staking operations are only supported on Asset Hub chains. The provided chain '${chain}' is not an Asset Hub chain. Supported Asset Hub chains are: polkadot_asset_hub, west_asset_hub, kusama_asset_hub, paseo_asset_hub.`
          }
        }

        const api = polkadotApi.getApi(chain) as Api<ChainIdAssetHub>
        const chainInfo = getChainById(chain, getAllSupportedChains())
        let tx: UnsafeTransactionType
        if (type === "FreeBalance" && amount) {
          const amountBigInt = parseUnits(amount, chainInfo.decimals)
          tx = bondExtraTx(api, "FreeBalance", amountBigInt)
        } else {
          tx = bondExtraTx(api, "Rewards")
        }

        const result = await submitTxWithPolkadotSigner(tx, signer)
        if (result.success) {
          return {
            success: result.success,
            transactionHash: result.transactionHash
          }
        } else {
          return {
            success: false,
            transactionHash: result.transactionHash,
            error: result.error
          }
        }
      },
      result => {
        if (result.success) {
          return `Successfully bonded extra tokens (${type}) on ${chain}. Transaction hash: ${result.transactionHash}`
        } else {
          return `Tx Hash Failed: ${result.transactionHash} with error: ${result.error}`
        }
      }
    )
  }, toolConfigBondExtra)
}

/**
 * Returns a tool that unbonds tokens from a nomination pool
 * @param polkadotApi - The Polkadot API instance
 * @param signer - The signer to use for transactions
 * @param address - The address to unbond from
 * @returns A dynamic structured tool for unbonding tokens
 */
export const unbondTool = (polkadotApi: PolkadotApi, signer: PolkadotSigner, address: string) => {
  return tool(async ({ amount, chain }: z.infer<typeof unbondToolSchema>) => {
    return executeTool<StakingToolResult>(
      ToolNames.UNBOND,
      async () => {
        if (!isChainIdAssetHub(chain)) {
          return {
            success: false,
            error: `Staking operations are only supported on Asset Hub chains. The provided chain '${chain}' is not an Asset Hub chain. Supported Asset Hub chains are: polkadot_asset_hub, west_asset_hub, kusama_asset_hub, paseo_asset_hub.`
          }
        }

        const api = polkadotApi.getApi(chain) as Api<ChainIdAssetHub>

        const formattedAddress = validateAndFormatAddress(address, chain)

        const chainInfo = getChainById(chain, getAllSupportedChains())
        const amountBigInt = parseUnits(amount, chainInfo.decimals)

        const tx = unbondTx(api, formattedAddress, amountBigInt)

        const result = await submitTxWithPolkadotSigner(tx, signer)

        if (result.success) {
          return {
            success: result.success,
            transactionHash: result.transactionHash
          }
        } else {
          return {
            success: false,
            transactionHash: result.transactionHash,
            error: result.error
          }
        }
      },
      result => {
        if (result.success) {
          return `Successfully unbonded ${amount} tokens on ${chain}. Transaction hash: ${result.transactionHash}`
        } else {
          return `Tx Hash Failed: ${result.transactionHash} with error: ${result.error}`
        }
      }
    )
  }, toolConfigUnbond)
}

/**
 * Returns a tool that withdraws unbonded tokens from a nomination pool
 * @param polkadotApi - The Polkadot API instance
 * @param signer - The signer to use for transactions
 * @param address - The address to withdraw for
 * @returns A dynamic structured tool for withdrawing unbonded tokens
 */
export const withdrawUnbondedTool = (
  polkadotApi: PolkadotApi,
  signer: PolkadotSigner,
  address: string
) => {
  return tool(async ({ numSlashingSpans, chain }: z.infer<typeof withdrawUnbondedToolSchema>) => {
    return executeTool<StakingToolResult>(
      ToolNames.WITHDRAW_UNBONDED,
      async () => {
        if (!isChainIdAssetHub(chain)) {
          return {
            success: false,
            error: `Staking operations are only supported on Asset Hub chains. The provided chain '${chain}' is not an Asset Hub chain. Supported Asset Hub chains are: polkadot_asset_hub, west_asset_hub, kusama_asset_hub, paseo_asset_hub.`
          }
        }
        const api = polkadotApi.getApi(chain) as Api<ChainIdAssetHub>
        const formattedAddress = validateAndFormatAddress(address, chain)
        const tx = withdrawUnbondedTx(api, formattedAddress, Number(numSlashingSpans || 0))

        const result = await submitTxWithPolkadotSigner(tx, signer)

        if (result.success) {
          return {
            success: result.success,
            transactionHash: result.transactionHash
          }
        } else {
          return {
            success: false,
            transactionHash: result.transactionHash,
            error: result.error
          }
        }
      },
      result => {
        if (result.success) {
          return `Successfully withdrew unbonded tokens on ${chain}. Transaction hash: ${result.transactionHash}`
        } else {
          return `Tx Hash Failed: ${result.transactionHash} with error: ${result.error}`
        }
      }
    )
  }, toolConfigWithdrawUnbonded)
}

/**
 * Returns a tool that claims rewards from a nomination pool
 * @param polkadotApi - The Polkadot API instance
 * @param signer - The signer to use for transactions
 * @returns A dynamic structured tool for claiming rewards
 */
export const claimRewardsTool = (polkadotApi: PolkadotApi, signer: PolkadotSigner) => {
  return tool(async ({ chain }: z.infer<typeof claimRewardsToolSchema>) => {
    return executeTool<StakingToolResult>(
      ToolNames.CLAIM_REWARDS,
      async () => {
        if (!isChainIdAssetHub(chain)) {
          return {
            success: false,
            error: `Staking operations are only supported on Asset Hub chains. The provided chain '${chain}' is not an Asset Hub chain. Supported Asset Hub chains are: polkadot_asset_hub, west_asset_hub, kusama_asset_hub, paseo_asset_hub.`
          }
        }
        const api = polkadotApi.getApi(chain) as Api<ChainIdAssetHub>

        const tx = claimRewardsTx(api)

        const result = await submitTxWithPolkadotSigner(tx, signer)

        if (result.success) {
          return {
            success: result.success,
            transactionHash: result.transactionHash
          }
        } else {
          return {
            success: false,
            transactionHash: result.transactionHash,
            error: result.error
          }
        }
      },
      result => {
        if (result.success) {
          return `Successfully claimed rewards on ${chain}. Transaction hash: ${result.transactionHash}`
        } else {
          return `Tx Hash Failed: ${result.transactionHash} with error: ${result.error}`
        }
      }
    )
  }, toolConfigClaimRewards)
}
