import type { Api, KnownChainId } from "@polkadot-agent-kit/common"
import type { SS58String } from "polkadot-api"
import {ASSETS_PROMPT, SWAP_PROMPT, NOMINATION_PROMPT, IDENTITY_PROMPT, BIFROST_PROMPT, DYNAMIC_CHAIN_INITIALIZATION_PROMPT} from "@polkadot-agent-kit/llm"

import { UnsafeTransactionType } from "@polkadot-agent-kit/common"
export const RECIPIENT = '5D7jcv6aYbhbYGVY8k65oemM6FVNoyBfoVkuJ5cbFvbefftr';

export const SYSTEM_PROMPT = ASSETS_PROMPT + SWAP_PROMPT + NOMINATION_PROMPT + IDENTITY_PROMPT + BIFROST_PROMPT + DYNAMIC_CHAIN_INITIALIZATION_PROMPT;

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

