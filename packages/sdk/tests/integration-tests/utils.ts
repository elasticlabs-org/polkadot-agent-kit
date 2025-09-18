import type { Api, KnownChainId } from "@polkadot-agent-kit/common"
import {ASSETS_PROMPT, SWAP_PROMPT, NOMINATION_PROMPT, IDENTITY_PROMPT, BIFROST_PROMPT} from "@polkadot-agent-kit/llm"

import { UnsafeTransactionType } from "@polkadot-agent-kit/common"
export const RECIPIENT= '5CcqKCNDxrYYkPNWys8yrjHJVTzd69i66VTgtewrSbJiVqoR';
export const RECIPIENT2 = '5D7jcv6aYbhbYGVY8k65oemM6FVNoyBfoVkuJ5cbFvbefftr';
export const RECIPIENT3 = '5FdxcDTshU5yhHrC91NneaJ64XCE2jwxnMCv8bfxQbwhkWMG';
export const RECIPIENT4 = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
export const SYSTEM_PROMPT = ASSETS_PROMPT + SWAP_PROMPT + NOMINATION_PROMPT + IDENTITY_PROMPT + BIFROST_PROMPT;

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
  return await api.query.System.Account.getValue(address);
}

