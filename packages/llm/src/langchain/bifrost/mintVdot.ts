import { tool } from "@langchain/core/tools"
import { parseUnits } from "@polkadot-agent-kit/common"
import { mintVDot, submitTxWithPolkadotSigner } from "@polkadot-agent-kit/core"
import type { PolkadotSigner } from "polkadot-api"
import type z from "zod"

import type { mintVdotSchema, MintVdotToolResult } from "../../types"
import { toolConfigMintVdot, ToolNames } from "../../types"
import { executeTool } from "../../utils"

export const mintVdotTool = (signer: PolkadotSigner) => {
  return tool(async ({ amount }: z.infer<typeof mintVdotSchema>) => {
    return executeTool<MintVdotToolResult>(ToolNames.MINT_VDOT, async () => {
      // Convert DOT amount to planck (1 DOT = 10^10 planck)
      const amountInPlanck = parseUnits(amount, 10)

      const tx = await mintVDot(amountInPlanck)

      const result = await submitTxWithPolkadotSigner(tx, signer)

      if (result.success) {
        return {
          success: result.success,
          transactionHash: result.transactionHash
        }
      } else {
        return {
          success: false,
          transactionHash: result.transactionHash,
          error: result.error
        }
      }
    })
  }, toolConfigMintVdot)
}
