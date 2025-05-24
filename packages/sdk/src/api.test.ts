import { beforeEach, describe, expect, it, vi, afterEach } from "vitest"
import {
  Api,
  Chain,
  KnownChainId,
  disconnect,
  getAllSupportedChains,
  getChainByName,
  isSupportedChain,
  SmoldotClient
} from "@polkadot-agent-kit/common"
import { start } from "polkadot-api/smoldot"
import { getApi, getChainSpec, AgentConfig } from "@polkadot-agent-kit/common"
import { PolkadotAgentKit } from "./api"
import { PolkadotApi } from "@polkadot-agent-kit/core"
import { DynamicStructuredTool } from "@langchain/core/tools"
import { BalanceTool, balanceToolSchema, PolkadotAgentApi } from "@polkadot-agent-kit/llm"

// Mock modules at top level with ALL required exports
vi.mock("polkadot-api/smoldot", () => ({
  start: vi.fn(() => ({
    terminate: vi.fn().mockResolvedValue(undefined)
  }))
}))

vi.mock("@polkadot-agent-kit/common", () => ({
  // Mock all the imports you're using
  getAllSupportedChains: vi.fn(() => [
    { id: "polkadot", name: "Polkadot", symbol: "DOT", decimals: 10 },
    { id: "west", name: "Westend", symbol: "WND", decimals: 12 },
    { id: "polkadot_asset_hub", name: "Polkadot Asset Hub", symbol: "DOT", decimals: 10 },
    { id: "west_asset_hub", name: "Westend Asset Hub", symbol: "WND", decimals: 12 }
  ]),
  getApi: vi.fn(() =>
    Promise.resolve({
      disconnect: vi.fn().mockResolvedValue(undefined),
      chainId: "polkadot",
      query: {
        System: {
          Account: {
            getValue: vi.fn().mockResolvedValue({
              data: { free: BigInt("1000000000000") }
            })
          }
        }
      },
      tx: {
        Balances: {
          transfer_keep_alive: vi.fn().mockReturnValue({
            decodedCall: {}
          })
        }
      }
    })
  ),
  getChainSpec: vi.fn(() => "mock-chain-spec"),
  disconnect: vi.fn(() => Promise.resolve(undefined)),
  getChainByName: vi.fn(() => ({ id: "polkadot", name: "Polkadot" })),
  getChainById: vi.fn(() => ({ id: "polkadot", name: "Polkadot", symbol: "DOT", decimals: 10 })),
  isSupportedChain: vi.fn(() => true),

  // Mock specRegistry as a function that returns spec data
  specRegistry: vi.fn(() => ({
    polkadot: "polkadot-spec-data",
    west: "westend-spec-data",
    polkadot_asset_hub: "polkadot-asset-hub-spec-data",
    west_asset_hub: "westend-asset-hub-spec-data"
  })),

  // Add other exports that might be needed
  formatBalance: vi.fn((balance, decimals) => `${balance} DOT`),
  parseUnits: vi.fn((value, decimals) => BigInt(value)),
  convertAddress: vi.fn((address, chain) => address),
  toMultiAddress: vi.fn(address => ({ type: "Id", value: address })),
  getDecimalsByChainId: vi.fn(() => 10),

  // Mock any types/interfaces (these don't need implementations)
  Api: {},
  Chain: {},
  KnownChainId: {},
  SmoldotClient: {},
  AgentConfig: {}
}))

