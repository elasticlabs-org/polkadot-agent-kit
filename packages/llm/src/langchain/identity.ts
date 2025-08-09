import { tool } from "@langchain/core/tools"
import { PolkadotApi, registerIdentity, submitTxWithPolkadotSigner } from "@polkadot-agent-kit/core"
import { PolkadotSigner } from "polkadot-api"
import {
  registerIdentitySchema,
  RegisterIdentityToolResult,
  toolConfigRegisterIdentity,
  ToolNames
} from "../types"
import { Api, ChainIdPara } from "@polkadot-agent-kit/common"
import { executeTool } from "../utils"
import z from "zod"

export const registerIdentityTool = (polkadotApi: PolkadotApi, signer: PolkadotSigner) => {
  return tool(
    async ({
      display,
      legal,
      web,
      matrix,
      email,
      image,
      twitter,
      github,
      discord
    }: z.infer<typeof registerIdentitySchema>) => {
      return executeTool<RegisterIdentityToolResult>(ToolNames.REGISTER_IDENTITY, async () => {
        const api = polkadotApi.getApi("paseo_people") as Api<ChainIdPara>
        const tx = await registerIdentity(
          api,
          display,
          legal,
          web,
          matrix,
          email,
          image,
          twitter,
          github,
          discord
        )

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
    },
    toolConfigRegisterIdentity
  )
}
