# Testing Polkadot Agent Kit 2.0 Features

This guide provides comprehensive instructions for testing all new features in Polkadot Agent Kit 2.0.

> **Note:** All test scripts automatically suppress Polkadot.js duplicate version warnings for cleaner output. These warnings are harmless and don't affect functionality.

## Prerequisites

1. **Environment Setup**:
```bash
# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Set up environment variables
cp .env.example .env
```

2. **Required Environment Variables**:
```bash
# Polkadot credentials (choose one)
PRIVATE_KEY=0x...
# OR
MNEMONIC="your twelve word mnemonic phrase here"

# API Keys for optional features
FIRECRAWL_API_KEY=your_firecrawl_api_key  # For web scraping features
HYPERBRIDGE_API_URL=https://api.hyperbridge.network  # For cross-chain verification
OPENAI_API_KEY=your_openai_key  # For LLM features
GOOGLE_API_KEY=your_google_key  # For Google GenAI

# Chain configuration
CHAINS=polkadot,kusama,westend
```

---

## 1. Testing Eliza Framework Integration

### A. Run the Eliza Example

```bash
cd examples/eliza-agent

# Set up environment
cp .env.example .env
# Edit .env with your credentials

# Run the agent
pnpm start
```

### B. Test Eliza Actions

The example demonstrates:
- ✅ Creating a Polkadot plugin for Eliza
- ✅ Converting Polkadot actions to Eliza-compatible format
- ✅ Running an agent with character configuration
- ✅ Executing blockchain operations through chat

**Expected Output**:
```
🚀 Starting Polkadot Eliza Agent...
📡 Configuring support for chains: polkadot, kusama, westend
⚙️  Initializing blockchain APIs...
✅ Agent initialized with address: 15oF4...
🔌 Polkadot plugin created with 15+ actions
```

### C. Integration Test

Create a test file:

```bash
# Create test file
touch packages/eliza/src/adapter.test.ts
```

---

## 2. Testing Firecrawl Integration

### A. Unit Tests

```bash
# Test Firecrawl tools
pnpm --filter @polkadot-agent-kit/llm test firecrawl
```

### B. Integration Test Example

```typescript
// examples/firecrawl-test.ts
import { PolkadotAgentKit } from "@polkadot-agent-kit/sdk";
import dotenv from "dotenv";

dotenv.config();

async function testFirecrawl() {
  const agentKit = new PolkadotAgentKit({
    mnemonic: process.env.MNEMONIC!,
    chains: ["polkadot"],
  });

  console.log("Testing Firecrawl Integration...\n");

  try {
    // Test 1: Scrape Web
    console.log("1. Testing scrapeWebTool...");
    const scrapeTool = agentKit.scrapeWebTool();
    const scrapeResult = await scrapeTool.invoke({
      url: "https://wiki.polkadot.network/",
      formats: ["markdown"],
      onlyMainContent: true,
    });
    console.log("✅ Scrape successful:", scrapeResult.substring(0, 100));

    // Test 2: Search Web
    console.log("\n2. Testing searchWebTool...");
    const searchTool = agentKit.searchWebTool();
    const searchResult = await searchTool.invoke({
      query: "Polkadot parachain",
      limit: 3,
    });
    console.log("✅ Search successful:", searchResult);

    // Test 3: Crawl Web
    console.log("\n3. Testing crawlWebTool...");
    const crawlTool = agentKit.crawlWebTool();
    const crawlResult = await crawlTool.invoke({
      url: "https://wiki.polkadot.network/",
      maxDepth: 1,
      limit: 5,
    });
    console.log("✅ Crawl successful, pages:", crawlResult.length);
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testFirecrawl();
```

**Run Test**:
```bash
# Ensure FIRECRAWL_API_KEY is set
export FIRECRAWL_API_KEY=your_key

# Run test
npx ts-node examples/firecrawl-test.ts
```

---

## 3. Testing Hyperbridge Cross-Chain Verification

### A. Unit Test

```typescript
// packages/core/src/hyperbridge/verify.test.ts
import { describe, it, expect } from "vitest";
import { verifyHyperbridgeMessage } from "./verify";

describe("Hyperbridge Verification", () => {
  it("should verify cross-chain message", async () => {
    const result = await verifyHyperbridgeMessage({
      sourceChain: "polkadot",
      destChain: "kusama",
      messageHash: "0x123...",
      blockNumber: 12345678,
    });

    expect(result.verified).toBeDefined();
  });
});
```

