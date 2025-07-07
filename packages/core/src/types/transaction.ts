import type { PolkadotSigner, TxEvent } from "polkadot-api"
import type { Observable } from "rxjs"

export interface Tx {
  signSubmitAndWatch(signer: PolkadotSigner): Observable<TxEvent>
}

export interface TxResult {
  success: boolean
  transactionHash?: string
  error?: string
  explorerUrl?: string
}

export function hasTypeProperty(val: unknown): val is { type: string } {
  return (
    typeof val === "object" &&
    val !== null &&
    "type" in val &&
    typeof (val as { type: unknown }).type === "string"
  )
}

export interface SubmitAndWatchOptionsPolkadot {
  transaction: Tx
  signer: PolkadotSigner
}

export type SubmitAndWatchOptions = SubmitAndWatchOptionsPolkadot

export function isTxWithPolkadotSigner(
  options: SubmitAndWatchOptions
): options is SubmitAndWatchOptionsPolkadot {
  return (
    !!options.transaction &&
    typeof options.transaction.signSubmitAndWatch === "function" &&
    !!options.signer &&
    options.signer.publicKey instanceof Uint8Array &&
    typeof options.signer.signTx === "function" &&
    typeof options.signer.signBytes === "function"
  )
}
