# Polkadot Agent Kit Examples

This directory contains example scripts demonstrating the new features in Polkadot Agent Kit 2.0.

## Setup

1. **Install dependencies**:
```bash
cd examples
pnpm install
```

2. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your credentials
```

## Examples

### 1. Eliza Agent (`eliza-agent/`)
Full example of an agent using the Eliza framework with Polkadot integration.

```bash
cd eliza-agent
pnpm start
```

### 2. Firecrawl Integration (`firecrawl-test.ts`)
Test web scraping, crawling, and searching capabilities.

```bash
pnpm run test:firecrawl
```

**Features tested**:
- Scrape web pages for content
- Crawl websites recursively
- Search the web for information

### 3. Google A2A Protocol (`a2a-test.ts`)
Test Agent-to-Agent communication protocol.

```bash
pnpm run test:a2a
```

**Features tested**:
- Convert tools to A2A format
- Handle A2A messages
- Execute blockchain operations via A2A
- Error handling

### 4. Intent Schema Engine (`intent-schema-test.ts`)
Test dynamic response formatting and schema validation.

```bash
pnpm run test:intent
```

**Features tested**:
- Create intent schemas programmatically
- Register and retrieve schemas
- Format responses dynamically
- Validate inputs
- Custom output formats

## Running All Tests

```bash
pnpm run test:all
```

> **Note:** Test scripts automatically filter out Polkadot.js duplicate version warnings for cleaner output. These warnings are harmless and don't affect functionality.

## Requirements

- Node.js 20+
- Polkadot account (mnemonic or private key)
- Optional API keys for specific features:
  - Firecrawl API key for web scraping
  - Hyperbridge API for cross-chain verification
  - OpenAI/Google API keys for LLM features

## Documentation

For comprehensive testing guide, see [TESTING_V2.md](../TESTING_V2.md)

