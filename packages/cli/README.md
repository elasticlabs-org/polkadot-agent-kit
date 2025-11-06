<div align="center">
  <h1 align="center">@polkadot-agent-kit/cli</h1>
  <h4 align="center">A powerful command-line interface for managing AI agents that interact with the Polkadot ecosystem.</h4>
  <p align="center">
    <a href="https://npmjs.com/package/@polkadot-agent-kit/cli">
      <img alt="version" src="https://img.shields.io/npm/v/@polkadot-agent-kit/cli?style=flat-square" />
    </a>
    <a href="https://npmjs.com/package/@polkadot-agent-kit/sdk">
      <img alt="downloads" src="https://img.shields.io/npm/dm/@polkadot-agent-kit/cli?style=flat-square" />
    </a>
  </p>
</div>



## Installation

### Global Installation

```bash
npm install -g @polkadot-agent-kit/cli
```

### Local Development

```bash
# Clone the repository
git clone https://github.com/elasticlabs-org/polkadot-agent-kit.git
cd polkadot-agent-kit

# Install dependencies
pnpm install

# Build the CLI
pnpm build

# Link for local development
cd packages/cli
npm link
```

## Quick Start

### 1. Create Your First Agent

```bash
pak agent create my-agent --interactive
```

### 2. Chat with Your Agent

```bash
pak agent chat my-agent
```


## Commands
### Configuration Management

#### `pak config`
Manage CLI configuration.

**Subcommands:**
- `get [key]` - Get configuration value
- `set <key> <value>` - Set configuration value
- `list` - List all configuration values
- `reset` - Reset configuration to defaults
- `validate` - Validate current configuration
- `edit` - Interactive configuration editor
- `export <file>` - Export configuration to file
- `import <file>` - Import configuration from file
- `paths` - Show configuration file paths

**Examples:**
```bash
pak config get llm.defaultProvider
pak config set llm.defaultProvider ollama
pak config list --format json
pak config edit --global
pak config validate
```

### Agent Management

#### `pak agent create <name>`
Create a new AI agent.

**Options:**
- `-p, --provider <provider>` - LLM provider (ollama, openai)
- `-m, --model <model>` - LLM model name
- `-t, --tools <tools>` - Comma-separated list of tools
- `-d, --description <description>` - Agent description
- `-i, --interactive` - Interactive setup

**Examples:**
```bash
pak agent create trading-bot --provider openai --model gpt-4
pak agent create staking-helper --tools balance,staking,xcm
pak agent create my-agent --interactive
```

#### `pak agent list`
List all AI agents.

**Options:**
- `-p, --provider <provider>` - Filter by provider
- `-f, --format <format>` - Output format (table, json)
- `--filter <filter>` - Filter agents by name pattern

**Examples:**
```bash
pak agent list
pak agent list --provider ollama
pak agent list --format json
pak agent list --filter trading
```

#### `pak agent chat <name>`
Start an interactive chat session with an agent.

**Options:**
- `--history` - Show chat history
- `--save` - Save chat history (default: true)
- `--timeout <timeout>` - Request timeout in seconds

**Examples:**
```bash
pak agent chat my-agent
pak agent chat trading-bot --history
```

#### `pak agent run <name> <command>`
Execute a command with an agent.

**Options:**
- `-f, --format <format>` - Output format (json, table, raw)
- `-t, --timeout <timeout>` - Request timeout in seconds
- `-v, --verbose` - Verbose output

**Examples:**
```bash
pak agent run my-agent "check my DOT balance"
pak agent run trading-bot "swap 10 DOT for USDC" --format json
pak agent run staking-helper "show my staking rewards" --verbose
```

#### `pak agent delete <name>`
Delete an AI agent.

**Options:**
- `-y, --yes` - Skip confirmation

**Examples:**
```bash
pak agent delete old-agent
pak agent delete temp-agent --yes
```

#### `pak agent model`
Manage agent model settings.

**Subcommands:**
- `set <name> <provider> [model]` - Set the model for an agent
- `get <name>` - Get the current model for an agent
- `list <provider>` - List available models for a provider

**Examples:**
```bash
pak agent model set my-agent ollama llama2
pak agent model get my-agent
pak agent model list openai
```

