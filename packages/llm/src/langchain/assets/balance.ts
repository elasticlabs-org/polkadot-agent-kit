import { tool } from "@langchain/core/tools"
import type { KnownChainId } from "@polkadot-agent-kit/common"
import { formatBalance } from "@polkadot-agent-kit/common"
import type { PolkadotApi } from "@polkadot-agent-kit/core"
import { getNativeBalance } from "@polkadot-agent-kit/core"
import type { z } from "zod"

import type { BalanceToolResult, balanceToolSchema } from "../../types"
import { toolConfigBalance } from "../../types/balance"
import { ToolNames } from "../../types/common"
import { executeTool, validateAndFormatAddress } from "../../utils"

/**
 * Returns a tool that checks the balance of a specific address
 * @param apis - Map of chain IDs to API instances
 * @param address - The address to check the balance for
 * @returns A dynamic structured tool that checks the balance of the specified address
 */
export const checkBalanceTool = (polkadotApi: PolkadotApi, address: string) => {
  return tool(async ({ chain }: z.infer<typeof balanceToolSchema>) => {
    return executeTool<BalanceToolResult>(
      ToolNames.CHECK_BALANCE,
      async () => {
        const api = polkadotApi.getApi(chain as KnownChainId)
        const formattedAddress = validateAndFormatAddress(address, chain as KnownChainId)
        const balanceInfo = await getNativeBalance(api, formattedAddress)
        const formattedBalance = formatBalance(balanceInfo.balance, balanceInfo.decimals)

        return {
          balance: formattedBalance,
          symbol: balanceInfo.symbol,
          chain
        } as unknown as BalanceToolResult
      },
      result => `Balance on ${result.chain}: ${result.balance} ${result.symbol}`
    )
  }, toolConfigBalance)
}
