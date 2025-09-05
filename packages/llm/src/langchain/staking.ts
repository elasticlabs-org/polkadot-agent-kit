import { tool } from "@langchain/core/tools"
import type { Api, ChainIdRelay, UnsafeTransactionType } from "@polkadot-agent-kit/common"
import { getAllSupportedChains, getChainById } from "@polkadot-agent-kit/common"
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
        const api = polkadotApi.getApi(chain as ChainIdRelay) as Api<ChainIdRelay>
        const chainInfo = getChainById(chain as ChainIdRelay, getAllSupportedChains())
        const amountBigInt = BigInt(amount) * BigInt(10 ** chainInfo.decimals)

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
        const api = polkadotApi.getApi(chain as ChainIdRelay) as Api<ChainIdRelay>
        const chainInfo = getChainById(chain as ChainIdRelay, getAllSupportedChains())
        let tx: UnsafeTransactionType
        if (type === "FreeBalance") {
          const amountBigInt = BigInt(amount!) * BigInt(10 ** chainInfo.decimals)
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
        const api = polkadotApi.getApi(chain as ChainIdRelay) as Api<ChainIdRelay>
        const formattedAddress = validateAndFormatAddress(address, chain as ChainIdRelay)
        const chainInfo = getChainById(chain as ChainIdRelay, getAllSupportedChains())
        const amountBigInt = BigInt(amount) * BigInt(10 ** chainInfo.decimals)

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
  return tool(async ({ slashingSpans, chain }: z.infer<typeof withdrawUnbondedToolSchema>) => {
    return executeTool<StakingToolResult>(
      ToolNames.WITHDRAW_UNBONDED,
      async () => {
        const api = polkadotApi.getApi(chain as ChainIdRelay) as Api<ChainIdRelay>
        const formattedAddress = validateAndFormatAddress(address, chain as ChainIdRelay)
        const tx = withdrawUnbondedTx(api, formattedAddress, Number(slashingSpans))

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
        const api = polkadotApi.getApi(chain as ChainIdRelay) as Api<ChainIdRelay>

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
