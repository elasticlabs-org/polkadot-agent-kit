# MCP Server Example with Polkadot Agent Kit

A Model Context Protocol (MCP) server that exposes Polkadot Agent Kit capabilities as tools for AI agents and LLM applications. This server enables natural language interaction with the Polkadot ecosystem through MCP-compatible clients like Claude Desktop, Cline, and other MCP tools.

## Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd polkadot-agent-kit/examples/mcp-server
```

### 2. Install dependencies

```bash
pnpm install --ignore-workspace
```

### 3. Build the project

```bash
pnpm run build
```


## Configuration

### Environment Variables

The MCP server requires the following environment variable:

- **`PRIVATE_KEY`** (required): Your Polkadot private key for signing transactions

### MCP Client Configuration

To use this server with Claude Desktop or other MCP clients, add it to your MCP configuration file.

#### Claude Desktop Configuration

Edit your Claude Desktop configuration file (typically located at `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "polkadot-agent-kit": {
      "command": "node",
      "args": [
        "/absolute/path/to/polkadot-agent-kit/examples/mcp-server/dist/index.js"
      ],
      "env": {
        "PRIVATE_KEY": "your_private_key_here"
      }
    }
  }
}
```

**Important:** 
- Replace `/absolute/path/to/` with the actual absolute path to your project
- Replace `your_private_key_here` with your actual private key
- Restart Claude Desktop after making changes

#### Example Configuration

```json
{
  "mcpServers": {
    "polkadot-agent-kit": {
      "command": "node",
      "args": [
        "/Users/username/polkadot-agent-kit/examples/mcp-server/dist/index.js"
      ],
      "env": {
        "PRIVATE_KEY": "0x1234567890abcdef..."
      }
    }
  }
}
```


## Usage

### Starting the Server

The MCP server communicates via stdio (standard input/output) and is designed to be launched by MCP clients. You typically don't start it manually, but for testing:

```bash
pnpm run start
```

Or in development mode:

```bash
pnpm run dev
```

### Using with MCP Clients

Once configured, tools will be available automatically in your MCP client. You can interact with them through natural language queries.



## Key Code Snippets

### Main Server Entry Point (`index.ts`)

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { PolkadotAgentKit, getMcpTools } from "@polkadot-agent-kit/sdk";

async function initializeServer() {
    // Create MCP server
    const server = new Server(
        {
            name: "polkadot-agent-kit",
            version: "1.0.0",
        },
        {
            capabilities: {
                tools: {},
            },
        }
    );

    // Initialize the agent kit
    const polkadotAgentKit = new PolkadotAgentKit({
        privateKey: process.env.PRIVATE_KEY!,
    });

    await polkadotAgentKit.initializeApi();

    // Get MCP tools
    const { tools, toolHandler } = await getMcpTools(polkadotAgentKit);

    // Handle tool listing
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return { tools };
    });

    // Handle tool calls
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        return await toolHandler(request.params.name, request.params.arguments);
    });

    return server;
}
```

## License

Apache-2.0

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.


## Related Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [Claude Desktop MCP Setup](https://modelcontextprotocol.io/docs/quickstart)


For more details, see the source code in the `examples/mcp-server` file.