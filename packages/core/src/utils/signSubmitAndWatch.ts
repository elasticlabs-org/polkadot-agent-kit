import type { PolkadotSigner, TxEvent } from "polkadot-api"

import type { Tx, TxResult } from "../types"

function hasTypeProperty(val: unknown): val is { type: string } {
  return (
    typeof val === "object" &&
    val !== null &&
    "type" in val &&
    typeof (val as { type: unknown }).type === "string"
  )
}

export async function submitAndWatchTx(transaction: Tx, signer: PolkadotSigner): Promise<TxResult> {
  return new Promise(resolve => {
    // Submit the signed transaction and watch status
    transaction.signSubmitAndWatch(signer).subscribe({
      next: (event: TxEvent) => {
        if (event.type === "finalized") {
          let finalResult: TxResult

          if (event.dispatchError) {
            const value = event.dispatchError.value
            const errorType = hasTypeProperty(value) ? value.type : undefined

            finalResult = {
              success: false,
              transactionHash: event.txHash,
              error: errorType
            }
          } else {
            finalResult = {
              success: true,
              transactionHash: event.txHash
            }
          }

          resolve(finalResult)
        }
      },
      error: (error: Error) => {
        resolve({
          success: false,
          error: `Transaction failed: ${error.message}`
        })
      },
      complete: () => {}
    })
  })
}
