/**
 * Format balance with proper decimal places
 * @param balance The balance in smallest unit
 * @param decimals The number of decimal places
 * @returns Formatted balance string
 */
export const formatBalance = (balance: bigint, decimals: number): string => {
  const divisor = BigInt(10 ** decimals)
  const integerPart = balance / divisor
  const fractionalPart = balance % divisor

  // Convert fractional part to string and pad with leading zeros
  let fractionalStr = fractionalPart.toString().padStart(decimals, "0")
  // Limit to 6 decimal places and remove trailing zeros
  fractionalStr = fractionalStr.slice(0, 6).replace(/0+$/, "")

  return fractionalStr ? `${integerPart}.${fractionalStr}` : integerPart.toString()
}

/**
 * Converts a token amount from human-readable format to the smallest unit (e.g., DOT to Planck)
 * @param value - The amount in human-readable format as a string (e.g., "10.5")
 * @param decimals - The number of decimal places for the token (e.g., 10 for DOT, 12 for WND)
 * @returns The amount in smallest unit as bigint
 * @throws Error if the input is invalid or negative
 *
 * @example
 * ```typescript
 * // Convert 10 DOT to Planck (10 * 10^10)
 * const planck = parseUnits("10", 10); // Returns 100000000000n
 *
 * // Convert 10.23234 DOT to Planck
 * const planck = parseUnits("10.23234", 10); // Returns 102323400000n
 * ```
 */
export function parseUnits(value: string, decimals: number): bigint {
  if (!Number.isInteger(decimals) || decimals < 0) {
    throw new Error("Decimals must be a non-negative integer")
  }
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error("Value must not be empty")
  }
  const [integerPart, fractionalPart = ""] = trimmed.split(".")
  if (!/^\d+$/.test(integerPart)) {
    throw new Error("Integer part must be numeric")
  }
  if (fractionalPart && !/^\d+$/.test(fractionalPart)) {
    throw new Error("Fractional part must be numeric")
  }
  if (fractionalPart.length > decimals) {
    throw new Error(`Fractional part exceeds allowed decimals (${decimals})`)
  }
  const divisor = BigInt(10 ** decimals)
  const integerValue = BigInt(integerPart)
  const paddedFraction = fractionalPart.padEnd(decimals, "0")
  const fractionalValue = paddedFraction ? BigInt(paddedFraction) : BigInt(0)
  return integerValue * divisor + fractionalValue
}
