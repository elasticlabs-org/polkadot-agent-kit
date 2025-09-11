import { ed25519CreateDerive, sr25519CreateDerive } from "@polkadot-labs/hdkd"
import { entropyToMiniSecret, mnemonicToEntropy } from "@polkadot-labs/hdkd-helpers"
import * as ss58 from "@subsquid/ss58"
import { getAllSupportedChains, getChainById } from "../chains/chains"



function publicKeyToAddress(publicKey: Uint8Array, chainId: string = "polkadot"): string {
  
  const chain = getChainById(chainId, getAllSupportedChains())

  return ss58.codec(chain.prefix).encode(publicKey)
}


export function deriveAndConvertAddress(
  mnemonic: string,
  keyType: "Sr25519" | "Ed25519" = "Sr25519",
  derivationPath: string = "",
  chainId: string = "polkadot"
): string {

  const entropy = mnemonicToEntropy(mnemonic)
  
  const miniSecret = entropyToMiniSecret(entropy)
  
  const derive = keyType === "Sr25519" 
    ? sr25519CreateDerive(miniSecret)
    : ed25519CreateDerive(miniSecret)
  

  const keypair = derive(derivationPath)
  

  return publicKeyToAddress(keypair.publicKey, chainId)
}

/**
 * Convert raw public key bytes to address
 */
export function convertPublicKeyBytesToAddress(
  publicKeyBytes: Uint8Array,
  chainId: string = "polkadot"
): string {
  return publicKeyToAddress(publicKeyBytes, chainId)
}