### B. Integration Test

```typescript
// examples/hyperbridge-test.ts
import { PolkadotAgentKit } from "@polkadot-agent-kit/sdk";
import dotenv from "dotenv";

dotenv.config();

async function testHyperbridge() {
  const agentKit = new PolkadotAgentKit({
    mnemonic: process.env.MNEMONIC!,
    chains: ["polkadot", "kusama"],
  });

  await agentKit.initializeApi();

  console.log("Testing Hyperbridge Verification...\n");

  try {
    // Test 1: XCM Transfer with Verification
    console.log("1. Testing XCM transfer with Hyperbridge verification...");
    const xcmTool = agentKit.xcmTransferNativeTool(agentKit.getSigner());
    
    const result = await xcmTool.invoke({
      sourceChain: "polkadot",
      destChain: "kusama",
      to: "DemoAddress...",
      amount: "0.1",
      verifyWithHyperbridge: true,
    });

    console.log("✅ XCM Transfer with verification:", result);
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testHyperbridge();
```

---

## 4. Testing Intent Schema Engine

### A. Programmatic API Test

```typescript
// examples/intent-schema-test.ts
import { IntentSchemaBuilder, IntentRegistry } from "@polkadot-agent-kit/llm";

async function testIntentSchema() {
  console.log("Testing Intent Schema Engine...\n");

  // Test 1: Create Intent Schema
  console.log("1. Creating intent schema...");
  const transferIntent = new IntentSchemaBuilder("transfer_intent")
    .setDescription("Transfer tokens intent")
    .addField("to", "string", "Recipient address", { required: true })
    .addField("amount", "number", "Amount to transfer", { required: true })
    .addField("token", "string", "Token symbol", { default: "DOT" })
    .build();

  console.log("✅ Schema created:", transferIntent);

  // Test 2: Register Intent
  console.log("\n2. Registering intent...");
  const registry = IntentRegistry.getInstance();
  registry.register(transferIntent);
  console.log("✅ Intent registered");

  // Test 3: Format Response
  console.log("\n3. Testing response formatter...");
  const formatter = registry.getFormatter("transfer_intent");
  const formattedResponse = formatter?.format({
    to: "15oF4...",
    amount: 10,
    token: "DOT",
  });

  console.log("✅ Formatted response:", formattedResponse);

  // Test 4: Validate Input
  console.log("\n4. Testing validation...");
  try {
    const validator = registry.getValidator("transfer_intent");
    const isValid = validator?.validate({
      to: "15oF4...",
      amount: 10,
    });
    console.log("✅ Validation result:", isValid);
  } catch (error) {
    console.log("❌ Validation failed:", error);
  }
}

testIntentSchema();
```

### B. UI Builder Test

```bash
# Start the playground app
cd apps/playground
pnpm dev

# Navigate to /intent-builder
# Test creating schemas through the UI
```

---

## 5. Testing Google A2A Protocol

### A. Integration Test

```typescript
// examples/a2a-test.ts
import { PolkadotAgentKit } from "@polkadot-agent-kit/sdk";
import { A2AHandler, getA2ATools } from "@polkadot-agent-kit/sdk";
import dotenv from "dotenv";

dotenv.config();

async function testA2A() {
  const agentKit = new PolkadotAgentKit({
    mnemonic: process.env.MNEMONIC!,
    chains: ["polkadot"],
  });

  await agentKit.initializeApi();

  console.log("Testing Google A2A Protocol...\n");

  // Test 1: Get A2A Tools
  console.log("1. Getting A2A tools...");
  const tools = getA2ATools(agentKit);
  console.log(`✅ Retrieved ${tools.length} A2A tools`);

  // Test 2: Handle A2A Message
  console.log("\n2. Testing A2A message handling...");
  const handler = new A2AHandler(agentKit);

  const message = {
    tool_code: "check_balance",
    tool_input: {
      chain: "polkadot",
      address: agentKit.getCurrentAddress(),
    },
  };

  const result = await handler.handleA2AMessage(message);
  console.log("✅ A2A message handled:", result);
}

testA2A();
```

---

## 6. Testing Vercel AI SDK Integration

### A. Integration Test

