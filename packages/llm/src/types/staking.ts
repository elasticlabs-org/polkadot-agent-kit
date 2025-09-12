import type { DynamicStructuredTool } from "@langchain/core/tools"
import { z } from "zod"

import type { BaseToolCallResult, ToolConfig } from "./common"
import { ToolNames } from "./common"

/**
 * Schema for the join pool tool input.
 * Defines the structure and validation rules for joining nomination pools.
 *
 * @example
 *   \{
 *     amount: "1.5",  // Amount of tokens to bond
 *     poolId: 1,      // Pool ID to join
 *     chain: "polkadot"  // Target chain
 *   \}
 */
export const joinPoolToolSchema = z.object({
  amount: z.string().describe("The amount of tokens to bond in the pool"),
  chain: z.string().describe("The chain to join the pool on")
})

/**
 * Schema for the bond extra tool input. This uses an enum-based approach for the `type` field.
 *
 * - If `type` is "FreeBalance", an `amount` should be provided to bond specific tokens from wallet.
 * - If `type` is "Rewards", no `amount` is needed as all pending rewards will be re-staked.
 *
 * @example
 *   // Bonding from free balance
 *   \{
 *     type: "FreeBalance",
 *     amount: "1.5",
 *     chain: "polkadot"
 *   \}
 *
 *   // Re-staking rewards
 *   \{
 *     type: "Rewards",
 *     chain: "polkadot"
 *   \}
 */
export const bondExtraToolSchema = z
  .object({
    type: z.enum(["FreeBalance", "Rewards"]).describe("Type of bonding operation"),
    amount: z
      .string()
      .optional()
      .describe("Amount to bond (only needed for FreeBalance type, not for Rewards)"),
    chain: z.string().describe("Chain name")
  })
  .describe(
    "Bonds extra funds to a nomination pool. Use 'FreeBalance' to bond a specific amount from your wallet, or 'Rewards' to re-stake ALL earned rewards (no amount needed)."
  )

/**
 * Schema for the unbond tool input.
 * Defines the structure and validation rules for unbonding tokens.
 *
 * @example
 *   \{
 *     amount: "1.5",  // Amount of tokens to unbond
 *     chain: "polkadot"  // Target chain
 *   \}
 */
export const unbondToolSchema = z.object({
  amount: z.string().describe("The amount of tokens to unbond"),
  chain: z.string().describe("The chain to unbond tokens on")
})

/**
 * Schema for the withdraw unbonded tool input.
 * Defines the structure and validation rules for withdrawing unbonded tokens.
 *
 * @example
 *   \{
 *     slashingSpans: 0,  // Number of slashing spans
 *     chain: "polkadot"  // Target chain
 *   \}
 */
export const withdrawUnbondedToolSchema = z.object({
  slashingSpans: z.string().describe("The number of slashing spans"),
  chain: z.string().describe("The chain to withdraw unbonded tokens on")
})

/**
 * Schema for the claim rewards tool input.
 * Defines the structure and validation rules for claiming rewards.
 *
 * @example
 *   \{
 *     chain: "polkadot"  // Target chain
 *   \}
 */
export const claimRewardsToolSchema = z.object({
  chain: z.string().describe("The chain to claim rewards on")
})

/**
 * Type for a join pool tool that validates input using joinPoolToolSchema.
 */
export type JoinPoolTool = DynamicStructuredTool<typeof joinPoolToolSchema>

/**
 * Type for a bond extra tool that validates input using bondExtraToolSchema.
 */
export type BondExtraTool = DynamicStructuredTool<typeof bondExtraToolSchema>

/**
 * Type for an unbond tool that validates input using unbondToolSchema.
 */
export type UnbondTool = DynamicStructuredTool<typeof unbondToolSchema>

/**
 * Type for a withdraw unbonded tool that validates input using withdrawUnbondedToolSchema.
 */
export type WithdrawUnbondedTool = DynamicStructuredTool<typeof withdrawUnbondedToolSchema>

/**
 * Type for a claim rewards tool that validates input using claimRewardsToolSchema.
 */
export type ClaimRewardsTool = DynamicStructuredTool<typeof claimRewardsToolSchema>

export type StakingToolResult = BaseToolCallResult

/**
 * Configuration object for the join pool tool.
 */
export const toolConfigJoinPool: ToolConfig = {
  name: ToolNames.JOIN_POOL,
  description: "Join a nomination pool for staking",
  schema: joinPoolToolSchema
}

/**
 * Configuration object for the bond extra tool.
 */
export const toolConfigBondExtra: ToolConfig = {
  name: ToolNames.BOND_EXTRA,
  description: "Bond extra tokens to a nomination pool",
  schema: bondExtraToolSchema
}

/**
 * Configuration object for the unbond tool.
 */
export const toolConfigUnbond: ToolConfig = {
  name: ToolNames.UNBOND,
  description: "Unbond tokens from a nomination pool",
  schema: unbondToolSchema
}

/**
 * Configuration object for the withdraw unbonded tool.
 */
export const toolConfigWithdrawUnbonded: ToolConfig = {
  name: ToolNames.WITHDRAW_UNBONDED,
  description: "Withdraw unbonded tokens from a nomination pool",
  schema: withdrawUnbondedToolSchema
}

/**
 * Configuration object for the claim rewards tool.
 */
export const toolConfigClaimRewards: ToolConfig = {
  name: ToolNames.CLAIM_REWARDS,
  description: "Claim rewards from a nomination pool",
  schema: claimRewardsToolSchema
}
