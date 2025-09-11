import { ed25519CreateDerive, sr25519CreateDerive } from "@polkadot-labs/hdkd"
import { entropyToMiniSecret, mnemonicToEntropy } from "@polkadot-labs/hdkd-helpers"
import * as ss58 from "@subsquid/ss58"
import type { PolkadotSigner } from "polkadot-api/signer"
import { getPolkadotSigner } from "polkadot-api/signer"

import { getAllSupportedChains, getChainById } from "../chains/chains"
import type { AgentConfig } from "../types"

/**
 * Convert a public key (Uint8Array) to a Substrate address
 * @param publicKey - The public key as Uint8Array (32 bytes)
 * @param chainId - The chain ID to get the correct SS58 prefix
 * @returns The SS58-encoded address string
 */
export function publicKeyToAddress(publicKey: Uint8Array, chainId: string = "polkadot"): string {
  const chain = getChainById(chainId, getAllSupportedChains())
  return ss58.codec(chain.prefix).encode(publicKey)
}

/**
 * Derive and convert address from mini secret
 *
 * @param miniSecret - The mini secret as Uint8Array (32 bytes)
 * @param keyType - The cryptographic key type ("Sr25519" or "Ed25519")
 * @param derivationPath - The BIP44 derivation path (e.g., "//0", "//hard/soft")
 * @param chainId - The target chain ID for address encoding (default: "polkadot")
 * @returns The SS58-encoded address string for the specified chain
 *
 */
export function deriveAndConvertAddress(
  miniSecret: Uint8Array,
  keyType: "Sr25519" | "Ed25519",
  derivationPath: string,
  chainId: string = "polkadot"
): string {
  const keypair = getKeypair(miniSecret, keyType, derivationPath)
  return publicKeyToAddress(keypair.publicKey, chainId)
}

/**
 * Generate mini secret from agent config
 * @param config - The agent configuration
 * @returns The mini secret as Uint8Array
 */
export function generateMiniSecret(config: AgentConfig): Uint8Array {
  if (!config.mnemonic && !config.privateKey) {
    throw new Error("Missing mnemonic phrase or privateKey")
  }

  if (config.mnemonic && config.privateKey) {
    throw new Error("Cannot provide both mnemonic phrase and privateKey")
  }

  if (config.mnemonic) {
    const entropy = mnemonicToEntropy(config.mnemonic)
    return entropyToMiniSecret(entropy)
  } else if (config.privateKey) {
    const privateKeyHex = config.privateKey.startsWith("0x")
      ? config.privateKey.slice(2)
      : config.privateKey

    return new Uint8Array(privateKeyHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
  } else {
    throw new Error("No valid wallet source found")
  }
}

/**
 * Get keypair from mini secret and derivation path
 * @param miniSecret - The mini secret
 * @param keyType - The key type
 * @param derivationPath - The derivation path
 * @returns The derived keypair
 */
export function getKeypair(
  miniSecret: Uint8Array,
  keyType: "Sr25519" | "Ed25519",
  derivationPath: string = ""
) {
  const derive =
    keyType === "Sr25519" ? sr25519CreateDerive(miniSecret) : ed25519CreateDerive(miniSecret)

  return derive(derivationPath)
}

export function getSigner(
  miniSecret: Uint8Array,
  keyType: "Sr25519" | "Ed25519",
  derivationPath: string = ""
): PolkadotSigner {
  if (keyType === "Sr25519") {
    const signer = getPolkadotSigner(
      getKeypair(miniSecret, keyType, derivationPath).publicKey,
      keyType,
      input => getKeypair(miniSecret, keyType, derivationPath).sign(input)
    )

    return signer
  } else {
    const signer = getPolkadotSigner(
      getKeypair(miniSecret, keyType, derivationPath).publicKey,
      keyType,
      input => getKeypair(miniSecret, keyType, derivationPath).sign(input)
    )
    return signer
  }
}
