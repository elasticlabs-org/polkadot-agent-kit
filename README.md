# Polkadot AI Agent Kit 

![Group 57](https://github.com/user-attachments/assets/ddc9ebc7-0bc6-4bac-af3e-82f378c959f5)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
![Status: In Development](https://img.shields.io/badge/Status-In%20Development-yellow)
[![NPM Package](https://img.shields.io/npm/v/@polkadot-agent-kit/sdk)](https://www.npmjs.com/package/@polkadot-agent-kit/sdk)
<br/>
<br/>

Polkadot AI Agent Kit is an open-source library for building autonomous AI agents capable of executing complex operations within the Polkadot ecosystem. It provides a modular framework and high-level APIs to abstract the complexity of on-chain interactions.

## 📦 Monorepo Structure

This project is organized as a monorepo with the following packages:

| Package | Description | Key Features |
|---------|-------------|--------------|
| **[`packages/common/`](packages/common/)** | **Shared utilities and type definitions** | • Chain configurations and supported networks<br/>• TypeScript interfaces and type definitions<br/>• Utility functions for chain validation and filtering<br/>• Common constants and enums used across packages |
| **[`packages/core/`](packages/core/)** | **Core Polkadot API functionality** | • PolkadotApi implementation with multi-chain support<br/>• Balance checking and native token transfers<br/>• Cross-chain (XCM) transaction handling<br/>• Dynamic chain initialization and management<br/>• Transaction utilities and signing logic |
| **[`packages/llm/`](packages/llm/)** | **LangChain integration for AI agents** | • LangChain-compatible tools for blockchain operations<br/>• AI agent interfaces and abstractions<br/>• Tool definitions for balance checking, transfers, and XCM<br/>• Dynamic chain initialization tools for AI agents |
| **[`packages/sdk/`](packages/sdk/)** | **Main SDK interface** | • PolkadotAgentKit - the primary class for developers<br/>• High-level API that combines core and LLM functionality<br/>• Comprehensive examples and documentation<br/>• Integration tests and usage patterns |


## 🔗 Examples

Explore real-world implementations:

- **[Telegram Bot Example](examples/telegram-bot/)**
- **[Polkadot Agent Kit MCP Server Example](examples/mcp-server/)**


## Application 

- **[Polkadot Agent Kit Developer Portal ](apps/playground)**


## 🚀 How to Run the Monorepo

### Prerequisites
- Node.js 22+
- pnpm (recommended package manager)

### Setup and Development Commands

```bash
# 1. Clone the repository
git clone https://github.com/elasticlabs-org/polkadot-agent-kit
cd polkadot-agent-kit

# 2. Install all dependencies
pnpm install

# 3. Build all packages
pnpm run build

# 4. Run unit tests across all packages
pnpm run test

# 5. Run end-to-end tests
pnpm run test:e2e

# 6. Run integration tests for testnet agent (requires Ollama)
pnpm run test:integration:testnet

# 7. Run integration tests for mainnet agent (requires Ollama)
pnpm run test:integration:mainnet

```

## 🤝 Contributing

We welcome contributions from the community! Please:
1. Fork the repository.
2. Create a new branch for your feature/bug fix.
3. Submit a Pull Request with a detailed description of your changes.

---

### Acknowledgment

[Dedot](https://dedot.dev) take a lot of inspirations from project [@polkadot/api](https://github.com/polkadot-js/api). A big thank to all the maintainers/contributors of this awesome library.

Proudly supported by Web3 Foundation Grants Program.
<p align="left">
  <img width="250" src="https://user-images.githubusercontent.com/6867026/227230786-0796214a-3e3f-42af-94e9-d4122c730b62.png">
</p>

---

## 📜 License

This project is licensed under the **[MIT License](LICENSE)**.
