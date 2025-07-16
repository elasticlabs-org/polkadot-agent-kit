import type { AgentConfig, Api, KnownChainId } from "@polkadot-agent-kit/common"
import { getAllSupportedChains, getChainById } from "@polkadot-agent-kit/common"
import type { IPolkadotApi } from "@polkadot-agent-kit/core"
import { PolkadotApi } from "@polkadot-agent-kit/core"
import type {
  BalanceTool,
  IPolkadotAgentApi,
  SwapTokensTool,
  TransferTool,
  XcmTransferNativeAssetTool
} from "@polkadot-agent-kit/llm"
import { PolkadotAgentApi } from "@polkadot-agent-kit/llm"
import { ed25519CreateDerive, sr25519CreateDerive } from "@polkadot-labs/hdkd"
import * as ss58 from "@subsquid/ss58"
import { getPolkadotSigner, type PolkadotSigner } from "polkadot-api/signer"

export class PolkadotAgentKit implements IPolkadotApi, IPolkadotAgentApi {
  private polkadotApi: PolkadotApi
  private agentApi: PolkadotAgentApi

  public wallet: string
  public config: AgentConfig

  constructor(wallet: string, config: AgentConfig) {
    this.polkadotApi = new PolkadotApi(config.chains)
    this.agentApi = new PolkadotAgentApi(this.polkadotApi)
    this.wallet = wallet
    this.config = config
  }

  setApi(chainId: KnownChainId, api?: Api<KnownChainId>) {
    this.polkadotApi.setApi(chainId, api)
  }

  getApi(chainId: KnownChainId): Api<KnownChainId> {
    return this.polkadotApi.getApi(chainId)
  }

