import type { Api, KnownChainId } from "@polkadot-agent-kit/common"
import { getAllSupportedChains, getChainById } from "@polkadot-agent-kit/common"
import type { TxResult } from "@substrate/asset-transfer-api"
import { AssetTransferApi } from "@substrate/asset-transfer-api"

import { constructApiPromiseWithTimeout } from "../../utils"
import { Builder, TDestination, TNodeDotKsmWithRelayChains, TPapiTransaction } from '@paraspell/sdk';
import { PolkadotSigner } from "polkadot-api"
import type { Tx } from "../../types"

// /**
//  * Transfers a native asset to a destination address on a destination chain via xcm
//  * @param api - The API instance to use for the query
//  * @param to - The destination address
//  * @param amount - The amount to transfer
//  * @param destinationChain - The destination chain (RelayChain or Parachain)
//  * @returns The transaction result
//  */
// export const xcmTransferNativeAsset = async (
//   api: Api<KnownChainId>,
//   to: string,
//   amount: bigint,
//   destinationChain: KnownChainId
// ): Promise<TxResult<"submittable">> => {
//   const sourceChain = getChainById(api.chainId, getAllSupportedChains())
//   const destChain = getChainById(destinationChain, getAllSupportedChains())
//   const {
//     api: xcmApi,
//     specName,
//     safeXcmVersion
//   } = await constructApiPromiseWithTimeout(sourceChain.wsUrls)

//   const assetApi = new AssetTransferApi(xcmApi, specName, safeXcmVersion)
//   let callInfo: TxResult<"submittable">
//   try {
//     callInfo = await assetApi.createTransferTransaction(
//       destChain.chainId?.toString() || "",
//       to,
//       [sourceChain.symbol],
//       [amount.toString()],
//       {
//         format: "submittable",
//         xcmVersion: safeXcmVersion
//       }
//     )
//     return callInfo
//   } catch (e) {
//     throw Error(e as string)
//   }
// }


export const xcmTransferNativeAsset = async (
  srcChain: KnownChainId,
  destChain: KnownChainId,
  from: string,
  to: string,
  amount: bigint,
): Promise<TPapiTransaction> => {
  const sourceChain = getChainById(srcChain, getAllSupportedChains())
  const destinationChain = getChainById(destChain, getAllSupportedChains())
  const url = sourceChain.wsUrls;
  // XCM transfer native tokken 
  const tx = await Builder(url)
    .from(sourceChain.name as TNodeDotKsmWithRelayChains)
    .senderAddress(from)
    .to(destinationChain.name as TDestination)
    .currency({ symbol: sourceChain.symbol, amount: amount })
    .address(to)
    .build();

  return tx;

}
