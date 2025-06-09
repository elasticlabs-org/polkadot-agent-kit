import { AccountId, type SS58String } from "polkadot-api"

/**
 * Checks if a string is a valid SS58 address
 * @param address - The string to check
 * @returns True if the string is a valid SS58 address, false otherwise
 */
export const isValidAddress = (address: SS58String | string): boolean => {
  try {
    if (!address) return false
    AccountId().enc(address)
    return true
  } catch (_err) {
    return false
  }
}
