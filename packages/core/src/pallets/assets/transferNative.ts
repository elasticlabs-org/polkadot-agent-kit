import type { Api, KnownChainId } from "@polkadot-agent-kit/common"
import type { MultiAddress } from "@polkadot-api/descriptors"

import type { Tx } from "../../types"

/**
 * Creates a transfer call for native assets
 * @param api - The API instance to use for the transfer
 * @param to - The recipient address
 * @param amount - The amount to transfer
 * @returns The transfer call
 */
export const transferNativeCall = (
  api: Api<KnownChainId>,
  to: MultiAddress,
  amount: bigint
): Tx => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
  return api.tx.Balances.transfer_keep_alive({ dest: to as any, value: amount })
}
