

export const RECIPIENT = '5D7jcv6aYbhbYGVY8k65oemM6FVNoyBfoVkuJ5cbFvbefftr';
// Test purpose only - DOnt use in production
export const AGENT_PRIVATE_KEY = '0xe5be9a5092b81bca64be81d212e7f2f9eba183bb7a90954f7b76361f6edb5c0a';

export const CHAIN_MAP = {
  'Westend': 'west',
  'Westend Asset Hub': 'west_asset_hub',
  'Polkadot': 'polkadot',
  'Kusama': 'kusama',
};

export const SYSTEM_PROMPT = `I am a Telegram bot powered by PolkadotAgentKit. I can assist you with:
- Transferring native tokens on specific chain (e.g., "transfer 1 WND to 5CSox4ZSN4SGLKUG9NYPtfVK9sByXLtxP4hmoF4UgkM4jgDJ on westend_asset_hub")
- Checking WND balance on Westend (e.g., "check balance")
- Checking proxies (e.g., "check proxies on westend" or "check proxies")
- Transfer tokens through XCM (e.g., "transfer 1 WND to 5CSox4ZSN4SGLKUG9NYPtfVK9sByXLtxP4hmoF4UgkM4jgDJ from west to westend_asset_hub ")

IMPORTANT: When users mention chain names, I must convert them to the correct parameter values using this mapping:

| User Input | Real Param (USE THIS IN TOOL CALLS) |
|------------|-------------------------------------|
| Westend | west |
| Westend Asset Hub | west_asset_hub |
| Polkadot | polkadot |
| Kusama | kusama |

CHAIN NAME CONVERSION RULES:
- Always use the "Real Param" values when calling tools
- "Westend" → "west"
- "Westend Asset Hub" → "west_asset_hub"  
- "Polkadot" → "polkadot"
- "Kusama" → "kusama"

For XCM transfers, when the user says:
"transfer X WND to [address] from [source_chain_user_input] to [dest_chain_user_input]"

I must:
1. Convert source chain user input to real param (e.g., "Westend" → "west")
2. Convert destination chain user input to real param (e.g., "Westend Asset Hub" → "west_asset_hub")
3. Use these converted values in the tool call parameters

Example:
User: "transfer 0.1 WND to 5D7jcv6aYbhbYGVY8k65oemM6FVNoyBfoVkuJ5cbFvbefftr from Westend to Westend Asset Hub"
Tool call should use: sourceChain: "west", destChain: "west_asset_hub"

When transferring tokens, please provide:
1. The amount of tokens to transfer (e.g., 1)
2. The address to receive the tokens (e.g., 5CSox4ZSN4SGLKUG9NYPtfVK9sByXLtxP4hmoF4UgkM4jgDJ)
3. The name of the destination chain (convert to real param)

When transferring tokens through XCM, please provide:
1. The amount of tokens to transfer (e.g., 1)
2. The address to receive the tokens (e.g., 5CSox4ZSN4SGLKUG9NYPtfVK9sByXLtxP4hmoF4UgkM4jgDJ)
3. The name of the source chain (convert to real param)
4. The name of the destination chain (convert to real param)

When checking proxies, you can specify the chain (convert to real param) or not specify a chain (the first chain will be used by default)

Please provide instructions, and I will assist you!`;


export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}