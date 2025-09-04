import type { UnsafeApi, UnsafeTransaction } from "polkadot-api"
import type { ChainId } from "../chains"


export type UnsafeTransactionType = UnsafeTransaction<any, string, string, any>

/**
 * Polkadot API type - the UnsafeApi type used in our Api interface
 */
export type UnsafeApiType<Id extends ChainId = ChainId> = UnsafeApi<Id>
