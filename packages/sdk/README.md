<div align="center">
  <h1 align="center">@polkadot-agent-kit/sdk</h1>
  <h4 align="center">A TypeScript SDK for building AI agents that interact with the Polkadot ecosystem.</h4>
  <p align="center">
    <a href="https://npmjs.com/package/@polkadot-agent-kit/sdk">
      <img alt="version" src="https://img.shields.io/npm/v/@polkadot-agent-kit/sdk?style=flat-square" />
    </a>
    <a href="https://npmjs.com/package/@polkadot-agent-kit/sdk">
      <img alt="downloads" src="https://img.shields.io/npm/dm/@polkadot-agent-kit/sdk?style=flat-square" />
    </a>
  </p>
</div>

## Installation

```sh
npm install @polkadot-agent-kit/sdk
```

## Features

- **Multi-chain Support**: Connect to multiple Polkadot ecosystem chains
- **Assets Operations**: Check balances and transfer tokens  
- **Cross-chain Transfers**: XCM transfers between parachains and relaychains 
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

### Relay Chains

| Chain Name | Chain ID | Network |
|------------|----------|---------|
| Polkadot | `polkadot` | Mainnet |
| Kusama | `kusama` | Mainnet |
| Westend | `west` | Testnet |
| Paseo | `paseo` | Testnet |

### Parachains

| Chain Name | Chain ID | Network |
|------------|----------|---------|
| Polkadot Asset Hub | `polkadot_asset_hub` | Mainnet |
| Kusama Asset Hub | `kusama_asset_hub` | Mainnet |
| HydraDX | `hydra` | Mainnet |
| Westend Asset Hub | `west_asset_hub` | Testnet |
| Paseo Asset Hub | `paseo_asset_hub` | Testnet |
| Bifrost | `bifrost_polkadot` | Mainnet |
> **Note:** More chains are supported. See the [chain configuration](packages/common/src/chains/supportedChains.ts) for the complete list.


### LangChain Tools

The `getLangChainTools()` function provides multiple ready-to-use LangChain tools for AI agents


## License

Published under [MIT License](https://github.com/elasticlabs-org/polkadot-agent-kit/blob/main/LICENSE).

---

Made with 💛 by [Elastic Labs](https://elasticlabs.org/)