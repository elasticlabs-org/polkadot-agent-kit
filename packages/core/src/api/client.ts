import type {
  Api,
  ChainOperationResult,
  KnownChainId,
  SmoldotClient} from "@polkadot-agent-kit/common"
import {
  disconnect,
  getAllSupportedChains,
  getApi,
  getChainSpec,
  getFilteredChains,
  isChainAllowed,
  specRegistry} from "@polkadot-agent-kit/common"
import { start } from "polkadot-api/smoldot"

/**
 * Interface for Polkadot API implementations
 * Defines the interface that all Polkadot chain types must follow
 */
export interface IPolkadotApi {
  setApi(chainId: KnownChainId, api?: Api<KnownChainId>): void
  initializeApi(): Promise<void>
  disconnect(): Promise<void>
  getApi(chainId: KnownChainId): Api<KnownChainId>
  getAllowedChains(): KnownChainId[]
  validateChainAccess(chainId: KnownChainId): void

  // Dynamic chain initialization methods
  initializeChainApi(chainId: KnownChainId): Promise<ChainOperationResult>
  isChainInitialized(chainId: KnownChainId): boolean
  getInitializedChains(): KnownChainId[]
  removeChainApi(chainId: KnownChainId): Promise<ChainOperationResult>
}

/**
 * Implementation of the IPolkadotApi interface
 * Manages the initialization and connection of Polkadot APIs
 */
export class PolkadotApi implements IPolkadotApi {
  private _apis: Map<KnownChainId, Api<KnownChainId>> = new Map()
  private initialized = false
  private smoldotClient: SmoldotClient
  private initPromise: Promise<void> | null = null
  private allowedChains?: KnownChainId[]

  constructor(allowedChains?: KnownChainId[]) {
    this.smoldotClient = start()
    this.allowedChains = allowedChains
  }

  /**
   * Get the list of allowed chains
   * @returns Array of allowed chain IDs
   */
  getAllowedChains(): KnownChainId[] {
    return this.allowedChains || getAllSupportedChains().map(chain => chain.id as KnownChainId)
  }

  /**
   * Validate if a chain is allowed to be accessed
   * @param chainId - The chain ID to validate
   * @throws Error if chain is not allowed
   */
  validateChainAccess(chainId: KnownChainId): void {
    if (!isChainAllowed(chainId, this.allowedChains)) {
      const allowedChainsStr = this.allowedChains?.join(", ") || "all"
      throw new Error(`Chain '${chainId}' is not allowed. Allowed chains: ${allowedChainsStr}`)
    }
  }

  /**
   * Sets the API for a specific chain
   * @param chainId - The ID of the chain
   * @param api - Optional API instance to set
   */
  setApi(chainId: KnownChainId, api?: Api<KnownChainId>) {
    this.validateChainAccess(chainId)
    if (api) {
      this._apis.set(chainId, api)
    }
  }

  /**
   * Retrieves the API for a specific chain
   * @param chainId - The ID of the chain
   * @returns The API instance for the specified chain
   */
  getApi(chainId: KnownChainId): Api<KnownChainId> {
    this.validateChainAccess(chainId)

    if (!this.initialized) {
      throw new Error("APIs not initialized. Call initializeApi() first.")
    }
    const api = this._apis.get(chainId)
    if (!api) {
      throw new Error(`API for chain ${chainId} not found`)
    }
    return api
  }

  /**
   * Retrieves all initialized APIs
   * @returns Map of chain IDs to API instances
   */
  getAllApis(): Map<KnownChainId, Api<KnownChainId>> {
    if (!this.initialized) {
      throw new Error("APIs not initialized. Call initializeApi() first.")
    }
    return this._apis
  }

  /**
   * Initializes all APIs
   * @returns Promise that resolves when all APIs are initialized
   */
  async initializeApi(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise
    }

    if (this.initialized) {
      return
    }

