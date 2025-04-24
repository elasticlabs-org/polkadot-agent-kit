import { Api, Chain, ChainId, KnowChainId } from "@dot-agent-kit/common"
import { DynamicStructuredTool, Tool } from "@langchain/core/tools"
import { PolkadotClient } from "polkadot-api"
import { checkBalanceTool } from "../langchain/balance"
import { transferNativeTool } from "../langchain/transfer"
import { MultiAddress } from "@dot-agent-kit/common/.papi/descriptors"

/**
 * Interface for Polkadot API implementations
 * Defines the interface that all Polkadot chain types must follow
 */
export interface IPolkadotAgentApi {
  getNativeBalanceTool(address: string): DynamicStructuredTool
  transferNativeTool(to: MultiAddress, amount: bigint): DynamicStructuredTool
}

export class PolkadotAgentApi implements IPolkadotAgentApi {
  private api: Api<KnowChainId>
  constructor(api: Api<KnowChainId>) {
    this.api = api
  }

  getNativeBalanceTool(address: string): DynamicStructuredTool {
    return checkBalanceTool(this.api)
  }

  transferNativeTool(to: MultiAddress, amount: bigint): DynamicStructuredTool {
    return transferNativeTool(this.api)
  }
}
