import { describe, it, expect, vi, beforeEach } from "vitest"
import { isValidAddress } from "./isValidAddress"

// Mock the polkadot-api AccountId
vi.mock("polkadot-api", () => ({
  AccountId: vi.fn()
}))

import { AccountId } from "polkadot-api"

const mockAccountId = vi.mocked(AccountId)

describe("isValidAddress", () => {
  const mockEnc = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockAccountId.mockReturnValue({ enc: mockEnc } as any)
  })

  describe("valid addresses", () => {
    it("should return true for valid SS58 address", () => {
      const validAddress = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
      mockEnc.mockReturnValue(new Uint8Array([1, 2, 3])) // Mock successful encoding

      const result = isValidAddress(validAddress)

      expect(AccountId).toHaveBeenCalled()
      expect(mockEnc).toHaveBeenCalledWith(validAddress)
      expect(result).toBe(true)
    })

    it("should return true for Polkadot mainnet addresses", () => {
      const polkadotAddresses = [
        "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5",
        "13UVJyLnbVp9RBZYFwFGyDvVd1y27Tt8tkntv6Q7JVPhFsTB",
        "16ZL8yLyXv3V3L3z9ofR1ovFLziyXaN1DPq4yffMAZ9czzBD"
      ]

      polkadotAddresses.forEach(address => {
        mockEnc.mockReturnValue(new Uint8Array([1, 2, 3]))

        const result = isValidAddress(address)

        expect(result).toBe(true)
        expect(mockEnc).toHaveBeenCalledWith(address)
      })
    })

    it("should return true for Kusama addresses", () => {
      const kusamaAddresses = [
        "CxDDSH8gS7jecsxaRL9Txf834Z8XqiWhtGAx6EByXAjJnkw",
        "DXgXPAT5zWtPHo6FhVvrDdiaDPgCNGxhJAeVBYLtiwW9hAc",
        "HNZata7iMYWmk5RvZRTiAsSDhV8366zq2YGb3tLH5Upf74F"
      ]

      kusamaAddresses.forEach(address => {
        mockEnc.mockReturnValue(new Uint8Array([4, 5, 6]))

        const result = isValidAddress(address)

        expect(result).toBe(true)
        expect(mockEnc).toHaveBeenCalledWith(address)
      })
    })

    it("should return true for Westend addresses", () => {
      const westendAddresses = [
        "5GNJqTPyNqANBkUVMN1LPPrxXnFouWXoe2wNSmmEoLctxiZY",
        "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
        "5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy"
      ]

      westendAddresses.forEach(address => {
        mockEnc.mockReturnValue(new Uint8Array([7, 8, 9]))

        const result = isValidAddress(address)

        expect(result).toBe(true)
        expect(mockEnc).toHaveBeenCalledWith(address)
      })
    })

    it("should handle different address formats correctly", () => {
      const addressFormats = [
        // Different prefix formats
        "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY", // Generic substrate
        "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5", // Polkadot
        "CxDDSH8gS7jecsxaRL9Txf834Z8XqiWhtGAx6EByXAjJnkw", // Kusama
        "5GNJqTPyNqANBkUVMN1LPPrxXnFouWXoe2wNSmmEoLctxiZY" // Westend
      ]

      addressFormats.forEach((address, index) => {
        mockEnc.mockReturnValue(new Uint8Array([index]))

        const result = isValidAddress(address)

        expect(result).toBe(true)
        expect(mockEnc).toHaveBeenCalledWith(address)
      })
    })
  })

  describe("invalid addresses", () => {
    it("should return false for invalid address format", () => {
      const invalidAddress = "invalid-address-format"
      mockEnc.mockImplementation(() => {
        throw new Error("Invalid address format")
      })

      const result = isValidAddress(invalidAddress)

      expect(AccountId).toHaveBeenCalled()
      expect(mockEnc).toHaveBeenCalledWith(invalidAddress)
      expect(result).toBe(false)
    })

    it("should return false for addresses with wrong checksum", () => {
      const invalidChecksumAddress = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQZ" // Modified last char
      mockEnc.mockImplementation(() => {
        throw new Error("Invalid checksum")
      })

      const result = isValidAddress(invalidChecksumAddress)

      expect(result).toBe(false)
      expect(mockEnc).toHaveBeenCalledWith(invalidChecksumAddress)
    })

    it("should return false for addresses with invalid characters", () => {
      const invalidCharAddress = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQ0" // Contains '0'
      mockEnc.mockImplementation(() => {
        throw new Error("Invalid character in address")
      })

      const result = isValidAddress(invalidCharAddress)

      expect(result).toBe(false)
    })

    it("should return false for addresses that are too short", () => {
      const shortAddress = "5GrwvaEF5zXb26Fz"
      mockEnc.mockImplementation(() => {
        throw new Error("Address too short")
      })

      const result = isValidAddress(shortAddress)

      expect(result).toBe(false)
    })

    it("should return false for addresses that are too long", () => {
      const longAddress = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQYExtended"
      mockEnc.mockImplementation(() => {
        throw new Error("Address too long")
      })

      const result = isValidAddress(longAddress)

      expect(result).toBe(false)
    })

    it("should return false for random strings", () => {
      const randomStrings = [
        "hello-world",
        "123456789",
        "abcdefghijklmnopqrstuvwxyz",
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        "!@#$%^&*()",
        "mixed123ABC!@#"
      ]

      randomStrings.forEach(randomString => {
        mockEnc.mockImplementation(() => {
          throw new Error("Invalid address")
        })

        const result = isValidAddress(randomString)

        expect(result).toBe(false)
        expect(mockEnc).toHaveBeenCalledWith(randomString)
      })
    })
  })

  describe("edge cases", () => {
    it("should return false for null address", () => {
      const result = isValidAddress(null as any)

      expect(result).toBe(false)
      // AccountId should not be called for falsy values
      expect(AccountId).not.toHaveBeenCalled()
      expect(mockEnc).not.toHaveBeenCalled()
    })

    it("should return false for undefined address", () => {
      const result = isValidAddress(undefined as any)

      expect(result).toBe(false)
      expect(AccountId).not.toHaveBeenCalled()
      expect(mockEnc).not.toHaveBeenCalled()
    })

    it("should return false for empty string", () => {
      const result = isValidAddress("")

      expect(result).toBe(false)
      expect(AccountId).not.toHaveBeenCalled()
      expect(mockEnc).not.toHaveBeenCalled()
    })

    it("should return false for whitespace-only string", () => {
      const result = isValidAddress("   ")

      mockEnc.mockImplementation(() => {
        throw new Error("Invalid address")
      })

      expect(result).toBe(false)
      expect(AccountId).toHaveBeenCalled()
      expect(mockEnc).toHaveBeenCalledWith("   ")
    })

    it("should return false for zero (falsy number)", () => {
      const result = isValidAddress(0 as any)

      expect(result).toBe(false)
      expect(AccountId).not.toHaveBeenCalled()
      expect(mockEnc).not.toHaveBeenCalled()
    })

    it("should return false for false boolean", () => {
      const result = isValidAddress(false as any)

      expect(result).toBe(false)
      expect(AccountId).not.toHaveBeenCalled()
      expect(mockEnc).not.toHaveBeenCalled()
    })
  })
})
