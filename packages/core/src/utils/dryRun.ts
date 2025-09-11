import { Api, getParaChainClient, getRelayChainClient, isRelayChain, KnownChainId, UnsafeTransactionType } from "@polkadot-agent-kit/common";
import { Enum } from "polkadot-api";


const DEFAULT_XCM_VERSION = 3


export async function dryRunCall(
  api: Api<KnownChainId>,
  from: string,
  transaction: UnsafeTransactionType
): Promise<any> {

  const origin = {
    type: 'system',
    value: {
      type: 'Signed',
      value: from
    }
  }
  
  let client;
  if (isRelayChain(api.chain)) {
    client = await getRelayChainClient(api.chain, {})
  } else {
    // Parachains and Asset Hubs will use getParaChainClient
    client = await getParaChainClient(api.chain, {})
  }

  const unsafeApi = client.getUnsafeApi()
  const dryRunResult = await unsafeApi.apis.DryRunApi.dry_run_call(origin, transaction.decodedCall, DEFAULT_XCM_VERSION)

  return dryRunResult
}