import type { Api, KnownChainId } from "@polkadot-agent-kit/common"

import type { Tx } from "../../types"

/**
 * Creates a transfer call for native assets
 * @param api - The API instance to use for the transfer
 * @param to - The recipient address
 * @param amount - The amount to transfer
 * @returns The transfer call
 */
export const transferNativeCall = (api: Api<KnownChainId>, to: string, amount: bigint): Tx => {
  // @ts-ignore
  return api.tx.Balances.transfer_keep_alive({ dest: to, value: amount })
}
