import type { Api, ChainIdAssetHub, KnownChainId } from "@polkadot-agent-kit/common"
import { isApiReady } from "@polkadot-agent-kit/common"
import {ASSETS_PROMPT, XCM_PROMPT, SWAP_PROMPT, NOMINATION_PROMPT, IDENTITY_PROMPT, BIFROST_PROMPT} from "@polkadot-agent-kit/llm"
import { UnsafeTransactionType } from "@polkadot-agent-kit/common"
import { createClient } from "polkadot-api";
import { getWsProvider } from "polkadot-api/ws-provider/node"
import { getOtherAssets } from "@paraspell/assets";
import { NODE_NAMES, TNodeWithRelayChains } from "@paraspell/sdk";

export const RECIPIENT0 = '5Fniv36Eu3bTWVRaR6N2Ve1qVouiTd15SJcZpxPyhkngRnqj';
export const RECIPIENT= '5CcqKCNDxrYYkPNWys8yrjHJVTzd69i66VTgtewrSbJiVqoR';
export const RECIPIENT2 = '5D7jcv6aYbhbYGVY8k65oemM6FVNoyBfoVkuJ5cbFvbefftr';
export const RECIPIENT3 = '5FdxcDTshU5yhHrC91NneaJ64XCE2jwxnMCv8bfxQbwhkWMG';
export const RECIPIENT4 = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
export const RECIPIENT5 = '5Ccmxb84eREZmtSkrLJSYp6QxJwNvmNbrfBm4p5B5VnKrB8z';
export const RECIPIENT6 = '5DNsfcAFhDMXesUwwXdBqfqPe9AHsZ5mWEnmoKq2sPMDg9re';
export const RECIPIENT7 = '5HWWpa7SnP81UdxKGD5neyqMbjRdi324txAFZ2z4LgcBpC21';
export const RECIPIENT8 = '5G8uJUCZMhihBdBMooxBE1pWhmvvyr2nWvaJNUKb6dNiuEjS';




const XCM_ONLY_CONTEXT = `
=== XCM TRANSFER SPECIALIST ===
You are a specialized agent for XCM cross-chain transfers ONLY.

**EXCLUSIVE CHAIN NAME RULES FOR XCM:**
- "West" → "Westend" 
- "Westend" → "Westend"
- "West Asset Hub" → "AssetHubWestend"
- "Westend Asset Hub" → "AssetHubWestend"
- "Asset Hub West" → "AssetHubWestend"

**TOOL**: xcm_transfer_native_asset
**FORMAT**: ParaSpell (PascalCase)
**TRIGGER**: "from X to Y" pattern

` + XCM_PROMPT;


const ASSETS_ONLY_CONTEXT = `
=== BALANCE & NATIVE TRANSFER SPECIALIST ===
You are a specialized agent for balance checks and native transfers ONLY.

**EXCLUSIVE CHAIN NAME RULES FOR ASSETS:**
- "West" → "west"
- "Westend" → "west" 
- "West Asset Hub" → "west_asset_hub"
- "Westend Asset Hub" → "west_asset_hub"

**TOOLS**: check_balance, transfer_native
**FORMAT**: Internal chain IDs (lowercase)
**TRIGGER**: Single chain operations

` + ASSETS_PROMPT;


export const XCM_SYSTEM_PROMPT = XCM_ONLY_CONTEXT;
export const ASSETS_SYSTEM_PROMPT = ASSETS_ONLY_CONTEXT;

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


export async function estimateTransactionFee(
  transaction: UnsafeTransactionType,
  fromAddress: string
): Promise<bigint> {
  return await transaction.getEstimatedFees(fromAddress);
}


export async function getBalance(
  api: Api<KnownChainId>,
  address: string
) {
  console.log("API get balance:", api);
  return await api.query.System.Account.getValue(address);
}

/**
 * Helper function to check if an API is ready before using it
 * @param api - The API instance to check
 * @param timeoutMs - Optional timeout in milliseconds (default: 60000)
 * @returns Promise that resolves to true if ready, false otherwise
 */
export async function checkApiReady(
  api: Api<KnownChainId | ChainIdAssetHub>,
  timeoutMs: number = 60000
): Promise<boolean> {
  const ready = await isApiReady(api, timeoutMs);
  if (ready) {
    console.log(`API for chain ${api.chainId} is ready!`);
  } else {
    console.log(`API for chain ${api.chainId} not ready or timeout`);
  }
  return ready;
}


export interface PoolMember {
  poolId: number
  points: bigint
  lastRecordedRewardCounter: bigint
  unbondingEras: Record<number, bigint>
}


export const getBondedAmountByMember = async (api: Api<ChainIdAssetHub>, address: string): Promise<bigint> => {
  const poolMember = await api.query.NominationPools.PoolMembers.getValue(address);
  if (poolMember) {
    return poolMember.points
  }
  else {
    return 0n
  }

}


// const ASSET_HUB = "wss://polkadot-asset-hub-rpc.polkadot.io";
// const client = createClient(getWsProvider(ASSET_HUB));
// const address = "1ssdhRq9sxzNSAQebDPq7AMsjRxjQ3t9CQhmjYcsD1YqCxx";
// // const api = client.getTypedApi(polkadot_asset_hub);


// console.log("API here:", client.getUnsafeApi());

// export async function getAssetBalance(api: Api<ChainIdAssetHub>, chain: string, assetSymbol:string ) {
//     const assets = getOtherAssets(chain as TNodeWithRelayChains);

//     const filteredAssets = assets.filter(asset => 
//         asset.symbol && asset.symbol === assetSymbol
//     );

//     console.log(`Assets with symbol "${assetSymbol}":`, filteredAssets);
//     console.log("Runtime token here 1:", client.getUnsafeApi().runtimeToken);
    
//     const assetAccount = await api.query.Assets.Account.getValue(filteredAssets[0].assetId, address);
//     console.log(`Balance of ${assetSymbol}:`, assetAccount.balance);

//     return assetAccount.balance;

// }





