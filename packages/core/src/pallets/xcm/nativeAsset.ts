import type {Api, KnownChainId } from "@polkadot-agent-kit/common"
import { getAllSupportedChains, getChainById } from "@polkadot-agent-kit/common"
import { AssetTransferApi, TxResult } from '@substrate/asset-transfer-api'
import { constructApiPromiseWithTimeout } from "../../utils";

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
    to: string, // destination address
    amount: bigint, // amount to transfer
    destinationChain: KnownChainId, // destination chain (RelayChain or Parachain)
): Promise<TxResult<'submittable'>> => {
    const sourceChain = getChainById(api.chainId, getAllSupportedChains())
    const destChain = getChainById(destinationChain, getAllSupportedChains())
    console.log("sourceChain", sourceChain);
    console.log("destChain", destChain);
    const { api: xcmApi, specName, safeXcmVersion } = await constructApiPromiseWithTimeout(sourceChain.wsUrls);
    
    const assetApi = new AssetTransferApi(xcmApi, specName, safeXcmVersion);
    console.log("to", to);
    console.log("amount", amount);
    console.log("symbol", sourceChain.symbol);
    console.log("chainId", destChain.chainId);
    let callInfo2: TxResult<'call'>;
    let callInfo: TxResult<'submittable'>;
    try {
        callInfo = await assetApi.createTransferTransaction(
            destChain.chainId?.toString() || "",
            to,
            [sourceChain.symbol],
            [amount.toString()],
            {
                format: 'submittable',
                xcmVersion: safeXcmVersion,
            },
        );
        console.log("callInfo", callInfo);
        callInfo2 = await assetApi.createTransferTransaction(
            destChain.chainId?.toString() || "",
            to,
            [sourceChain.symbol],
            [amount.toString()],
            {
                format: 'call',
                xcmVersion: safeXcmVersion,
            },
        );
        const decoded = assetApi.decodeExtrinsic(callInfo2.tx, 'call');
        console.log("decoded", decoded);
    } catch (e) {
        console.error(e);
        throw Error(e as string);
    }

    return callInfo;
}


