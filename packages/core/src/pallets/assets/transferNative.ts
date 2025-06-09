import type { Api, KnownChainId } from "@polkadot-agent-kit/common"
import { MultiAddress } from "@polkadot-api/descriptors"

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
) => {
  const data = {
    dest: MultiAddress.Id(to),
    value: amount
  }
  return api.tx.Balances.transfer_keep_alive(data).decodedCall
}
