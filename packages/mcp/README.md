# Polkadot Agent Kit MCP

Model Context Protocol (MCP) package for the Polkadot Agent Kit, enabling AI assistants to interact with Polkadot blockchain operations through standardized MCP tools.

## Installation

```bash
npm install @polkadot-agent-kit/mcp
```

## MCP Server Integration

To integrate with an MCP server (like Claude Desktop or custom MCP clients):

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { PolkadotAgentKit } from "@polkadot-agent-kit/sdk";
import { getMcpTools } from "@polkadot-agent-kit/mcp";

async function runServer() {
  // Initialize the agent kit
  const agentKit = new PolkadotAgentKit({
    privateKey: process.env.PRIVATE_KEY!,
    chains: ["polkadot", "kusama", "westend"]
  });
  
  await agentKit.initializeApi();
  
  // Get MCP tools
  const { tools, toolHandler } = await getMcpTools(agentKit);

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

  // Handle tool listing
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    return await toolHandler(request.params.name, request.params.arguments);
  });

  // Start server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("Polkadot Agent Kit MCP server running on stdio");
}

runServer().catch(console.error);
```