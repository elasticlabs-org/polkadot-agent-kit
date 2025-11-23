# @polkadot-agent-kit/eliza

Eliza framework integration for Polkadot Agent Kit. This package allows you to use Polkadot Agent Kit actions within the [ai16z/eliza](https://github.com/ai16z/eliza) framework.

## Installation

```bash
npm install @polkadot-agent-kit/eliza @polkadot-agent-kit/sdk
# or
pnpm add @polkadot-agent-kit/eliza @polkadot-agent-kit/sdk
```

## Quick Start

```typescript
import { PolkadotAgentKit } from "@polkadot-agent-kit/sdk";
import { createPolkadotPlugin } from "@polkadot-agent-kit/eliza";

// Initialize the agent kit
const agentKit = new PolkadotAgentKit({
  privateKey: process.env.PRIVATE_KEY,
  chains: ["polkadot", "kusama", "polkadot_asset_hub"]
});

await agentKit.initializeApi();

// Create the Eliza plugin
const polkadotPlugin = createPolkadotPlugin({
  agentKit
});

// Register with your Eliza runtime
runtime.registerPlugin(polkadotPlugin);
```

## Features

- **Seamless Integration**: Works out-of-the-box with Eliza agents
- **All Agent Kit Actions**: Access to balance checks, transfers, XCM, staking, and more
- **Natural Language**: Actions respond to natural language queries
- **Action Filtering**: Enable only specific actions if needed

## Available Actions

The plugin includes all Polkadot Agent Kit actions:

- `check_balance` - Check token balances
- `transfer_native` - Transfer native tokens
- `xcm_transfer_native_asset` - Cross-chain transfers via XCM
- `swap_tokens` - Token swaps on Hydration DEX
- `join_pool` - Join nomination pools for staking
- `bond_extra` - Bond additional tokens to pools
- `unbond` - Unbond tokens from pools
- `withdraw_unbonded` - Withdraw unbonded tokens
- `claim_rewards` - Claim staking rewards
- `register_identity` - Register on-chain identity
- `mint_vdot` - Mint liquid staking tokens on Bifrost

## Advanced Usage

### Enable Specific Actions

```typescript
const polkadotPlugin = createPolkadotPlugin({
  agentKit,
  enabledActions: ["check_balance", "transfer_native", "xcm_transfer_native_asset"]
});
```

### Custom Configuration

```typescript
const polkadotPlugin = createPolkadotPlugin({
  agentKit,
  customActionConfig: {
    // Custom configuration for specific actions
  }
});
```

### Using the Adapter Directly

```typescript
import { PolkadotElizaAdapter } from "@polkadot-agent-kit/eliza";

const adapter = new PolkadotElizaAdapter(agentKit);
const elizaActions = adapter.getElizaActions();

// Register actions individually
elizaActions.forEach(action => {
  runtime.registerAction(action);
});
```

## Character Configuration

Add Polkadot-specific knowledge to your Eliza character:

```json
{
  "name": "Polkadot Agent",
  "bio": [
    "I'm a helpful assistant that can perform blockchain operations on Polkadot.",
    "I can check balances, transfer tokens, and help with staking."
  ],
  "knowledge": [
    "Polkadot is a multi-chain blockchain platform",
    "XCM allows cross-chain transfers between parachains",
    "Nomination pools enable easy staking"
  ],
  "plugins": ["polkadot-agent-kit"]
}
```

## Examples

See the [examples/eliza-agent](../../examples/eliza-agent) directory for complete examples.

## API Reference

### `createPolkadotPlugin(config)`

Creates a Polkadot Agent Kit plugin for Eliza.

**Parameters:**
- `config.agentKit` - PolkadotAgentKit instance
- `config.enabledActions` - Optional array of action names to enable
- `config.customActionConfig` - Optional custom configuration

**Returns:** `ElizaPlugin`

### `polkadotPlugin(agentKit)`

Simplified plugin creation with just an agent kit instance.

**Parameters:**
- `agentKit` - PolkadotAgentKit instance

**Returns:** `ElizaPlugin`

### `PolkadotElizaAdapter`

Adapter class for converting Polkadot Agent Kit actions to Eliza actions.

**Methods:**
- `getElizaActions()` - Get all actions in Eliza format

## License

MIT

