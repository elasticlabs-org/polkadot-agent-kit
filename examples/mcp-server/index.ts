import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { PolkadotAgentKit, getMcpTools } from "@polkadot-agent-kit/sdk";


function validateEnvironment(): void {
    const requiredVars = ["PRIVATE_KEY"];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
    if (missingVars.length > 0) {
      const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}`;
      throw new Error(errorMessage);
    }
  }
  


async function initializeServer() {
    try {
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
            privateKey: process.env.PRIVATE_KEY,

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
    } catch (error) {
        console.error("Failed to initialize server:", error);
        throw error;
    }
}

/**
 * Main function to run the Polkadot MCP server
 */
async function main() {
    try {
        validateEnvironment();
        const server = await initializeServer();
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error("Polkadot Agent Kit MCP Server running on stdio");
    } catch (error) {
        console.error("Fatal error:", error);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error("Fatal error in main():", error);
        process.exit(1);
    });
}