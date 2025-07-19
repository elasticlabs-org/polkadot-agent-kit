import type { PolkadotApi } from "@polkadot-agent-kit/core"
import type { PolkadotSigner } from "polkadot-api"

import {
  bondExtraTool,
  checkBalanceTool,
  claimRewardsTool,
  initializeChainApiTool,
  joinPoolTool,
  swapTokensTool,
  transferNativeTool,
  unbondTool,
  withdrawUnbondedTool,
  xcmTransferNativeTool
} from "../langchain"
import type {
  BalanceTool,
  BondExtraTool,
  ClaimRewardsTool,
  InitializeChainApiTool,
  JoinPoolTool,
  SwapTokensTool,
  TransferTool,
  UnbondTool,
  WithdrawUnbondedTool,
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

  /**
   * Returns a tool that swaps tokens across different chains using the Hydration DEX
   * @returns A dynamic structured tool that swaps tokens across different chains using the Hydration DEX
   */
  swapTokensTool(signer: PolkadotSigner, sender: string): SwapTokensTool

  /**
   * Returns a tool that joins a nomination pool
   * @param signer - The signer to use for transactions
   * @returns A dynamic structured tool that joins nomination pools
   */
  joinPoolTool(signer: PolkadotSigner): JoinPoolTool

  /**
   * Returns a tool that bonds extra tokens to a nomination pool
   * @param signer - The signer to use for transactions
   * @returns A dynamic structured tool that bonds extra tokens
   */
  bondExtraTool(signer: PolkadotSigner): BondExtraTool

  /**
   * Returns a tool that unbonds tokens from a nomination pool
   * @param signer - The signer to use for transactions
   * @param address - The address to unbond from
   * @returns A dynamic structured tool that unbonds tokens
   */
  unbondTool(signer: PolkadotSigner, address: string): UnbondTool

  /**
   * Returns a tool that withdraws unbonded tokens from a nomination pool
   * @param signer - The signer to use for transactions
   * @param address - The address to withdraw for
   * @returns A dynamic structured tool that withdraws unbonded tokens
   */
  withdrawUnbondedTool(signer: PolkadotSigner, address: string): WithdrawUnbondedTool

  /**
   * Returns a tool that claims rewards from a nomination pool
   * @param signer - The signer to use for transactions
   * @returns A dynamic structured tool that claims rewards
   */
  claimRewardsTool(signer: PolkadotSigner): ClaimRewardsTool
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

  swapTokensTool(signer: PolkadotSigner, sender: string): SwapTokensTool {
    return swapTokensTool(signer, sender) as unknown as SwapTokensTool
  }

  joinPoolTool(signer: PolkadotSigner): JoinPoolTool {
    return joinPoolTool(this.api, signer) as unknown as JoinPoolTool
  }

  bondExtraTool(signer: PolkadotSigner): BondExtraTool {
    return bondExtraTool(this.api, signer) as unknown as BondExtraTool
  }

  unbondTool(signer: PolkadotSigner, address: string): UnbondTool {
    return unbondTool(this.api, signer, address) as unknown as UnbondTool
  }

  withdrawUnbondedTool(signer: PolkadotSigner, address: string): WithdrawUnbondedTool {
    return withdrawUnbondedTool(this.api, signer, address) as unknown as WithdrawUnbondedTool
  }

  claimRewardsTool(signer: PolkadotSigner): ClaimRewardsTool {
    return claimRewardsTool(this.api, signer) as unknown as ClaimRewardsTool
  }
}
