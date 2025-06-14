import { PolkadotSigner, TxEvent } from "polkadot-api"
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
