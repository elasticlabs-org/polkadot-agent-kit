import type { Api, ChainIdAssetHub, KnownChainId } from "@polkadot-agent-kit/common"
import { isApiReady } from "@polkadot-agent-kit/common"
import {ASSETS_PROMPT, XCM_PROMPT, SWAP_PROMPT, NOMINATION_PROMPT, IDENTITY_PROMPT, BIFROST_PROMPT} from "@polkadot-agent-kit/llm"
import { UnsafeTransactionType } from "@polkadot-agent-kit/common"


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

export async function getPendingRewards(api: Api<ChainIdAssetHub>, address: string): Promise<bigint> {
  const pendingRewards = await api.apis.NominationPoolsApi.pending_rewards(address) as bigint;

  return pendingRewards
}

export const getUnbondingByEra = async (api: Api<ChainIdAssetHub>, address: string, era: number): Promise<bigint> => {
  const poolMember = await api.query.NominationPools.PoolMembers.getValue(address);
  if (!poolMember) return 0n;
  
  const unbondingEras = poolMember.unbonding_eras;
  const unbondingEra = unbondingEras.find((eraEntry) => eraEntry[0] === era);
  
  if (!unbondingEra) return 0n;
  return unbondingEra[1];
}

export const getCurrentEra = async (api: Api<ChainIdAssetHub>) : Promise<number>  => {

  const currentEra = await api.query.Staking.CurrentEra.getValue();

  return currentEra + 28

}





