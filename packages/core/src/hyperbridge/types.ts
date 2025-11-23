/**
 * Hyperbridge verification types
 */

/**
 * Cross-chain message status
 */
export enum MessageStatus {
  PENDING = "pending",
  VERIFIED = "verified",
  FAILED = "failed",
  TIMEOUT = "timeout"
}

/**
 * Cross-chain message proof
 */
export interface CrossChainProof {
  sourceChain: string
  destinationChain: string
  messageHash: string
  timestamp: number
  proof: string
  signatures: string[]
}

/**
 * Verification request
 */
export interface VerificationRequest {
  messageHash: string
  sourceChain: string
  destinationChain: string
  timeout?: number
}

/**
 * Verification result
 */
export interface VerificationResult {
  success: boolean
  status: MessageStatus
  messageHash: string
  proof?: CrossChainProof
  error?: string
  verifiedAt?: Date
}

/**
 * Hyperbridge configuration
 */
export interface HyperbridgeConfig {
  endpoint?: string
  apiKey?: string
  timeout?: number
  retryAttempts?: number
}

/**
 * Message details
 */
export interface MessageDetails {
  hash: string
  sourceChain: string
  destinationChain: string
  sender: string
  recipient: string
  data: string
  status: MessageStatus
  timestamp: number
  blockNumber?: number
}

