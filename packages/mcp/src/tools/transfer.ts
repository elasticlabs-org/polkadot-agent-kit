import type { CallToolRequest, CallToolResult } from "@modelcontextprotocol/sdk/types";
import type { KnownChainId } from "@polkadot-agent-kit/common";
import type { PolkadotAgentKit } from "@polkadot-agent-kit/sdk";

import { transferNativeSchema, type TransferNativeParams } from "../types/schemas";
import type { TransferResult } from "../types/index";
import { executeTool, validateAndFormatAddress } from "../utils/index";

export class TransferToolHandler {
  constructor(
    private polkadotAgent: PolkadotAgentKit
  ) {}

  async transferNative(request: CallToolRequest): Promise<CallToolResult> {
    return executeTool<TransferResult>(
      "transfer_native",
      async () => {
        const params = transferNativeSchema.parse(request.params) as TransferNativeParams;
        const { to, amount, chain } = params;

        // Use the SDK's transfer tool
        const transferTool = this.polkadotAgent.transferNativeTool();
        
        // Call the tool with the transfer parameters
        const result = await transferTool.call({
          to: validateAndFormatAddress(to, chain),
          amount,
          chain: chain as KnownChainId
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
        };
      },
      (result) => {
        if (result.success) {
          return `Transfer successful: ${result.transactionHash}`;
        } else {
          return `Transfer failed: ${result.error}`;
        }
      }
    );
  }
}
