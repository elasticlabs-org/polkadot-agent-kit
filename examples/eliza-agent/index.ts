/**
 * Eliza Agent with Polkadot Agent Kit Integration
 *
 * This example demonstrates how to create an Eliza agent that can perform
 * blockchain operations on Polkadot using the Polkadot Agent Kit.
 */

import { PolkadotAgentKit } from "@polkadot-agent-kit/sdk";
import { createPolkadotPlugin } from "@polkadot-agent-kit/eliza";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Main function to initialize and run the Eliza agent
 */
async function main() {
  try {
    console.log("🚀 Starting Polkadot Eliza Agent...");

    // 1. Validate required environment variables
    if (!process.env.PRIVATE_KEY && !process.env.MNEMONIC) {
      throw new Error(
        "Either PRIVATE_KEY or MNEMONIC must be set in the environment variables",
      );
    }

    // 2. Parse chains configuration
    const chains = process.env.CHAINS
      ? process.env.CHAINS.split(",").map((chain) => chain.trim())
      : ["polkadot", "kusama", "west"];

    console.log(`📡 Configuring support for chains: ${chains.join(", ")}`);

    // 3. Initialize Polkadot Agent Kit
    const agentKit = new PolkadotAgentKit({
      privateKey: process.env.PRIVATE_KEY,
      mnemonic: process.env.MNEMONIC,
      keyType: "Sr25519",
      chains: chains as any,
    });

    console.log("⚙️  Initializing blockchain APIs...");
    await agentKit.initializeApi();

    const address = agentKit.getCurrentAddress();
    console.log(`✅ Agent initialized with address: ${address}`);

    // 4. Load character configuration
    const characterPath = join(__dirname, "character.json");
    const character = JSON.parse(readFileSync(characterPath, "utf-8"));

    console.log(`🎭 Loaded character: ${character.name}`);

    // 5. Create Polkadot plugin for Eliza
    const polkadotPlugin = createPolkadotPlugin({
      agentKit,
      // Optional: specify which actions to enable
      // enabledActions: ['check_balance', 'transfer_native', 'xcm_transfer_native_asset']
    });

    console.log(
      `🔌 Polkadot plugin created with ${polkadotPlugin.actions?.length || 0} actions`,
    );

    // 6. Initialize Eliza runtime
    // Note: This is a simplified example. In a real implementation,
    // you would initialize the full Eliza runtime with your chosen
    // model provider, memory system, and other components.

    console.log("\n" + "=".repeat(60));
    console.log("✨ Polkadot Eliza Agent is ready!");
    console.log("=".repeat(60));
    console.log(`\nAgent Address: ${address}`);
    console.log(`Supported Chains: ${chains.join(", ")}`);
    console.log(`Available Actions: ${polkadotPlugin.actions?.length || 0}`);
    console.log("\nAvailable actions:");
    polkadotPlugin.actions?.forEach((action: any) => {
      console.log(`  - ${action.name}: ${action.description}`);
    });

    console.log("\n" + "=".repeat(60));
    console.log("To use this agent:");
    console.log("1. Integrate with Eliza runtime");
    console.log("2. Register the polkadotPlugin");
    console.log("3. Start interacting through your chosen client");
    console.log("=".repeat(60) + "\n");

    // Example: How to register with Eliza runtime (pseudocode)
    /*
    import { AgentRuntime } from '@ai16z/eliza';
    
    const runtime = new AgentRuntime({
      character,
      token: process.env.OPENAI_API_KEY,
      // ... other runtime configuration
    });

    runtime.registerPlugin(polkadotPlugin);
    
    // Start the agent
    await runtime.start();
    */

    // Keep the process alive
    console.log("Agent running... Press Ctrl+C to exit.\n");

    // Example of using actions directly
    console.log("Example: Testing balance check action...");
    const balanceAction = polkadotPlugin.actions?.find(
      (a: any) => a.name === "check_balance",
    );

    if (balanceAction) {
      // Simulate an Eliza message
      const testMessage = {
        user: "user123",
        content: {
          text: "Check my balance on Polkadot",
          chain: "polkadot",
        },
      };

      const mockCallback = async (response: any) => {
        console.log(`\n📬 Action Response:`);
        console.log(response.text);
      };

      try {
        await balanceAction.handler(
          {} as any,
          testMessage as any,
          {} as any,
          {},
          mockCallback,
        );
      } catch (error) {
        console.error("Error testing action:", error);
      }
    }

    // Cleanup handler
    process.on("SIGINT", async () => {
      console.log("\n\n🛑 Shutting down agent...");
      await agentKit.disconnect();
      console.log("✅ Agent disconnected successfully");
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Error initializing agent:", error);
    process.exit(1);
  }
}

// Run the main function
main();