    this.initPromise = (async () => {
      try {
        // Get filtered chains based on allowed chains
        const supportedChains = getFilteredChains(this.allowedChains)

        const chainSpecs: Record<KnownChainId, string> = {
          polkadot: "",
          west: "",
          polkadot_asset_hub: "",
          west_asset_hub: "",
          hydra: ""
        }

        for (const chain of supportedChains) {
          chainSpecs[chain.id as KnownChainId] = this.getChainSpec(chain.id as KnownChainId)
        }

        const apiInitPromises = supportedChains.map(async chain => {
          try {
            const api = await getApi(chain.id as KnownChainId, [chain], true, {
              enable: true,
              smoldot: this.smoldotClient,
              chainSpecs
            })
            return { chain, api }
          } catch (error) {
            throw new Error(
              `Failed to initialize API for ${chain.id}: ${error instanceof Error ? error.message : String(error)}`
            )
          }
        })

        const results = await Promise.all(apiInitPromises)
        for (const { chain, api } of results) {
          this._apis.set(chain.id as KnownChainId, api)
        }

        this.initialized = true
      } catch (error) {
        throw new Error(
          `Failed to initialize APIs: ${error instanceof Error ? error.message : String(error)}`
        )
      } finally {
        this.initPromise = null
      }
    })()

    return this.initPromise
  }

  /**
   * Disconnects all APIs and terminates the smoldot client
   * @returns Promise that resolves when all APIs are disconnected
   */
  async disconnect(): Promise<void> {
    try {
      // Disconnect all chain APIs
      for (const [chainId, api] of this._apis.entries()) {
        await disconnect(api)
        this._apis.delete(chainId)
      }

      if (this.smoldotClient) {
        await this.smoldotClient.terminate()
      }

      this.initialized = false
    } catch (error) {
      throw new Error(
        `Failed to disconnect: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * Retrieves the chain spec for a specific chain
   * @param chainId - The ID of the chain
   * @returns The chain spec for the specified chain
   */
  getChainSpec(chainId: KnownChainId) {
    return getChainSpec(chainId, specRegistry())
  }

  /**
   * Dynamically initialize a single chain API
   * @param chainId - The chain ID to initialize
   * @returns Promise resolving to operation result
   */
  async initializeChainApi(chainId: KnownChainId): Promise<ChainOperationResult> {
    try {
      // Check if chain is already initialized
      if (this._apis.has(chainId)) {
        return {
          success: true,
          chainId,
          message: `Chain '${chainId}' is already initialized`
        }
      }

      // Get chain configuration from supported chains
      const allChains = getAllSupportedChains()
      const chainConfig = allChains.find(chain => chain.id === chainId)

      if (!chainConfig) {
        return {
          success: false,
          chainId,
          message: `Chain '${chainId}' is not supported`,
          error: `Available chains: ${allChains.map(c => c.id).join(", ")}`
        }
      }

      // Build chain specs for this specific chain
      const chainSpecs: Partial<Record<KnownChainId, string>> = {}
      try {
        chainSpecs[chainId] = this.getChainSpec(chainId)
      } catch (error) {
        return {
          success: false,
          chainId,
          message: `Failed to get chain specification for '${chainId}'`,
          error: error instanceof Error ? error.message : String(error)
        }
      }

      // Initialize the API for this specific chain
      const api = await getApi(chainId, [chainConfig], true, {
        enable: true,
        smoldot: this.smoldotClient,
        chainSpecs
      })

      // Store the API
      this._apis.set(chainId, api)

      return {
        success: true,
        chainId,
        message: `Successfully initialized '${chainId}' chain API`
      }
    } catch (error) {
      return {
        success: false,
        chainId,
        message: `Failed to initialize '${chainId}' chain API`,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Check if a chain is currently initialized
   * @param chainId - The chain ID to check
   * @returns True if the chain is initialized
   */
  isChainInitialized(chainId: KnownChainId): boolean {
    return this._apis.has(chainId)
  }

  /**
   * Get list of currently initialized chains
   * @returns Array of initialized chain IDs
   */
  getInitializedChains(): KnownChainId[] {
    return Array.from(this._apis.keys())
  }

  /**
   * Remove a chain API and disconnect it
   * @param chainId - The chain ID to remove
   * @returns Promise resolving to operation result
   */
  async removeChainApi(chainId: KnownChainId): Promise<ChainOperationResult> {
    try {
      const api = this._apis.get(chainId)
      if (!api) {
        return {
          success: true,
          chainId,
          message: `Chain '${chainId}' is not initialized`
        }
      }

      // Disconnect the specific chain API
      await disconnect(api)

      // Remove from the map
      this._apis.delete(chainId)

      return {
        success: true,
        chainId,
        message: `Successfully removed '${chainId}' chain API`
      }
    } catch (error) {
      return {
        success: false,
        chainId,
        message: `Failed to remove '${chainId}' chain API`,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }
}
