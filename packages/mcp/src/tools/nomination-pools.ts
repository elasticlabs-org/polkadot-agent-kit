import type {
  CallToolRequest,
  CallToolResult,
} from "@modelcontextprotocol/sdk/types";
import type { KnownChainId } from "@polkadot-agent-kit/common";
import type { PolkadotAgentKit } from "@polkadot-agent-kit/sdk";

import type { StakingResult } from "../types/index.js";
import {
  bondExtraSchema,
  claimRewardsSchema,
  joinPoolSchema,
  unbondSchema,
  withdrawUnbondedSchema,
} from "../types/schemas";
import { executeTool } from "../utils/index";

export class NominationPoolsToolHandler {
  constructor(private polkadotAgent: PolkadotAgentKit) {}

  async joinPool(request: CallToolRequest): Promise<CallToolResult> {
    return executeTool<StakingResult>(
      "join_pool",
      async () => {
        const params = joinPoolSchema.parse(request.params);
        const { amount, chain } = params;

        // Use the SDK's join pool tool
        const joinPoolTool = this.polkadotAgent.joinPoolTool();

        // Call the tool with the parameters
        const result = await joinPoolTool.call({
          amount,
          chain: chain as KnownChainId,
        });

        // Parse the result from the SDK tool
        if (result.error) {
          return {
            success: false,
            error: result.error,
          };
        }

        return {
          success: true,
          transactionHash: result.transactionHash,
          data: result.data,
        };
      },
      (result) => {
        const params = joinPoolSchema.parse(request.params);
        if (result.success) {
          return `Successfully joined nomination pool with ${params.amount} tokens on ${params.chain}. Transaction hash: ${result.transactionHash}`;
        } else {
          return `Failed to join pool: ${result.error}`;
        }
      },
    );
  }

  async bondExtra(request: CallToolRequest): Promise<CallToolResult> {
    return executeTool<StakingResult>(
      "bond_extra",
      async () => {
        const params = bondExtraSchema.parse(request.params);
        const { type, amount, chain } = params;

        // Use the SDK's bond extra tool
        const bondExtraTool = this.polkadotAgent.bondExtraTool();

        // Call the tool with the parameters
        const result = await bondExtraTool.call({
          type,
          amount,
          chain: chain as KnownChainId,
        });

        // Parse the result from the SDK tool
        if (result.error) {
          return {
            success: false,
            error: result.error,
          };
        }

        return {
          success: true,
          transactionHash: result.transactionHash,
          data: result.data,
        };
      },
      (result) => {
        const params = bondExtraSchema.parse(request.params);
        if (result.success) {
          return `Successfully bonded extra tokens to nomination pool on ${params.chain}. Transaction hash: ${result.transactionHash}`;
        } else {
          return `Failed to bond extra: ${result.error}`;
        }
      },
    );
  }

  async unbond(request: CallToolRequest): Promise<CallToolResult> {
    return executeTool<StakingResult>(
      "unbond",
      async () => {
        const params = unbondSchema.parse(request.params);
        const { amount, chain } = params;

        // Use the SDK's unbond tool
        const unbondTool = this.polkadotAgent.unbondTool();

        // Call the tool with the parameters
        const result = await unbondTool.call({
          amount,
          chain: chain as KnownChainId,
        });

        // Parse the result from the SDK tool
        if (result.error) {
          return {
            success: false,
            error: result.error,
          };
        }

        return {
          success: true,
          transactionHash: result.transactionHash,
          data: result.data,
        };
      },
      (result) => {
        const params = unbondSchema.parse(request.params);
        if (result.success) {
          return `Successfully unbonded ${params.amount} tokens from nomination pool on ${params.chain}. Transaction hash: ${result.transactionHash}`;
        } else {
          return `Failed to unbond: ${result.error}`;
        }
      },
    );
  }

  async withdrawUnbonded(request: CallToolRequest): Promise<CallToolResult> {
    return executeTool<StakingResult>(
      "withdraw_unbonded",
      async () => {
        const params = withdrawUnbondedSchema.parse(request.params);
        const { slashingSpans, chain } = params;

        // Use the SDK's withdraw unbonded tool
        const withdrawUnbondedTool = this.polkadotAgent.withdrawUnbondedTool();

        // Call the tool with the parameters
        const result = await withdrawUnbondedTool.call({
          slashingSpans,
          chain: chain as KnownChainId,
        });

        // Parse the result from the SDK tool
        if (result.error) {
          return {
            success: false,
            error: result.error,
          };
        }

        return {
          success: true,
          transactionHash: result.transactionHash,
          data: result.data,
        };
      },
      (result) => {
        const params = withdrawUnbondedSchema.parse(request.params);
        if (result.success) {
          return `Successfully withdrew unbonded tokens from nomination pool on ${params.chain}. Transaction hash: ${result.transactionHash}`;
        } else {
          return `Failed to withdraw unbonded: ${result.error}`;
        }
      },
    );
  }

  async claimRewards(request: CallToolRequest): Promise<CallToolResult> {
    return executeTool<StakingResult>(
      "claim_rewards",
      async () => {
        const params = claimRewardsSchema.parse(request.params);
        const { chain } = params;

        // Use the SDK's claim rewards tool
        const claimRewardsTool = this.polkadotAgent.claimRewardsTool();

        // Call the tool with the parameters
        const result = await claimRewardsTool.call({
          chain: chain as KnownChainId,
        });

        // Parse the result from the SDK tool
        if (result.error) {
          return {
            success: false,
            error: result.error,
          };
        }

        return {
          success: true,
          transactionHash: result.transactionHash,
          data: result.data,
        };
      },
      (result) => {
        const params = claimRewardsSchema.parse(request.params);
        if (result.success) {
          return `Successfully claimed rewards from nomination pool on ${params.chain}. Transaction hash: ${result.transactionHash}`;
        } else {
          return `Failed to claim rewards: ${result.error}`;
        }
      },
    );
  }
}
