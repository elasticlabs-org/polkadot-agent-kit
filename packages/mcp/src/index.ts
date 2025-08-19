import { PolkadotAgentKit } from "@polkadot-agent-kit/sdk";

import { PolkadotMCPServer } from "../src/server";
import { createDefaultConfig } from "../src/utils/config";

async function runServer() {
  try {
    const config = createDefaultConfig();

    const polkadotAgent = new PolkadotAgentKit({
      privateKey: config.privateKey,
      keyType: "Sr25519",
      chains: ["polkadot"],
    });

    const server = new PolkadotMCPServer(config, polkadotAgent);

    await server.start();
  } catch (error) {
    console.error("❌ Failed to start MCP server:", error);
    process.exit(1);
  }
}

runServer().catch(console.error);
