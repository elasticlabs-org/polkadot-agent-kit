import type { Api, KnownChainId } from "@polkadot-agent-kit/common"
import { getAllSupportedChains, getChainById } from "@polkadot-agent-kit/common"
import type { TxResult } from "@substrate/asset-transfer-api"
import { AssetTransferApi } from "@substrate/asset-transfer-api"

import { constructApiPromiseWithTimeout } from "../../utils"

/**
 * Transfers a native asset to a destination address on a destination chain via xcm
 * @param api - The API instance to use for the query
 * @param to - The destination address
 * @param amount - The amount to transfer
 * @param destinationChain - The destination chain (RelayChain or Parachain)
 * @returns The transaction result
 */
export const xcmTransferNativeAsset = async (
  api: Api<KnownChainId>,
  to: string,
  amount: bigint,
  destinationChain: KnownChainId
): Promise<TxResult<"submittable">> => {
  const sourceChain = getChainById(api.chainId, getAllSupportedChains())
  const destChain = getChainById(destinationChain, getAllSupportedChains())
  const {
    api: xcmApi,
    specName,
    safeXcmVersion
  } = await constructApiPromiseWithTimeout(sourceChain.wsUrls)

  const assetApi = new AssetTransferApi(xcmApi, specName, safeXcmVersion)
  let callInfo: TxResult<"submittable">
  try {
    callInfo = await assetApi.createTransferTransaction(
      destChain.chainId?.toString() || "",
      to,
      [sourceChain.symbol],
      [amount.toString()],
      {
        format: "submittable",
        xcmVersion: safeXcmVersion
      }
    )
    return callInfo
  } catch (e) {
    throw Error(e as string)
  }

  return callInfo
}
