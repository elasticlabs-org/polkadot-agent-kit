import { Command } from 'commander';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { logger } from '../utils/logger';
import { InitOptions, CLIError } from '../types/commands';

export const initCommand = new Command('init')
  .description('Initialize a new Polkadot Agent Kit project')
  .argument('[name]', 'Project name')
  .option('-t, --template <template>', 'Project template', 'default')
  .option('-p, --provider <provider>', 'LLM provider (ollama|openai)', 'ollama')
  .option('-i, --interactive', 'Interactive setup', false)
  .action(async (name: string | undefined, options: InitOptions) => {
    try {
      await initializeProject(name, options);
    } catch (error) {
      if (error instanceof Error) {
        throw new CLIError(`Failed to initialize project: ${error.message}`);
      }
      throw error;
    }
  });

async function initializeProject(projectName: string | undefined, options: InitOptions): Promise<void> {
  logger.info(chalk.blue('🚀 Initializing Polkadot Agent Kit project...'));

  // Get project configuration
  const config = await getProjectConfig(projectName, options);
  
  // Create project directory
  const projectPath = path.resolve(config.name);
  await createProjectStructure(projectPath, config);
  
  // Initialize configuration
  await initializeConfiguration(projectPath, config);
  
  // Create sample files
  await createSampleFiles(projectPath, config);
  
  logger.success(chalk.green('✅ Project initialized successfully!'));
  logger.info(chalk.cyan(`\nNext steps:`));
  logger.info(chalk.white(`  cd ${config.name}`));
  logger.info(chalk.white(`  pak agent create my-agent`));
  logger.info(chalk.white(`  pak agent chat my-agent`));
}

async function getProjectConfig(projectName: string | undefined, options: InitOptions) {
  if (options.interactive || !projectName) {
    return await interactiveSetup(projectName, options);
  }
  
  return {
    name: projectName,
    template: options.template || 'default',
    llmProvider: options.llmProvider || 'ollama',
  };
}

async function interactiveSetup(projectName: string | undefined, options: InitOptions) {
  const questions = [];

  if (!projectName) {
    questions.push({
      type: 'input',
      name: 'name',
      message: 'Project name:',
      default: 'my-polkadot-agent',
      validate: (input: string) => {
        if (!input.trim()) return 'Project name is required';
        if (!/^[a-zA-Z0-9-_]+$/.test(input)) return 'Project name can only contain letters, numbers, hyphens, and underscores';
        return true;
      }
    });
  }

  questions.push(
    {
      type: 'list',
      name: 'template',
      message: 'Choose a project template:',
      choices: [
        { name: 'Default - Basic agent setup', value: 'default' },
        { name: 'Trading - DeFi and trading focused', value: 'trading' },
        { name: 'Staking - Staking and governance focused', value: 'staking' },
      ],
      default: options.template || 'default'
    },
    {
      type: 'list',
      name: 'llmProvider',
      message: 'Choose your LLM provider:',
      choices: [
        { name: 'Ollama (Local)', value: 'ollama' },
        { name: 'OpenAI (Cloud)', value: 'openai' },
      ],
      default: options.llmProvider || 'ollama'
    }
  );

  const answers = await inquirer.prompt(questions);
  
  return {
    name: projectName || answers.name,
    template: answers.template,
    llmProvider: answers.llmProvider,
  };
}

async function createProjectStructure(projectPath: string, config: any): Promise<void> {
  logger.info(`Creating project structure at ${projectPath}...`);
  
  if (await fs.pathExists(projectPath)) {
    const isEmpty = (await fs.readdir(projectPath)).length === 0;
    if (!isEmpty) {
      throw new Error(`Directory ${projectPath} already exists and is not empty`);
    }
  }

  await fs.ensureDir(projectPath);
  await fs.ensureDir(path.join(projectPath, 'agents'));
  await fs.ensureDir(path.join(projectPath, 'scripts'));
  await fs.ensureDir(path.join(projectPath, 'logs'));
}

