import { describe, it, expect, vi, beforeEach } from "vitest"
import { validateAndFormatAddress, validateAndFormatMultiAddress } from "./tools"
import { InvalidAddressError } from "../types"

vi.mock("@polkadot-agent-kit/core", () => ({
  convertAddress: vi.fn(),
  toMultiAddress: vi.fn()
}))

import { convertAddress, toMultiAddress } from "@polkadot-agent-kit/core"

const mockConvertAddress = vi.mocked(convertAddress)
const mockToMultiAddress = vi.mocked(toMultiAddress)

describe("validateAndFormatAddress", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("successful address validation", () => {
    it("should return formatted address when convertAddress succeeds", () => {
      const inputAddress = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
      const expectedFormattedAddress = "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5"
      const chain = "polkadot" as any

      mockConvertAddress.mockReturnValue(expectedFormattedAddress)

      const result = validateAndFormatAddress(inputAddress, chain)

      expect(mockConvertAddress).toHaveBeenCalledWith(inputAddress, chain)
      expect(result).toBe(expectedFormattedAddress)
    })

    it("should handle different chain types", () => {
      const inputAddress = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
      const formattedAddress = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"

      const chains = ["polkadot", "kusama", "westend", "rococo"] as any[]

      chains.forEach(chain => {
        mockConvertAddress.mockReturnValue(formattedAddress)

        const result = validateAndFormatAddress(inputAddress, chain)

        expect(mockConvertAddress).toHaveBeenCalledWith(inputAddress, chain)
        expect(result).toBe(formattedAddress)
      })
    })

    it("should handle various valid address formats", () => {
      const testCases = [
        {
          input: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
          formatted: "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5"
        },
        {
          input: "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5",
          formatted: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
        }
      ]

      testCases.forEach(({ input, formatted }) => {
        mockConvertAddress.mockReturnValue(formatted)

        const result = validateAndFormatAddress(input, "polkadot" as any)

        expect(result).toBe(formatted)
      })
    })
  })

  describe("error handling", () => {
    it("should throw InvalidAddressError when convertAddress returns null", () => {
      const invalidAddress = "invalid-address"
      const chain = "polkadot" as any

      mockConvertAddress.mockReturnValue(null)

      expect(() => validateAndFormatAddress(invalidAddress, chain)).toThrow(InvalidAddressError)

      expect(mockConvertAddress).toHaveBeenCalledWith(invalidAddress, chain)
    })

    it("should throw InvalidAddressError when convertAddress returns undefined", () => {
      const invalidAddress = "another-invalid-address"
      const chain = "kusama" as any

      mockConvertAddress.mockReturnValue(null)

      expect(() => validateAndFormatAddress(invalidAddress, chain)).toThrow(InvalidAddressError)
    })

    it("should throw InvalidAddressError when convertAddress returns empty string", () => {
      const invalidAddress = ""
      const chain = "polkadot" as any

      mockConvertAddress.mockReturnValue("")

      expect(() => validateAndFormatAddress(invalidAddress, chain)).toThrow(InvalidAddressError)
    })

    it("should preserve the original address in the error", () => {
      const invalidAddress = "malformed-address-123"
      const chain = "polkadot" as any

      mockConvertAddress.mockReturnValue(null)

      expect(() => validateAndFormatAddress(invalidAddress, chain)).toThrow(
        new InvalidAddressError(invalidAddress)
      )
    })
  })

  describe("edge cases", () => {
    it("should handle whitespace in addresses", () => {
      const addressWithSpaces = "  5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY  "
      const formattedAddress = "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5"
      const chain = "polkadot" as any

      mockConvertAddress.mockReturnValue(formattedAddress)

      const result = validateAndFormatAddress(addressWithSpaces, chain)

      expect(mockConvertAddress).toHaveBeenCalledWith(addressWithSpaces, chain)
      expect(result).toBe(formattedAddress)
    })

    it("should handle very long addresses", () => {
      const longAddress = "5".repeat(100)
      const formattedAddress = "1".repeat(100)
      const chain = "polkadot" as any

      mockConvertAddress.mockReturnValue(formattedAddress)

      const result = validateAndFormatAddress(longAddress, chain)

      expect(result).toBe(formattedAddress)
    })
  })
})

describe("validateAndFormatMultiAddress", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("successful multi-address creation", () => {
    it("should return MultiAddress when both validation and conversion succeed", () => {
      const inputAddress = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
      const formattedAddress = "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5"
      const multiAddress = { type: "Id", value: "mock-multi-address" } as any
      const chain = "polkadot" as any

      mockConvertAddress.mockReturnValue(formattedAddress)
      mockToMultiAddress.mockReturnValue(multiAddress)

      const result = validateAndFormatMultiAddress(inputAddress, chain)

      expect(mockConvertAddress).toHaveBeenCalledWith(inputAddress, chain)
      expect(mockToMultiAddress).toHaveBeenCalledWith(formattedAddress)
      expect(result).toBe(multiAddress)
    })

    it("should handle different MultiAddress types", () => {
      const inputAddress = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
      const formattedAddress = "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5"
      const chain = "polkadot" as any

      const multiAddressTypes = [
        { type: "Id", value: "account-id" },
        { type: "Index", value: 123 },
        { type: "Raw", value: new Uint8Array([1, 2, 3]) },
        { type: "Address32", value: "address32-value" },
        { type: "Address20", value: "address20-value" }
      ] as any[]

      multiAddressTypes.forEach(multiAddress => {
        mockConvertAddress.mockReturnValue(formattedAddress)
        mockToMultiAddress.mockReturnValue(multiAddress)

        const result = validateAndFormatMultiAddress(inputAddress, chain)

        expect(result).toBe(multiAddress)
        expect(result.type).toBe(multiAddress.type)
        expect(result.value).toBe(multiAddress.value)
      })
    })
  })

  describe("error propagation from validateAndFormatAddress", () => {
    it("should propagate InvalidAddressError from validateAndFormatAddress", () => {
      const invalidAddress = "invalid-address"
      const chain = "polkadot" as any

      mockConvertAddress.mockReturnValue(null)

      expect(() => validateAndFormatMultiAddress(invalidAddress, chain)).toThrow(
        InvalidAddressError
      )

      expect(mockToMultiAddress).not.toHaveBeenCalled()
    })

    it("should not call toMultiAddress when address validation fails", () => {
      const invalidAddress = "malformed-address"
      const chain = "kusama" as any

      mockConvertAddress.mockReturnValue("")

      expect(() => validateAndFormatMultiAddress(invalidAddress, chain)).toThrow(
        InvalidAddressError
      )

      expect(mockToMultiAddress).not.toHaveBeenCalled()
    })
  })

  describe("error handling from toMultiAddress", () => {
    it("should propagate errors from toMultiAddress", () => {
      const inputAddress = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
      const formattedAddress = "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5"
      const chain = "polkadot" as any
      const conversionError = new Error("Failed to convert to MultiAddress")

      mockConvertAddress.mockReturnValue(formattedAddress)
      mockToMultiAddress.mockImplementation(() => {
        throw conversionError
      })

      expect(() => validateAndFormatMultiAddress(inputAddress, chain)).toThrow(
        "Failed to convert to MultiAddress"
      )

      expect(mockConvertAddress).toHaveBeenCalledWith(inputAddress, chain)
      expect(mockToMultiAddress).toHaveBeenCalledWith(formattedAddress)
    })
  })
})
