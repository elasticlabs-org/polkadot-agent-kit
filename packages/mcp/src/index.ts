import { PolkadotAgentKit } from "@polkadot-agent-kit/sdk";
import { PolkadotMCPServer } from "../src/server";
import { createDefaultConfig } from "../src/utils/config";
import { sleep } from "./utils";

async function runServer() {
  try {
    console.log("🚀 Initializing Polkadot MCP Server...");
    
    const config = createDefaultConfig();
    console.log("📝 Configuration loaded");
    
    const polkadotAgent = new PolkadotAgentKit(config.privateKey, {
      keyType: "Sr25519",
      chains: ["polkadot"]
    });
    console.log("🔗 Polkadot Agent Kit created");

    const server = new PolkadotMCPServer(config, polkadotAgent);
    console.log("🖥️  MCP Server instance created");
    
    await server.start();
    
  } catch (error) {
    console.error("❌ Failed to start MCP server:", error);
    process.exit(1);
  }
}

runServer().catch(console.error);







