import { getParaChainClient, getRelayChainClient, westendAssetHubChain, westendChain, type Api, type KnownChainId } from "@polkadot-agent-kit/common"

import { UnsafeTransactionType } from "@polkadot-agent-kit/common"
/**
 * Creates a transfer call for native assets
 * @param api - The API instance to use for the transfer
 * @param to - The recipient address
 * @param amount - The amount to transfer
 * @returns The transfer call
 */
export const transferNativeCall = async (api: any, to: string, amount: bigint): Promise<UnsafeTransactionType> => {

  return api.tx.Balances.transfer_keep_alive({
    dest: {
      type: 'Id',
      value: to,
    },
    value: amount
  })
}


