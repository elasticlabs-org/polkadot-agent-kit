import type { CallToolRequest, CallToolResult } from "@modelcontextprotocol/sdk/types";
import type { KnownChainId } from "@polkadot-agent-kit/common";
import type { PolkadotAgentKit } from "@polkadot-agent-kit/sdk";

import { 
  xcmTransferSchema,
  type XcmTransferParams
} from "../types/schemas";
import type { XcmTransferResult } from "../types/index.js";
import { executeTool } from "../utils/index";

export class XcmTransferToolHandler {
  constructor(
    private polkadotAgent: PolkadotAgentKit
  ) {}

  async xcmTransfer(request: CallToolRequest): Promise<CallToolResult> {
    return executeTool<XcmTransferResult>(
      "xcm_transfer",
      async () => {
        const params = xcmTransferSchema.parse(request.params) as XcmTransferParams;
        const { amount, to, sourceChain, destChain } = params;

        // Use the SDK's XCM transfer tool
        const xcmTransferTool = this.polkadotAgent.xcmTransferNativeTool();
        
        // Call the tool with the parameters
        const result = await xcmTransferTool.call({
          amount,
          to,
          sourceChain: sourceChain as KnownChainId,
          destChain: destChain as KnownChainId
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
            amount,
            to,
            sourceChain,
            destChain
          }
        };
      },
      (result) => {
        if (result.success) {
          return `Successfully transferred ${request.params.amount} tokens from ${request.params.sourceChain} to ${request.params.destChain}. Transaction hash: ${result.transactionHash}`;
        } else {
          return `XCM transfer failed: ${result.error}`;
        }
      }
    );
  }
} 