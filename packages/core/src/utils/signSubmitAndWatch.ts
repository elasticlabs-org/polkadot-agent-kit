import type { PolkadotSigner, TxEvent } from "polkadot-api"

import type { Tx, TxResult } from "../types"
import type { SubmitAndWatchOptions } from "../types/transaction"
import { hasTypeProperty, isTxWithPolkadotSigner } from "../types/transaction"

async function submitAndWatchTx(options: SubmitAndWatchOptions): Promise<TxResult> {
  return new Promise((resolve, reject) => {
    try {
      // Handle Tx with PolkadotSigner using signSubmitAndWatch
      if (isTxWithPolkadotSigner(options)) {
        try {
          options.transaction.signSubmitAndWatch(options.signer).subscribe({
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
        } catch (error) {
          resolve({
            success: false,
            error: `Transaction creation failed: ${error instanceof Error ? error.message : String(error)}`
          })
        }
      }
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)))
    }
  })
}

/**
 * Function to submit a transaction with a PolkadotSigner
 */
export async function submitTxWithPolkadotSigner(
  transaction: Tx,
  signer: PolkadotSigner
): Promise<TxResult> {
  return submitAndWatchTx({ transaction, signer })
}
