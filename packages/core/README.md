<div align="center">
  <h1 align="center">@polkadot-agent-kit/core</h1>
  <h4 align="center">Core functionality for Polkadot Agent Kit</h4>
  <p align="center">
    <a href="https://npmjs.com/package/@polkadot-agent-kit/core">
      <img alt="version" src="https://img.shields.io/npm/v/@polkadot-agent-kit/core?style=flat-square" />
    </a>
    <a href="https://npmjs.com/package/@polkadot-agent-kit/core">
      <img alt="downloads" src="https://img.shields.io/npm/dm/@polkadot-agent-kit/core?style=flat-square" />
    </a>
  </p>
</div>

## Overview

The `@polkadot-agent-kit/core` package provides core functionality for building AI agents that interact with the Polkadot ecosystem. It includes utilities for blockchain operations, DeFi interactions, staking, and cross-chain transfers.

## Features

- **Cross-Chain Transfers (XCM)** - Native asset transfers between parachains
- **DeFi Operations** - Token swaps and liquidity operations  
- **Staking & Nomination Pools** - Join pools, bond/unbond, claim rewards
- **Bifrost Integration** - Mint vDOT tokens and liquid staking
- **Utility Functions** - Address validation, balance checking, transaction handling

## Installation

```bash
pnpm add @polkadot-agent-kit/core
```

## Development

### Prerequisites
- Node.js >= 22
- pnpm (recommended)

### Setup & Run

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Run tests
pnpm test

```

### Available Scripts

- `pnpm build` - Build the package
- `pnpm test` - Run unit tests
- `pnpm lint` - Run ESLint
- `pnpm compile` - TypeScript compilation check
- `pnpm format:write` - Format code with Prettier

## License

Published under [MIT License](https://github.com/elasticlabs-org/polkadot-agent-kit/blob/main/LICENSE).

---

Made with 💛 by [Elastic Labs](https://elasticlabs.org/)