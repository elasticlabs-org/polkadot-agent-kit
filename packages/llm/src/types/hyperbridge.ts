import { z } from "zod"

/**
 * Schema for verifying cross-chain messages
 */
export const verifyMessageSchema = z.object({
  messageHash: z
    .string()
    .describe("The hash of the cross-chain message to verify"),
  sourceChain: z
    .string()
    .describe("The source chain identifier (e.g., 'polkadot')"),
  destinationChain: z
    .string()
    .describe("The destination chain identifier (e.g., 'polkadot_asset_hub')"),
  waitForConfirmation: z
    .boolean()
    .optional()
    .describe("Whether to wait for the message to be verified (default: false)")
})

export type VerifyMessageInput = z.infer<typeof verifyMessageSchema>

/**
 * Tool configuration for Hyperbridge verification
 */
export const toolConfigVerifyMessage = {
  name: "verify_cross_chain_message",
  description:
    "Verify a cross-chain message using Hyperbridge. This checks if a message sent from one chain has been successfully received and validated on the destination chain. Useful for confirming XCM transfers and other cross-chain communications.",
  schema: verifyMessageSchema
}

