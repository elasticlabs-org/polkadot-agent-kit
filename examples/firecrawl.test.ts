/**
 * Firecrawl Integration Test
 *
 * Tests web scraping, crawling, and searching capabilities
 */

import { PolkadotAgentKit } from "@polkadot-agent-kit/sdk";
import dotenv from "dotenv";

dotenv.config();

async function testFirecrawl() {
  console.log("🔥 Testing Firecrawl Integration\n");
  console.log("=".repeat(50));

  // Initialize agent kit
  const agentKit = new PolkadotAgentKit({
    mnemonic: process.env.MNEMONIC,
    privateKey: process.env.PRIVATE_KEY,
    chains: ["polkadot"],
  });

  try {
    // Test 1: Scrape Web
    console.log("\n📄 Test 1: Scraping a web page...");
    console.log("-".repeat(50));

    const scrapeTool = agentKit.scrapeWebTool();
    console.log("✓ Scrape tool created");

    const scrapeResult = await scrapeTool.invoke({
      url: "https://wiki.polkadot.network/docs/learn-accounts",
      formats: ["markdown"],
      onlyMainContent: true,
    });

    console.log("✅ Scrape successful!");
    console.log(
      `Preview: ${JSON.stringify(scrapeResult).substring(0, 200)}...`,
    );

    // Test 2: Search Web
    console.log("\n🔍 Test 2: Searching the web...");
    console.log("-".repeat(50));

    const searchTool = agentKit.searchWebTool();
    console.log("✓ Search tool created");

    const searchResult = await searchTool.invoke({
      query: "Polkadot parachain auction",
      limit: 3,
    });

    console.log("✅ Search successful!");
    console.log(
      `Results: ${JSON.stringify(searchResult).substring(0, 200)}...`,
    );

    // Test 3: Crawl Web
    console.log("\n🕷️  Test 3: Crawling a website...");
    console.log("-".repeat(50));

    const crawlTool = agentKit.crawlWebTool();
    console.log("✓ Crawl tool created");

    const crawlResult = await crawlTool.invoke({
      url: "https://wiki.polkadot.network/",
      maxDepth: 1,
      limit: 3,
    });

    console.log("✅ Crawl successful!");
    console.log(
      `Pages crawled: ${JSON.stringify(crawlResult).length} characters`,
    );

    console.log("\n" + "=".repeat(50));
    console.log("✅ All Firecrawl tests passed!");
  } catch (error: any) {
    console.error("\n" + "=".repeat(50));
    console.error("❌ Test failed:", error.message);
    console.error("\nNote: Ensure FIRECRAWL_API_KEY is set in your .env file");
    process.exit(1);
  }
}

// Run tests
testFirecrawl()
  .then(() => {
    console.log("\n🎉 Testing complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
