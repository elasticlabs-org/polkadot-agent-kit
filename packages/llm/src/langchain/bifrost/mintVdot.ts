import { tool } from "@langchain/core/tools"
import type { Api, ChainIdPara } from "@polkadot-agent-kit/common"
import { parseUnits, publicKeyToAddress } from "@polkadot-agent-kit/common"
import type { PolkadotApi } from "@polkadot-agent-kit/core"
import { mintVDot, submitTxWithPolkadotSigner } from "@polkadot-agent-kit/core"
import type { PolkadotSigner } from "polkadot-api/signer"
import type z from "zod"

import type { mintVdotSchema, MintVdotToolResult } from "../../types"
import { toolConfigMintVdot, ToolNames } from "../../types"
import { executeTool } from "../../utils"

export const mintVdotTool = (polkadotApi: PolkadotApi, signer: PolkadotSigner) => {
  return tool(async ({ amount }: z.infer<typeof mintVdotSchema>) => {
    return executeTool<MintVdotToolResult>(
      ToolNames.MINT_VDOT,
      async () => {
        const api = polkadotApi.getApi("bifrost_polkadot") as Api<ChainIdPara>
        // Convert DOT amount to planck (1 DOT = 10^10 planck)
        const amountInPlanck = parseUnits(amount, 10)

        // Get sender address from signer public key for Bifrost Polkadot chain
        const fromAddress = publicKeyToAddress(signer.publicKey, "bifrost_polkadot")

        const mintTx = await mintVDot(api, fromAddress, amountInPlanck)

        if (!mintTx.success) {
          return {
            success: false,
            error: mintTx.error
          }
        }

        const result = await submitTxWithPolkadotSigner(mintTx.transaction!, signer)

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
      },
      result => {
        if (result.success) {
          return `Tx Hash Successful: ${result.transactionHash}`
        } else {
          return `Tx Hash Failed: ${result.transactionHash} with error: ${result.error}`
        }
      }
    )
  }, toolConfigMintVdot)
}
