import type { UnsafeTransactionType } from "@polkadot-agent-kit/common"
import { type Api, type KnownChainId } from "@polkadot-agent-kit/common"
/**
 * Creates a transfer call for native assets
 * @param api - The API instance to use for the transfer
 * @param to - The recipient address
 * @param amount - The amount to transfer
 * @returns The transfer call
 */
export const transferNativeCall = (
  api: Api<KnownChainId>,
  to: string,
  amount: bigint
): UnsafeTransactionType => {
  return api.tx.Balances.transfer_keep_alive({
    dest: {
      type: "Id",
      value: to
    },
    value: amount
  })
}
