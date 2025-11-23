import {
  formatWithIntentSchema,
  getGlobalRegistry,
  getIntentSchema,
  IntentSchemaBuilder,
  previewFormat,
  registerIntentSchema,
} from "@polkadot-agent-kit/llm";

async function testIntentSchema() {
  console.log("🎯 Testing Intent Schema Engine\n");
  console.log("=".repeat(50));

  try {
    // Test 1: Create Transfer Intent Schema
    console.log("\n📝 Test 1: Creating transfer intent schema...");
    console.log("-".repeat(50));

    const transferIntentDef = new IntentSchemaBuilder()
      .setName("transfer_intent")
      .setDescription("Transfer tokens between accounts")
      .setLayout("list")
      .addField({
        name: "to",
        type: "string",
        description: "Recipient address",
        required: true,
      })
      .addField({
        name: "amount",
        type: "number",
        description: "Amount to transfer",
        required: true,
      })
      .addField({
        name: "token",
        type: "string",
        description: "Token symbol",
        default: "DOT",
      })
      .addField({
        name: "chain",
        type: "string",
        description: "Blockchain network",
        default: "polkadot",
      })
      .build();

    console.log("✅ Transfer intent schema created:");
    console.log(JSON.stringify(transferIntentDef, null, 2));

    // Test 2: Register Intent
    console.log("\n📋 Test 2: Registering intent...");
    console.log("-".repeat(50));

    registerIntentSchema(transferIntentDef);
    console.log("✅ Intent registered successfully");

    const registry = getGlobalRegistry();
    const allIntents = registry.list();
    console.log(`Total registered intents: ${allIntents.length}`);

    // Test 3: Create Staking Intent Schema
    console.log("\n🎲 Test 3: Creating staking intent schema...");
    console.log("-".repeat(50));

    const stakingIntentDef = new IntentSchemaBuilder()
      .setName("staking_intent")
      .setDescription("Stake tokens in a nomination pool")
      .setLayout("list")
      .addField({
        name: "poolId",
        type: "number",
        description: "Pool ID to join",
        required: true,
      })
      .addField({
        name: "amount",
        type: "number",
        description: "Amount to stake",
        required: true,
      })
      .addField({
        name: "chain",
        type: "string",
        description: "Blockchain network",
        default: "polkadot",
      })
      .build();

    registerIntentSchema(stakingIntentDef);
    console.log("✅ Staking intent schema created and registered");

    // Test 4: Format Response
    console.log("\n🎨 Test 4: Testing response formatter...");
    console.log("-".repeat(50));

    const transferSchema = getIntentSchema("transfer_intent");
    if (!transferSchema) {
      throw new Error("Transfer schema not found");
    }

    const responseData = {
      to: "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5",
      amount: 10.5,
      token: "DOT",
      chain: "polkadot",
    };

    const formattedResponse = formatWithIntentSchema(
      responseData,
      transferSchema,
      {
        includeMetadata: true,
      },
    );
    console.log("✅ Response formatted:");
    console.log(JSON.stringify(formattedResponse, null, 2));
    console.log("\n📄 Formatted content:");
    console.log(formattedResponse.content);

    // Test 5: Validate Input
    console.log("\n✓ Test 5: Testing input validation...");
    console.log("-".repeat(50));

    const validData = {
      to: "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5",
      amount: 5.0,
      token: "DOT",
      chain: "polkadot",
    };

    try {
      transferSchema.zodSchema.parse(validData);
      console.log("✅ Valid data passed validation");
    } catch (_error) {
      console.error("❌ Validation failed:", _error);
    }

    // Test invalid data
    const invalidData = {
      // missing required 'to' field
      amount: 5.0,
      token: "DOT",
    };

    try {
      transferSchema.zodSchema.parse(invalidData);
      console.log("❌ Should have failed validation");
    } catch {
      console.log("✅ Invalid data correctly rejected");
    }

    // Test 6: Preview Format
    console.log("\n🔍 Test 6: Testing format preview...");
    console.log("-".repeat(50));

    const previewData = {
      to: "12D3KooWEyoppNCUx8Yx66oV9fJnriXwCcXwDDUA2kj6vnc6iDEp",
      amount: 100,
      token: "KSM",
      chain: "kusama",
    };

    const preview = previewFormat(previewData, transferSchema);
    console.log("✅ Format preview:");
    console.log(preview);

    // Test 7: Registry Operations
    console.log("\n🗃️ Test 7: Testing registry operations...");
    console.log("-".repeat(50));

    console.log("Registered schemas:", registry.list());
    console.log("Registry size:", registry.list().length);
    console.log("Has 'transfer_intent':", registry.has("transfer_intent"));
    console.log("Has 'non_existent':", registry.has("non_existent"));

    // Test 8: Custom Layout
    console.log("\n🎨 Test 8: Testing custom layout...");
    console.log("-".repeat(50));

    const customLayoutDef = new IntentSchemaBuilder()
      .setName("balance_check")
      .setDescription("Check account balance")
      .setLayout("grid")
      .addField({
        name: "address",
        type: "string",
        description: "Account address",
        required: true,
      })
      .addField({
        name: "balance",
        type: "number",
        description: "Current balance",
      })
      .addField({
        name: "locked",
        type: "number",
        description: "Locked balance",
      })
      .addField({
        name: "reserved",
        type: "number",
        description: "Reserved balance",
      })
      .build();

    registerIntentSchema(customLayoutDef);

    const balanceSchema = getIntentSchema("balance_check");
    if (!balanceSchema) {
      throw new Error("Balance schema not found");
    }

    const balanceData = {
      address: "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5",
      balance: 1000.5,
      locked: 100.0,
      reserved: 50.0,
    };

    const balanceFormatted = formatWithIntentSchema(balanceData, balanceSchema);
    console.log("✅ Custom layout formatted:");
    console.log(balanceFormatted.content);

    console.log("\n" + "=".repeat(50));
    console.log("✅ All intent schema tests completed successfully!\n");
  } catch (_error) {
    const error = _error as Error;
    console.error("\n❌ Intent Schema Test Failed:");
    console.error(error.message ?? String(error));
    if (error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the test
void testIntentSchema();
