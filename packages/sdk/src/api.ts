import type { AgentConfig, Api, KnownChainId } from "@polkadot-agent-kit/common"
import { deriveAndConvertAddress, generateMiniSecret, getSigner } from "@polkadot-agent-kit/common"
import type { IPolkadotApi } from "@polkadot-agent-kit/core"
import { PolkadotApi } from "@polkadot-agent-kit/core"
import type {
  Action,
  BalanceTool,
  IPolkadotAgentApi,
  RegisterIdentityTool,
  SwapTokensTool,
  TransferTool,
  XcmTransferNativeAssetTool
} from "@polkadot-agent-kit/llm"
import { PolkadotAgentApi, validateTools } from "@polkadot-agent-kit/llm"
import { type PolkadotSigner } from "polkadot-api/signer"

export class PolkadotAgentKit implements IPolkadotApi, IPolkadotAgentApi {
  private polkadotApi: PolkadotApi
  private agentApi: PolkadotAgentApi
  private customTools: Action[] = []

  public config: AgentConfig
  private miniSecret: Uint8Array

  constructor(config: AgentConfig) {
    this.polkadotApi = new PolkadotApi(config.chains)
    this.agentApi = new PolkadotAgentApi(this.polkadotApi)
    this.config = this.validateAndNormalizeConfig(config)

    try {
      const miniSecret: Uint8Array = (generateMiniSecret as (config: AgentConfig) => Uint8Array)(
        this.config
      )
      this.miniSecret = miniSecret
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to generate mini secret: ${errMsg}`)
    }
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
    return this.agentApi.joinPoolTool(this.getSigner())
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
    return this.agentApi.bondExtraTool(this.getSigner())
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
    return this.agentApi.unbondTool(this.getSigner(), this.getCurrentAddress())
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
    return this.agentApi.withdrawUnbondedTool(this.getSigner(), this.getCurrentAddress())
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
    return this.agentApi.claimRewardsTool(this.getSigner())
  }

  /**
   * Get Register Identity Tool
   * Creates a tool for registering an identity on People Chain
   *
   * @returns DynamicStructuredTool for registering an identity on People Chain
   */
  registerIdentityTool(): RegisterIdentityTool {
    return this.agentApi.registerIdentityTool(this.getSigner())
  }

  mintVdotTool() {
    return this.agentApi.mintVdotTool(this.getSigner())
  }

  /**
   * Get Scrape Web Tool
   * Creates a tool for scraping content from web pages
   *
   * @returns DynamicStructuredTool for scraping web pages
   *
   * @example
   * ```typescript
   * // Create a web scraping tool
   * const scrapeTool = agent.scrapeWebTool();
   *
   * // Tool can be used with LangChain
   * const result = await scrapeTool.call({
   *   url: "https://example.com",
   *   formats: ["markdown"]
   * });
   * ```
   */
  scrapeWebTool(): ReturnType<typeof this.agentApi.scrapeWebTool> {
    try {
      return (this.agentApi.scrapeWebTool as () => ReturnType<typeof this.agentApi.scrapeWebTool>)()
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to create scrape web tool: ${errMsg}`)
    }
  }

  /**
   * Get Crawl Web Tool
   * Creates a tool for crawling multiple pages from a website
   *
   * @returns DynamicStructuredTool for crawling websites
   *
   * @example
   * ```typescript
   * // Create a web crawling tool
   * const crawlTool = agent.crawlWebTool();
   *
   * // Tool can be used with LangChain
   * const result = await crawlTool.call({
   *   url: "https://example.com/docs",
   *   maxDepth: 2,
   *   limit: 10
   * });
   * ```
   */
  crawlWebTool(): ReturnType<typeof this.agentApi.crawlWebTool> {
    try {
      return (this.agentApi.crawlWebTool as () => ReturnType<typeof this.agentApi.crawlWebTool>)()
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to create crawl web tool: ${errMsg}`)
    }
  }

  /**
   * Get Search Web Tool
   * Creates a tool for searching the web
   *
   * @returns DynamicStructuredTool for searching the web
   *
   * @example
   * ```typescript
   * // Create a web search tool
   * const searchTool = agent.searchWebTool();
   *
   * // Tool can be used with LangChain
   * const result = await searchTool.call({
   *   query: "Polkadot blockchain",
   *   limit: 5
   * });
   * ```
   */
  searchWebTool(): ReturnType<typeof this.agentApi.searchWebTool> {
    try {
      return (this.agentApi.searchWebTool as () => ReturnType<typeof this.agentApi.searchWebTool>)()
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to create search web tool: ${errMsg}`)
    }
  }

  /**
   * Add custom actions to the agent
   *
   * Allows developers to extend the agent with custom tool calls.
   *
   * @param actions - Array of custom actions to add
   * @throws Error if action is invalid or name conflicts with built-in tools
   *
   */
  addCustomTools(tools: Action[]): void {
    try {
      ;(validateTools as (actions: Action[], existingCustomActions: Action[]) => void)(
        tools,
        this.customTools
      )
      this.customTools.push(...tools)
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to add custom tools: ${errMsg}`)
    }
  }

  getActions(): Action[] {
    const builtInActions = this.agentApi.getActions(this.getSigner(), this.getCurrentAddress())
    return [...builtInActions, ...this.customTools]
  }

  /**
   * Get Address
   *
   * @returns The address as string
   * @throws Error if no main private key is available
   *
   */
  public getCurrentAddress(): string {
    try {
      const result: string = (
        deriveAndConvertAddress as (
          miniSecret: Uint8Array,
          keyType: "Sr25519" | "Ed25519",
          derivationPath: string,
          chainId?: string
        ) => string
      )(this.miniSecret, this.config.keyType || "Sr25519", this.config.derivationPath || "")
      return result
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to derive address: ${errMsg}`)
    }
  }

  private getSigner(): PolkadotSigner {
    try {
      const result: PolkadotSigner = (
        getSigner as (
          miniSecret: Uint8Array,
          keyType: "Sr25519" | "Ed25519",
          derivationPath: string
        ) => PolkadotSigner
      )(this.miniSecret, this.config.keyType || "Sr25519", this.config.derivationPath || "")
      return result
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to get signer: ${errMsg}`)
    }
  }

  /**
   * Validates and normalizes the configuration
   */
  private validateAndNormalizeConfig(config: AgentConfig): AgentConfig {
    const hasMnemonic = config.mnemonic && config.mnemonic.trim().length > 0
    const hasPrivateKey = config.privateKey && config.privateKey.trim().length > 0

    if (!hasMnemonic && !hasPrivateKey) {
      throw new Error("Either 'mnemonic' or 'privateKey' must be provided")
    }

    if (hasMnemonic && hasPrivateKey) {
      throw new Error("Cannot provide both 'mnemonic' and 'privateKey'")
    }

    return {
      keyType: config.keyType || "Sr25519",
      derivationPath: config.derivationPath || "",
      ...config
    }
  }
}
