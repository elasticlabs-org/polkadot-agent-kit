import type { UnsafeTransactionType } from "@polkadot-agent-kit/common"
import { type Api, type KnownChainId } from "@polkadot-agent-kit/common"
import { dryRunCall } from "../../utils/dryRun"
import { TxResult } from "../../types/transaction"
/**
 * Creates a transfer call for native assets
 * @param api - The API instance to use for the transfer
 * @param to - The recipient address
 * @param amount - The amount to transfer
 * @returns The transfer call
 */
export const transferNativeCall = async (
  api: Api<KnownChainId>,
  from: string,
  to: string,
  amount: BigInt
): Promise<TxResult> => {

  // Dry Run check 
  const tx = api.tx.Balances.transfer_keep_alive({
    dest: {
      type: "Id",
      value: to
    },
    value: amount
  })
  const dryRunResult = await dryRunCall(api, from, tx)
  if (dryRunResult.value.execution_result.success) {
    return {
      success: true,
      transaction: tx
    }
  }
  else {
    const executionError = dryRunResult.value?.execution_result?.value

    if (executionError?.error) {
      const {error} = executionError

      return {
        success: false,
        error: `${error.type} error: ${error.value?.type || "Unknown error"}`
      }
    }

  return {
    success: false,
    error: "Unknown error"
  }

  }
}
