import {
  Api,
  KnownChainId,
  getChainById,
  getAllSupportedChains,
  BalanceInfo
} from "@polkadot-agent-kit/common"

/**
 * Retrieves the native balance and token information of an account
 * @param api The API instance to use for the query
 * @param address The address to query the balance for
 * @returns The native balance info including balance, decimals and symbol
 */
export const getNativeBalance = async (
  api: Api<KnownChainId>,
  address: string
): Promise<BalanceInfo> => {
  const balance = await api.query.System.Account.getValue(address)
  const chain = getChainById(api.chainId, getAllSupportedChains())

  return {
    balance: balance.data.free,
    decimals: chain.decimals,
    symbol: chain.symbol
  }
}
