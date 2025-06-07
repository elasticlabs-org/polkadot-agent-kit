import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { getNativeBalance } from "@polkadot-agent-kit/core"
import type { Api, KnownChainId } from "@polkadot-agent-kit/common"
import { formatBalance } from "@polkadot-agent-kit/common"
import { getApiForChain, validateAndFormatAddress, executeTool } from "../utils"
import { toolConfigBalance, ToolNames } from "../types"
import type { BalanceToolResult, balanceToolSchema} from "../types"

/**
 * Returns a tool that checks the balance of a specific address
 * @param apis - Map of chain IDs to API instances
 * @param address - The address to check the balance for
 * @returns A dynamic structured tool that checks the balance of the specified address
 */
export const checkBalanceTool = (apis: Map<KnownChainId, Api<KnownChainId>>, address: string) => {
  return tool(async ({ chain }: z.infer<typeof balanceToolSchema>) => {
    return executeTool<BalanceToolResult>(
      ToolNames.CHECK_BALANCE,
      async () => {
        const api = getApiForChain(apis, chain)
        const formattedAddress = validateAndFormatAddress(address, chain as KnownChainId)
        const balanceInfo = await getNativeBalance(api, formattedAddress)
        const formattedBalance = formatBalance(balanceInfo.balance, balanceInfo.decimals)

        return {
          balance: formattedBalance,
          symbol: balanceInfo.symbol,
          chain
        }
      },
      result => `Balance on ${result.chain}: ${result.balance} ${result.symbol}`
    )
  }, toolConfigBalance)
}
