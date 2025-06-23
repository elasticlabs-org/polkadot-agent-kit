import type { AgentConfig, Api, KnownChainId } from "@polkadot-agent-kit/common"
import { getAllSupportedChains, getChainById } from "@polkadot-agent-kit/common"
import type { IPolkadotApi } from "@polkadot-agent-kit/core"
import { PolkadotApi } from "@polkadot-agent-kit/core"
import type {
  BalanceTool,
  IPolkadotAgentApi,
  TransferTool,
  XcmTransferNativeAssetTool
} from "@polkadot-agent-kit/llm"
import { PolkadotAgentApi } from "@polkadot-agent-kit/llm"
import { ed25519CreateDerive, sr25519CreateDerive } from "@polkadot-labs/hdkd"
import * as ss58 from "@subsquid/ss58"
import { getPolkadotSigner, type PolkadotSigner } from "polkadot-api/signer"
import { KeyringPair } from "@polkadot/keyring/types"
import { Keyring } from "@polkadot/keyring"
import { cryptoWaitReady } from "@polkadot/util-crypto"
import { hexToU8a } from "@polkadot/util"

export class PolkadotAgentKit implements IPolkadotApi, IPolkadotAgentApi {
  private polkadotApi: PolkadotApi
  private agentApi: PolkadotAgentApi

  public wallet: string
  public config: AgentConfig

  constructor(wallet: string, config: AgentConfig) {
    this.polkadotApi = new PolkadotApi()
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
   * @param to - The recipient address as string
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
   * const result = await transferTool.call(\{
   *   address: to,
   *   amount: amount
   * \});
   * ```
   *
   * @throws \{Error\} If the transfer fails or parameters are invalid
   */
  transferNativeTool(): TransferTool {
    return this.agentApi.transferNativeTool(this.getSigner())
  }

  xcmTransferNativeTool(): XcmTransferNativeAssetTool {
    return this.agentApi.xcmTransferNativeTool(this.getKeyringPair())
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

  private getKeyringPair(): KeyringPair {
    const keyring = new Keyring({ type: "sr25519" })

    const keypair = keyring.addFromSeed(hexToU8a(this.wallet))
    return keypair
  }
}
