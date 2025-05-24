import { KnownChainId } from "@polkadot-agent-kit/common"
import { DynamicStructuredTool } from "@langchain/core/tools"
import { checkBalanceTool, transferNativeTool } from "../langchain"
import { PolkadotApi } from "@polkadot-agent-kit/core"
import { BalanceTool, TransferTool } from "../types"

/**
 * Interface for Polkadot API implementations
 * Defines the interface that all Polkadot chain types must follow
 */
export interface IPolkadotAgentApi {
  /**
   * Returns a tool that checks the balance of a specific address
   * @param address The address to check the balance for
   * @returns A dynamic structured tool that checks the balance of the specified address
   */
  getNativeBalanceTool(address: string): BalanceTool

  /**
   * Returns a tool that transfers native tokens to a specific address
   * @returns A dynamic structured tool that transfers native tokens to the specified address
   */
  transferNativeTool(): TransferTool
}

/**
 * Implementation of the IPolkadotAgentApi interface
 * Provides access to Polkadot API methods
 */
export class PolkadotAgentApi implements IPolkadotAgentApi {
  /**
   * The Polkadot API instance
   */
  private api: PolkadotApi

  constructor(api: PolkadotApi) {
    this.api = api
  }

  getNativeBalanceTool(address: string): BalanceTool {
    return checkBalanceTool(this.api.getAllApis(), address) as BalanceTool
  }

  transferNativeTool(): TransferTool {
    return transferNativeTool(this.api.getAllApis()) as TransferTool
  }
}
