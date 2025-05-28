import {
  IPolkadotAgentApi,
  PolkadotAgentApi,
  BalanceTool,
  TransferTool
} from "@polkadot-agent-kit/llm"
import { IPolkadotApi, PolkadotApi } from "@polkadot-agent-kit/core"
import {
  Api,
  KnownChainId,
  getAllSupportedChains,
  AgentConfig,
  getChainById
} from "@polkadot-agent-kit/common"
import { DynamicStructuredTool } from "@langchain/core/tools"
import { sr25519CreateDerive, ed25519CreateDerive } from "@polkadot-labs/hdkd"
import * as ss58 from "@subsquid/ss58"

export class PolkadotAgentKit implements IPolkadotApi, IPolkadotAgentApi {
  private polkadotApi: PolkadotApi
  private agentApi: PolkadotAgentApi

  public wallet: Uint8Array
  public config: AgentConfig

  constructor(wallet: string, config: AgentConfig) {
    this.polkadotApi = new PolkadotApi()
    this.agentApi = new PolkadotAgentApi(this.polkadotApi)
    this.wallet = this.normalizePrivateKey(wallet)
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
      console.error("PolkadotAgentKit API initialization failed:", error)
      throw error
    }
  }

  disconnect(): Promise<void> {
    return this.polkadotApi.disconnect()
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
   * const result = await balanceTool.call({ address });
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
   * @param to - The recipient address as MultiAddress
   * @param amount - The amount to transfer as bigint
   * @returns DynamicStructuredTool for transferring native tokens
   *
   * @example
   * ```typescript
   * // Create a transfer tool
   * const transferTool = agent.transferNativeTool(
   *   "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
   *   BigInt(1000000000000) // 1 DOT in planck
   * );
   *
   * // Tool can be used with LangChain
   * const result = await transferTool.call({
   *   address: to,
   *   amount: amount
   * });
   * ```
   *
   * @throws {Error} If the transfer fails or parameters are invalid
   */
  transferNativeTool(): TransferTool {
    return this.agentApi.transferNativeTool()
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
    const publicKey = this.getPublicKey()
    const value = publicKey
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
  private getPublicKey(): Uint8Array {
    if (this.config.keyType === "Sr25519") {
      // For Sr25519, use the derive function to get the public key
      const derive = sr25519CreateDerive(this.wallet as Uint8Array)
      return derive(this.config.derivationPath || "").publicKey
    } else {
      // For Ed25519, use the ed25519 lib
      const derive = ed25519CreateDerive(this.wallet as Uint8Array)
      return derive(this.config.derivationPath || "").publicKey
    }
  }

  /**
   * Normalize a private key string to Uint8Array format
   * Handles hex strings with or without 0x prefix
   *
   * @param key - Private key as string
   * @returns Uint8Array representation of the key
   * @private
   */
  private normalizePrivateKey(key: string): Uint8Array {
    if (key.startsWith("0x")) {
      return new Uint8Array(
        key
          .substring(2)
          .match(/.{1,2}/g)
          ?.map(byte => parseInt(byte, 16)) || []
      )
    } else {
      return new Uint8Array(key.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || [])
    }
  }
}
