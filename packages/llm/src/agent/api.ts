import type { PolkadotApi } from "@polkadot-agent-kit/core"
import type { PolkadotSigner } from "polkadot-api"

import {
  checkBalanceTool,
  initializeChainApiTool,
  transferNativeTool,
  xcmTransferNativeTool
} from "../langchain"
import type {
  BalanceTool,
  InitializeChainApiTool,
  TransferTool,
  XcmTransferNativeAssetTool
} from "../types"
/**
 * Interface for Polkadot API implementations
 * Defines the interface that all Polkadot chain types must follow
 */
export interface IPolkadotAgentApi {
  /**
   * Returns a tool that checks the balance of a specific address
   * @param address - The address to check the balance for
   * @returns A dynamic structured tool that checks the balance of the specified address
   */
  getNativeBalanceTool(address: string): BalanceTool

  /**
   * Returns a tool that transfers native tokens to a specific address
   * @returns A dynamic structured tool that transfers native tokens to the specified address
   */
  transferNativeTool(signer: PolkadotSigner): TransferTool

  // /**
  //  * Returns a tool that transfers native tokens to a specific address via xcm
  //  * @returns A dynamic structured tool that transfers native tokens to the specified address via xcm
  //  */
  xcmTransferNativeTool(signer: PolkadotSigner, sender: string): XcmTransferNativeAssetTool

  /**
   * Returns a tool that initializes a new chain API dynamically
   * @returns A dynamic structured tool that initializes chain APIs
   */
  getInitializeChainApiTool(): InitializeChainApiTool
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
    return checkBalanceTool(this.api, address) as unknown as BalanceTool
  }

  transferNativeTool(signer: PolkadotSigner): TransferTool {
    return transferNativeTool(this.api, signer) as unknown as TransferTool
  }

  xcmTransferNativeTool(signer: PolkadotSigner, sender: string): XcmTransferNativeAssetTool {
    return xcmTransferNativeTool(signer, sender) as unknown as XcmTransferNativeAssetTool
  }

  getInitializeChainApiTool(): InitializeChainApiTool {
    return initializeChainApiTool(this.api) as unknown as InitializeChainApiTool
  }
}
