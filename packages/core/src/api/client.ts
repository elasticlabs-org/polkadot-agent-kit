import {
  Api,
  KnownChainId,
  SmoldotClient,
  getApi,
  getChainSpec,
  disconnect,
  getAllSupportedChains,
  specRegistry
} from "@polkadot-agent-kit/common"
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

  constructor() {
    this.smoldotClient = start()
  }

  /**
   * Sets the API for a specific chain
   * @param chainId The ID of the chain
   * @param api Optional API instance to set
   */
  setApi(chainId: KnownChainId, api?: Api<KnownChainId>) {
    if (api) {
      this._apis.set(chainId, api)
    }
  }

  /**
   * Retrieves the API for a specific chain
   * @param chainId The ID of the chain
   * @returns The API instance for the specified chain
   */
  getApi(chainId: KnownChainId): Api<KnownChainId> {
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
        const supportedChains = getAllSupportedChains()

        const chainSpecs: Record<KnownChainId, string> = {
          polkadot: "",
          west: "",
          polkadot_asset_hub: "",
          west_asset_hub: ""
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
            console.error(`Failed to initialize API for ${chain.id}:`, error)
            throw error
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
   * @param chainId The ID of the chain
   * @returns The chain spec for the specified chain
   */
  getChainSpec(chainId: KnownChainId) {
    return getChainSpec(chainId, specRegistry())
  }
}