describe("PolkadotApi", () => {
  let polkadotApi: PolkadotApi

  beforeEach(() => {
    vi.clearAllMocks()
    polkadotApi = new PolkadotApi()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("initializeApi", () => {
    it("should initialize APIs for all supported chains", async () => {
      await polkadotApi.initializeApi()

      expect(polkadotApi["initialized"]).toBe(true)
      expect(polkadotApi["_apis"].size).toBe(4)
      expect(polkadotApi["_apis"].has("polkadot")).toBe(true)
      expect(polkadotApi["_apis"].has("west")).toBe(true)
      expect(polkadotApi["_apis"].has("polkadot_asset_hub")).toBe(true)
      expect(polkadotApi["_apis"].has("west_asset_hub")).toBe(true)
    })

    it("should not reinitialize if already initialized", async () => {
      // First initialization
      await polkadotApi.initializeApi()
      expect(polkadotApi["initialized"]).toBe(true)

      const commonModule = await import("@polkadot-agent-kit/common")
      const getApiMock = vi.mocked(commonModule.getApi)

      // Clear the mock calls from first initialization
      getApiMock.mockClear()

      // Second initialization should not call getApi again
      await polkadotApi.initializeApi()

      expect(getApiMock).not.toHaveBeenCalled()
    })
  })

  describe("disconnect", () => {
    it("should disconnect all chain APIs and terminate smoldot client", async () => {
      // Setup APIs first
      await polkadotApi.initializeApi()

      // Verify APIs are initialized
      expect(polkadotApi["initialized"]).toBe(true)
      expect(polkadotApi["_apis"].size).toBe(4)

      // Disconnect
      await polkadotApi.disconnect()

      expect(polkadotApi["initialized"]).toBe(false)
      expect(polkadotApi["_apis"].size).toBe(0)
    })

    it("should handle disconnect errors", async () => {
      const error = new Error("Disconnect failed")
      const commonModule = await import("@polkadot-agent-kit/common")
      vi.mocked(commonModule.disconnect).mockRejectedValue(error)

      await polkadotApi.initializeApi()

      await expect(polkadotApi.disconnect()).rejects.toThrow(
        "Failed to disconnect: Disconnect failed"
      )
    })
  })

  describe("getApi", () => {
    it("should return the API for a specific chain", async () => {
      await polkadotApi.initializeApi()
      const api = polkadotApi.getApi("polkadot")
      expect(api).toBeDefined()
    })

    it("should return the correct API for different chains", async () => {
      await polkadotApi.initializeApi()
      const dotApi = polkadotApi.getApi("polkadot")
      const westApi = polkadotApi.getApi("west")

      expect(dotApi).toBeDefined()
      expect(westApi).toBeDefined()
      expect(dotApi).not.toBe(westApi)
    })
  })

  describe("setApi", () => {
    it("should set API for a specific chain", () => {
      const mockChainApi = {} as Api<KnownChainId>
      polkadotApi.setApi("polkadot", mockChainApi)

      expect(polkadotApi["_apis"].get("polkadot")).toBe(mockChainApi)
    })

    it("should not set API when api parameter is undefined", () => {
      polkadotApi.setApi("polkadot", undefined)

      expect(polkadotApi["_apis"].has("polkadot")).toBe(false)
    })
  })

  describe("getNativeBalanceTool", () => {
    const createMockBalanceTool = (name: string, description: string): BalanceTool =>
      ({
        name,
        description,
        execute: vi.fn(),
        invoke: vi.fn(),
        call: vi.fn(),
        metadata: {},
        tags: [],
        callbacks: undefined,
        verbose: false
      }) as unknown as BalanceTool

    let mockDotBalanceTool: BalanceTool
    let mockWestBalanceTool: BalanceTool
    let mockAgentPolkadotApi: PolkadotAgentApi
    let mockAgentWestApi: PolkadotAgentApi

    beforeEach(() => {
      mockDotBalanceTool = createMockBalanceTool("polkadotBalance", "Get Polkadot native balance")
      mockWestBalanceTool = createMockBalanceTool("westBalance", "Get Westend native balance")

      polkadotApi["_apis"].set("polkadot", {} as Api<KnownChainId>)
      polkadotApi["_apis"].set("west", {} as Api<KnownChainId>)

      mockAgentPolkadotApi = {
        getNativeBalanceTool: vi.fn().mockReturnValue(mockDotBalanceTool),
        transferNativeTool: vi.fn()
      } as unknown as PolkadotAgentApi

      mockAgentWestApi = {
        getNativeBalanceTool: vi.fn().mockReturnValue(mockWestBalanceTool),
        transferNativeTool: vi.fn()
      } as unknown as PolkadotAgentApi
    })

    it("should return the correct tool for a specific chain", () => {
      const tool = mockAgentPolkadotApi.getNativeBalanceTool(
        "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
      )

      expect(tool).toBeDefined()
      expect(tool).toBe(mockDotBalanceTool)
      expect(tool.name).toBe("polkadotBalance")
    })

    it("should return the correct tool for different chains", () => {
      const dotTool = mockAgentPolkadotApi.getNativeBalanceTool(
        "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
      )
      const westTool = mockAgentWestApi.getNativeBalanceTool(
        "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
      )

      expect(dotTool).toBeDefined()
      expect(westTool).toBeDefined()
      expect(dotTool).toBe(mockDotBalanceTool)
      expect(westTool).toBe(mockWestBalanceTool)
      expect(dotTool).not.toBe(westTool)
    })
  })
})