```typescript
// examples/vercel-ai-test.ts
import { PolkadotAgentKit } from "@polkadot-agent-kit/sdk";
import { getVercelAITools } from "@polkadot-agent-kit/sdk";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import dotenv from "dotenv";

dotenv.config();

async function testVercelAI() {
  const agentKit = new PolkadotAgentKit({
    mnemonic: process.env.MNEMONIC!,
    chains: ["polkadot"],
  });

  await agentKit.initializeApi();

  console.log("Testing Vercel AI SDK Integration...\n");

  // Get Vercel AI compatible tools
  const tools = getVercelAITools(agentKit);
  console.log(`✅ Retrieved ${Object.keys(tools).length} Vercel AI tools`);

  // Test with AI
  const result = await generateText({
    model: openai("gpt-4-turbo"),
    tools,
    prompt: `Check the balance of ${agentKit.getCurrentAddress()} on Polkadot`,
  });

  console.log("✅ AI Response:", result.text);
}

testVercelAI();
```

---

## 7. Running All Tests

### A. Unit Tests

```bash
# Test all packages
pnpm test

# Test specific package
pnpm --filter @polkadot-agent-kit/llm test
pnpm --filter @polkadot-agent-kit/core test
pnpm --filter @polkadot-agent-kit/eliza test
```

### B. Integration Tests

```bash
# Create integration test script
mkdir -p tests/integration

# Run integration tests
pnpm test:integration
```

### C. E2E Tests

```bash
# Test the complete workflow
cd examples/eliza-agent
pnpm start

# In another terminal, interact with the agent
# Test various commands like:
# - "Check my balance on Polkadot"
# - "Transfer 1 DOT to [address]"
# - "Search for Polkadot parachain information"
```

---

## 8. CI/CD Testing

Add to `.github/workflows/test.yml`:

```yaml
name: Test V2 Features

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm run build
      - run: pnpm test
      
      # Test Eliza integration
      - name: Test Eliza
        run: pnpm --filter @polkadot-agent-kit/eliza test
      
      # Test Firecrawl tools
      - name: Test Firecrawl
        run: pnpm --filter @polkadot-agent-kit/llm test
        env:
          FIRECRAWL_API_KEY: ${{ secrets.FIRECRAWL_API_KEY }}
      
      # Test type safety
      - name: TypeScript Check
        run: pnpm --filter @polkadot-agent-kit/* run compile
```

---

## 9. Manual Testing Checklist

### Eliza Framework
- [ ] Agent initializes with Polkadot plugin
- [ ] Actions are properly converted to Eliza format
- [ ] Character configuration loads correctly
- [ ] Agent responds to blockchain queries
- [ ] Transactions can be executed through chat

### Firecrawl Integration
- [ ] Web scraping returns markdown content
- [ ] Web crawling navigates multiple pages
- [ ] Web search returns relevant results
- [ ] Handles errors gracefully (invalid URLs, API limits)

### Hyperbridge Verification
- [ ] Verifies cross-chain messages
- [ ] Integrates with XCM transfers
- [ ] Returns verification status
- [ ] Handles failed verifications

### Intent Schema Engine
- [ ] Schemas can be created programmatically
- [ ] UI builder generates valid schemas
- [ ] Response formatting works correctly
- [ ] Validation catches invalid inputs

### Google A2A Protocol
- [ ] Tools convert to A2A format
- [ ] Messages are handled correctly
- [ ] Results are properly formatted
- [ ] Errors are handled gracefully

### Vercel AI SDK
- [ ] Tools convert to Vercel format
- [ ] Integrates with AI models
- [ ] Function calls execute correctly
- [ ] Responses are properly formatted

---

## 10. Performance Testing

```bash
# Benchmark tool execution times
pnpm run benchmark

# Load test with multiple concurrent requests
pnpm run load-test

# Memory profiling
node --inspect examples/eliza-agent/index.ts
```

---

## Troubleshooting

### Common Issues

1. **Module not found errors**: Run `pnpm run build` to build all packages
2. **API key errors**: Ensure all required API keys are set in `.env`
3. **Connection errors**: Check network connectivity and API endpoints
4. **Type errors**: Run `pnpm run compile` to check TypeScript issues

### Getting Help

- Check [MIGRATION_v2.md](./MIGRATION_v2.md) for migration guide
- Review example files in `examples/`
- Open an issue on GitHub for bugs

---

## Next Steps

After testing, consider:
1. Adding more integration tests
2. Creating additional examples
3. Writing end-to-end test scenarios
4. Contributing test coverage reports
5. Documenting edge cases and limitations

