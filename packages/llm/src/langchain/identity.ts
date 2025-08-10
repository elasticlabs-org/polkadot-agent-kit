import { tool } from "@langchain/core/tools"
import type { Api, ChainIdPara } from "@polkadot-agent-kit/common"
import type { PolkadotApi} from "@polkadot-agent-kit/core";
import { registerIdentity, submitTxWithPolkadotSigner } from "@polkadot-agent-kit/core"
import type { PolkadotSigner } from "polkadot-api"
import type z from "zod"

import type {
  registerIdentitySchema,
  RegisterIdentityToolResult} from "../types";
import {
  toolConfigRegisterIdentity,
  ToolNames
} from "../types"
import { executeTool } from "../utils"

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
        const tx = registerIdentity(
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
