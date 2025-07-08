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
import { PolkadotAgentKit } from '@polkadot-agent-kit/sdk'

// Initialize agent with specific chains
const agent = new PolkadotAgentKit({
  chains: ['polkadot', 'west_asset_hub'], // Optional: restrict to specific chains
  seedPhrase: 'your twelve word seed phrase here'
})

// Initialize APIs for configured chains
await agent.initializeApi()

// Check balance
const balance = await agent.getNativeBalance('polkadot', address)

// Transfer tokens
const result = await agent.transferNative(
  'polkadot', 
  recipient, 
  amount, 
  signer
)
```

### Dynamic Chain Management

```typescript
// Check which chains are currently available
const initTool = agent.getChainStatusTool()
const status = await initTool.call({}) // Get all chains
console.log('Available chains:', status)

// Dynamically initialize a new chain
const initTool = agent.getInitializeChainApiTool()
const result = await initTool.call({
  chainId: 'hydra'
})

if (result.success) {
  console.log('Chain initialized successfully!')
  // Now you can use other tools with this chain
}
```

### LangChain Integration

```typescript
import { PolkadotAgentKit } from '@polkadot-agent-kit/sdk'

const agent = new PolkadotAgentKit({
  seedPhrase: 'your twelve word seed phrase here'
})

// Get LangChain tools for AI agents
const balanceTool = agent.getNativeBalanceTool(address)
const transferTool = agent.transferNativeTool(signer)
const xcmTool = agent.xcmTransferNativeTool(signer, sender)

// Dynamic chain tools
const initChainTool = agent.getInitializeChainApiTool()
const statusTool = agent.getChainStatusTool()

// Use with LangChain
const tools = [
  balanceTool,
  transferTool,
  xcmTool,
  initChainTool,
  statusTool
]
```

## Supported Chains

- **Polkadot** (`polkadot`) - Polkadot relay chain
- **Westend** (`west`) - Westend testnet relay chain  
- **Polkadot Asset Hub** (`polkadot_asset_hub`) - Polkadot Asset Hub parachain
- **Westend Asset Hub** (`west_asset_hub`) - Westend Asset Hub parachain
- **HydraDX** (`hydra`) - HydraDX parachain

## AI Agent Flow

The dynamic chain functionality enables a seamless experience:

1. **User Request**: "Check balance on Hydra"
2. **Tool Execution**: `check_balance` tool fails (chain not initialized)
3. **Automatic Recovery**: Agent calls `initialize_chain_api` tool
4. **Retry**: `check_balance` tool succeeds with initialized chain

## API Reference

### Core Methods

- `initializeApi()` - Initialize APIs for configured chains
- `disconnect()` - Disconnect from all chains
- `getNativeBalance(chain, address)` - Get native token balance
- `transferNative(chain, to, amount, signer)` - Transfer native tokens

### Dynamic Chain Methods

- `initializeChainApi(chainId)` - Initialize a specific chain API
- `isChainInitialized(chainId)` - Check if chain is initialized
- `getInitializedChains()` - Get list of initialized chains
- `removeChainApi(chainId)` - Remove chain API and free resources
- `getChainStatus(chainId?)` - Get chain status information

### LangChain Tools

- `getNativeBalanceTool(address)` - Balance checking tool
- `transferNativeTool(signer)` - Native transfer tool
- `xcmTransferNativeTool(signer, sender)` - XCM transfer tool
- `getInitializeChainApiTool()` - Chain initialization tool
- `getChainStatusTool()` - Chain status tool

## Configuration

```typescript
interface PolkadotAgentKitConfig {
  seedPhrase: string
  chains?: KnownChainId[] // Optional: restrict to specific chains
}
```

## Error Handling

All operations return structured results:

```typescript
interface ChainOperationResult {
  success: boolean
  chainId: string
  message: string
  error?: string
}
```

## Examples

See the `/examples` directory for complete examples including:
- Telegram bot integration
- Dynamic chain usage
- Cross-chain operations
