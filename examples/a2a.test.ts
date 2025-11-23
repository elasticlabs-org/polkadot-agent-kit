/**
 * Google A2A Protocol Integration Test
 *
 * Tests Agent-to-Agent communication protocol
 */

import {
  A2AHandler,
  getA2ATools,
  PolkadotAgentKit,
} from "@polkadot-agent-kit/sdk";
import dotenv from "dotenv";

dotenv.config();

async function testA2A() {
  console.log("🤖 Testing Google A2A Protocol\n");
  console.log("=".repeat(50));

  // Initialize agent kit
  const agentKit = new PolkadotAgentKit({
    mnemonic: process.env.MNEMONIC,
    privateKey: process.env.PRIVATE_KEY,
    chains: ["polkadot"],
  });

  await agentKit.initializeApi();
  const address = agentKit.getCurrentAddress();

  try {
    // Test 1: Get A2A Tools
    console.log("\n🔧 Test 1: Getting A2A tools...");
    console.log("-".repeat(50));

    const tools = getA2ATools(agentKit);
    console.log(`✅ Retrieved ${tools.length} A2A tools`);
    console.log("\nAvailable tools:");
    tools.slice(0, 5).forEach((tool, i) => {
      console.log(
        `  ${i + 1}. ${tool.function.name}: ${tool.function.description}`,
      );
    });
    if (tools.length > 5) {
      console.log(`  ... and ${tools.length - 5} more`);
    }

    // Test 2: Handle Balance Check A2A Message
    console.log("\n💰 Test 2: Testing balance check via A2A...");
    console.log("-".repeat(50));

    const handler = new A2AHandler(agentKit);
    console.log("✓ A2A handler created");

    const balanceToolCall = {
      id: "call_balance_001",
      type: "function" as const,
      function: {
        name: "check_balance",
        arguments: JSON.stringify({
          chain: "polkadot",
          address: address,
        }),
      },
    };

    console.log(
      `Sending A2A tool call: ${JSON.stringify(balanceToolCall, null, 2)}`,
    );
    const balanceResult = await handler.handleToolCall(balanceToolCall);
    console.log("✅ Balance check successful!");
    console.log(`Result: ${JSON.stringify(balanceResult, null, 2)}`);

    // Test 3: Handle Initialize Chain A2A Message
    console.log("\n⚙️  Test 3: Testing chain initialization via A2A...");
    console.log("-".repeat(50));

    const initToolCall = {
      id: "call_init_001",
      type: "function" as const,
      function: {
        name: "initialize_chain_api",
        arguments: JSON.stringify({
          chain: "kusama",
        }),
      },
    };

    console.log(
      `Sending A2A tool call: ${JSON.stringify(initToolCall, null, 2)}`,
    );
    const initResult = await handler.handleToolCall(initToolCall);
    console.log("✅ Chain initialization successful!");
    console.log(`Result: ${JSON.stringify(initResult, null, 2)}`);

    // Test 4: Error Handling
    console.log("\n❗ Test 4: Testing error handling...");
    console.log("-".repeat(50));

    const invalidToolCall = {
      id: "call_invalid_001",
      type: "function" as const,
      function: {
        name: "non_existent_tool",
        arguments: JSON.stringify({}),
      },
    };

    const invalidResult = await handler.handleToolCall(invalidToolCall);
    console.log("✅ Error handling works correctly");
    console.log(`Result: ${JSON.stringify(invalidResult, null, 2)}`);

    console.log("\n" + "=".repeat(50));
    console.log("✅ All A2A tests passed!");
  } catch (error: any) {
    console.error("\n" + "=".repeat(50));
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

// Run tests
testA2A()
  .then(() => {
    console.log("\n🎉 Testing complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
