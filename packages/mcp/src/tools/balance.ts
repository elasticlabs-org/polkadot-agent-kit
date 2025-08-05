import type { CallToolRequest, CallToolResult } from "@modelcontextprotocol/sdk/types";
import type { KnownChainId } from "@polkadot-agent-kit/common";
import type { PolkadotAgentKit } from "@polkadot-agent-kit/sdk";

import { checkBalanceSchema, type CheckBalanceParams } from "../types/schemas";
import type { BalanceResult } from "../types/index.js";
import { executeTool } from "../utils/index";

export class BalanceToolHandler {
  constructor(
    private polkadotAgent: PolkadotAgentKit
  ) {}

  async checkBalance(request: CallToolRequest): Promise<CallToolResult> {
    return executeTool<BalanceResult>(
      "check_balance",
      async () => {
        const params = checkBalanceSchema.parse(request.params) as CheckBalanceParams;
        const { chain } = params;
        
        const targetAddress = this.polkadotAgent.getCurrentAddress();
        if (!targetAddress) {
          throw new Error("No address provided and no default address configured");
        }

        // Use the SDK's native balance tool
        const balanceTool = this.polkadotAgent.getNativeBalanceTool();
        
        // Call the tool with the target address
        const result = await balanceTool.call({
          address: targetAddress,
          chain: chain as KnownChainId
        });

        // Parse the result from the SDK tool
        if (result.error) {
          throw new Error(`Balance check failed: ${result.error}`);
        }

        return {
          balance: result.balance || "0",
          symbol: result.symbol || "DOT",
          chain,
        };
      },
      (result) => `Balance on ${result.chain}: ${result.balance} ${result.symbol}`
    );
  }
}
