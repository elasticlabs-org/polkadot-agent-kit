import type { HyperbridgeConfig, VerificationRequest, VerificationResult } from "./types"
import { createHyperbridgeClient } from "./client"

/**
 * Verify a cross-chain message using Hyperbridge
 *
 * @param request - Verification request details
 * @param config - Optional Hyperbridge configuration
 * @returns Verification result
 *
 * @example
 * ```typescript
 * const result = await verifyMessage({
 *   messageHash: "0x1234...",
 *   sourceChain: "polkadot",
 *   destinationChain: "polkadot_asset_hub"
 * });
 *
 * if (result.success) {
 *   console.log("Message verified:", result.proof);
 * }
 * ```
 */
export async function verifyMessage(
  request: VerificationRequest,
  config?: HyperbridgeConfig
): Promise<VerificationResult> {
  const client = createHyperbridgeClient(config)
  return await client.verifyMessage(request)
}

/**
 * Wait for a message to be verified
 *
 * @param messageHash - The message hash to verify
 * @param sourceChain - Source chain identifier
 * @param destinationChain - Destination chain identifier
 * @param config - Optional Hyperbridge configuration
 * @returns Verification result
 *
 * @example
 * ```typescript
 * const result = await waitForVerification(
 *   "0x1234...",
 *   "polkadot",
 *   "polkadot_asset_hub"
 * );
 * ```
 */
export async function waitForVerification(
  messageHash: string,
  sourceChain: string,
  destinationChain: string,
  config?: HyperbridgeConfig
): Promise<VerificationResult> {
  const client = createHyperbridgeClient(config)
  return await client.waitForVerification(messageHash, sourceChain, destinationChain)
}

/**
 * Get detailed information about a cross-chain message
 *
 * @param messageHash - The message hash to query
 * @param config - Optional Hyperbridge configuration
 * @returns Message details or null if not found
 */
export async function getMessageDetails(messageHash: string, config?: HyperbridgeConfig) {
  const client = createHyperbridgeClient(config)
  return await client.getMessageDetails(messageHash)
}

