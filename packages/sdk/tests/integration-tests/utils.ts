

import {ASSETS_PROMPT, SWAP_PROMPT, NOMINATION_PROMPT, IDENTITY_PROMPT, BIFROST_PROMPT} from "@polkadot-agent-kit/llm"
export const RECIPIENT = '5D7jcv6aYbhbYGVY8k65oemM6FVNoyBfoVkuJ5cbFvbefftr';
// Test purpose only - DOnt use in production
export const AGENT_PRIVATE_KEY = '0xe5be9a5092b81bca64be81d212e7f2f9eba183bb7a90954f7b76361f6edb5c0a';

export const SYSTEM_PROMPT = ASSETS_PROMPT + SWAP_PROMPT + NOMINATION_PROMPT + IDENTITY_PROMPT + BIFROST_PROMPT;


export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}




