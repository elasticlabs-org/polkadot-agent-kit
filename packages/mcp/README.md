# Polkadot Agent Kit MCP Server

Model Context Protocol (MCP) server for the Polkadot Agent Kit, enabling AI assistants to interact with Polkadot blockchain operations.

## Installation

```bash
npm install @polkadot-agent-kit/mcp
```

## Configuration

The MCP server can be configured through environment variables or client configuration files.

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PRIVATE_KEY` | Private key for signing transactions | - | Yes |

### Claude Desktop Configuration

Create or update your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "polkadot-agent-kit": {
      "command": "npx",
      "args": ["@polkadot-agent-kit/mcp"],
      "env": {
        "PRIVATE_KEY": "your-private-key-here",
      }
    }
  }
}
```

### Cursor Configuration

Create or update your Cursor MCP configuration:

```json
{
  "mcpServers": {
    "polkadot-agent-kit": {
      "command": "npx",
      "args": ["@polkadot-agent-kit/mcp"],
      "env": {
        "PRIVATE_KEY": "your-private-key-here",
      }
    }
  }
}
```

### Custom Client Configuration

Here's how to connect to the MCP server from a custom JavaScript/TypeScript client:

```typescript
import { Client } from "@modelcontextprotocol/sdk/client";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio";

async function main() {
  // 1. Initialize the client
  const client = new Client({
    name: "polkadot-client",
    version: "1.0.0"
  });

  // 2. Configure the transport to connect to the MCP server
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["@polkadot-agent-kit/mcp"],
    env: {
      PRIVATE_KEY: "your-private-key-here"
    }
  });

  // 3. Connect to the server
  await client.connect(transport);
  console.log("✅ Connected to MCP server");

  // 4. Use the tools
  // Example 1: Check balance
  const balance = await client.callTool({
    name: "check_balance",
    arguments: { chain: "polkadot" }
  });
  console.log("Balance:", balance);

  // Example 2: Transfer 0.1 DOT on Polkadot
  const transferResult = await client.callTool({
    name: "transfer_native",
    arguments: {
      to: "15oF4uVJwmo4o4KoAc4v98tklqve5eMDU2rgh5M5G4Z2bftF", // Example address, replace with a valid one
      amount: "0.1",
      chain: "polkadot"
    }
  });
  console.log("Transfer Result:", transferResult);

  // 5. Disconnect from the server
  await client.close();
  console.log("Disconnected from MCP server");
}

main().catch(console.error);
```

## Available Tools

The MCP server exposes a rich set of tools for interacting with the Polkadot ecosystem.

### 💰 Balance

- **`check_balance`**: Checks the native token balance for the current account.
  - **Parameters**: `chain` (`polkadot`, `kusama`, `westend`)

### 💸 Transfer

- **`transfer_native`**: Transfers native tokens to another account.
  - **Parameters**: `to` (address), `amount`, `chain`

### 🔒 Staking (Nomination Pools)

- **`join_pool`**: Joins a nomination pool with a specified amount.
  - **Parameters**: `amount`, `chain`
- **`bond_extra`**: Bonds additional funds to a pool from the wallet balance or rewards.
  - **Parameters**: `type` (`FreeBalance` or `Rewards`), `amount` (optional), `chain`
- **`unbond`**: Unbonds tokens from a pool.
  - **Parameters**: `amount`, `chain`
- **`withdraw_unbonded`**: Withdraws unbonded tokens after the unbonding period.
  - **Parameters**: `slashingSpans`, `chain`
- **`claim_rewards`**: Claims pending staking rewards.
  - **Parameters**: `chain`

### 🌐 XCM (Cross-Chain)

- **`xcm_transfer`**: Transfers native assets between chains (e.g., Polkadot to AssetHub).
  - **Parameters**: `amount`, `to` (address), `sourceChain`, `destChain`

### 🔁 DeFi (Swap)

- **`swap_tokens`**: Swaps tokens on a DEX like Hydration.
  - **Parameters**: `currencyFrom`, `currencyTo`, `amount`, `from` (chain), `to` (chain), `receiver` (address), `dex`

## Development

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Start the MCP server with inspector for debugging
npx -y @modelcontextprotocol/inspector npx -y tsx src/index.ts
```

The inspector will provide a web interface where you can:
- View all available tools
- Test tool calls with different parameters
- See the request/response flow
- Debug any issues with the MCP server

This is especially useful during development to verify that all tools are properly registered and working correctly.

## License

MIT 