import { tool } from "@langchain/core/tools"
import { verifyMessage, waitForVerification } from "@polkadot-agent-kit/core"

import type { VerifyMessageInput } from "../../types/hyperbridge"
import { verifyMessageSchema } from "../../types/hyperbridge"

/**
 * Verify Cross-Chain Message Tool
 * LangChain tool for verifying cross-chain messages via Hyperbridge
 */
export const verifyMessageTool = () => {
  return tool(
    async (input: VerifyMessageInput) => {
      try {
        // If waiting for confirmation, use the polling method
        if (input.waitForConfirmation) {
          const result = await waitForVerification(
            input.messageHash,
            input.sourceChain,
            input.destinationChain
          )

          if (!result.success) {
            return `Cross-chain message verification failed: ${result.error || "Unknown error"}\nStatus: ${result.status}\nMessage Hash: ${input.messageHash}`
          }

          let output = `✅ Cross-chain message verified successfully!\n\n`
          output += `**Message Hash:** ${input.messageHash}\n`
          output += `**Source Chain:** ${input.sourceChain}\n`
          output += `**Destination Chain:** ${input.destinationChain}\n`
          output += `**Status:** ${result.status}\n`

          if (result.verifiedAt) {
            output += `**Verified At:** ${result.verifiedAt.toISOString()}\n`
          }

          if (result.proof) {
            output += `\n**Proof Details:**\n`
            output += `- Timestamp: ${new Date(result.proof.timestamp).toISOString()}\n`
            output += `- Signatures: ${result.proof.signatures.length} validator(s)\n`
          }

          return output
        }

        // Otherwise, do a single verification check
        const result = await verifyMessage({
          messageHash: input.messageHash,
          sourceChain: input.sourceChain,
          destinationChain: input.destinationChain
        })

        if (!result.success) {
          return `Cross-chain message verification check: ${result.status}\n\nMessage Hash: ${input.messageHash}\nError: ${result.error || "Message not yet verified"}\n\nTip: Set waitForConfirmation=true to wait for verification.`
        }

        let output = `✅ Cross-chain message is verified!\n\n`
        output += `**Message Hash:** ${input.messageHash}\n`
        output += `**Source Chain:** ${input.sourceChain}\n`
        output += `**Destination Chain:** ${input.destinationChain}\n`
        output += `**Status:** ${result.status}\n`

        if (result.proof) {
          output += `\n**Proof Details:**\n`
          output += `- Timestamp: ${new Date(result.proof.timestamp).toISOString()}\n`
          output += `- Signatures: ${result.proof.signatures.length} validator(s)\n`
        }

        return output
      } catch (error) {
        return `Error verifying cross-chain message: ${error instanceof Error ? error.message : String(error)}`
      }
    },
    {
      name: "verify_cross_chain_message",
      description:
        "Verify a cross-chain message using Hyperbridge. This checks if a message sent from one chain has been successfully received and validated on the destination chain. Useful for confirming XCM transfers and other cross-chain communications.",
      schema: verifyMessageSchema
    }
  )
}

