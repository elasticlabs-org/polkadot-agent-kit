# Polkadot Eliza Agent Example

This example demonstrates how to integrate Polkadot Agent Kit with the [ai16z/eliza](https://github.com/ai16z/eliza) framework to create a conversational AI agent that can perform blockchain operations on Polkadot and its parachains.

## Features

- 🤖 Full Eliza framework integration
- 🔗 Support for multiple Polkadot chains
- 💬 Natural language blockchain interactions
- 🎭 Customizable character configuration
- 🔐 Secure key management

## Prerequisites

- Node.js 22 or higher
- pnpm (recommended) or npm
- A Polkadot account with some testnet tokens (for testing)
- OpenAI API key (or other LLM provider supported by Eliza)

## Installation

```bash
# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

## Configuration

### Environment Variables

Edit the `.env` file with your configuration:

```bash
# Required: Your account credentials (use one)
PRIVATE_KEY=0x1234...
# or
MNEMONIC=word1 word2 word3 ...

# Optional: Chains to support (default: polkadot,kusama,west)
CHAINS=polkadot,kusama,west,polkadot_asset_hub

# Required for full Eliza functionality
OPENAI_API_KEY=sk-...
```

### Character Configuration

The agent's personality and knowledge are defined in `character.json`. You can customize:

- **bio**: Agent's background and capabilities
- **knowledge**: Domain-specific knowledge about Polkadot
- **messageExamples**: Training examples for better responses
- **topics**: Topics the agent is knowledgeable about
- **style**: Communication style preferences

## Usage

### Run the Agent

```bash
# Start the agent
pnpm start

# Or run in development mode with auto-reload
pnpm dev
```

### Interact with the Agent

Once running, the agent can understand and respond to natural language requests like:

- "What's my DOT balance?"
- "Send 5 DOT to [address]"
- "Transfer 10 DOT from Polkadot to Asset Hub"
- "Stake 100 DOT in a nomination pool"
- "Check my staking rewards"
- "Register my identity on chain"

## Available Actions

The agent has access to all Polkadot Agent Kit actions:

### Balance & Transfers
- `check_balance` - Check token balances
- `transfer_native` - Transfer native tokens
- `xcm_transfer_native_asset` - Cross-chain transfers

### DeFi
- `swap_tokens` - Token swaps on Hydration DEX

### Staking
- `join_pool` - Join nomination pools
- `bond_extra` - Add more stake
- `unbond` - Unstake tokens
- `withdraw_unbonded` - Withdraw unbonded tokens
- `claim_rewards` - Claim staking rewards

### Identity & Other
- `register_identity` - Register on-chain identity
- `mint_vdot` - Mint liquid staking tokens
- `initialize_chain_api` - Dynamically add chain support

## Architecture

```
┌─────────────────────────────────────────────┐
│           Eliza Framework                   │
│  ┌─────────────────────────────────────┐   │
│  │     Character Configuration         │   │
│  │  (personality, knowledge, style)    │   │
│  └─────────────────────────────────────┘   │
│                    │                        │
│  ┌─────────────────────────────────────┐   │
│  │    Polkadot Plugin                  │   │
│  │  - Action handlers                  │   │
│  │  - Validators                       │   │
│  │  - Parameter extraction             │   │
│  └─────────────────────────────────────┘   │
│                    │                        │
└────────────────────┼────────────────────────┘
                     │
┌────────────────────┼────────────────────────┐
│  Polkadot Agent Kit│                        │
│  ┌─────────────────────────────────────┐   │
│  │   Action Layer                      │   │
│  │  (balance, transfer, staking, etc)  │   │
│  └─────────────────────────────────────┘   │
│                    │                        │
│  ┌─────────────────────────────────────┐   │
│  │   Core API Layer                    │   │
│  │  (chain APIs, transactions, etc)    │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

## Customization

### Enable Specific Actions Only

Edit `index.ts` to limit which actions are available:

```typescript
const polkadotPlugin = createPolkadotPlugin({
  agentKit,
  enabledActions: [
    'check_balance',
    'transfer_native',
    'xcm_transfer_native_asset'
  ]
});
```

### Customize Character Personality

Edit `character.json` to change the agent's personality, knowledge, and communication style.

### Add Custom Actions

You can extend the agent with custom actions:

```typescript
import { createAction } from "@polkadot-agent-kit/llm";

const customAction = createAction({
  name: "custom_operation",
  description: "Perform a custom blockchain operation",
  schema: z.object({
    param1: z.string(),
    param2: z.number()
  }),
  handler: async (params) => {
    // Your custom logic here
    return "Operation completed";
  }
});

agentKit.addCustomTools([customAction]);
```

## Integration with Eliza Runtime

For full Eliza integration, you'll need to:

1. Install the full Eliza framework
2. Initialize an AgentRuntime
3. Register the Polkadot plugin
4. Configure your chosen client (Discord, Twitter, etc.)

Example:

```typescript
import { AgentRuntime } from '@ai16z/eliza';
import { createPolkadotPlugin } from '@polkadot-agent-kit/eliza';

const runtime = new AgentRuntime({
  character,
  token: process.env.OPENAI_API_KEY,
  // ... other configuration
});

const polkadotPlugin = createPolkadotPlugin({ agentKit });
runtime.registerPlugin(polkadotPlugin);

await runtime.start();
```

## Troubleshooting

### "APIs not initialized"

Make sure `await agentKit.initializeApi()` is called before creating the plugin.

### "Private key or mnemonic required"

Set either `PRIVATE_KEY` or `MNEMONIC` in your `.env` file.

### "Chain not found"

Ensure the chain ID is in the supported list. Check `@polkadot-agent-kit/common` for available chains.

### Action not responding

Check that:
1. The action name is correct
2. Required parameters are provided
3. The agent has necessary permissions/balance

## Security Considerations

- 🔑 Never commit your private keys or mnemonics
- 🛡️ Use testnet tokens for development and testing
- 🔒 Consider using environment-specific accounts
- 📝 Implement transaction limits in production
- ✅ Always validate user inputs
- 🚨 Monitor for suspicious activity

## Learn More

- [Polkadot Agent Kit Documentation](../../README.md)
- [Eliza Framework](https://github.com/ai16z/eliza)
- [Polkadot Wiki](https://wiki.polkadot.network/)
- [Polkadot.js Documentation](https://polkadot.js.org/docs/)

## License

MIT

