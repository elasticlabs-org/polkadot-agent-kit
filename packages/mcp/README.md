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
| `POLKADOT_PRIVATE_KEY` | Alternative private key variable | - | No |
| `DEFAULT_ADDRESS` | Default account address | Derived from private key | No |
| `POLKADOT_DEFAULT_ADDRESS` | Alternative address variable | - | No |
| `LOG_LEVEL` | Logging level (debug, info, warn, error) | info | No |

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
        "DEFAULT_ADDRESS": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
        "LOG_LEVEL": "info"
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
        "DEFAULT_ADDRESS": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

### Custom Client Configuration

```typescript
import { Client } from "@modelcontextprotocol/sdk/client";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio";

const client = new Client({
  name: "polkadot-client",
  version: "1.0.0"
});

// Set environment variables before connecting
process.env.PRIVATE_KEY = "your-private-key-here";
process.env.DEFAULT_ADDRESS = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";

await client.connect(transport);

// Use the tools
const balance = await client.callTool({
  name: "check_balance",
  arguments: { chain: "polkadot" }
});
```

## Available Tools

### Balance Tools

- `check_balance` - Check native token balance on a Polkadot chain

### Transfer Tools

- `transfer_native` - Transfer native tokens to another account

## Security Considerations

1. **Private Key Management**: Never hardcode private keys in configuration files. Use environment variables or secure key management systems.

2. **Network Security**: Ensure your RPC endpoints are secure and from trusted sources.

3. **Read-Only Mode**: Consider using read-only mode for development and testing.

## Development

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Run tests
pnpm test

# Start the MCP server locally
pnpm dev
```

## License

MIT 