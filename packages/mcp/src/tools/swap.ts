import type {
  CallToolRequest,
  CallToolResult,
} from "@modelcontextprotocol/sdk/types";
import type { PolkadotAgentKit } from "@polkadot-agent-kit/sdk";

import type { SwapResult } from "../types/index.js";
import { swapTokensSchema } from "../types/schemas";
import { executeTool } from "../utils/index";

export class SwapToolHandler {
  constructor(private polkadotAgent: PolkadotAgentKit) {}

  async swapTokens(request: CallToolRequest): Promise<CallToolResult> {
    return executeTool<SwapResult>(
      "swap_tokens",
      async () => {
        const params = swapTokensSchema.parse(request.params);
        const { from, to, currencyFrom, currencyTo, amount, receiver, dex } =
          params;

        // Use the SDK's swap tokens tool
        const swapTokensTool = this.polkadotAgent.swapTokensTool();

        // Call the tool with the parameters
        const result = await swapTokensTool.call({
          from,
          to,
          currencyFrom,
          currencyTo,
          amount,
          receiver,
          dex,
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
          data: {
            from,
            to,
            currencyFrom,
            currencyTo,
            amount,
            receiver,
            dex,
          },
        };
      },
      (result) => {
        const params = swapTokensSchema.parse(request.params);
        if (result.success) {
          const swapType = params.dex
            ? `DEX swap on ${params.dex}`
            : `cross-chain swap from ${params.from} to ${params.to}`;
          return `Successfully completed ${swapType}: ${params.amount} ${params.currencyFrom} → ${params.currencyTo}. Transaction hash: ${result.transactionHash}`;
        } else {
          return `Token swap failed: ${result.error}`;
        }
      },
    );
  }
}
