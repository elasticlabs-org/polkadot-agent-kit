import { Command } from 'commander';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { configManager } from '../../core/config/manager';
import { logger } from '../../utils/logger';
import { AgentCreateOptions, CLIError } from '../../types/commands';
import {
  AVAILABLE_TOOLS,
  TOOL_DESCRIPTIONS,
  DEFAULT_SYSTEM_PROMPT,
  AgentMetadata,
  PolkadotAgentConfig
} from '../../types/agent.js';
import { getAllSupportedChains } from '@polkadot-agent-kit/common';

export const createCommand = new Command('create')
  .description('Create a new AI agent')
  .argument('<name>', 'Agent name')
  .option('-p, --provider <provider>', 'LLM provider (ollama|openai)')
  .option('-m, --model <model>', 'LLM model name')
  .option('-t, --tools <tools>', 'Comma-separated list of tools')
  .option('-d, --description <description>', 'Agent description')
  .option('-i, --interactive', 'Interactive setup', false)
  .action(async (name: string, options: AgentCreateOptions) => {
    try {
      await createAgent(name, options);
    } catch (error) {
      throw new CLIError(`Failed to create agent: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

async function createAgent(name: string, options: AgentCreateOptions): Promise<void> {
  logger.info(chalk.blue(`🤖 Creating agent "${name}"...`));

  // Validate agent name
  if (!isValidAgentName(name)) {
    throw new Error('Agent name must contain only letters, numbers, hyphens, and underscores');
  }

  // Check if agent already exists
  const agentsPath = getAgentsPath();
  const agentFile = path.join(agentsPath, `${name}.json`);
  
  if (await fs.pathExists(agentFile)) {
    throw new Error(`Agent "${name}" already exists`);
  }

  // Get agent configuration
  const config = await getAgentConfig(name, options);
  
  // Create agent metadata
  const metadata = createAgentMetadata(config);
  
  // Save agent
  await saveAgent(name, metadata);
  
  logger.success(chalk.green(`✅ Agent "${name}" created successfully!`));
  logger.info(chalk.cyan('\nNext steps:'));
  logger.info(chalk.white(`  pak agent chat ${name}`));
}

function isValidAgentName(name: string): boolean {
  return /^[a-zA-Z0-9-_]+$/.test(name);
}

function getAgentsPath(): string {
  const config = configManager.getConfig();
  const agentsLocation = config.agents.storageLocation;
  
  if (agentsLocation.startsWith('~/')) {
    return path.join(process.env.HOME || '', agentsLocation.slice(2));
  }
  
  return path.resolve(agentsLocation);
}

async function getAgentConfig(name: string, options: AgentCreateOptions) {
  if (options.interactive) {
    return await interactiveAgentSetup(name, options);
  }
  
  // For non-interactive mode, we still need private key, so force interactive mode
  logger.info(chalk.yellow('🔐 Private key configuration is required. Switching to interactive mode...'));
  return await interactiveAgentSetup(name, options);
}

function getDefaultModel(provider: string): string {
  const config = configManager.getConfig();
  logger.debug("Go to getDefaultModel");
  if (provider === 'ollama') {
    return config.llm.ollama?.defaultModel || 'llama2';
  } else if (provider === 'openai') {
    return config.llm.openai?.defaultModel || 'gpt-3.5-turbo';
  }
  
  return 'llama2';
}

async function interactiveAgentSetup(name: string, options: AgentCreateOptions) {
  const config = configManager.getConfig();
  
  // Step 1: Private Key Import
  logger.info(chalk.blue('\n🔐 Step 1: Private Key Configuration'));
  const privateKeyQuestions = [
    {
      type: 'password',
      name: 'privateKey',
      message: 'Enter your private key (hex format, e.g., 0x...):',
      mask: '*',
      validate: (input: string) => {
        if (!input) {
          return 'Private key is required';
        }
        if (!input.startsWith('0x') || input.length !== 66) {
          return 'Private key must be in hex format (0x followed by 64 characters)';
        }
        return true;
      }
    },
    {
      type: 'list',
      name: 'keyType',
      message: 'Choose key type:',
      choices: [
        { name: 'Sr25519 (Recommended)', value: 'Sr25519' },
        { name: 'Ed25519', value: 'Ed25519' },
      ],
      default: 'Sr25519'
    }
  ];

  const privateKeyAnswers = await inquirer.prompt(privateKeyQuestions);

  // Step 2: Network Selection
  logger.info(chalk.blue('\n🌐 Step 2: Network Configuration'));
  const supportedChains = getAllSupportedChains();
  const chainChoices = supportedChains.map(chain => ({
    name: `${chain.name} (${chain.symbol})`,
    value: chain.id,
    checked: true // Default to all chains selected
  }));

  const networkQuestions = [
    {
      type: 'list',
      name: 'networkSelection',
      message: 'Choose network configuration:',
      choices: [
        { name: 'All supported networks (Recommended)', value: 'all' },
        { name: 'Select specific networks', value: 'specific' },
      ],
      default: 'all'
    }
  ];

  const networkAnswer = await inquirer.prompt(networkQuestions);
  let selectedChains: string[] | undefined;

  if (networkAnswer.networkSelection === 'specific') {
    const chainSelectionQuestions = [
      {
        type: 'checkbox',
        name: 'chains',
        message: 'Select networks to support:',
        choices: chainChoices,
        validate: (input: string[]) => {
          if (input.length === 0) {
            return 'Please select at least one network';
          }
          return true;
        }
      }
    ];
    const chainAnswers = await inquirer.prompt(chainSelectionQuestions);
    selectedChains = chainAnswers.chains;
  }

  // Step 3: LLM Provider Selection
  logger.info(chalk.blue('\n🤖 Step 3: LLM Provider Configuration'));
  const questions = [
    {
      type: 'list',
      name: 'provider',
      message: 'Choose LLM provider:',
      choices: [
        { name: 'Ollama (Local)', value: 'ollama' },
        { name: 'OpenAI (Cloud)', value: 'openai' },
      ],
      default: options.provider || config.llm.defaultProvider
    }
  ];

  const providerAnswer = await inquirer.prompt(questions);
  const provider = providerAnswer.provider;

  // Get available models for the selected provider
  const availableModels = await getAvailableModels(provider);
  logger.debug("Available Models:", availableModels);
  
  const modelQuestions = [
    {
      type: 'list',
      name: 'model',
      message: `Choose ${provider} model:`,
      choices: availableModels.length > 0 ? availableModels : [getDefaultModel(provider)],
      default: options.model || getDefaultModel(provider)
    },
    {
      type: 'checkbox',
      name: 'tools',
      message: 'Select tools for this agent:',
      choices: AVAILABLE_TOOLS.map(tool => ({
        name: `${tool} - ${TOOL_DESCRIPTIONS[tool]}`,
        value: tool,
        checked: config.agents.defaultTools.includes(tool)
      })),
      validate: (input: string[]) => {
        if (input.length === 0) {
          return 'Please select at least one tool';
        }
        return true;
      }
    }
  ];

  const answers = await inquirer.prompt(modelQuestions);

  let systemPrompt = DEFAULT_SYSTEM_PROMPT
  

  const finalQuestions = [
    {
      type: 'input',
      name: 'description',
      message: 'Agent description:',
      default: options.description || `AI agent for Polkadot operations`
    },
    {
      type: 'number',
      name: 'temperature',
      message: 'Temperature (0.0-2.0, higher = more creative):',
      default: 0.7,
      validate: (input: number) => {
        if (input < 0 || input > 2) {
          return 'Temperature must be between 0.0 and 2.0';
        }
        return true;
      }
    }
  ];

  const finalAnswers = await inquirer.prompt(finalQuestions);

  return {
    name,
    provider,
    model: answers.model,
    tools: answers.tools,
    description: finalAnswers.description,
    systemPrompt,
    temperature: finalAnswers.temperature,
    polkadotConfig: {
      privateKey: privateKeyAnswers.privateKey,
      keyType: privateKeyAnswers.keyType,
      chains: selectedChains,
    },
  };
}

async function getAvailableModels(provider: string): Promise<string[]> {
  const config = configManager.getConfig();
  
  if (provider === 'ollama') {
    // Try to fetch available Ollama models
    try {
      const response = await fetch(`${config.llm.ollama?.baseUrl || 'http://localhost:11434'}/api/tags`);
      if (response.ok) {
        const data = await response.json();
        return data.models?.map((model: any) => model.name) || [];
      }
    } catch (error) {
      logger.debug('Failed to fetch Ollama models:', error);
    }
    
    return ['llama2', 'codellama', 'mistral', 'neural-chat'];
  } else if (provider === 'openai') {
    return [
      'gpt-4',
      'gpt-4-turbo',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k'
    ];
  }
  
  return [];
}

function createAgentMetadata(config: any): AgentMetadata {
  const now = new Date();
  
  return {
    name: config.name,
    provider: config.provider,
    model: config.model,
    tools: config.tools,
    systemPrompt: config.systemPrompt,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    description: config.description,
    tags: config.tags || [],
    polkadotConfig: config.polkadotConfig,
    createdAt: now,
    updatedAt: now,
    usageCount: 0,
    version: '1.0.0',
  };
}

async function saveAgent(name: string, metadata: AgentMetadata): Promise<void> {
  const agentsPath = getAgentsPath();
  await fs.ensureDir(agentsPath);
  
  const agentFile = path.join(agentsPath, `${name}.json`);
  await fs.writeJson(agentFile, metadata, { spaces: 2 });
  
  logger.debug(`Agent saved to ${agentFile}`);
}
