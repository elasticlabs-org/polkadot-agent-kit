import type { KnownChainId } from "../chains"

/** Key type supported by the agent */
export type KeyType = "Sr25519" | "Ed25519"

/** Define configuration for PolkadotAgentKit **/
export interface AgentConfig {
  /** Private key as string (hex encoded) */
  privateKey?: string
  /** Mnemonic phrase to generate keys */
  mnemonic?: string
  /** Derivation path for the mnemonic (default: empty string) */
  derivationPath?: string
  /** Key type to use (Sr25519 or Ed25519, default: Ed25519) */
  keyType?: KeyType
  /** Optional delegate private key */
  delegatePrivateKey?: string
  /** Optional delegate mnemonic phrase */
  delegateMnemonic?: string
  /** Optional delegate derivation path */
  delegateDerivationPath?: string
  /** Optional delegate key type (defaults to main keyType) */
  delegateKeyType?: KeyType
  /** Chains to use (defaults to all chains) */
  chains?: KnownChainId[]
}

/** Result type for dynamic chain operations */
export interface ChainOperationResult {
  success: boolean
  chainId: KnownChainId
  message: string
  error?: string
}