  async initializeApi(): Promise<void> {
    try {
      await this.polkadotApi.initializeApi()
    } catch (error) {
      throw new Error(
        `PolkadotAgentKit API initialization failed: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  disconnect(): Promise<void> {
    return this.polkadotApi.disconnect()
  }

  // Dynamic chain management tools

  /**
   * Get Initialize Chain API Tool
   * Creates a tool for dynamically initializing chain APIs
   *
   * @returns DynamicStructuredTool for initializing chain APIs
   *
   * @example
   * ```typescript
   * // Create an initialize chain tool
   * const initTool = agent.getInitializeChainApiTool();
   *
   * // Tool can be used with LangChain
   * const result = await initTool.call({
   *   chainId: "kusama"
   * });
   * ```
   */
  getInitializeChainApiTool() {
    return this.agentApi.getInitializeChainApiTool()
  }

  /**
   * Get Native Balance Tool
   * Creates a tool for checking native token balance of an address
   *
   * @param address - The address to check balance for
   * @returns DynamicStructuredTool for checking native token balance
   *
   * @example
   * ```typescript
   * // Create a balance checking tool
   * const balanceTool = agent.getNativeBalanceTool("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY");
   *
   * // Tool can be used with LangChain
   * const result = await balanceTool.call(\{ address \});
   * ```
   */
  getNativeBalanceTool(): BalanceTool {
    const address = this.getCurrentAddress()
    return this.agentApi.getNativeBalanceTool(address)
  }

  /**
   * Get Native Transfer Tool
   * Creates a tool for transferring native tokens to an address
   *
   * @returns DynamicStructuredTool for transferring native tokens
   *
   * @example
   * ```typescript
   * // Create a transfer tool
   * const transferTool = agent.transferNativeTool();
   *
   * // Tool can be used with LangChain
   * const result = await transferTool.call({
   *   amount: "1",
   *   to: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
   *   chain: "polkadot"
   * });
   * ```
   *
   * @throws \{Error\} If the transfer fails or parameters are invalid
   */
  transferNativeTool(): TransferTool {
    return this.agentApi.transferNativeTool(this.getSigner())
  }

  /**
   * Get XCM Transfer Native Tool
   * Creates a tool for transferring native tokens across chains using XCM (Cross-Consensus Messaging)
   *
   * @returns DynamicStructuredTool for cross-chain native token transfers
   *
   * @example
   * ```typescript
   * // Create an XCM transfer tool
   * const xcmTransferTool = agent.xcmTransferNativeTool();
   *
   * // Tool can be used with LangChain for cross-chain transfers
   * const result = await xcmTransferTool.call(\{
   *   amount: "1",
   *   to: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
   *   sourceChain: "polkadot",
   *   destChain: "polkadot_asset_hub"
   * \});
   * ```
   *
   * @throws \{Error\} If the XCM transfer fails or parameters are invalid
   */
  xcmTransferNativeTool(): XcmTransferNativeAssetTool {
    return this.agentApi.xcmTransferNativeTool(this.getSigner(), this.getCurrentAddress())
  }

  /**
   * Get Swap Tokens Tool
   * Creates a tool for swapping tokens across different chains using the Hydration DEX
   *
   * @returns DynamicStructuredTool for swapping tokens across different chains using the Hydration DEX
   */
  swapTokensTool(): SwapTokensTool {
    return this.agentApi.swapTokensTool(this.getSigner(), this.getCurrentAddress())
  }

  /**
   * Get Join Pool Tool
   * Creates a tool for joining a nomination pool for staking
   *
   * @returns DynamicStructuredTool for joining nomination pools
   *
   * @example
   * ```typescript
   * // Create a join pool tool
   * const joinPoolTool = agent.joinPoolTool();
   *
   * // Tool can be used with LangChain
   * const result = await joinPoolTool.call({
   *   amount: "1.5",
   *   poolId: 1,
   *   chain: "polkadot"
   * });
   * ```
   */
  joinPoolTool() {
    return (this.agentApi).joinPoolTool(this.getSigner())
  }

  /**
   * Get Bond Extra Tool
   * Creates a tool for bonding extra tokens to a nomination pool
   *
   * @returns DynamicStructuredTool for bonding extra tokens
   *
   * @example
   * ```typescript
   * // Create a bond extra tool
   * const bondExtraTool = agent.bondExtraTool();
   *
   * // Tool can be used with LangChain
   * const result = await bondExtraTool.call({
   *   type: "FreeBalance",
   *   chain: "polkadot"
   * });
   * ```
   */
  bondExtraTool() {
    return (this.agentApi).bondExtraTool(this.getSigner())
  }

  /**
   * Get Unbond Tool
   * Creates a tool for unbonding tokens from a nomination pool
   *
   * @returns DynamicStructuredTool for unbonding tokens
   *
   * @example
   * ```typescript
   * // Create an unbond tool
   * const unbondTool = agent.unbondTool();
   *
   * // Tool can be used with LangChain
   * const result = await unbondTool.call({
   *   amount: "1.5",
   *   chain: "polkadot"
   * });
   * ```
   */
  unbondTool() {
    return (this.agentApi).unbondTool(this.getSigner(), this.getCurrentAddress())
  }

  /**
   * Get Withdraw Unbonded Tool
   * Creates a tool for withdrawing unbonded tokens from a nomination pool
   *
   * @returns DynamicStructuredTool for withdrawing unbonded tokens
   *
   * @example
   * ```typescript
   * // Create a withdraw unbonded tool
   * const withdrawUnbondedTool = agent.withdrawUnbondedTool();
   *
   * // Tool can be used with LangChain
   * const result = await withdrawUnbondedTool.call({
   *   slashingSpans: 0,
   *   chain: "polkadot"
   * });
   * ```
   */
  withdrawUnbondedTool() {
    return (this.agentApi).withdrawUnbondedTool(this.getSigner(), this.getCurrentAddress())
  }

  /**
   * Get Claim Rewards Tool
   * Creates a tool for claiming rewards from a nomination pool
   *
   * @returns DynamicStructuredTool for claiming rewards
   *
   * @example
   * ```typescript
   * // Create a claim rewards tool
   * const claimRewardsTool = agent.claimRewardsTool();
   *
   * // Tool can be used with LangChain
   * const result = await claimRewardsTool.call({
   *   chain: "polkadot"
   * });
   * ```
   */
  claimRewardsTool() {
    return (this.agentApi).claimRewardsTool(this.getSigner())
  }
  /**
   * Get Address
   *
   * @returns The address as string
   * @throws Error if no main private key is available
   *
   * @example
   * ```typescript
   * // Get the main account address
   * const address = agent.getCurrentAddress('polkadot');
   * ```
   */
  public getCurrentAddress(): string {
    // get chain default address polkadot
    const chain = getChainById("polkadot", getAllSupportedChains())
    const keypair = this.getKeypair()
    const value = keypair.publicKey
    if (!value) {
      return ""
    }
    return ss58.codec(chain.prefix).encode(value)
  }

  /**
   * Get main account public key
   *
   * @returns The public key as Uint8Array
   * @throws Error if no main private key is available
   *
   * @example
   * ```typescript
   * // Get the main account public key
   * const publicKey = agent.getPublicKey();
   * ```
   */
  private getKeypair() {
    if (this.config.keyType === "Sr25519") {
      // For Sr25519, use the derive function to get the public key
      const derive = sr25519CreateDerive(this.wallet)
      return derive(this.config.derivationPath || "")
    } else {
      // For Ed25519, use the ed25519 lib
      const derive = ed25519CreateDerive(this.wallet)
      return derive(this.config.derivationPath || "")
    }
  }

  private getSigner(): PolkadotSigner {
    if (this.config.keyType === "Sr25519") {
      const signer = getPolkadotSigner(
        this.getKeypair().publicKey,
        this.config.keyType as "Sr25519" | "Ed25519" | "Ecdsa",
        input => this.getKeypair().sign(input)
      )

      return signer
    } else {
      const signer = getPolkadotSigner(
        this.getKeypair().publicKey,
        this.config.keyType as "Sr25519" | "Ed25519" | "Ecdsa",
        input => this.getKeypair().sign(input)
      )
      return signer
    }
  }
}
