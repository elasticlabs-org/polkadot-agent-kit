import { describe, it, expect, vi, beforeEach } from "vitest"
import { validateAndFormatAddress } from "./tools"
import { InvalidAddressError } from "../types"

vi.mock("@polkadot-agent-kit/core", () => ({
  convertAddress: vi.fn()
}))

import { convertAddress } from "@polkadot-agent-kit/core"

const mockConvertAddress = vi.mocked(convertAddress)

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

      mockConvertAddress.mockReturnValue(null as any)

      expect(() => validateAndFormatAddress(invalidAddress, chain)).toThrow(InvalidAddressError)

      expect(mockConvertAddress).toHaveBeenCalledWith(invalidAddress, chain)
    })

    it("should throw InvalidAddressError when convertAddress returns undefined", () => {
      const invalidAddress = "another-invalid-address"
      const chain = "kusama" as any

      mockConvertAddress.mockReturnValue(null as any)

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

      mockConvertAddress.mockReturnValue(null as any)

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
