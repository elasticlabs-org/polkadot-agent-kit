# Polkadot Agent Kit SDK

A TypeScript SDK for building AI agents that interact with the Polkadot ecosystem.

## Installation

```sh
npm install @polkadot-agent-kit/sdk
```

## Features

- **Multi-chain Support**: Connect to multiple Polkadot ecosystem chains
- **Dynamic Chain Loading**: Dynamically initialize new chains at runtime
- **Native Asset Operations**: Check balances and transfer tokens  
- **Cross-chain Transfers**: XCM transfers between parachains
- **LangChain Integration**: Ready-to-use tools for AI agents

## Quick Start

### Basic Usage

```typescript
import { PolkadotAgentKit, getLangChainTools } from '@polkadot-agent-kit/sdk'
import { getLangChainTools } from '@polkadot-agent-kit/sdk'

// Initialize PolkadotAgentKit
const agent = new PolkadotAgentKit({privateKey:'your private key', keyType: 'Sr25519', chains: ['polkadot','west', 'west_asset_hub'] });
await agent.initializeApi()

// Get LangChain tools
const tools = getLangChainTools(agent)

// Create LangChain agent - OpenAI, Ollama, ...

```

## Supported Chains

- **Polkadot** (`polkadot`) - Polkadot relay chain
- **Westend** (`west`) - Westend testnet relay chain 
- **Kusama** (`kusama`) - Kusama relay chain 
- **Paseo** (`paseo`) - Paseo testnet relay chain 
- **Polkadot Asset Hub** (`polkadot_asset_hub`) - Polkadot Asset Hub parachain
- **Westend Asset Hub** (`west_asset_hub`) - Westend Asset Hub parachain
- **Kusama Asset Hub** (`kusama_asset_hub`) - Kusama Asset Hub parachain
- **Paseo Asset Hub** (`paseo_asset_hub`) - Paseo Asset Hub parachain
- **HydraDX** (`hydra`) - HydraDX parachain
- **More chains supported**

## API Reference

### Core Methods

- `initializeApi()` - Initialize APIs for configured chains
- `disconnect()` - Disconnect from all chains


### LangChain Tools

The `getLangChainTools()` function provides 11 ready-to-use LangChain tools for AI agents:

#### Balance & Transfer Tools
- **`check_balance`** - Check wallet balance on specific chains
  ```typescript
  // Example: "Check my balance on Polkadot"
  { chain: "polkadot" }
  ```

- **`transfer_native`** - Transfer native tokens to an address
  ```typescript
  // Example: "Transfer 5 DOT to Alice"
  { 
    amount: "5", 
    to: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY", 
    chain: "polkadot" 
  }
  ```

- **`xcm_transfer_native_asset`** - Cross-chain transfers via XCM
  ```typescript
  // Example: "Transfer 10 DOT from Polkadot to Asset Hub"
  { 
    amount: "10",
    to: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
    sourceChain: "Polkadot",
    destChain: "AssetHubPolkadot"
  }
  ```

#### DeFi Tools
- **`swap_tokens`** - Token swaps using Hydration DEX
  ```typescript
  // Cross-chain swap
  { 
    from: "polkadot",
    to: "hydra",
    currencyFrom: "DOT",
    currencyTo: "HDX",
    amount: "10000000000"
  }
  
  // DEX-specific swap
  { 
    currencyFrom: "HDX",
    currencyTo: "USDT",
    amount: "5000000000",
    dex: "HydrationDex"
  }
  ```

#### Staking Tools
- **`join_pool`** - Join a nomination pool for staking
  ```typescript
  // Example: "Join a nomination pool with 1.5 DOT"
  { amount: "1.5", chain: "polkadot" }
  ```

- **`bond_extra`** - Bond additional tokens to a nomination pool
  ```typescript
  // Bond from free balance
  { type: "FreeBalance", amount: "1.5", chain: "polkadot" }
  
  // Re-stake rewards
  { type: "Rewards", chain: "polkadot" }
  ```

- **`unbond`** - Unbond tokens from a nomination pool
  ```typescript
  // Example: "Unbond 1 DOT from my nomination pool"
  { amount: "1", chain: "polkadot" }
  ```

- **`withdraw_unbonded`** - Withdraw unbonded tokens from a nomination pool
  ```typescript
  // Example: "Withdraw my unbonded tokens"
  { slashingSpans: "0", chain: "polkadot" }
  ```

- **`claim_rewards`** - Claim rewards from a nomination pool
  ```typescript
  // Example: "Claim my staking rewards"
  { chain: "polkadot" }
  ```

#### Identity Tools
- **`register_identity`** - Register an identity on People Chain
  ```typescript
  // Example: "Register my identity with display name 'Alice'"
  { 
    display: "Alice",
    email: "alice@example.com",
    twitter: "@alice_crypto"
  }
  ```

#### System Tools
- **`initialize_chain_api`** - Dynamically initialize chain APIs
  ```typescript
  // Example: "Initialize Kusama chain API"
  { chainId: "kusama" }
  ```

## Configuration

```typescript
interface PolkadotAgentKitConfig {
  privateKey?: string
  chains?: KnownChainId[] // Optional: restrict to specific chains
}
```