### Documentation

#### `pak docs`
Open Polkadot Agent Kit documentation.

**Options:**
- `-s, --section <section>` - Open specific documentation section

**Examples:**
```bash
pak docs
pak docs --section getting-started
pak docs --section api
```

## Configuration

The CLI uses a hierarchical configuration system:

1. **Global Configuration** (`~/.pak/config.json`)
2. **Project Configuration** (`./pak.config.json`)

### Configuration Structure

```json
{
  "version": "1.0.0",
  "llm": {
    "defaultProvider": "ollama",
    "ollama": {
      "baseUrl": "http://localhost:11434",
      "defaultModel": "llama2",
      "timeout": 30000
    },
    "openai": {
      "defaultModel": "gpt-3.5-turbo",
      "timeout": 30000
    }
  },
  "agents": {
    "defaultTools": ["balance", "transfer", "xcm"],
    "storageLocation": "~/.pak/agents",
    "maxHistory": 100
  },
  "ui": {
    "colorOutput": true,
    "verboseLogging": false,
    "progressIndicators": true,
    "theme": "auto"
  },
  "polkadot": {
    "defaultChain": "polkadot",
    "rpcEndpoints": {
      "polkadot": "wss://rpc.polkadot.io",
      "kusama": "wss://kusama-rpc.polkadot.io"
    }
  }
}
```

## Available Tools

Agents can be equipped with various tools:

- **balance** - Check token balances on various chains
- **transfer** - Transfer tokens between accounts
- **xcm** - Cross-chain transfers using XCM
- **staking** - Staking operations (nominate, bond, unbond)
- **swap** - Token swapping via DEX protocols

## LLM Providers

### Ollama (Local)

1. Install Ollama: https://ollama.ai/
2. Pull a model: `ollama pull qwen3:latest`
3. Configure the CLI:
   ```bash
   pak config set llm.defaultProvider ollama
   pak config set llm.ollama.baseUrl http://localhost:11434
   ```

### OpenAI (Cloud)

1. Get an API key from OpenAI
2. Configure the CLI:
   ```bash
   pak config set llm.defaultProvider openai
   pak config set llm.openai.apiKey your-api-key
   ```

## Examples

### Trading Bot Example

```bash
# Create a trading-focused agent
pak agent create trading-bot \
  --provider openai \
  --model gpt-4 \
  --tools balance,transfer,swap,xcm \
  --description "AI trading assistant for DeFi operations"

# Chat with the trading bot
pak agent chat trading-bot

# Execute trading commands
pak agent run trading-bot "What's my DOT balance?"
pak agent run trading-bot "Swap 10 DOT for USDC on HydraDX"
```

## Troubleshooting

### Common Issues

1. **Command not found: pak**
   ```bash
   # Make sure the CLI is installed globally
   npm install -g @polkadot-agent-kit/cli
   
   # Or use npx
   npx @polkadot-agent-kit/cli --help
   ```

2. **Ollama connection failed**
   ```bash
   # Check if Ollama is running
   curl http://localhost:11434/api/tags
   
   # Update the base URL if needed
   pak config set llm.ollama.baseUrl http://localhost:11434
   ```

3. **OpenAI API errors**
   ```bash
   # Verify your API key
   pak config get llm.openai.apiKey
   
   # Set a new API key
   pak config set llm.openai.apiKey your-new-api-key
   ```

4. **Agent not found**
   ```bash
   # List all agents
   pak agent list
   
   # Check agents storage location
   pak config get agents.storageLocation
   ```

### Debug Mode

Enable verbose logging for debugging:

```bash
pak --verbose agent chat my-agent
pak config set ui.verboseLogging true
```

## Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/elasticlabs-org/polkadot-agent-kit.git
cd polkadot-agent-kit

# Install dependencies
pnpm install

# Build the CLI package
pnpm build --filter @polkadot-agent-kit/cli

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see [LICENSE](../../LICENSE) for details.

## Support

- [GitHub Issues](https://github.com/elasticlabs-org/polkadot-agent-kit/issues)
- [Documentation](https://github.com/elasticlabs-org/polkadot-agent-kit)
- [Discord Community](https://discord.gg/polkadot)
