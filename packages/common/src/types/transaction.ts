import type { UnsafeApi, UnsafeTransaction } from "polkadot-api"

import type { ChainId } from "../chains"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type UnsafeTransactionType = UnsafeTransaction<any, string, string, any>

export type UnsafeApiType<Id extends ChainId = ChainId> = UnsafeApi<Id>