async function initializeConfiguration(projectPath: string, config: any): Promise<void> {
  logger.info('Setting up project configuration...');
  
  const projectConfig = {
    version: '1.0.0',
    llm: {
      defaultProvider: config.llmProvider,
      ...(config.llmProvider === 'ollama' && {
        ollama: {
          baseUrl: 'http://localhost:11434',
          defaultModel: 'llama2',
          timeout: 30000,
          models: []
        }
      }),
      ...(config.llmProvider === 'openai' && {
        openai: {
          defaultModel: 'gpt-3.5-turbo',
          timeout: 30000,
          models: []
        }
      })
    },
    agents: {
      defaultTools: ['balance', 'transfer', 'xcm'],
      storageLocation: './agents',
      maxHistory: 100,
      templates: []
    },
    ui: {
      colorOutput: true,
      verboseLogging: false,
      progressIndicators: true,
      autoComplete: true,
      theme: 'auto'
    },
    polkadot: {
      defaultChain: 'polkadot',
      rpcEndpoints: {
        polkadot: 'wss://rpc.polkadot.io',
        kusama: 'wss://kusama-rpc.polkadot.io',
        westend: 'wss://westend-rpc.polkadot.io'
      }
    }
  };

  const configPath = path.join(projectPath, 'pak.config.json');
  await fs.writeJson(configPath, projectConfig, { spaces: 2 });
}

async function createSampleFiles(projectPath: string, config: any): Promise<void> {
  logger.info('Creating sample files...');
  
  // Create README
  const readmeContent = generateReadme(config);
  await fs.writeFile(path.join(projectPath, 'README.md'), readmeContent);
  
  // Create .env.example
  const envContent = generateEnvExample(config);
  await fs.writeFile(path.join(projectPath, '.env.example'), envContent);
  
  // Create .gitignore
  const gitignoreContent = generateGitignore();
  await fs.writeFile(path.join(projectPath, '.gitignore'), gitignoreContent);
  
  // Create sample script
  const scriptContent = generateSampleScript(config);
  await fs.writeFile(path.join(projectPath, 'scripts', 'example.js'), scriptContent);
}

function generateReadme(config: any): string {
  return `# ${config.name}

A Polkadot Agent Kit project for AI-powered blockchain interactions.

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Configure your environment:
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your configuration
   \`\`\`

3. Create your first agent:
   \`\`\`bash
   pak agent create my-agent --provider ${config.llmProvider}
   \`\`\`

4. Start chatting with your agent:
   \`\`\`bash
   pak agent chat my-agent
   \`\`\`

## Available Commands

- \`pak agent create <name>\` - Create a new agent
- \`pak agent list\` - List all agents
- \`pak agent chat <name>\` - Chat with an agent
- \`pak agent run <name> <command>\` - Execute a command with an agent
- \`pak config\` - Manage configuration
- \`pak docs\` - Open documentation

## Configuration

The project configuration is stored in \`pak.config.json\`. You can modify:

- LLM provider settings
- Agent default tools
- Polkadot network endpoints
- UI preferences

## Learn More

- [Polkadot Agent Kit Documentation](https://github.com/elasticlabs-org/polkadot-agent-kit)
- [Polkadot Documentation](https://docs.polkadot.network/)
`;
}

function generateEnvExample(config: any): string {
  let content = `# Polkadot Agent Kit Configuration

# Polkadot Network
POLKADOT_RPC_URL=wss://rpc.polkadot.io
KUSAMA_RPC_URL=wss://kusama-rpc.polkadot.io
WESTEND_RPC_URL=wss://westend-rpc.polkadot.io

# Wallet Configuration (optional)
# MNEMONIC=your twelve word mnemonic phrase here
# PRIVATE_KEY=your_private_key_here

`;

  if (config.llmProvider === 'openai') {
    content += `# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_BASE_URL=https://api.openai.com/v1

`;
  }

  if (config.llmProvider === 'ollama') {
    content += `# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2

`;
  }

  return content;
}

function generateGitignore(): string {
  return `# Dependencies
node_modules/
.pnpm-debug.log*

# Environment variables
.env
.env.local
.env.production

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Agent data
agents/*.json
agents/history/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Build outputs
dist/
build/
`;
}

function generateSampleScript(config: any): string {
  return `// Sample script for ${config.name}
// This demonstrates basic usage of the Polkadot Agent Kit

import { PolkadotAgentKit } from '@polkadot-agent-kit/sdk';

async function main() {
  // Initialize the agent kit
  const agentKit = new PolkadotAgentKit({
    chain: 'polkadot',
    // Add your configuration here
  });

  // Example: Get balance
  try {
    const balance = await agentKit.getBalance('your-address-here');
    console.log('Balance:', balance);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main().catch(console.error);
`;
}
