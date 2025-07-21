import { Command } from 'commander';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { configManager } from '../../core/config/manager.js';
import { logger } from '../../utils/logger.js';
import { AgentCreateOptions, CLIError } from '../../types/commands.js';
import { 
  AVAILABLE_TOOLS, 
  TOOL_DESCRIPTIONS, 
  DEFAULT_SYSTEM_PROMPTS,
  AgentMetadata 
} from '../../types/agent.js';

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
  logger.info(chalk.white(`  pak agent run ${name} "check my balance"`));
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
  
  const config = configManager.getConfig();
  
  return {
    name,
    provider: options.provider || config.llm.defaultProvider,
    model: options.model || getDefaultModel(options.provider || config.llm.defaultProvider),
    tools: options.tools ? options.tools.split(',').map(t => t.trim()) : config.agents.defaultTools,
    description: options.description || `AI agent for Polkadot operations`,
  };
}

function getDefaultModel(provider: string): string {
  const config = configManager.getConfig();
  
  if (provider === 'ollama') {
    return config.llm.ollama?.defaultModel || 'llama2';
  } else if (provider === 'openai') {
    return config.llm.openai?.defaultModel || 'gpt-3.5-turbo';
  }
  
  return 'llama2';
}

async function interactiveAgentSetup(name: string, options: AgentCreateOptions) {
  const config = configManager.getConfig();
  
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
    },
    {
      type: 'list',
      name: 'systemPromptType',
      message: 'Choose system prompt template:',
      choices: [
        { name: 'General - All-purpose Polkadot assistant', value: 'general' },
        { name: 'Trading - DeFi and trading focused', value: 'trading' },
        { name: 'Staking - Staking and governance focused', value: 'staking' },
        { name: 'Custom - I\'ll provide my own', value: 'custom' },
      ],
      default: 'general'
    }
  ];

  const answers = await inquirer.prompt(modelQuestions);

  let systemPrompt = DEFAULT_SYSTEM_PROMPTS[answers.systemPromptType as keyof typeof DEFAULT_SYSTEM_PROMPTS];
  
  if (answers.systemPromptType === 'custom') {
    const customPrompt = await inquirer.prompt([{
      type: 'editor',
      name: 'systemPrompt',
      message: 'Enter your custom system prompt:',
      default: DEFAULT_SYSTEM_PROMPTS.general
    }]);
    systemPrompt = customPrompt.systemPrompt;
  }

  const finalQuestions = [
    {
      type: 'input',
      name: 'description',
      message: 'Agent description:',
      default: options.description || `${answers.systemPromptType} AI agent for Polkadot operations`
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
