import type { Api, KnownChainId, UnsafeTransactionType } from "@polkadot-agent-kit/common"
import { getParaChainClient, getRelayChainClient, isRelayChain } from "@polkadot-agent-kit/common"

const DEFAULT_XCM_VERSION = 3

export interface DryRunResult {
  success: boolean
  value?: {
    execution_result: {
      success: boolean
      value?: {
        error?: {
          type: string
          value?: {
            type?: string
            [key: string]: unknown
          }
        }
        post_info?: unknown
      }
    }
    emitted_events?: unknown[]
    local_xcm?: unknown
    forwarded_xcms?: unknown[]
  }
  error?: string
}

/**
 * Performs a dry run of a transaction using the runtime API
 * @param api - The API instance
 * @param from - The sender address
 * @param transaction - The transaction to dry run
 * @returns Promise resolving to DryRunResult
 */
export async function dryRunCall(
  api: Api<KnownChainId>,
  from: string,
  transaction: UnsafeTransactionType
): Promise<DryRunResult> {
  const origin = {
    type: "system",
    value: {
      type: "Signed",
      value: from
    }
  }

  let client
  if (isRelayChain(api.chain)) {
    client = await getRelayChainClient(api.chain, {})
  } else {
    client = await getParaChainClient(api.chain, {})
  }

  const unsafeApi = client.getUnsafeApi()

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const dryRunResult = await unsafeApi.apis.DryRunApi.dry_run_call(
    origin,
    transaction.decodedCall,
    DEFAULT_XCM_VERSION
  )

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return dryRunResult
}
