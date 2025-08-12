import type { PolkadotApi } from "@polkadot-agent-kit/core"
import type { PolkadotSigner } from "polkadot-api"

import {
  bondExtraTool,
  checkBalanceTool,
  claimRewardsTool,
  initializeChainApiTool,
  joinPoolTool,
  registerIdentityTool,
  swapTokensTool,
  transferNativeTool,
  unbondTool,
  withdrawUnbondedTool,
  xcmTransferNativeTool
} from "../langchain"
import {
  type Action,
  type BalanceTool,
  type BondExtraTool,
  type ClaimRewardsTool,
  type InitializeChainApiTool,
  type JoinPoolTool,
  type RegisterIdentityTool,
  type SwapTokensTool,
  toolConfigBalance,
  toolConfigBondExtra,
  toolConfigClaimRewards,
  toolConfigInitializeChainApi,
  toolConfigJoinPool,
  toolConfigRegisterIdentity,
  toolConfigSwapTokens,
  toolConfigTransferNative,
  toolConfigUnbond,
  toolConfigWithdrawUnbonded,
  toolConfigXcmTransferNativeAsset,
  type TransferTool,
  type UnbondTool,
  type WithdrawUnbondedTool,
  type XcmTransferNativeAssetTool
} from "../types"
import { createAction } from "../utils/tools"
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

  /**
   * Returns a tool that registers an identity on People Chain
   * @param signer - The signer to use for transactions
   * @returns A dynamic structured tool that registers an identity on People Chain
   */
  registerIdentityTool(signer: PolkadotSigner): RegisterIdentityTool

  getActions(signer: PolkadotSigner, address: string): Action[]
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

  registerIdentityTool(signer: PolkadotSigner): RegisterIdentityTool {
    return registerIdentityTool(this.api, signer) as unknown as RegisterIdentityTool
  }

  getActions(signer: PolkadotSigner, address: string): Action[] {
    const actions: Action[] = []

    // Balance Tool
    const balanceTool = this.getNativeBalanceTool(address)
    actions.push(createAction(balanceTool, toolConfigBalance))

    // Transfer Tool
    const transferTool = this.transferNativeTool(signer)
    actions.push(createAction(transferTool, toolConfigTransferNative))

    // XCM Transfer Tool
    const xcmTransferTool = this.xcmTransferNativeTool(signer, address)
    actions.push(createAction(xcmTransferTool, toolConfigXcmTransferNativeAsset))

    // Swap Tokens Tool
    const swapTool = this.swapTokensTool(signer, address)
    actions.push(createAction(swapTool, toolConfigSwapTokens))

    // Join Pool Tool
    const joinPoolTool = this.joinPoolTool(signer)
    actions.push(createAction(joinPoolTool, toolConfigJoinPool))

    // Bond Extra Tool
    const bondExtraTool = this.bondExtraTool(signer)
    actions.push(createAction(bondExtraTool, toolConfigBondExtra))

    // Unbond Tool
    const unbondTool = this.unbondTool(signer, address)
    actions.push(createAction(unbondTool, toolConfigUnbond))

    // Withdraw Unbonded Tool
    const withdrawUnbondedTool = this.withdrawUnbondedTool(signer, address)
    actions.push(createAction(withdrawUnbondedTool, toolConfigWithdrawUnbonded))

    // Claim Rewards Tool
    const claimRewardsTool = this.claimRewardsTool(signer)
    actions.push(createAction(claimRewardsTool, toolConfigClaimRewards))

    // Register Identity Tool
    const registerIdentityTool = this.registerIdentityTool(signer)
    actions.push(createAction(registerIdentityTool, toolConfigRegisterIdentity))

    // Initialize Chain API Tool
    const initChainTool = this.getInitializeChainApiTool()
    actions.push(createAction(initChainTool, toolConfigInitializeChainApi))

    return actions
  }
}
