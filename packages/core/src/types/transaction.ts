import { KeyringPair } from "@polkadot/keyring/types"
import { TxResult as TxResultXcm } from "@substrate/asset-transfer-api"
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

export interface SubmitAndWatchOptionsKeypair {
  transaction: TxResultXcm<"submittable">
  signer: KeyringPair
}

export type SubmitAndWatchOptions = SubmitAndWatchOptionsPolkadot | SubmitAndWatchOptionsKeypair

export function isTxWithPolkadotSigner(
  options: SubmitAndWatchOptions
): options is SubmitAndWatchOptionsPolkadot {
  return (
    !!options.transaction &&
    typeof (options.transaction as any).signSubmitAndWatch === "function" &&
    !!options.signer &&
    options.signer.publicKey instanceof Uint8Array &&
    typeof (options.signer as any).signTx === "function" &&
    typeof (options.signer as any).signBytes === "function"
  )
}

export function isTxXcmWithKeypair(
  options: SubmitAndWatchOptions
): options is SubmitAndWatchOptionsKeypair {
  return (
    !!options.transaction &&
    typeof (options.transaction as any).tx?.signAndSend === "function" &&
    !!options.signer &&
    typeof (options.signer as any).address === "string" &&
    typeof (options.signer as any).sign === "function"
  )
}
