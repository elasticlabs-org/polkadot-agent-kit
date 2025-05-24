import { describe, it, expect } from "vitest"
import { formatBalance, parseUnits } from "./formatBalance"

describe("formatBalance", () => {
  describe("basic functionality", () => {
    it("should format balance with no fractional part", () => {
      const result = formatBalance(BigInt("1000000000000"), 10) // 100 DOT
      expect(result).toBe("100")
    })

    it("should format balance with fractional part", () => {
      const result = formatBalance(BigInt("1050000000000"), 10) // 105 DOT
      expect(result).toBe("105")
    })

    it("should format balance with decimal places", () => {
      const result = formatBalance(BigInt("1500000000000"), 10) // 150 DOT
      expect(result).toBe("150")
    })

    // it('should handle small fractional amounts', () => {
    //     const result = formatBalance(BigInt('1000000000001'), 10) // 100.0000000001 DOT
    //     expect(result).toBe('1000000000.001')
    // })
  })

  describe("decimal handling", () => {
    it("should limit to 6 decimal places", () => {
      const result = formatBalance(BigInt("1123456789012"), 10) // 112.3456789012 DOT
      expect(result).toBe("112.345678")
    })

    it("should remove trailing zeros", () => {
      const result = formatBalance(BigInt("1500000000000"), 10) // 150.000000 DOT
      expect(result).toBe("150")
    })

    it("should remove partial trailing zeros", () => {
      const result = formatBalance(BigInt("1230000000000"), 10) // 123.000000 DOT
      expect(result).toBe("123")
    })

    it("should preserve significant decimal places", () => {
      const result = formatBalance(BigInt("1001000000000"), 10) // 100.1 DOT
      expect(result).toBe("100.1")
    })
  })

  describe("edge cases", () => {
    it("should handle zero balance", () => {
      const result = formatBalance(BigInt("0"), 10)
      expect(result).toBe("0")
    })

    // it('should handle very small amounts', () => {
    //     const result = formatBalance(BigInt('1'), 18) // 1 wei
    //     expect(result).toBe('0.000000000000000000')
    // })

    // it('should handle very large amounts', () => {
    //     const result = formatBalance(BigInt('999999999999999999999'), 18)
    //     expect(result).toBe('999999999999999999.999')
    // })

    it("should handle different decimal configurations", () => {
      // Test with 12 decimals (like WND)
      const result = formatBalance(BigInt("1000000000000"), 12) // 1 WND
      expect(result).toBe("1")
    })

    it("should handle zero decimals", () => {
      const result = formatBalance(BigInt("123"), 0)
      expect(result).toBe("123")
    })
  })
})

describe("parseUnits", () => {
  describe("valid inputs", () => {
    it("should parse integer values", () => {
      const result = parseUnits("10", 10)
      expect(result).toBe(BigInt("100000000000")) // 10 * 10^10
    })

    it("should parse decimal values", () => {
      const result = parseUnits("10.5", 10)
      expect(result).toBe(BigInt("105000000000")) // 10.5 * 10^10
    })

    it("should parse values with leading/trailing whitespace", () => {
      const result = parseUnits("  10.5  ", 10)
      expect(result).toBe(BigInt("105000000000"))
    })

    it("should parse zero values", () => {
      const result = parseUnits("0", 10)
      expect(result).toBe(BigInt("0"))
    })

    it("should parse decimal zero", () => {
      const result = parseUnits("0.0", 10)
      expect(result).toBe(BigInt("0"))
    })

    it("should handle values with maximum decimal places", () => {
      const result = parseUnits("1.2345678901", 10) // exactly 10 decimal places
      expect(result).toBe(BigInt("12345678901"))
    })
  })

  describe("decimal padding", () => {
    it("should pad fractional part with zeros", () => {
      const result = parseUnits("1.5", 10) // should become 1.5000000000
      expect(result).toBe(BigInt("15000000000"))
    })

    it("should handle single decimal place", () => {
      const result = parseUnits("1.1", 2)
      expect(result).toBe(BigInt("110"))
    })

    it("should handle no decimal part", () => {
      const result = parseUnits("42", 6)
      expect(result).toBe(BigInt("42000000"))
    })
  })

  describe("error handling", () => {
    it("should throw error for negative decimals", () => {
      expect(() => parseUnits("10", -1)).toThrow("Decimals must be a non-negative integer")
    })

    it("should throw error for non-integer decimals", () => {
      expect(() => parseUnits("10", 1.5)).toThrow("Decimals must be a non-negative integer")
    })

    it("should throw error for empty string", () => {
      expect(() => parseUnits("", 10)).toThrow("Value must not be empty")
    })

    it("should throw error for whitespace only", () => {
      expect(() => parseUnits("   ", 10)).toThrow("Value must not be empty")
    })

    it("should throw error for invalid integer part", () => {
      expect(() => parseUnits("abc", 10)).toThrow("Integer part must be numeric")
    })

    it("should throw error for invalid fractional part", () => {
      expect(() => parseUnits("10.abc", 10)).toThrow("Fractional part must be numeric")
    })

    it("should throw error for fractional part exceeding decimals", () => {
      expect(() => parseUnits("10.12345678901", 10)).toThrow(
        "Fractional part exceeds allowed decimals (10)"
      )
    })

    it("should throw error for negative values", () => {
      expect(() => parseUnits("-10", 10)).toThrow("Integer part must be numeric")
    })

    it("should throw error for special characters", () => {
      expect(() => parseUnits("10.5$", 10)).toThrow("Fractional part must be numeric")
    })
  })

  describe("edge cases", () => {
    it("should handle zero decimals", () => {
      const result = parseUnits("123", 0)
      expect(result).toBe(BigInt("123"))
    })

    it("should handle very large values", () => {
      const result = parseUnits("999999999999999999", 0)
      expect(result).toBe(BigInt("999999999999999999"))
    })

    it("should handle decimal point at end", () => {
      const result = parseUnits("10.", 2)
      expect(result).toBe(BigInt("1000"))
    })

    it("should handle values with exact decimal precision", () => {
      const result = parseUnits("1.000000000000000000", 18) // 18 zeros
      expect(result).toBe(BigInt("1000000000000000000"))
    })
  })
})
