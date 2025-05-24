import { ed25519 } from "@noble/curves/ed25519"
import { getPolkadotSigner, PolkadotSigner } from "polkadot-api/signer"
import { getSs58AddressInfo } from "polkadot-api"
export type Hex = Uint8Array | string

import * as ss58 from "@subsquid/ss58"

export function buildAccountSigner(): PolkadotSigner {
  const seed = getPrivateKey(process.env.PRIVATE_KEY) as string
  const signer = getPolkadotSigner(ed25519.getPublicKey(seed), "Ed25519", input =>
    ed25519.sign(input, seed)
  )
  return signer
}

export function buildAccountDelegateProxySigner(): PolkadotSigner {
  const seed = getPrivateKey(process.env.DELEGATE_PRIVATE_KEY) as string
  const signer = getPolkadotSigner(ed25519.getPublicKey(seed), "Ed25519", input =>
    ed25519.sign(input, seed)
  )
  return signer
}

export function getPrivateKey(account?: string) {
  return account || process.env.PRIVATE_KEY
}

export function publicKeyOf(seed?: string) {
  let privateKey: Hex | undefined = seed || getPrivateKey()
  if (!privateKey) {
    console.warn("No private key found will use a random one")
    privateKey = ed25519.utils.randomPrivateKey()
  }
  return ed25519.getPublicKey(privateKey)
}

/**
 * Check if a value is a hex string
 * @param value - the value to check
 **/
export function isHex(value: unknown): value is string {
  return typeof value === "string" && value.length % 2 === 0 && /^0x[\da-f]*$/i.test(value)
}

/**
 * Decode an ss58 address from the value
 * @param address - the address to decode
 **/
export function addressOf(address: Uint8Array): string {
  const value = address
  if (!value) {
    return ""
  }
  return ss58.codec("polkadot").encode(value)
}

export function addressOfSubstrate(address: Uint8Array): string {
  const value = address
  if (!value) {
    return ""
  }
  return ss58.codec("substrate").encode(value)
}

export interface BalanceInfo {
  balance: bigint
  decimals: number
  symbol: string
}

// export function toMultiAddress(address: string): MultiAddress {
//   return MultiAddress.Id(address);
// }
